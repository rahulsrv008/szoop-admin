import { ListQuery } from '@core/models';

export type MissedJobReason =
  | 'NO_ON_THE_WAY'
  | 'NOT_MOVING'
  | 'CUSTOMER_REPLACED'
  | 'NOT_STARTED'
  | 'PLAN_VISIT_MISSED';

/** What each reason means, for the page's legend. */
export const MISSED_JOB_HELP: Record<MissedJobReason, string> = {
  NO_ON_THE_WAY: "Accepted, but didn't tap \"I'm on my way\" in time, so the job went to someone else",
  NOT_MOVING: '"Right now" job: no closer to the customer 10 minutes after setting off',
  CUSTOMER_REPLACED: 'Running late: the customer asked for another expert',
  NOT_STARTED: 'On the way, but not started 30 minutes after the start time: cancelled and refunded',
  PLAN_VISIT_MISSED: 'A plan visit not started 30 minutes after its time',
};

/** GET admin/missed-jobs/agents */
export interface MissedJobAgentsQuery {
  from?: string;
  to?: string;
  search?: string;
  [key: string]: string | number | boolean | undefined | null;
}

export interface MissedJobAgentRow {
  agentId: string;
  agentName: string;
  agentMobile?: string | null;
  agentStatus?: string | null;
  missed: number;
  byReason: Record<MissedJobReason, number>;
  notWarned: number;
  lastMissedAt?: string | null;
  lastWarnedAt?: string | null;
}

export interface MissedJobAgentsResponse {
  range: { from: string; to: string };
  items: MissedJobAgentRow[];
  totals: { agents: number; missed: number; notWarned: number };
  labels: Record<MissedJobReason, string>;
}

/** GET admin/missed-jobs */
export interface MissedJobsQuery extends ListQuery {
  agentId?: string;
  reason?: MissedJobReason;
}

export interface MissedJobRow {
  id: string;
  agentId: string;
  agentName: string;
  agentMobile?: string | null;
  bookingId: string;
  bookingNumber?: string | null;
  service?: string | null;
  bookingMode?: string | null;
  bookingStatus?: string | null;
  customerName?: string | null;
  slot: string;
  reason: MissedJobReason;
  reasonLabel: string;
  details?: string | null;
  warnedAt?: string | null;
  createdAt: string;
}

export interface MissedJobsResponse {
  items: MissedJobRow[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

export interface WarningPreview {
  agentId: string;
  notWarned: number;
  message: string;
}

export interface WarnResult {
  agentId: string;
  warnedJobs: number;
  message: string;
  warnedAt: string;
}
