import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SessionStore } from '@core/auth/session.store';
import { NotificationService } from '@core/services/notification.service';

/**
 * Route-level role check. Add `data: { roles: ['SUPER_ADMIN'] }` to a route;
 * an empty or missing list means every signed-in admin may enter.
 */
export const permissionGuard: CanActivateFn = (route) => {
  const session = inject(SessionStore);
  const router = inject(Router);
  const notifications = inject(NotificationService);

  const allowed = (route.data?.['roles'] as string[] | undefined) ?? [];
  if (!allowed.length) return true;

  const role = session.role();
  if (role && allowed.includes(role)) return true;

  notifications.error('You do not have permission to open that screen');
  return router.createUrlTree(['/dashboard']);
};
