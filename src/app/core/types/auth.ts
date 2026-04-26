export type RoleId = 'admin' | 'director' | 'hod' | 'teacher';

export interface RefreshResponse {
    access_token: string;
    refresh_token: string;
}