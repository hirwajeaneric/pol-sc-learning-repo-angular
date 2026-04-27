export type ToastType = 'success' | 'error' | 'warning' | 'info';

export type AppTheme = 'light' | 'dark';

export interface ToastItem {
    id: string;
    type: ToastType;
    message: string;
    durationMs: number;
}