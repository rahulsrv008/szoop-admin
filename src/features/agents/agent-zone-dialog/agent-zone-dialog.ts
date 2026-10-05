import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Observable } from 'rxjs';
import { ServiceArea } from '@core/models';
import { ServiceAreasService } from '../../service-areas/service-areas.service';

export interface AgentZoneDialogData {
  mode: 'approve' | 'assign';
  agentName: string;
  homeZoneId?: string | null;
  serviceAreaIds?: string[];
}

export interface AgentZoneDialogResult {
  confirmed: true;
  homeZoneId: string | null;
  serviceAreaIds: string[];
  remarks?: string;
}

export function openAgentZoneDialog(
  dialog: MatDialog,
  data: AgentZoneDialogData,
): Observable<AgentZoneDialogResult | { confirmed: false } | undefined> {
  return dialog
    .open(AgentZoneDialog, { width: '520px', data })
    .afterClosed();
}

@Component({
  selector: 'app-agent-zone-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
  ],
  templateUrl: './agent-zone-dialog.html',
  styleUrl: './agent-zone-dialog.scss',
})
export class AgentZoneDialog {
  private readonly dialogRef = inject(
    MatDialogRef<AgentZoneDialog, AgentZoneDialogResult | { confirmed: false }>,
  );
  private readonly formBuilder = inject(FormBuilder);
  private readonly areas = inject(ServiceAreasService);
  readonly data = inject<AgentZoneDialogData>(MAT_DIALOG_DATA);

  readonly zones = signal<ServiceArea[]>([]);
  readonly loading = signal(true);

  readonly form = this.formBuilder.nonNullable.group({
    homeZoneId: [this.data.homeZoneId ?? ''],
    serviceAreaIds: [
      this.data.serviceAreaIds ?? [],
      [Validators.minLength(1)],
    ],
    remarks: [''],
  });

  constructor() {
    this.areas.catalog().subscribe({
      next: (result) => {
        this.zones.set(result?.items ?? []);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  get title() {
    return this.data.mode === 'approve'
      ? `Approve ${this.data.agentName}`
      : `Assign service locations · ${this.data.agentName}`;
  }

  cancel() {
    this.dialogRef.close({ confirmed: false });
  }

  save() {
    if (!this.form.value.serviceAreaIds?.length) {
      this.form.controls.serviceAreaIds.setErrors({ minlength: true });
      this.form.markAllAsTouched();
      return;
    }
    const raw = this.form.getRawValue();
    this.dialogRef.close({
      confirmed: true,
      homeZoneId: raw.homeZoneId || null,
      serviceAreaIds: raw.serviceAreaIds,
      remarks: raw.remarks.trim() || undefined,
    });
  }
}
