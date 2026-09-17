import { Injectable, inject } from '@angular/core';
import { AdminUser, Paginated, SystemSetting } from '@core/models';
import { ApiService } from '@core/services/api.service';
import {
  AdminListQuery,
  BulkUpdateSettingsPayload,
  BulkUpdateSettingsResult,
  CreateAdminPayload,
  SettingUpdatePayload,
  SettingsListResponse,
  UpdateAdminPayload,
} from './settings.model';

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private readonly api = inject(ApiService);

  listSettings() {
    return this.api.get<SettingsListResponse>('admin/settings');
  }

  getSetting(key: string) {
    return this.api.get<SystemSetting>(`admin/settings/${key}`);
  }

  updateSetting(key: string, payload: SettingUpdatePayload) {
    return this.api.put<SystemSetting>(`admin/settings/${key}`, payload);
  }

  bulkUpdateSettings(payload: BulkUpdateSettingsPayload) {
    return this.api.patch<BulkUpdateSettingsResult>('admin/settings', payload);
  }

  listAdmins(query: AdminListQuery) {
    return this.api.get<Paginated<AdminUser>>('admin/admins', query);
  }

  createAdmin(payload: CreateAdminPayload) {
    return this.api.post<AdminUser>('admin/admins', payload);
  }

  updateAdmin(id: string, payload: UpdateAdminPayload) {
    return this.api.patch<AdminUser>(`admin/admins/${id}`, payload);
  }

  activateAdmin(id: string) {
    return this.api.post<AdminUser>(`admin/admins/${id}/activate`);
  }

  deactivateAdmin(id: string) {
    return this.api.post<AdminUser>(`admin/admins/${id}/deactivate`);
  }
}
