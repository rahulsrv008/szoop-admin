import { Routes } from '@angular/router';

export const MISSED_JOBS_ROUTES: Routes = [
  {
    path: '',
    title: 'Missed jobs · ClearIt Admin',
    data: { title: 'Missed jobs' },
    loadComponent: () =>
      import('./missed-jobs-page/missed-jobs-page').then((m) => m.MissedJobsPage),
  },
];
