import { Routes } from '@angular/router';

export const SETTINGS_ROUTES: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'general' },
  {
    path: 'general',
    title: 'Settings · Szoop Admin',
    data: { title: 'Settings' },
    loadComponent: () =>
      import('./general-settings/general-settings').then(
        (m) => m.GeneralSettings,
      ),
  },
  {
    path: 'users',
    title: 'Admin users · Szoop Admin',
    data: { title: 'Admin users' },
    loadComponent: () =>
      import('./admin-users/admin-users').then((m) => m.AdminUsers),
  },
  {
    path: 'roles',
    title: 'Roles & permissions · Szoop Admin',
    data: { title: 'Roles & permissions' },
    loadComponent: () =>
      import('./roles-permissions/roles-permissions').then(
        (m) => m.RolesPermissions,
      ),
  },
  {
    path: 'coupons',
    title: 'Coupon Settings · Szoop Admin',
    data: { title: 'Coupon Settings' },
    loadComponent: () =>
      import('./coupon-settings/coupon-settings').then(
        (m) => m.CouponSettingsComponent,
      ),
  },
  {
    path: 'referrals',
    title: 'Referral program · Szoop Admin',
    data: { title: 'Referral program' },
    loadComponent: () =>
      import('./referral-settings/referral-settings').then(
        (m) => m.ReferralSettingsPage,
      ),
  },
];
