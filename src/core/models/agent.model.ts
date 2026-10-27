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

export interface ZoneRef {
  id: string;
  code?: string | null;
  name: string;
  city?: string | null;
  region?: string | null;
}

export interface AgentCurrentLocation {
  latitude: number;
  longitude: number;
  recordedAt: string;
}

export interface AgentListItem {
  agentId: string;
  userId?: string;
  /** SZ26-K7M4P: also the agent's referral code. Set on approval. */
  employeeId?: string | null;
  name: string | null;
  mobile: string;
  status: string;
  approvalStatus: string;
  profileImage?: string | null;
  documentsVerified?: number;
  averageRating?: number;
  completedBookings?: number;
  joiningDate?: string | null;
  createdAt?: string;
  homeZone?: ZoneRef | null;
  serviceAreas?: ZoneRef[];
  currentLocation?: AgentCurrentLocation | null;
}

export interface AgentDetail extends AgentListItem {
  /** Whose referral code the agent signed up with. */
  referredBy?: { agentId: string; name: string; employeeId: string | null } | null;
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
  address?: {
    addressLine1?: string | null;
    locality?: string | null;
    city?: string | null;
    state?: string | null;
    pincode?: string | null;
    latitude?: number | null;
    longitude?: number | null;
  } | null;
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
