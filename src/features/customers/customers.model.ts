import { CustomerDetail, ListQuery } from '@core/models';

/** Query accepted by GET admin/customers. */
export interface CustomerListQuery extends ListQuery {
  isActive?: boolean;
}

/** Recent booking row embedded in the customer detail payload. */
export interface CustomerRecentBooking {
  id: string;
  bookingNumber: string;
  bookingDate: string;
  startTime: string;
  status: string;
  paymentStatus: string;
  totalAmount: number;
}

/** One wallet ledger row: refunds for cancelled or expired bookings. */
export interface CustomerWalletTransaction {
  id: string;
  type: 'CREDIT' | 'DEBIT';
  reason: string;
  amount: number;
  bookingId: string | null;
  bookingNumber: string | null;
  createdAt: string;
}

/**
 * GET admin/customers/:id nests its booking counts under `counts.bookings`,
 * which is narrower than the shared CustomerDetail contract.
 */
export interface CustomerDetailView
  extends Omit<CustomerDetail, 'counts' | 'recentBookings'> {
  counts?: {
    bookings?: Record<string, number>;
    totalBookings?: number;
    totalSpent?: number;
  };
  recentBookings?: CustomerRecentBooking[];
  wallet?: { balance: number; recentTransactions: CustomerWalletTransaction[] };
  updatedAt?: string;
}

/** Response of the block / unblock endpoints. */
export interface CustomerActionResult {
  customerId: string;
  userId: string;
  isActive: boolean;
  message?: string;
}
