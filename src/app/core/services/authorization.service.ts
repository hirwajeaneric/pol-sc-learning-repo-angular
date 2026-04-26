import { computed, Injectable, signal } from '@angular/core';
import { RoleId } from '../types/auth';

const KNOWN_ROLES: readonly RoleId[] = ['admin', 'director', 'hod', 'teacher'];

/**
 * Role-based authorization: persists the active {@link RoleId} and answers permission checks
 * against a static matrix of capability strings per role.
 */
@Injectable({
  providedIn: 'root',
})
export class AuthzService {
  private readonly roleStorageKey = 'polaris-role';

  private readonly currentRole = signal<RoleId>('admin');

  private readonly permissionsByRole: Record<RoleId, Set<string>> = {
    admin: new Set([
      'view:dashboard',
      'view:users',
      'view:students',
      'import:students',
      'manage:parents',
      'view:sections',
      'view:classes',
      'view:courses',
      'view:transcripts',
      'manage:transcript-templates',
      'view:reports',
      'view:grades',
      'edit:grades',
      'view:terms',
      'manage:terms',
      'manage:criteria',
      'manage:teacher-assignments',
    ]),
    director: new Set([
      'view:dashboard',
      'view:users',
      'view:students',
      'view:sections',
      'view:classes',
      'view:courses',
      'view:transcripts',
      'view:reports',
      'view:grades',
      'edit:grades',
      'view:terms',
    ]),
    hod: new Set([
      'view:dashboard',
      'view:students',
      'view:sections',
      'view:classes',
      'view:courses',
      'view:transcripts',
      'view:reports',
      'view:grades',
      'edit:grades',
      'view:terms',
    ]),
    teacher: new Set([
      'view:dashboard',
      'view:students',
      'view:sections',
      'view:classes',
      'view:courses',
      'view:transcripts',
      'view:reports',
      'view:grades',
      'edit:grades',
    ]),
  };

  /** Read-only signal of the current role (mirrors {@link currentRole}). */
  readonly role = computed(() => this.currentRole());

  constructor() {
    const stored = localStorage.getItem(this.roleStorageKey) as RoleId | null;
    if (stored && KNOWN_ROLES.includes(stored)) {
      this.currentRole.set(stored);
    }
  }

  /**
   * Updates the active role in memory and persists it to `localStorage`.
   *
   * @param role - Role identifier to apply for subsequent {@link has} checks.
   */
  setRole(role: RoleId): void {
    this.currentRole.set(role);
    localStorage.setItem(this.roleStorageKey, role);
  }

  /**
   * Whether the current role grants the given permission string.
   *
   * @param permission - Capability key (e.g. `'view:grades'`).
   */
  has(permission: string): boolean {
    return this.permissionsByRole[this.role()].has(permission);
  }
}
