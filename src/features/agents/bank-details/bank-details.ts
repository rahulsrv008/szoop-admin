import { Component, input } from '@angular/core';
import { AgentBankAccount } from '@core/models';
import { StatusBadge } from '@shared/components/status-badge/status-badge';
import { OrDashPipe } from '@shared/pipes/empty.pipe';

@Component({
  selector: 'app-agent-bank-details',
  imports: [StatusBadge, OrDashPipe],
  templateUrl: './bank-details.html',
  styleUrl: './bank-details.scss',
})
export class AgentBankDetails {
  readonly bankAccount = input<AgentBankAccount | null | undefined>(null);
}
