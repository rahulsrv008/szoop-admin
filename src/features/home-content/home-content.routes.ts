import { Routes } from '@angular/router';

export const HOME_CONTENT_ROUTES: Routes = [
  {
    path: '',
    title: 'App home · ClearIt Admin',
    data: { title: 'App home' },
    loadComponent: () =>
      import('./home-content-page/home-content-page').then(
        (m) => m.HomeContentPage,
      ),
  },
];
