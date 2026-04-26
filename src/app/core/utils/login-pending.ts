const LOGIN_PENDING_KEY = 'polaris-grading-app-pending';

export interface LoginPendingState {
    pendingToken: string;
    email: string;
}

export function readLoginPending(): LoginPendingState | null {
    if (typeof window === 'undefined') return null;

    const raw = sessionStorage.getItem(LOGIN_PENDING_KEY);
    if (!raw) return null;

    try {
        const o = JSON.parse(raw) as LoginPendingState;
        if (o?.pendingToken && o?.email) return o;
        return null;
    } catch {
        return null;
    }
}

export function writeLoginPending(state: LoginPendingState) {
    if (typeof window === 'undefined') return;
    sessionStorage.setItem(LOGIN_PENDING_KEY, JSON.stringify(state));
}

export function clearLoginPending() {
    if (typeof window === 'undefined') return;
    sessionStorage.removeItem(LOGIN_PENDING_KEY);
}