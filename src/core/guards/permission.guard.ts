import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router } from '@angular/router';
import { SessionStore } from '@core/auth/session.store';
import { NotificationService } from '@core/services/notification.service';

/**
 * Route-level role check. Add `data: { roles: ['SUPER_ADMIN'] }` to a route
 * or any ancestor; an empty or missing list means every signed-in admin may enter.
 */
export const permissionGuard: CanActivateFn = (route) => {
  const session = inject(SessionStore);
  const router = inject(Router);
  const notifications = inject(NotificationService);
  const role = session.role();

  let current: ActivatedRouteSnapshot | null = route;
  while (current) {
    const allowed = (current.data?.['roles'] as string[] | undefined) ?? [];
    if (allowed.length && (!role || !allowed.includes(role))) {
      notifications.error('You do not have permission to open that screen');
      return router.createUrlTree(['/dashboard']);
    }
    current = current.parent;
  }

  return true;
};
