import { Injectable, inject } from '@angular/core';
import { CustomerListItem, Paginated, UpdateCustomerPayload } from '@core/models';
import { ApiService } from '@core/services/api.service';
import {
  CustomerActionResult,
  CustomerDetailView,
  CustomerListQuery,
} from './customers.model';

@Injectable({ providedIn: 'root' })
export class CustomersService {
  private readonly api = inject(ApiService);

  list(query: CustomerListQuery) {
    return this.api.get<Paginated<CustomerListItem>>('admin/customers', query);
  }

  detail(id: string) {
    return this.api.get<CustomerDetailView>(`admin/customers/${id}`);
  }

  update(id: string, payload: UpdateCustomerPayload) {
    return this.api.patch<CustomerDetailView>(`admin/customers/${id}`, payload);
  }

  block(id: string, reason?: string) {
    return this.api.post<CustomerActionResult>(`admin/customers/${id}/block`, {
      reason,
    });
  }

  unblock(id: string) {
    return this.api.post<CustomerActionResult>(`admin/customers/${id}/unblock`);
  }
}
