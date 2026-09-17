import { AgentDetail, AgentDocument, AgentListItem, ListQuery } from '@core/models';

/** Query accepted by GET admin/agents. */
export interface AgentListQuery extends ListQuery {
  approvalStatus?: string;
  status?: string;
}

export interface AgentAvailabilitySlot {
  id?: string;
  availabilityDate?: string;
  startTime?: string | null;
  endTime?: string | null;
  isAvailable?: boolean;
}

export interface AgentRecentBooking {
  id: string;
  bookingNumber: string;
  bookingDate: string;
  startTime: string;
  status: string;
  totalAmount: number;
}

/**
 * GET admin/agents/:id returns today's availability as an array and nests
 * earnings/ratings the same way the shared AgentDetail describes.
 */
export interface AgentDetailView
  extends Omit<AgentDetail, 'availabilityToday' | 'recentBookings'> {
  isUserActive?: boolean;
  updatedAt?: string;
  availabilityToday?: AgentAvailabilitySlot[] | AgentDetail['availabilityToday'];
  recentBookings?: AgentRecentBooking[];
}

export interface AgentActionResult {
  agentId: string;
  status: string;
  approvalStatus: string;
  joiningDate?: string | null;
  message?: string;
}

export interface AgentDocumentActionResult {
  agentId: string;
  documentId: string;
  documentType: string;
  verificationStatus: string;
  verifiedAt?: string | null;
}

export interface AgentLocationView {
  agentId: string;
  latest: {
    id: string;
    bookingId?: string | null;
    latitude: string | number;
    longitude: string | number;
    recordedAt: string;
  } | null;
  recent: {
    id: string;
    bookingId?: string | null;
    latitude: string | number;
    longitude: string | number;
    recordedAt: string;
  }[];
}

export interface VerifyDocumentPayload {
  verificationStatus: 'VERIFIED' | 'REJECTED';
  remarks?: string;
}

export type { AgentDocument, AgentListItem };
