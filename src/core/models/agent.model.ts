export interface AgentDocument {
  id: string;
  documentType: string;
  documentNumber?: string | null;
  documentUrl?: string | null;
  verificationStatus: string;
  verifiedAt?: string | null;
  createdAt?: string;
}

export interface AgentBankAccount {
  id?: string;
  accountHolderName?: string | null;
  accountNumber?: string | null;
  ifscCode?: string | null;
  bankName?: string | null;
  isVerified?: boolean;
}

export interface AgentListItem {
  agentId: string;
  userId?: string;
  name: string | null;
  mobile: string;
  status: string;
  approvalStatus: string;
  documentsVerified?: number;
  averageRating?: number;
  completedBookings?: number;
  joiningDate?: string | null;
  createdAt?: string;
}

export interface AgentDetail extends AgentListItem {
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  gender?: string | null;
  dateOfBirth?: string | null;
  profileImage?: string | null;
  documents?: AgentDocument[];
  bankAccount?: AgentBankAccount | null;
  availabilityToday?: {
    isAvailable?: boolean;
    startTime?: string | null;
    endTime?: string | null;
  } | null;
  ratings?: { average?: number; count?: number };
  earnings?: { thisMonth?: number; lifetime?: number };
  recentBookings?: unknown[];
}

export interface AgentLocationPing {
  id?: string;
  agentId?: string;
  bookingId?: string | null;
  latitude: string | number;
  longitude: string | number;
  recordedAt: string;
}

export interface AgentAttendanceRow {
  id: string;
  agentId: string;
  agentName?: string | null;
  attendanceDate: string;
  checkIn?: string | null;
  checkOut?: string | null;
  status?: string | null;
  hoursWorked?: number;
}
