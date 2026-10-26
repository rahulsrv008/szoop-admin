import { Injectable, inject } from '@angular/core';
import {
  AgentReferralsView,
  ReferralSettings,
  ReferralSettingsView,
  ReverseRewardResult,
} from '@core/models';
import { ApiService } from '@core/services/api.service';

/** Agent referral program: settings (Settings page) and per-agent referrals (agent page). */
@Injectable({ providedIn: 'root' })
export class ReferralsService {
  private readonly api = inject(ApiService);

  getSettings() {
    return this.api.get<ReferralSettingsView>('admin/referrals/settings');
  }

  updateSettings(payload: ReferralSettings) {
    return this.api.put<ReferralSettingsView>('admin/referrals/settings', payload);
  }

  agentReferrals(agentId: string) {
    return this.api.get<AgentReferralsView>(`admin/referrals/agents/${agentId}`);
  }

  reverseReward(rewardId: string, remarks: string) {
    return this.api.post<ReverseRewardResult>(
      `admin/referrals/rewards/${rewardId}/reverse`,
      { remarks },
    );
  }
}
