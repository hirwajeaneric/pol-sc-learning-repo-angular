import { effect, inject, Injectable } from '@angular/core';
import { HttpBackend, HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { RefreshResponse } from '../../types/auth';
import { AuthSessionService } from '../auth-session.service';

/** Lead time before JWT expiry when a proactive refresh is scheduled (ms). */
const PROACTIVE_REFRESH_LEAD_MS = 60_000;

/** Minimum delay before running a proactive refresh when expiry is very soon (ms). */
const PROACTIVE_REFRESH_MIN_DELAY_MS = 5_000;

/**
 * Coordinates access-token refresh, proactive refresh before expiry, and forced logout
 * when refresh fails. Uses an {@link HttpClient} backed by {@link HttpBackend} so refresh
 * calls are not intercepted by the app's HTTP interceptors.
 */
@Injectable({
  providedIn: 'root',
})
export class AuthRecoveryService {
  private readonly session = inject(AuthSessionService);
  private readonly router = inject(Router);
  private readonly http: HttpClient;

  /** Single in-flight refresh promise so concurrent callers share one request. */
  private refreshInFlight: Promise<string | null> | null = null;

  /** Timer handle for the next proactive refresh attempt. */
  private proactiveRefreshTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.http = new HttpClient(inject(HttpBackend));
    effect(() => {
      const accessToken = this.session.accessToken();
      this.scheduleProactiveRefresh(accessToken);
    });
  }

  /**
   * Refreshes the access token using the stored refresh token.
   * Deduplicates concurrent calls: all callers await the same promise until it settles.
   *
   * @returns The new access token, or `null` if no refresh token or the refresh request failed.
   */
  refreshAccessToken(): Promise<string | null> {
    if (this.refreshInFlight) {
      return this.refreshInFlight;
    }
    this.refreshInFlight = this.performRefresh();
    return this.refreshInFlight.finally(() => {
      this.refreshInFlight = null;
    });
  }

  /**
   * Clears session state, optionally records a session-expired message, cancels proactive
   * refresh, and navigates to the login route.
   *
   * @param reason - `'expired'` shows a post-login notice; `'manual'` skips it.
   */
  async forceLogout(reason: 'expired' | 'manual' = 'manual'): Promise<void> {
    if (reason === 'expired') {
      this.session.markSessionExpiredNotice();
    }
    this.clearProactiveRefreshTimer();
    this.session.signOut();
    await this.router.navigateByUrl('/login');
  }

  /**
   * POSTs to the refresh endpoint, persists new tokens on success, and returns the new
   * access token.
   */
  private async performRefresh(): Promise<string | null> {
    const refreshToken = this.session.refreshToken();
    if (!refreshToken) {
      return null;
    }
    try {
      const response = await firstValueFrom(
        this.http.post<RefreshResponse>(`${environment.apiBaseUrl}/auth/refresh`, {
          refreshToken,
        }),
      );
      this.session.setTokens({
        accessToken: response.access_token,
        refreshToken: response.refresh_token,
      });
      return response.access_token;
    } catch {
      return null;
    }
  }

  /**
   * Runs when the proactive timer fires: refreshes tokens or logs the user out if refresh fails.
   */
  private async handleProactiveRefresh(): Promise<void> {
    const refreshedToken = await this.refreshAccessToken();
    if (!refreshedToken) {
      await this.forceLogout('expired');
    }
  }

  /**
   * Schedules a one-shot refresh shortly before the JWT `exp` claim. Clears any previous timer.
   *
   * @param accessToken - Current access JWT, or `null` to only clear scheduling.
   */
  private scheduleProactiveRefresh(accessToken: string | null): void {
    this.clearProactiveRefreshTimer();
    if (!accessToken) {
      return;
    }
    const expirationMs = this.extractTokenExpirationMs(accessToken);
    if (!expirationMs) {
      return;
    }
    const now = Date.now();
    const delayMs = Math.max(
      expirationMs - now - PROACTIVE_REFRESH_LEAD_MS,
      PROACTIVE_REFRESH_MIN_DELAY_MS,
    );

    this.proactiveRefreshTimer = setTimeout(() => {
      void this.handleProactiveRefresh();
    }, delayMs);
  }

  /** Cancels the proactive refresh timer if one is active. */
  private clearProactiveRefreshTimer(): void {
    if (!this.proactiveRefreshTimer) {
      return;
    }
    clearTimeout(this.proactiveRefreshTimer);
    this.proactiveRefreshTimer = null;
  }

  /**
   * Reads the JWT payload `exp` (seconds since epoch) and returns expiry in milliseconds.
   *
   * @param token - A JWT string (header.payload.signature).
   * @returns Unix expiry in ms, or `null` if the token is malformed or has no `exp`.
   */
  private extractTokenExpirationMs(token: string): number | null {
    try {
      const [, payloadPart] = token.split('.');
      if (!payloadPart) {
        return null;
      }
      const normalized = payloadPart.replace(/-/g, '+').replace(/_/g, '/');
      const decoded = JSON.parse(atob(normalized)) as { exp?: number };
      if (decoded.exp == null) {
        return null;
      }
      return decoded.exp * 1000;
    } catch {
      return null;
    }
  }
}
