import { Injectable, inject } from '@angular/core';
import { AgentListItem, Paginated } from '@core/models';
import { ApiService } from '@core/services/api.service';
import {
  AgentActionResult,
  AgentDetailView,
  AgentDocumentActionResult,
  AgentListQuery,
  AgentLocationView,
  VerifyDocumentPayload,
} from './agents.model';

@Injectable({ providedIn: 'root' })
export class AgentsService {
  private readonly api = inject(ApiService);

  list(query: AgentListQuery = {}) {
    return this.api.get<Paginated<AgentListItem>>('admin/agents', query);
  }

  detail(id: string) {
    return this.api.get<AgentDetailView>(`admin/agents/${id}`);
  }

  location(id: string) {
    return this.api.get<AgentLocationView>(`admin/agents/${id}/location`);
  }

  approve(id: string, remarks?: string) {
    return this.api.post<AgentActionResult>(`admin/agents/${id}/approve`, {
      remarks,
    });
  }

  reject(id: string, reason: string) {
    return this.api.post<AgentActionResult>(`admin/agents/${id}/reject`, {
      reason,
    });
  }

  suspend(id: string, reason: string) {
    return this.api.post<AgentActionResult>(`admin/agents/${id}/suspend`, {
      reason,
    });
  }

  activate(id: string) {
    return this.api.post<AgentActionResult>(`admin/agents/${id}/activate`);
  }

  verifyDocument(agentId: string, documentId: string, payload: VerifyDocumentPayload) {
    return this.api.patch<AgentDocumentActionResult>(
      `admin/agents/${agentId}/documents/${documentId}`,
      payload,
    );
  }
}
