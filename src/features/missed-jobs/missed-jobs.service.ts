import { Injectable, inject } from '@angular/core';
import { ApiService } from '@core/services/api.service';
import {
  MissedJobAgentsQuery,
  MissedJobAgentsResponse,
  MissedJobsQuery,
  MissedJobsResponse,
  WarnResult,
  WarningPreview,
} from './missed-jobs.model';

@Injectable({ providedIn: 'root' })
export class MissedJobsService {
  private readonly api = inject(ApiService);

  agents(query: MissedJobAgentsQuery = {}) {
    return this.api.get<MissedJobAgentsResponse>('admin/missed-jobs/agents', query);
  }

  list(query: MissedJobsQuery = {}) {
    return this.api.get<MissedJobsResponse>('admin/missed-jobs', query);
  }

  warningPreview(agentId: string) {
    return this.api.get<WarningPreview>(`admin/missed-jobs/agents/${agentId}/warning`);
  }

  /** Without a message the agent gets the standard one (see warningPreview). */
  warn(agentId: string, message?: string) {
    return this.api.post<WarnResult>(`admin/missed-jobs/agents/${agentId}/warn`, message ? { message } : {});
  }
}
