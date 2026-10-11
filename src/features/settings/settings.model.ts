import { AdminUser, ListQuery, SystemSetting, UpdateSettingPayload } from '@core/models';

export interface SettingsListResponse {
  items: SystemSetting[];
}

export interface BulkSettingEntry {
  key: string;
  value: unknown;
  description?: string;
}

export interface BulkUpdateSettingsPayload {
  settings: BulkSettingEntry[];
}

export interface BulkUpdateSettingsResult {
  updated: number;
  items: SystemSetting[];
}

export type SettingUpdatePayload = UpdateSettingPayload;

export interface AdminListQuery extends ListQuery {
  isActive?: boolean;
  role?: string;
}

export interface CreateAdminPayload {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  zoneIds?: string[];
}

export interface UpdateAdminPayload {
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  password?: string;
  zoneIds?: string[];
}

export type AdminProfileRow = AdminUser;

export const ADMIN_ROLE_OPTIONS = [
  'SUPER_ADMIN',
  'ADMIN',
  'OPS',
  'SUPPORT',
  'FINANCE',
] as const;

export interface RoleCatalogueEntry {
  role: string;
  label: string;
  intent: string;
  typicalAccess: string[];
}

export interface PermissionCatalogueEntry {
  area: string;
  intent: string;
  notes: string;
}

/** Read-only catalogue documenting intended role boundaries. */
export const ROLE_CATALOGUE: RoleCatalogueEntry[] = [
  {
    role: 'SUPER_ADMIN',
    label: 'Super admin',
    intent: 'Sees every zone. Creates staff and assigns the zones they can open.',
    typicalAccess: [
      'Admin users and zone assignment',
      'System settings',
      'All zones, bookings, agents and customers',
      'Reports',
    ],
  },
  {
    role: 'ADMIN',
    label: 'Admin',
    intent: 'Day-to-day lead for the zones assigned to this account.',
    typicalAccess: [
      'Bookings & live board',
      'Customers & agents',
      'Catalog & pricing',
      'Complaints & notifications',
    ],
  },
  {
    role: 'OPS',
    label: 'Operations',
    intent: 'Dispatch and field coordination inside assigned zones.',
    typicalAccess: [
      'Live bookings',
      'Agent attendance',
      'Agent approvals',
      'Support tickets',
    ],
  },
  {
    role: 'SUPPORT',
    label: 'Support',
    intent: 'Customer care for the zones assigned to this account.',
    typicalAccess: [
      'Complaints',
      'Customer profiles (read/update)',
      'Ratings moderation',
      'Notification history',
    ],
  },
  {
    role: 'FINANCE',
    label: 'Finance',
    intent: 'Payments, earnings and reports for assigned zones.',
    typicalAccess: [
      'Payments',
      'Earnings & incentives',
      'Coupons',
      'Revenue reports',
    ],
  },
];

/** Areas the permissionGuard / route data.roles will eventually gate. */
export const PERMISSION_CATALOGUE: PermissionCatalogueEntry[] = [
  {
    area: 'Dashboard',
    intent: 'Business overview for every signed-in admin.',
    notes: 'No role restriction today.',
  },
  {
    area: 'Settings → General',
    intent: 'Mutate system_settings that drive tax, payouts and cancellation windows.',
    notes: 'Intended for SUPER_ADMIN / ADMIN.',
  },
  {
    area: 'Settings → Users',
    intent: 'Create, update, activate and deactivate Admin Web accounts.',
    notes: 'Intended for SUPER_ADMIN only.',
  },
  {
    area: 'Settings → Roles & permissions',
    intent: 'Document role intent until fine-grained permissions ship.',
    notes: 'Read-only catalogue; no API yet.',
  },
  {
    area: 'Reports',
    intent: 'Aggregated bookings, revenue, agent and customer insights.',
    notes: 'Open to all admins; FINANCE is the primary consumer.',
  },
  {
    area: 'Notifications broadcast',
    intent: 'Send audience-targeted push/inbox messages.',
    notes: 'Intended for ADMIN / OPS / SUPPORT.',
  },
];
