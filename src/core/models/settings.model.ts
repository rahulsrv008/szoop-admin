export interface SystemSetting {
  id?: string;
  settingKey: string;
  settingValue: unknown;
  description?: string | null;
  updatedAt?: string;
}

export interface UpdateSettingPayload {
  value: unknown;
  description?: string;
}

/** Admin Web user (row in the `admins` table). */
export interface AdminUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
  isActive: boolean;
  createdAt?: string;
}
