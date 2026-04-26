import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthorizationService, AuthSessionService } from '../services/index';

/**
 * Route guards for authentication and role-based permissions.
 *
 * **authGuard** — Uses {@link AuthSessionService}; blocks navigation when the user is not
 * authenticated and sends them to `/login` with `returnUrl` for post-login redirect.
 *
 * **permissionGuard** — Uses {@link AuthorizationService}; allows navigation when the route's
 * `data.permission` or `data.permissionAny` matches the static permission sets for the current
 * {@link RoleId}. On denial, redirects to `/dashboard` (not login), so callers typically compose
 * `canActivate: [authGuard, permissionGuard]` when a route requires both sign-in and a capability.
 *
 * Wire-up: register guards on routes in `app.routes.ts` (or feature route modules), for example:
 * `{ path: 'grades', canActivate: [authGuard, permissionGuard], data: { permission: 'view:grades' } }`.
 *
 * Related: permission strings and role matrix live in {@link AuthorizationService}; session flag
 * in {@link AuthSessionService}. {@link PermissionService} is unrelated to these guards until
 * you connect it.
 */
export const authGuard: CanActivateFn = (_route, state) => {
  const router = inject(Router);
  const session = inject(AuthSessionService);
  if (session.isAuthenticated()) return true;
  return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
};

/**
 * Allows activation if the signed-in user's current role has the required permission(s).
 *
 * Route `data` contract:
 * - `permission` (optional string): user must have this exact permission, or the guard passes
 *   if `permission` is omitted (useful for parent routes that only need `authGuard`).
 * - `permissionAny` (optional string[]): user must have **at least one** of these permissions;
 *   when present and non-empty, this is evaluated **instead of** `permission` for that branch.
 *
 * @returns `true`, or a `UrlTree` to `/dashboard` when the user lacks the required capability.
 */
export const permissionGuard: CanActivateFn = (route) => {
  const router = inject(Router);
  const authorization = inject(AuthorizationService);
  const anyPerms = route.data?.['permissionAny'] as string[] | undefined;
  if (anyPerms?.length) {
    if (anyPerms.some((p) => authorization.has(p))) return true;
    return router.createUrlTree(['/dashboard']);
  }
  const permission = route.data?.['permission'] as string | undefined;
  if (!permission || authorization.has(permission)) return true;
  return router.createUrlTree(['/dashboard']);
};
