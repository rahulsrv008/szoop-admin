export interface BookingListItem {
  id: string;
  bookingNumber: string;
  customerName?: string | null;
  customerMobile?: string | null;
  agentName?: string | null;
  agentId?: string | null;
  bookingDate: string;
  startTime: string;
  status: string;
  paymentStatus: string;
  totalAmount: string | number;
  serviceNames?: string[];
  /** Set for On Demand / monthly plan bookings from the customer home. */
  planTitle?: string | null;
  createdAt?: string;
}

export interface BookingItemLine {
  id: string;
  serviceId: string;
  serviceName?: string | null;
  quantity: number;
  durationMinutes?: number | null;
  pricePerHour?: string | number | null;
  amount?: string | number | null;
}

export interface BookingStatusHistoryRow {
  id: string;
  status: string;
  changedBy?: string | null;
  remarks?: string | null;
  createdAt: string;
}

export interface BookingDetail extends BookingListItem {
  durationMinutes?: number;
  subtotal?: string | number;
  discount?: string | number;
  tax?: string | number;
  notes?: string | null;
  endTime?: string | null;
  items?: BookingItemLine[];
  address?: Record<string, unknown> | null;
  payment?: Record<string, unknown> | null;
  agent?: Record<string, unknown> | null;
  customer?: Record<string, unknown> | null;
  statusHistory?: BookingStatusHistoryRow[];
  ratings?: unknown[];
  trackingPings?: number;
}

export interface AssignAgentPayload {
  agentId: string;
  remarks?: string;
  reason?: string;
}
