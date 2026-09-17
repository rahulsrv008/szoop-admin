import { BookingDetail, BookingListItem, ListQuery } from '@core/models';

/** Query accepted by GET admin/bookings. */
export interface BookingListQuery extends ListQuery {
  status?: string;
  paymentStatus?: string;
  customerId?: string;
  agentId?: string;
}

export interface BookingAmounts {
  subtotal: number;
  discount: number;
  tax: number;
  totalAmount: number;
}

export interface BookingParty {
  customerId?: string;
  agentId?: string;
  userId?: string;
  name?: string | null;
  mobile?: string | null;
  email?: string | null;
  status?: string;
  approvalStatus?: string;
}

/**
 * GET admin/bookings/:id nests money under `amounts` and parties under
 * `customer` / `agent`, which is richer than the shared BookingDetail type.
 */
export interface BookingDetailView
  extends Omit<
    BookingDetail,
    'totalAmount' | 'subtotal' | 'discount' | 'tax' | 'customer' | 'agent' | 'payment'
  > {
  amounts?: BookingAmounts;
  totalAmount?: string | number;
  customer?: BookingParty | null;
  agent?: BookingParty | null;
  payment?: {
    id: string;
    amount: number;
    paymentMethod?: string | null;
    paymentStatus: string;
    paidAt?: string | null;
    transactions?: unknown[];
  } | null;
  serviceArea?: { id: string; name: string } | null;
  updatedAt?: string;
}

export interface BookingActionResult {
  id?: string;
  bookingNumber?: string;
  status?: string;
  agentId?: string | null;
  message?: string;
}

export type { BookingListItem };
