import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DEFAULT_PAGE_SIZE } from '@config/constants';
import { Coupon, CouponUsageRow } from '@core/models';
import { DataTable } from '@shared/components/data-table/data-table';
import { TableColumn, TablePageEvent } from '@shared/models/table.model';
import { CouponsService } from '../coupons.service';

@Component({
  selector: 'app-coupon-usage',
  imports: [RouterLink, MatButtonModule, MatIconModule, DataTable],
  templateUrl: './coupon-usage.html',
  styleUrl: './coupon-usage.scss',
})
export class CouponUsage {
  private readonly coupons = inject(CouponsService);
  private readonly route = inject(ActivatedRoute);

  readonly loading = signal(false);
  readonly rows = signal<CouponUsageRow[]>([]);
  readonly total = signal(0);
  readonly page = signal(1);
  readonly limit = signal(DEFAULT_PAGE_SIZE);
  readonly coupon = signal<Coupon | null>(null);
  readonly couponId = this.route.snapshot.paramMap.get('id') ?? '';

  readonly columns: TableColumn<CouponUsageRow>[] = [
    { key: 'customerName', label: 'Customer', fallback: '—' },
    { key: 'bookingNumber', label: 'Booking', fallback: '—' },
    {
      key: 'discountAmount',
      label: 'Discount',
      type: 'currency',
      align: 'right',
    },
    { key: 'createdAt', label: 'Redeemed', type: 'datetime' },
  ];

  constructor() {
    if (this.couponId) {
      this.coupons.find(this.couponId).subscribe({
        next: (coupon) => this.coupon.set(coupon),
      });
      this.load();
    }
  }

  load() {
    this.loading.set(true);
    this.coupons
      .usage(this.couponId, {
        page: this.page(),
        limit: this.limit(),
      })
      .subscribe({
        next: (result) => {
          this.rows.set(result?.items ?? []);
          this.total.set(result?.meta?.total ?? 0);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  onPageChange(event: TablePageEvent) {
    this.page.set(event.page);
    this.limit.set(event.limit);
    this.load();
  }
}
