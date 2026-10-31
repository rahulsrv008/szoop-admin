import { Routes } from '@angular/router';

export const PRICING_ROUTES: Routes = [
  {
    path: '',
    title: 'Pricing · Szoop Admin',
    data: { title: 'Pricing' },
    loadComponent: () =>
      import('./service-pricing/service-pricing').then(
        (m) => m.ServicePricingPage,
      ),
  },
  {
    path: 'areas',
    title: 'Area pricing · Szoop Admin',
    data: { title: 'Area pricing' },
    loadComponent: () =>
      import('./area-pricing/area-pricing').then((m) => m.AreaPricing),
  },
];
