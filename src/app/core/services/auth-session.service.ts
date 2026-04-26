import { computed, Injectable, signal } from "@angular/core";
import { RoleId } from "../types";

@Injectable({ providedIn: 'root' })
export class AuthSessionService {
    private readonly authStorageKey = 'polaris-authenticated';
    private readonly accessTokenStorageKey = 'polaris-access-token';
    private readonly refreshTokenStorageKey = 'polaris-refresh-token';
    private readonly roleStorageKey = 'polaris-role';
    private readonly sessionExpiredNoticeStorageKey = 'polaris-session-expired-notice';

    private readonly authenticatedState = signal(false);
    private readonly accessTokenState = signal<string | null>(null);
    private readonly refreshTokenState = signal<string | null>(null);
    private readonly sessionExpiredNoticeState = signal<string | null>(null);

    readonly isAuthenticated = computed(() => this.authenticatedState());
    readonly accessToken = computed(() => this.accessTokenState());
    readonly refreshToken = computed(() => this.refreshTokenState());
    readonly sessionExpiredNotice = computed(() => this.sessionExpiredNoticeState());

    constructor() {
        this.authenticatedState.set(localStorage.getItem(this.authStorageKey) === 'true');
        this.accessTokenState.set(localStorage.getItem(this.accessTokenStorageKey));
        this.refreshTokenState.set(localStorage.getItem(this.refreshTokenStorageKey));
        this.sessionExpiredNoticeState.set(localStorage.getItem(this.sessionExpiredNoticeStorageKey));
    }

    clearSessionExpiredNotice(): void {
        this.sessionExpiredNoticeState.set(null);
        localStorage.removeItem(this.sessionExpiredNoticeStorageKey);
    }

    signIn(payload?: { accessToken?: string; refreshToken?: string, roleId?: RoleId }) {
        this.authenticatedState.set(true);
        localStorage.setItem(this.authStorageKey, 'true');
        if (payload?.accessToken) {
            this.accessTokenState.set(payload.accessToken);
            localStorage.setItem(this.accessTokenStorageKey, payload.accessToken);
        }
        if (payload?.refreshToken) {
            this.refreshTokenState.set(payload.refreshToken);
            localStorage.setItem(this.refreshTokenStorageKey, payload.refreshToken);
        }
        if (payload?.roleId) {
            localStorage.setItem(this.roleStorageKey, payload.roleId);
        }
        this.clearSessionExpiredNotice();
    }

    setTokens(payload: { accessToken: string, refreshToken: string }): void {
        this.authenticatedState.set(true);
        localStorage.setItem(this.authStorageKey, 'true');
        this.accessTokenState.set(payload.accessToken);
        this.refreshTokenState.set(payload.refreshToken);
        localStorage.setItem(this.accessTokenStorageKey, payload.accessToken);
        localStorage.setItem(this.refreshTokenStorageKey, payload.refreshToken);
    }

    markSessionExpiredNotice(message = 'Your session expired. Please sign in again.') {
        this.sessionExpiredNoticeState.set(message);
        localStorage.setItem(this.sessionExpiredNoticeStorageKey, message);
    }

    signOut(): void {
        this.authenticatedState.set(false);
        localStorage.setItem(this.authStorageKey, 'false');
        this.accessTokenState.set(null);
        this.refreshTokenState.set(null);
        localStorage.removeItem(this.accessTokenStorageKey);
        localStorage.removeItem(this.refreshTokenStorageKey);
        localStorage.removeItem(this.roleStorageKey);
        this.clearSessionExpiredNotice();
    }
}