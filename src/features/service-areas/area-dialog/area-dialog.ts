import { Component, inject } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { ServiceArea } from '@core/models';
import { pincodeValidator } from '@shared/validators/form.validators';
import { AreaPayload } from '../service-areas.model';

export interface AreaDialogData {
  area?: ServiceArea | null;
}

@Component({
  selector: 'app-area-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSlideToggleModule,
    MatIconModule,
  ],
  templateUrl: './area-dialog.html',
  styleUrl: './area-dialog.scss',
})
export class AreaDialog {
  private readonly formBuilder = inject(FormBuilder);
  private readonly dialogRef = inject(
    MatDialogRef<AreaDialog, AreaPayload | null>,
  );
  readonly data = inject<AreaDialogData>(MAT_DIALOG_DATA);
  readonly isEdit = !!this.data.area;

  readonly form = this.formBuilder.nonNullable.group({
    name: [
      this.data.area?.name ?? '',
      [Validators.required, Validators.minLength(2)],
    ],
    code: [this.data.area?.code ?? ''],
    city: [this.data.area?.city ?? ''],
    region: [this.data.area?.region ?? ''],
    state: [this.data.area?.state ?? ''],
    latitude: [this.data.area?.latitude ?? (null as number | null)],
    longitude: [this.data.area?.longitude ?? (null as number | null)],
    serviceRadiusKm: [this.data.area?.serviceRadiusKm ?? 3],
    isActive: [this.data.area?.isActive ?? true],
    areas: this.formBuilder.array(
      (this.data.area?.areas?.length
        ? this.data.area.areas
        : [{ area: '', pincode: '', buildingsCover: [] }]
      ).map((item) => this.createAreaGroup(item)),
    ),
  });

  get areas(): FormArray {
    return this.form.controls.areas;
  }

  addArea() {
    this.areas.push(this.createAreaGroup());
  }

  removeArea(index: number) {
    if (this.areas.length === 1) {
      this.areas.at(0).reset({ area: '', pincode: '', buildingsCover: '' });
      return;
    }
    this.areas.removeAt(index);
  }

  cancel() {
    this.dialogRef.close(null);
  }

  save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const raw = this.form.getRawValue();
    const clusters = raw.areas
      .map((item) => ({
        area: item.area.trim(),
        pincode: item.pincode.trim(),
        buildingsCover: this.splitBuildings(item.buildingsCover),
      }))
      .filter((item) => item.area && item.pincode);

    this.dialogRef.close({
      name: raw.name.trim(),
      code: raw.code.trim() || null,
      city: raw.city.trim() || null,
      region: raw.region.trim() || null,
      state: raw.state.trim() || null,
      pincode: clusters[0]?.pincode ?? null,
      latitude: this.toNumber(raw.latitude),
      longitude: this.toNumber(raw.longitude),
      serviceRadiusKm: this.toNumber(raw.serviceRadiusKm) ?? 3,
      areas: clusters,
      isActive: raw.isActive,
    });
  }

  private createAreaGroup(
    item?: { area: string; pincode: string; buildingsCover?: string[] },
  ) {
    return this.formBuilder.nonNullable.group({
      area: [item?.area ?? '', [Validators.required]],
      pincode: [item?.pincode ?? '', [Validators.required, pincodeValidator()]],
      buildingsCover: [(item?.buildingsCover ?? []).join('\n')],
    });
  }

  private splitBuildings(value: string) {
    return value
      .split(/[\n,]/)
      .map((part) => part.trim())
      .filter(Boolean);
  }

  private toNumber(value: number | string | null | undefined) {
    if (value === null || value === undefined || value === '') return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
}
