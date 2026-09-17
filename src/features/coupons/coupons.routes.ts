import { Routes } from '@angular/router';

export const COUPONS_ROUTES: Routes = [
  {
    path: '',
    title: 'Coupons · ClearIt Admin',
    data: { title: 'Coupons' },
    loadComponent: () =>
      import('./coupon-list/coupon-list').then((m) => m.CouponList),
  },
  {
    path: 'new',
    title: 'New coupon · ClearIt Admin',
    data: { title: 'New coupon' },
    loadComponent: () =>
      import('./coupon-form/coupon-form').then((m) => m.CouponForm),
  },
  {
    path: ':id/edit',
    title: 'Edit coupon · ClearIt Admin',
    data: { title: 'Edit coupon' },
    loadComponent: () =>
      import('./coupon-form/coupon-form').then((m) => m.CouponForm),
  },
  {
    path: ':id/usage',
    title: 'Coupon usage · ClearIt Admin',
    data: { title: 'Coupon usage' },
    loadComponent: () =>
      import('./coupon-usage/coupon-usage').then((m) => m.CouponUsage),
  },
];
