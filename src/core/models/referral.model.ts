/** The referral program as stored in settings (amounts in whole rupees). */
export interface ReferralSettings {
  enabled: boolean;
  /** How many people can use one code, ever. */
  maxPerAgent: number;
  /** How many levels up a reward goes (1 = direct referrer only). */
  maxLevels: number;
  /** Level 1: one amount per invite, in the order they qualify. */
  rewardTiers: number[];
  /** Level 2, 3, …: one amount per level. */
  levelRewards: number[];
  maxEarning: number;
  qualifyJobs: number;
  joiningBonus: number;
  activeMinJobs: number;
  activeWindowDays: number;
}

export interface ReferralSettingsView extends ReferralSettings {
  lastChanged: { at: string; by: string | null } | null;
}

export type ReferralRewardType = 'DIRECT' | 'NETWORK' | 'JOINING';
export type ReferralRewardStatus = 'PENDING' | 'PAID' | 'MISSED' | 'REVERSED';
export type ReferralStatus = 'JOINED' | 'QUALIFIED' | 'REJECTED';

export interface ReferralAgentRef {
  agentId: string;
  name: string;
  employeeId: string | null;
}

export interface ReferralRewardRow {
  id: string;
  type: ReferralRewardType;
  level: number;
  from: ReferralAgentRef;
  amount: number;
  intendedAmount: number;
  status: ReferralRewardStatus;
  reasonCode: string | null;
  /** Plain-words reason for a missed, reduced or reversed reward. */
  reason: string | null;
  salary: { id: string; month: number; year: number; status: string } | null;
  createdAt: string;
  paidAt: string | null;
  canReverse: boolean;
}

export interface ReferralLevelRow {
  level: number;
  people: number;
  qualified: number;
  earned: number;
  paid: number;
  pending: number;
  missed: number;
}

export interface ReferralTeamMember {
  agentId: string;
  name: string;
  employeeId: string | null;
  level: number;
  accountStatus: string;
  referralStatus: ReferralStatus | null;
  joinedAt: string | null;
  jobsCompleted: number;
  team: ReferralTeamMember[];
}

export interface AgentReferralsView {
  agentId: string;
  employeeId: string | null;
  referredBy: ReferralAgentRef | null;
  invites: { used: number; max: number; remaining: number };
  jobsToQualify: number;
  totals: {
    earned: number;
    limit: number;
    paid: number;
    pending: number;
    missed: number;
    missedCount: number;
  };
  activity: {
    jobsDone: number;
    jobsRequired: number;
    windowDays: number;
    unlocked: boolean;
    applies: boolean;
  };
  levels: ReferralLevelRow[];
  joiningBonus: ReferralRewardRow | null;
  history: ReferralRewardRow[];
  team: { members: ReferralTeamMember[]; truncated: boolean };
}

export interface ReverseRewardResult {
  id: string;
  status: ReferralRewardStatus;
  amount: number;
  wasPaid: boolean;
  message: string;
}
