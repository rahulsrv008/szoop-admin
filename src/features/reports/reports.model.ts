export interface ReportRange {
  from: string;
  to: string;
}

export interface ReportRangeQuery {
  from?: string;
  to?: string;
  [key: string]: string | number | boolean | undefined | null;
}

export interface BookingSeriesPoint {
  date: string;
  total: number;
  completed: number;
  cancelled: number;
  expired: number;
  revenue: number;
}

export interface BookingsReport {
  range: ReportRange;
  series: BookingSeriesPoint[];
  totals: {
    total: number;
    completed: number;
    cancelled: number;
    expired: number;
    revenue: number;
  };
}

export interface RevenueSeriesPoint {
  date: string;
  collected: number;
  pending: number;
  refunded: number;
  count: number;
}

export interface TopServiceRow {
  serviceId: string;
  serviceName: string;
  bookings: number;
  revenue: number;
}

export interface RevenueReport {
  range: ReportRange;
  series: RevenueSeriesPoint[];
  totals: {
    collected: number;
    pending: number;
    refunded: number;
    count: number;
  };
  topServices: TopServiceRow[];
}

export interface AgentReportRow {
  agentId: string;
  name?: string | null;
  completedJobs: number;
  hours: number;
  revenueGenerated: number;
  earnings: number;
  averageRating: number;
  attendanceDays: number;
}

export interface AgentsReport {
  range: ReportRange;
  items: AgentReportRow[];
}

export interface CustomerSeriesPoint {
  date: string;
  count: number;
}

export interface TopCustomerRow {
  customerId: string;
  name?: string | null;
  mobile?: string | null;
  payments: number;
  spend: number;
}

export interface CustomersReport {
  range: ReportRange;
  newCustomers: CustomerSeriesPoint[];
  topCustomers: TopCustomerRow[];
  totals: {
    newCustomers: number;
    repeatCustomers: number;
    payingCustomers: number;
    totalSpend: number;
  };
}

export interface ReportsOverview {
  range: ReportRange;
  bookings: {
    total: number;
    completed: number;
    cancelled: number;
    expired: number;
    completedRevenue: number;
    days: number;
  };
  revenue: RevenueReport['totals'];
  topServices: TopServiceRow[];
  agents: {
    activeAgents: number;
    completedJobs: number;
    hours: number;
    revenueGenerated: number;
    earnings: number;
    topAgents: AgentReportRow[];
  };
  customers: {
    newCustomers: number;
    repeatCustomers: number;
    payingCustomers: number;
    totalSpend: number;
    topCustomers: TopCustomerRow[];
  };
}

export interface BarSlice {
  label: string;
  value: number;
  percent: number;
  hint?: string;
}

export function toBarSlices(
  entries: Array<{ label: string; value: number; hint?: string }>,
): BarSlice[] {
  const max = Math.max(...entries.map((entry) => entry.value), 0);
  return entries.map((entry) => ({
    ...entry,
    percent: max ? Math.round((entry.value / max) * 100) : 0,
  }));
}
