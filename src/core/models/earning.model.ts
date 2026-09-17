export interface EarningRow {
  id: string;
  agentId: string;
  agentName?: string | null;
  bookingId?: string | null;
  bookingNumber?: string | null;
  earningDate?: string | null;
  serviceHours: string | number;
  revenueGenerated: string | number;
  earningAmount: string | number;
  createdAt?: string;
}

export interface EarningTotals {
  earnings: number;
  revenue: number;
  hours: number;
}

export interface EarningSummaryRow {
  agentId: string;
  name: string | null;
  completedJobs: number;
  hours: number;
  revenueGenerated: number;
  earnings: number;
}

export interface IncentiveRow {
  id: string;
  agentId: string;
  agentName?: string | null;
  month: number;
  year: number;
  revenueGenerated: string | number;
  thresholdAmount: string | number;
  incentiveAmount: string | number;
  status: string;
  createdAt?: string;
}

export interface SalaryRow {
  id: string;
  agentId: string;
  agentName?: string | null;
  month: number;
  year: number;
  fixedSalary: string | number;
  incentive: string | number;
  deductions: string | number;
  netSalary: string | number;
  status: string;
  createdAt?: string;
}
