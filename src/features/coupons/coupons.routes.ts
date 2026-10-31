import { Routes } from '@angular/router';

export const COUPONS_ROUTES: Routes = [
  {
    path: '',
    title: 'Coupons · Szoop Admin',
    data: { title: 'Coupons' },
    loadComponent: () =>
      import('./coupon-list/coupon-list').then((m) => m.CouponList),
  },
  {
    path: 'new',
    title: 'New coupon · Szoop Admin',
    data: { title: 'New coupon' },
    loadComponent: () =>
      import('./coupon-form/coupon-form').then((m) => m.CouponForm),
  },
  {
    path: ':id/edit',
    title: 'Edit coupon · Szoop Admin',
    data: { title: 'Edit coupon' },
    loadComponent: () =>
      import('./coupon-form/coupon-form').then((m) => m.CouponForm),
  },
  {
    path: ':id/usage',
    title: 'Coupon usage · Szoop Admin',
    data: { title: 'Coupon usage' },
    loadComponent: () =>
      import('./coupon-usage/coupon-usage').then((m) => m.CouponUsage),
  },
];
