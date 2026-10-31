import { Routes } from '@angular/router';

export const REPORTS_ROUTES: Routes = [
  {
    path: '',
    title: 'Reports · Szoop Admin',
    data: { title: 'Reports' },
    loadComponent: () =>
      import('./report-overview/report-overview').then((m) => m.ReportOverview),
  },
  {
    path: 'bookings',
    title: 'Bookings report · Szoop Admin',
    data: { title: 'Bookings report' },
    loadComponent: () =>
      import('./report-bookings/report-bookings').then((m) => m.ReportBookings),
  },
  {
    path: 'revenue',
    title: 'Revenue report · Szoop Admin',
    data: { title: 'Revenue report' },
    loadComponent: () =>
      import('./report-revenue/report-revenue').then((m) => m.ReportRevenue),
  },
  {
    path: 'agents',
    title: 'Agents report · Szoop Admin',
    data: { title: 'Agents report' },
    loadComponent: () =>
      import('./report-agents/report-agents').then((m) => m.ReportAgents),
  },
  {
    path: 'customers',
    title: 'Customers report · Szoop Admin',
    data: { title: 'Customers report' },
    loadComponent: () =>
      import('./report-customers/report-customers').then(
        (m) => m.ReportCustomers,
      ),
  },
];
