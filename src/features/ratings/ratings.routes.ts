import { Routes } from '@angular/router';

export const RATINGS_ROUTES: Routes = [
  {
    path: '',
    title: 'Ratings · Szoop Admin',
    data: { title: 'Ratings' },
    loadComponent: () =>
      import('./rating-list/rating-list').then((m) => m.RatingList),
  },
];
