import {
  HttpContextToken,
  HttpErrorResponse,
  HttpEvent,
  HttpHandlerFn,
  HttpRequest,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, catchError, throwError } from 'rxjs';
import { ApiErrorBody } from '@core/models';
import { NotificationService } from '@core/services/notification.service';

/** Background polls set this so a failure doesn't toast every few seconds; the caller shows its own state. */
export const SILENT_ERRORS = new HttpContextToken<boolean>(() => false);

function readMessage(error: HttpErrorResponse): string {
  if (error.status === 0) {
    return 'Cannot reach the API. Is the backend running?';
  }

  const body = error.error as ApiErrorBody | string | null;
  if (typeof body === 'string' && body.trim()) return body;

  const message = (body as ApiErrorBody | null)?.message;
  if (Array.isArray(message)) return message.join(', ');
  if (typeof message === 'string' && message.trim()) return message;

  return error.statusText || 'Something went wrong';
}

/** Surfaces every failed request as a toast; 401s are handled by authInterceptor. */
export function errorInterceptor(
  request: HttpRequest<unknown>,
  next: HttpHandlerFn,
): Observable<HttpEvent<unknown>> {
  const notifications = inject(NotificationService);

  return next(request).pipe(
    catchError((error: unknown) => {
      if (
        error instanceof HttpErrorResponse &&
        error.status !== 401 &&
        !request.context.get(SILENT_ERRORS)
      ) {
        notifications.error(readMessage(error));
      }
      return throwError(() => error);
    }),
  );
}
