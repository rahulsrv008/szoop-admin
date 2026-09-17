import { Component, inject } from '@angular/core';
import {
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
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { CategoryListRow, CategoryPayload } from '../services.model';

export interface CategoryDialogData {
  category?: CategoryListRow | null;
}

@Component({
  selector: 'app-category-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSlideToggleModule,
  ],
  templateUrl: './category-dialog.html',
  styleUrl: './category-dialog.scss',
})
export class CategoryDialog {
  private readonly formBuilder = inject(FormBuilder);
  private readonly dialogRef = inject(
    MatDialogRef<CategoryDialog, CategoryPayload | null>,
  );
  readonly data = inject<CategoryDialogData>(MAT_DIALOG_DATA);

  readonly isEdit = !!this.data.category;

  readonly form = this.formBuilder.nonNullable.group({
    name: [
      this.data.category?.name ?? '',
      [Validators.required, Validators.minLength(2)],
    ],
    description: [this.data.category?.description ?? ''],
    imageUrl: [this.data.category?.imageUrl ?? ''],
    isActive: [this.data.category?.isActive ?? true],
  });

  cancel() {
    this.dialogRef.close(null);
  }

  save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const raw = this.form.getRawValue();
    this.dialogRef.close({
      name: raw.name.trim(),
      description: raw.description.trim() || null,
      imageUrl: raw.imageUrl.trim() || null,
      isActive: raw.isActive,
    });
  }
}
