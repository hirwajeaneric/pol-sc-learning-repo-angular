import { HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthSessionService } from '../services/auth-session.service';

/**
 * Clones the outgoing request with an `Authorization: Bearer …` header when an access token exists.
 *
 * @param req - Original request.
 * @param token - Non-empty access token.
 * @returns A new request carrying the bearer header.
 */
function withBearerAuthorization<T>(req: HttpRequest<T>, token: string): HttpRequest<T> {
  return req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`,
    },
  });
}

/**
 * Functional HTTP interceptor that attaches the session access token to outgoing API calls.
 * Requests are unchanged when there is no access token (e.g. anonymous or logged-out state).
 */
export const authTokenInterceptor: HttpInterceptorFn = (req, next) => {
  const session = inject(AuthSessionService);
  const token = session.accessToken();
  if (!token) {
    return next(req);
  }
  return next(withBearerAuthorization(req, token));
};
