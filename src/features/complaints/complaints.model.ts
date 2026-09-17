import { ListQuery, UpdateTicketPayload } from '@core/models';

export interface ComplaintListQuery extends ListQuery {
  status?: string;
  priority?: string;
}

export interface ComplaintRaiser {
  userId: string;
  userType?: string | null;
  name?: string | null;
  mobile?: string | null;
  email?: string | null;
  isActive?: boolean | null;
  customerId?: string | null;
  agentId?: string | null;
}

export interface ComplaintListItem {
  id: string;
  subject?: string | null;
  priority: string;
  status: string;
  raisedBy: ComplaintRaiser;
  bookingId?: string | null;
  bookingNumber?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface ComplaintBooking {
  id: string;
  bookingNumber: string;
  bookingDate?: string;
  startTime?: string;
  status?: string;
  paymentStatus?: string;
  totalAmount?: number;
}

export interface ComplaintDetail {
  id: string;
  subject?: string | null;
  description?: string | null;
  priority: string;
  status: string;
  raisedBy: ComplaintRaiser;
  booking?: ComplaintBooking | null;
  createdAt: string;
  updatedAt?: string;
}

export interface ComplaintUpdateResult {
  id: string;
  status: string;
  priority: string;
  resolutionNoteSentToRaiser: boolean;
  message?: string;
}

export type ComplaintUpdatePayload = UpdateTicketPayload;
