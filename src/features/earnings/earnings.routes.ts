import { Routes } from '@angular/router';

export const EARNINGS_ROUTES: Routes = [
  {
    path: '',
    title: 'Agent earnings · ClearIt Admin',
    data: { title: 'Agent earnings' },
    loadComponent: () =>
      import('./agent-earnings/agent-earnings').then((m) => m.AgentEarnings),
  },
  {
    path: 'incentives',
    title: 'Incentives · ClearIt Admin',
    data: { title: 'Incentives' },
    loadComponent: () =>
      import('./incentives/incentives').then((m) => m.Incentives),
  },
  {
    path: 'salary',
    title: 'Salary · ClearIt Admin',
    data: { title: 'Salary' },
    loadComponent: () => import('./salary/salary').then((m) => m.Salary),
  },
];
