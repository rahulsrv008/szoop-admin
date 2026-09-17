import { Routes } from '@angular/router';

export const SERVICE_AREAS_ROUTES: Routes = [
  {
    path: '',
    title: 'Service areas · ClearIt Admin',
    data: { title: 'Service areas' },
    loadComponent: () => import('./areas/areas').then((m) => m.Areas),
  },
  {
    path: 'cities',
    title: 'Cities · ClearIt Admin',
    data: { title: 'Cities' },
    loadComponent: () => import('./cities/cities').then((m) => m.Cities),
  },
  {
    path: 'pincodes',
    title: 'Pincodes · ClearIt Admin',
    data: { title: 'Pincodes' },
    loadComponent: () => import('./pincodes/pincodes').then((m) => m.Pincodes),
  },
  {
    path: 'societies',
    title: 'Societies · ClearIt Admin',
    data: { title: 'Societies' },
    loadComponent: () =>
      import('./societies/societies').then((m) => m.Societies),
  },
];
