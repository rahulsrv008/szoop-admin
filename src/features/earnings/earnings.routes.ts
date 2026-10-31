import { Routes } from '@angular/router';

export const EARNINGS_ROUTES: Routes = [
  {
    path: '',
    title: 'Agent earnings · Szoop Admin',
    data: { title: 'Agent earnings' },
    loadComponent: () =>
      import('./agent-earnings/agent-earnings').then((m) => m.AgentEarnings),
  },
  {
    path: 'incentives',
    title: 'Incentives · Szoop Admin',
    data: { title: 'Incentives' },
    loadComponent: () =>
      import('./incentives/incentives').then((m) => m.Incentives),
  },
  {
    path: 'salary',
    title: 'Salary · Szoop Admin',
    data: { title: 'Salary' },
    loadComponent: () => import('./salary/salary').then((m) => m.Salary),
  },
];
