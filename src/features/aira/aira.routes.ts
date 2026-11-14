import { Routes } from '@angular/router';

export const AIRA_ROUTES: Routes = [
  {
    path: '',
    title: 'Aira app settings · Szoop Admin',
    data: { title: 'Aira app settings' },
    loadComponent: () =>
      import('./aira-settings/aira-settings').then((m) => m.AiraSettingsPage),
  },
  {
    path: 'menu',
    title: 'Aira services & menu · Szoop Admin',
    data: { title: 'Aira services & menu' },
    loadComponent: () =>
      import('./aira-menu-page/aira-menu-page').then((m) => m.AiraMenuPage),
  },
];
