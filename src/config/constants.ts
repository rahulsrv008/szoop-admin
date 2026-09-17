/** Shared option lists and labels, kept in sync with the backend enums. */

export const STORAGE_KEYS = {
  accessToken: 'clearit.admin.accessToken',
  refreshToken: 'clearit.admin.refreshToken',
  admin: 'clearit.admin.profile',
} as const;

export const BOOKING_STATUSES = [
  'finding',
  'paid',
  'accepted',
  'arriving',
  'ongoing',
  'completed',
  'cancelled',
] as const;

export const BOOKING_STATUS_LABELS: Record<string, string> = {
  finding: 'Awaiting payment',
  paid: 'Paid — unassigned',
  accepted: 'Agent assigned',
  arriving: 'Agent on the way',
  ongoing: 'Service in progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

/** Statuses that belong on the "live bookings" board. */
export const LIVE_BOOKING_STATUSES = ['paid', 'accepted', 'arriving', 'ongoing'];

export const PAYMENT_STATUSES = [
  'PENDING',
  'PAID',
  'FAILED',
  'REFUNDED',
  'VOIDED',
] as const;

export const AGENT_APPROVAL_STATUSES = ['PENDING', 'APPROVED', 'REJECTED'] as const;

export const AGENT_STATUSES = ['PENDING', 'ACTIVE', 'SUSPENDED'] as const;

export const DOCUMENT_TYPES = [
  'AADHAAR',
  'PAN',
  'DRIVING_LICENSE',
  'POLICE_VERIFICATION',
  'PHOTO',
] as const;

export const DOCUMENT_STATUSES = ['PENDING', 'VERIFIED', 'REJECTED'] as const;

export const TICKET_STATUSES = [
  'OPEN',
  'IN_PROGRESS',
  'RESOLVED',
  'CLOSED',
] as const;

export const TICKET_PRIORITIES = ['LOW', 'NORMAL', 'HIGH'] as const;

export const DISCOUNT_TYPES = ['PERCENT', 'FLAT'] as const;

export const INCENTIVE_STATUSES = [
  'PENDING',
  'APPROVED',
  'PAID',
  'REJECTED',
] as const;

export const NOTIFICATION_AUDIENCES = [
  'ALL',
  'CUSTOMERS',
  'AGENTS',
  'SPECIFIC',
] as const;

export const GENDERS = ['MALE', 'FEMALE', 'OTHER'] as const;

export const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export const PAGE_SIZES = [10, 20, 50, 100];

export const DEFAULT_PAGE_SIZE = 20;
