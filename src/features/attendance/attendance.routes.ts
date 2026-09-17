import { Routes } from '@angular/router';

export const ATTENDANCE_ROUTES: Routes = [
  {
    path: '',
    title: 'Attendance · ClearIt Admin',
    data: { title: 'Attendance' },
    loadComponent: () =>
      import('./attendance-list/attendance-list').then((m) => m.AttendanceList),
  },
  {
    path: 'report',
    title: 'Attendance report · ClearIt Admin',
    data: { title: 'Attendance report' },
    loadComponent: () =>
      import('./attendance-report/attendance-report').then(
        (m) => m.AttendanceReport,
      ),
  },
];
