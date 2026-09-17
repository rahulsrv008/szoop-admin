import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandlerFn,
  HttpRequest,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, catchError, switchMap, throwError } from 'rxjs';
import { SessionStore } from '@core/auth/session.store';
import { AuthService } from '@core/services/auth.service';

/** Endpoints that must never carry (or retry with) an access token. */
const PUBLIC_PATHS = ['admin/auth/login', 'admin/auth/refresh-token'];

function isPublic(url: string) {
  return PUBLIC_PATHS.some((path) => url.includes(path));
}

/**
 * Attaches the bearer token and, on a single 401, transparently refreshes the
 * session and replays the request once.
 */
export function authInterceptor(
  request: HttpRequest<unknown>,
  next: HttpHandlerFn,
): Observable<HttpEvent<unknown>> {
  const session = inject(SessionStore);
  const auth = inject(AuthService);

  if (isPublic(request.url)) return next(request);

  const withToken = (token: string | null) =>
    token
      ? request.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
      : request;

  return next(withToken(session.accessToken())).pipe(
    catchError((error: unknown) => {
      const isAuthError =
        error instanceof HttpErrorResponse && error.status === 401;
      if (!isAuthError || !session.refreshToken()) {
        return throwError(() => error);
      }

      return auth.refreshSession().pipe(
        switchMap(() => next(withToken(session.accessToken()))),
        catchError((refreshError: unknown) => {
          auth.logout({ callApi: false });
          return throwError(() => refreshError);
        }),
      );
    }),
  );
}
