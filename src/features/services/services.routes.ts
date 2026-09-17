import { Routes } from '@angular/router';

export const SERVICES_ROUTES: Routes = [
  {
    path: '',
    title: 'Services · ClearIt Admin',
    data: { title: 'Services' },
    loadComponent: () =>
      import('./service-list/service-list').then((m) => m.ServiceList),
  },
  {
    path: 'new',
    title: 'New service · ClearIt Admin',
    data: { title: 'New service' },
    loadComponent: () =>
      import('./service-form/service-form').then((m) => m.ServiceForm),
  },
  {
    path: 'categories',
    title: 'Service categories · ClearIt Admin',
    data: { title: 'Service categories' },
    loadComponent: () =>
      import('./category-list/category-list').then((m) => m.CategoryList),
  },
  {
    path: ':id/edit',
    title: 'Edit service · ClearIt Admin',
    data: { title: 'Edit service' },
    loadComponent: () =>
      import('./service-form/service-form').then((m) => m.ServiceForm),
  },
];
