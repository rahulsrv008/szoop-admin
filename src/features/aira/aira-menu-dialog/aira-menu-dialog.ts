import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { NotificationService } from '@core/services/notification.service';
import { isImageRef, readImageFile } from '@features/home-content/image-file';
import {
  AIRA_ICONS,
  AIRA_SEGMENTS,
  AiraGroup,
  AiraGroupPayload,
  AiraItem,
  AiraItemPayload,
  slugify,
} from '../aira-menu.model';

export type AiraMenuDialogData =
  | { kind: 'group'; group?: AiraGroup | null; nextSortOrder: number }
  | { kind: 'item'; item?: AiraItem | null; groups: AiraGroup[]; sections: string[]; groupId?: string; nextSortOrder: number };

const SLUG = /^[a-z0-9-]+$/;
const optionalNumber = (value: string) => (value.trim() === '' ? null : Number(value));

@Component({
  selector: 'app-aira-menu-dialog',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
  ],
  templateUrl: './aira-menu-dialog.html',
  styleUrl: '../../home-content/home-item-dialog/home-item-dialog.scss',
})
export class AiraMenuDialog {
  private readonly ref = inject(MatDialogRef<AiraMenuDialog, AiraGroupPayload | AiraItemPayload | null>);
  private readonly notifications = inject(NotificationService);
  private readonly fb = inject(FormBuilder);
  readonly data = inject<AiraMenuDialogData>(MAT_DIALOG_DATA);

  readonly segments = AIRA_SEGMENTS;
  readonly icons = AIRA_ICONS;
  readonly isGroup = this.data.kind === 'group';
  readonly editing = this.data.kind === 'group' ? !!this.data.group : !!this.data.item;
  readonly heading = `${this.editing ? 'Edit' : 'Add'} ${this.isGroup ? 'group' : 'service'}`;
  readonly groups = this.data.kind === 'item' ? this.data.groups : [];
  readonly sections = this.data.kind === 'item' ? this.data.sections : [];
  readonly image = signal<string | null>(null);
  private idTouched = this.editing;

  readonly form = this.fb.nonNullable.group({
    id: ['', [Validators.required, Validators.maxLength(40), Validators.pattern(SLUG)]],
    title: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(120)]],
    blurb: ['', Validators.maxLength(200)],
    icon: ['sparkles'],
    segment: ['women'],
    groupId: [''],
    kind: ['service'],
    section: ['', Validators.maxLength(60)],
    minutes: ['30'],
    price: [''],
    originalPrice: [''],
    rating: [''],
    reviewsCount: [''],
    badge: ['', Validators.maxLength(30)],
    includes: [''],
    sortOrder: [String(this.data.nextSortOrder)],
    isActive: [true],
  });

  constructor() {
    if (this.data.kind === 'group' && this.data.group) {
      const g = this.data.group;
      this.form.patchValue({ id: g.id, title: g.title, blurb: g.blurb ?? '', icon: g.icon, segment: g.segment, sortOrder: String(g.sortOrder), isActive: g.isActive });
      this.image.set(g.imageUrl);
    }
    if (this.data.kind === 'item') {
      const i = this.data.item;
      if (i) {
        this.form.patchValue({
          id: i.id,
          title: i.title,
          groupId: i.group,
          kind: i.kind,
          section: i.section,
          minutes: String(i.minutes),
          price: String(i.price),
          originalPrice: i.originalPrice === null ? '' : String(i.originalPrice),
          rating: i.rating === null ? '' : String(i.rating),
          reviewsCount: i.reviewsCount === null ? '' : String(i.reviewsCount),
          badge: i.badge ?? '',
          segment: i.segment ?? '',
          includes: i.includes.join('\n'),
          sortOrder: String(i.sortOrder),
          isActive: i.isActive,
        });
        this.image.set(i.imageUrl);
      } else {
        this.form.patchValue({ groupId: this.data.groupId ?? this.groups[0]?.id ?? '', segment: '' });
      }
      for (const name of ['groupId', 'section', 'minutes', 'price'] as const) {
        this.form.controls[name].addValidators(Validators.required);
      }
    }
    if (this.editing) this.form.controls.id.disable();
    this.form.controls.title.valueChanges.subscribe((title) => {
      if (!this.idTouched) this.form.controls.id.setValue(slugify(title), { emitEvent: false });
    });
  }

  markIdTouched() {
    this.idTouched = true;
  }

  async pickImage(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    try {
      this.image.set(await readImageFile(file, 900));
    } catch (err) {
      this.notifications.error(err instanceof Error ? err.message : 'Could not read the image');
    }
  }

  clearImage() {
    this.image.set(null);
  }

  isImage(value: string | null) {
    return isImageRef(value);
  }

  save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const sortOrder = Number(v.sortOrder) || 0;
    if (this.isGroup) {
      this.ref.close({
        id: v.id,
        title: v.title.trim(),
        blurb: v.blurb.trim() || null,
        icon: v.icon,
        segment: v.segment as AiraGroupPayload['segment'],
        imageUrl: this.image(),
        sortOrder,
        isActive: v.isActive,
      } satisfies AiraGroupPayload);
      return;
    }
    const price = Number(v.price);
    const minutes = Number(v.minutes);
    if (!Number.isFinite(price) || price <= 0 || !Number.isInteger(minutes) || minutes < 5) {
      this.notifications.error('Enter a price above 0 and a duration of at least 5 minutes');
      return;
    }
    this.ref.close({
      id: v.id,
      groupId: v.groupId,
      kind: v.kind as AiraItemPayload['kind'],
      title: v.title.trim(),
      section: v.section.trim(),
      minutes,
      price,
      originalPrice: optionalNumber(v.originalPrice),
      rating: optionalNumber(v.rating),
      reviewsCount: optionalNumber(v.reviewsCount),
      badge: v.badge.trim() || null,
      segment: (v.segment || null) as AiraItemPayload['segment'],
      includes: v.includes.split('\n').map((line) => line.trim()).filter(Boolean).slice(0, 12),
      imageUrl: this.image(),
      sortOrder,
      isActive: v.isActive,
    } satisfies AiraItemPayload);
  }

  cancel() {
    this.ref.close(null);
  }
}
