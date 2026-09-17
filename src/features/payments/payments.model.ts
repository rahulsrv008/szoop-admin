import {
  ListQuery,
  PaymentDetail,
  PaymentListItem,
  PaymentListResponse,
  PaymentTransactionRow,
} from '@core/models';

export interface PaymentListQuery extends ListQuery {
  paymentStatus?: string;
  paymentMethod?: string;
}

/** Nested booking / customer shapes from GET admin/payments/:id. */
export interface PaymentDetailView
  extends Omit<PaymentDetail, 'booking' | 'customer' | 'bookingNumber' | 'customerName'> {
  booking?: {
    id: string;
    bookingNumber: string;
    bookingDate?: string;
    startTime?: string;
    status?: string;
    paymentStatus?: string;
    totalAmount?: number;
  } | null;
  customer?: {
    customerId: string;
    userId?: string;
    name: string | null;
    mobile?: string | null;
    email?: string | null;
  } | null;
}

export type { PaymentListItem, PaymentListResponse, PaymentTransactionRow };
