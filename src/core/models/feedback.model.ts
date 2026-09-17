export interface RatingRow {
  id: string;
  bookingId: string;
  bookingNumber?: string | null;
  customerName?: string | null;
  agentId?: string | null;
  agentName?: string | null;
  rating: string | number;
  reviewText?: string | null;
  createdAt: string;
}

export interface RatingSummary {
  average: number;
  count: number;
  breakdown?: Record<string, number>;
}

export interface SupportTicketRow {
  id: string;
  subject?: string | null;
  description?: string | null;
  priority: string;
  status: string;
  raisedByName?: string | null;
  raisedByMobile?: string | null;
  raisedByRole?: string | null;
  bookingNumber?: string | null;
  bookingId?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface UpdateTicketPayload {
  status?: string;
  priority?: string;
  resolutionNote?: string;
}
