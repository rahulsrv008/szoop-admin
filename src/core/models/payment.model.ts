export interface PaymentTransactionRow {
  id: string;
  gatewayName?: string | null;
  gatewayTransactionId?: string | null;
  status?: string | null;
  gatewayResponse?: Record<string, unknown> | null;
  createdAt: string;
}

export interface PaymentListItem {
  id: string;
  bookingId: string;
  bookingNumber?: string | null;
  customerName?: string | null;
  amount: string | number;
  paymentMethod?: string | null;
  paymentStatus: string;
  transactionId?: string | null;
  paidAt?: string | null;
  createdAt: string;
}

export interface PaymentTotals {
  collected: number;
  pending: number;
  refunded: number;
  count: number;
}

export interface PaymentListResponse {
  items: PaymentListItem[];
  meta: { page: number; limit: number; total: number; totalPages: number };
  totals?: PaymentTotals;
}

export interface PaymentDetail extends PaymentListItem {
  booking?: Record<string, unknown> | null;
  customer?: Record<string, unknown> | null;
  transactions?: PaymentTransactionRow[];
}
