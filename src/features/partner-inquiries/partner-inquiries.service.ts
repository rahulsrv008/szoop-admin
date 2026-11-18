import { Injectable, inject } from '@angular/core';
import { Paginated } from '@core/models';
import { ApiService } from '@core/services/api.service';
import { PartnerInquiryListItem, PartnerInquiryListQuery } from './partner-inquiries.model';

@Injectable({ providedIn: 'root' })
export class PartnerInquiriesService {
  private readonly api = inject(ApiService);

  list(query: PartnerInquiryListQuery) {
    return this.api.get<Paginated<PartnerInquiryListItem>>('admin/partner-inquiries', query);
  }
}
