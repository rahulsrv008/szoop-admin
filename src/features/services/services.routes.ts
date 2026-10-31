import { Routes } from '@angular/router';

export const SERVICES_ROUTES: Routes = [
  {
    path: '',
    title: 'Services · Szoop Admin',
    data: { title: 'Services' },
    loadComponent: () =>
      import('./service-list/service-list').then((m) => m.ServiceList),
  },
  {
    path: 'new',
    title: 'New service · Szoop Admin',
    data: { title: 'New service' },
    loadComponent: () =>
      import('./service-form/service-form').then((m) => m.ServiceForm),
  },
  {
    path: 'categories',
    title: 'Service categories · Szoop Admin',
    data: { title: 'Service categories' },
    loadComponent: () =>
      import('./category-list/category-list').then((m) => m.CategoryList),
  },
  {
    path: ':id/edit',
    title: 'Edit service · Szoop Admin',
    data: { title: 'Edit service' },
    loadComponent: () =>
      import('./service-form/service-form').then((m) => m.ServiceForm),
  },
];
