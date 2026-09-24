import { Routes } from '@angular/router';
import { authGuard, guestGuard } from '@core/guards/auth.guard';
import { permissionGuard } from '@core/guards/permission.guard';
import { AdminLayout } from '@layouts/admin-layout/admin-layout';
import { AuthLayout } from '@layouts/auth-layout/auth-layout';

/**
 * Two shells: AuthLayout for the public screens, AdminLayout for everything
 * behind the session. Feature areas own their own child route files.
 */
export const routes: Routes = [
  {
    path: 'auth',
    component: AuthLayout,
    canActivate: [guestGuard],
    loadChildren: () =>
      import('@features/auth/auth.routes').then((m) => m.AUTH_ROUTES),
  },
  {
    path: '',
    component: AdminLayout,
    canActivate: [authGuard],
    canActivateChild: [permissionGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'agents',
        loadChildren: () =>
          import('@features/agents/agents.routes').then((m) => m.AGENTS_ROUTES),
      },
      {
        path: 'attendance',
        loadChildren: () =>
          import('@features/attendance/attendance.routes').then(
            (m) => m.ATTENDANCE_ROUTES,
          ),
      },
      {
        path: 'bookings',
        loadChildren: () =>
          import('@features/bookings/bookings.routes').then(
            (m) => m.BOOKINGS_ROUTES,
          ),
      },
      {
        path: 'complaints',
        loadChildren: () =>
          import('@features/complaints/complaints.routes').then(
            (m) => m.COMPLAINTS_ROUTES,
          ),
      },
      {
        path: 'coupons',
        loadChildren: () =>
          import('@features/coupons/coupons.routes').then(
            (m) => m.COUPONS_ROUTES,
          ),
      },
      {
        path: 'customers',
        loadChildren: () =>
          import('@features/customers/customers.routes').then(
            (m) => m.CUSTOMERS_ROUTES,
          ),
      },
      {
        path: 'dashboard',
        loadChildren: () =>
          import('@features/dashboard/dashboard.routes').then(
            (m) => m.DASHBOARD_ROUTES,
          ),
      },
      {
        path: 'earnings',
        loadChildren: () =>
          import('@features/earnings/earnings.routes').then(
            (m) => m.EARNINGS_ROUTES,
          ),
      },
      {
        path: 'home-content',
        loadChildren: () =>
          import('@features/home-content/home-content.routes').then(
            (m) => m.HOME_CONTENT_ROUTES,
          ),
      },
      {
        path: 'notifications',
        loadChildren: () =>
          import('@features/notifications/notifications.routes').then(
            (m) => m.NOTIFICATIONS_ROUTES,
          ),
      },
      {
        path: 'payments',
        loadChildren: () =>
          import('@features/payments/payments.routes').then(
            (m) => m.PAYMENTS_ROUTES,
          ),
      },
      {
        path: 'pricing',
        loadChildren: () =>
          import('@features/pricing/pricing.routes').then(
            (m) => m.PRICING_ROUTES,
          ),
      },
      {
        path: 'ratings',
        loadChildren: () =>
          import('@features/ratings/ratings.routes').then(
            (m) => m.RATINGS_ROUTES,
          ),
      },
      {
        path: 'reports',
        loadChildren: () =>
          import('@features/reports/reports.routes').then(
            (m) => m.REPORTS_ROUTES,
          ),
      },
      {
        path: 'service-areas',
        loadChildren: () =>
          import('@features/service-areas/service-areas.routes').then(
            (m) => m.SERVICE_AREAS_ROUTES,
          ),
      },
      {
        path: 'services',
        loadChildren: () =>
          import('@features/services/services.routes').then(
            (m) => m.SERVICES_ROUTES,
          ),
      },
      {
        path: 'settings',
        loadChildren: () =>
          import('@features/settings/settings.routes').then(
            (m) => m.SETTINGS_ROUTES,
          ),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
