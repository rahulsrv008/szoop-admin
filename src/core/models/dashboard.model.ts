export interface DashboardSummary {
  customers?: { total?: number; newInRange?: number; blocked?: number };
  agents?: {
    total?: number;
    approved?: number;
    pendingApproval?: number;
    suspended?: number;
    onlineToday?: number;
  };
  bookings?: {
    total?: number;
    inRange?: number;
    activeNow?: number;
    byStatus?: Record<string, number>;
  };
  revenue?: {
    today?: number;
    inRange?: number;
    thisMonth?: number;
    lifetime?: number;
    pendingCollection?: number;
  };
  ratings?: { average?: number; count?: number };
  support?: { open?: number; inProgress?: number; highPriority?: number };
  kyc?: { pendingDocuments?: number };
  team?: DashboardTeamRow[];
}

export interface DashboardLiveMap {
  zones: DashboardMapZone[];
  customers: DashboardMapCustomer[];
  agents: DashboardMapAgent[];
  generatedAt: string;
}

export interface DashboardMapZone {
  id: string;
  name: string;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  serviceRadiusKm: number;
}

export interface DashboardMapCustomer {
  id: string;
  bookingId: string;
  zoneId: string | null;
  name: string;
  status: string;
  latitude: number;
  longitude: number;
}

export interface DashboardMapAgent {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  zoneIds: string[];
  recordedAt: string;
}

export interface DashboardTeamRow {
  id: string;
  name: string;
  email: string;
  role: string;
  unrestricted?: boolean;
  zones?: { id: string; name: string; city?: string | null }[];
  earnings: number;
}

export interface BookingReportRow {
  date: string;
  total: number;
  completed: number;
  cancelled: number;
  expired: number;
  revenue: number;
}

export interface RevenueReportRow {
  date: string;
  collected: number;
  pending: number;
  refunded: number;
}

export interface RevenueReport {
  rows: RevenueReportRow[];
  totals?: { collected: number; pending: number; refunded: number };
  topServices?: { serviceId: string; name: string; revenue: number }[];
}

export interface AgentReportRow {
  agentId: string;
  name: string | null;
  completedJobs: number;
  hours: number;
  revenueGenerated: number;
  earnings: number;
  averageRating: number;
  attendanceDays: number;
}

export interface CustomerReportRow {
  date: string;
  newCustomers: number;
}

export interface CustomerReport {
  rows: CustomerReportRow[];
  repeatCustomers?: number;
  topCustomers?: {
    customerId: string;
    name: string | null;
    bookings: number;
    spend: number;
  }[];
}
