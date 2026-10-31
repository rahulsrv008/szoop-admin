import { Routes } from '@angular/router';

export const COMPLAINTS_ROUTES: Routes = [
  {
    path: '',
    title: 'Complaints · Szoop Admin',
    data: { title: 'Complaints' },
    loadComponent: () =>
      import('./complaint-list/complaint-list').then((m) => m.ComplaintList),
  },
  {
    path: ':id',
    title: 'Complaint · Szoop Admin',
    data: { title: 'Complaint details' },
    loadComponent: () =>
      import('./complaint-details/complaint-details').then(
        (m) => m.ComplaintDetails,
      ),
  },
];
