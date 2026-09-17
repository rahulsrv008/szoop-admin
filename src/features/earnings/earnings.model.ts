import {
  EarningRow,
  EarningSummaryRow,
  EarningTotals,
  IncentiveRow,
  ListQuery,
  SalaryRow,
} from '@core/models';

export interface EarningsListQuery extends ListQuery {
  agentId?: string;
}

export interface EarningsListResponse {
  items: EarningRow[];
  meta: { page: number; limit: number; total: number; totalPages: number };
  totals?: EarningTotals;
}

export interface EarningsSummaryResponse {
  month: number;
  year: number;
  items: EarningSummaryRow[];
  totals?: {
    agents: number;
    completedJobs: number;
    hours: number;
    revenueGenerated: number;
    earnings: number;
  };
}

export interface IncentiveListQuery extends ListQuery {
  agentId?: string;
  month?: number;
  year?: number;
  status?: string;
}

export interface SalaryListQuery extends ListQuery {
  agentId?: string;
  month?: number;
  year?: number;
  status?: string;
}

export interface GeneratePeriodPayload {
  month: number;
  year: number;
}

export interface GenerateSummary {
  month: number;
  year: number;
  generated: number;
  updated: number;
  [key: string]: unknown;
}

export interface IncentiveUpdatePayload {
  status: 'APPROVED' | 'PAID' | 'REJECTED';
  remarks?: string;
}

export interface SalaryUpdatePayload {
  status?: string;
  deductions?: number;
  remarks?: string;
}

export type { EarningRow, EarningSummaryRow, IncentiveRow, SalaryRow };
