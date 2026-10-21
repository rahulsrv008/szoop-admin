/** GET admin/booking-monitor — see AdminBookingMonitorService in clearit-be. */

export type MonitorStep = 'WAITING_FOR_AGENT' | 'NOT_SET_OFF' | 'ON_THE_WAY' | 'IN_PROGRESS';
export type MonitorSeverity = 'ok' | 'orange' | 'red';
export type AgentPresence = 'online' | 'off_hours' | 'offline';

export interface MonitorFlag {
  code: string;
  label: string;
  tone: 'info' | 'warn' | 'danger';
}

export interface MonitorJob {
  id: string;
  bookingNumber: string;
  status: string;
  step: MonitorStep;
  mode: 'INSTANT' | 'SCHEDULED';
  plan: boolean;
  service: string;
  /** The job's start, or a plan's current/next visit. */
  slot: string;
  running: boolean;
  /** When this step's timer started counting (future = coming up). */
  clockStartsAt: string;
  /** What the timer is measured from, e.g. "broadcast 1:15 PM", "picked 1:16 PM". */
  note: string | null;
  orangeAt: string;
  redAt: string;
  /** At least this colour whatever the timer says (e.g. no agent online to take it). */
  floor: MonitorSeverity | null;
  severity: MonitorSeverity;
  flags: MonitorFlag[];
  /** What the system does next on its own, and when. */
  nextAction: { label: string; at: string } | null;
  customer: { name: string; mobile: string | null };
  area: { id: string; name: string } | null;
  address: string | null;
  agent: {
    id: string;
    userId: string;
    name: string;
    mobile: string | null;
    presence: AgentPresence;
    lastSeenAt: string | null;
    distanceKm: number | null;
  } | null;
}

export interface MonitorAgent {
  id: string;
  userId: string;
  name: string;
  mobile: string | null;
  zone: string | null;
  presence: AgentPresence;
  presenceLabel: string;
  lastSeenAt: string | null;
  currentJob: { bookingId: string; bookingNumber: string; step: MonitorStep } | null;
  nextJob: { bookingId: string; bookingNumber: string; slot: string; setOffBy: string } | null;
  jobsToday: number;
  /** Not online with a job today: orange now, red from `redAt`. */
  alert: { orangeAt: string; redAt: string; reason: string } | null;
  severity: MonitorSeverity | 'idle';
}

export interface MonitorRules {
  waitingOrangeMinutes: number;
  waitingRedMinutes: number;
  setOffOrangeMinutes: number;
  setOffRedMinutes: number;
  arrivalOrangeMinutes: number;
  arrivalRedMinutes: number;
  overrunOrangeMinutes: number;
  overrunRedMinutes: number;
  setOffLeadMinutes: number;
  instantArrivalMinutes: number;
}

export interface MonitorBoard {
  serverTime: string;
  refreshSeconds: number;
  rules: MonitorRules;
  /** How long before its start a scheduled job opens to agents. */
  dispatchLeadMinutes: number;
  jobs: MonitorJob[];
  agents: MonitorAgent[];
}

/** A job as it stands this second. */
export interface LiveJob extends MonitorJob {
  live: {
    severity: MonitorSeverity;
    running: boolean;
    /** Time on the step's timer if running, else until it starts. */
    ms: number;
  };
}

export interface LiveAgent extends MonitorAgent {
  live: { severity: MonitorSeverity | 'idle' };
}

export const MONITOR_STEPS: MonitorStep[] = [
  'WAITING_FOR_AGENT',
  'NOT_SET_OFF',
  'ON_THE_WAY',
  'IN_PROGRESS',
];

export const STEP_META: Record<
  MonitorStep,
  { label: string; icon: string; running: string; upcoming: string }
> = {
  WAITING_FOR_AGENT: {
    label: 'Waiting for an agent',
    icon: 'person_search',
    running: 'Not picked for',
    upcoming: 'Broadcasts in',
  },
  NOT_SET_OFF: {
    label: "Agent hasn't set off",
    icon: 'hourglass_top',
    running: 'Not on the way for',
    upcoming: 'Timer starts in',
  },
  ON_THE_WAY: {
    label: 'Agent on the way',
    icon: 'two_wheeler',
    running: 'Late to start by',
    upcoming: 'Due to start in',
  },
  IN_PROGRESS: {
    label: 'Work in progress',
    icon: 'cleaning_services',
    running: 'Over booked time by',
    upcoming: 'Ends in',
  },
};
