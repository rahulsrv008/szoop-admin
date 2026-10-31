import { Routes } from '@angular/router';

export const AGENTS_ROUTES: Routes = [
  {
    path: '',
    title: 'Agents · Szoop Admin',
    data: { title: 'Agents' },
    loadComponent: () =>
      import('./agent-list/agent-list').then((m) => m.AgentList),
  },
  {
    path: 'pending',
    title: 'Pending agents · Szoop Admin',
    data: { title: 'Pending KYC' },
    loadComponent: () =>
      import('./agent-pending/agent-pending').then((m) => m.AgentPending),
  },
  {
    path: ':id/location',
    title: 'Agent location · Szoop Admin',
    data: { title: 'Agent location' },
    loadComponent: () =>
      import('./agent-location/agent-location').then((m) => m.AgentLocation),
  },
  {
    path: ':id',
    title: 'Agent · Szoop Admin',
    data: { title: 'Agent profile' },
    loadComponent: () =>
      import('./agent-details/agent-details').then((m) => m.AgentDetails),
  },
];
