import { Routes } from '@angular/router';

export const PARTNER_INQUIRIES_ROUTES: Routes = [
  {
    path: '',
    title: 'Partner inquiries · Szoop Admin',
    data: { title: 'Partner inquiries' },
    loadComponent: () =>
      import('./partner-inquiry-list/partner-inquiry-list').then((m) => m.PartnerInquiryList),
  },
];
