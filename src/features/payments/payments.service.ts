import { Injectable, inject } from '@angular/core';
import { PaymentListResponse } from '@core/models';
import { ApiService } from '@core/services/api.service';
import { PaymentDetailView, PaymentListQuery } from './payments.model';

@Injectable({ providedIn: 'root' })
export class PaymentsService {
  private readonly api = inject(ApiService);

  list(query: PaymentListQuery = {}) {
    return this.api.get<PaymentListResponse>('admin/payments', query);
  }

  detail(id: string) {
    return this.api.get<PaymentDetailView>(`admin/payments/${id}`);
  }
}
