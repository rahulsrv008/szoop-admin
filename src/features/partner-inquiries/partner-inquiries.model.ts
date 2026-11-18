import { ListQuery } from '@core/models';

export interface PartnerInquiryListItem {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  city: string;
  partnerType: string;
  note?: string | null;
  createdAt: string;
}

export type PartnerInquiryListQuery = ListQuery;
