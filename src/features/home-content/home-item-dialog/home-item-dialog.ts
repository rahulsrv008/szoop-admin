import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
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
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { NotificationService } from '@core/services/notification.service';
import {
  ACTION_LABELS,
  HomeCategory,
  HomeCategoryAction,
  HomeCategoryOption,
  HomeHighlight,
  HomePopularItem,
  HomePricingTier,
  HomeTileLayout,
  ICON_SUGGESTIONS,
  LAYOUT_LABELS,
} from '../home-content.model';
import { isImageRef, readImageFile } from '../image-file';

export type HomeItemKind = 'category' | 'option' | 'popular';

export interface HomeItemDialogData {
  kind: HomeItemKind;
  item?: HomeCategory | HomeCategoryOption | HomePopularItem | null;
  /** Needed for popular cards so the admin can pick what a tap opens. */
  categories?: HomeCategory[];
  nextSortOrder?: number;
}

type HighlightGroup = FormGroup<{
  text: FormControl<string>;
  icon: FormControl<string>;
}>;

type TierGroup = FormGroup<{
  label: FormControl<string>;
  subtitle: FormControl<string>;
  minutes: FormControl<string>;
  startTime: FormControl<string>;
  price: FormControl<string>;
}>;

const TITLES: Record<HomeItemKind, string> = {
  category: 'category',
  option: 'option',
  popular: 'popular card',
};

@Component({
  selector: 'app-home-item-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
  ],
  templateUrl: './home-item-dialog.html',
  styleUrl: './home-item-dialog.scss',
})
export class HomeItemDialog {
  private readonly formBuilder = inject(FormBuilder);
  private readonly notifications = inject(NotificationService);
  private readonly dialogRef = inject(MatDialogRef<HomeItemDialog>);
  readonly data = inject<HomeItemDialogData>(MAT_DIALOG_DATA);

  readonly kind = this.data.kind;
  readonly isEdit = !!this.data.item;
  readonly heading = `${this.isEdit ? 'Edit' : 'New'} ${TITLES[this.kind]}`;
  readonly hasHighlights = this.kind !== 'popular';

  readonly layouts = Object.entries(LAYOUT_LABELS) as [HomeTileLayout, string][];
  readonly actions = Object.entries(ACTION_LABELS) as [HomeCategoryAction, string][];
  readonly iconSuggestions = ICON_SUGGESTIONS;
  readonly categories = this.data.categories ?? [];
  readonly isImageRef = isImageRef;
  readonly uploading = signal(false);

  private readonly source = (this.data.item ?? {}) as Partial<
    HomeCategory & HomeCategoryOption & HomePopularItem
  >;

  readonly form = this.formBuilder.nonNullable.group({
    title: [this.source.title ?? '', [Validators.required, Validators.minLength(2)]],
    subtitle: [this.source.subtitle ?? ''],
    badge: [this.source.badge ?? ''],
    imageUrl: [this.source.imageUrl ?? ''],
    tileColor: [this.source.tileColor ?? '#EDE4F5'],
    layout: [(this.source.layout ?? 'HALF') as HomeTileLayout],
    actionType: [(this.source.actionType ?? 'POPUP') as HomeCategoryAction],
    popupTitle: [this.source.popupTitle ?? ''],
    priceLabel: [this.source.priceLabel ?? ''],
    rating: [this.source.rating == null ? '' : String(this.source.rating)],
    categoryId: [this.source.categoryId ?? ''],
    optionId: [this.source.optionId ?? ''],
    sortOrder: [this.source.sortOrder ?? this.data.nextSortOrder ?? 0],
    isActive: [this.source.isActive ?? true],
    highlights: this.formBuilder.array<HighlightGroup>(
      (this.source.highlights ?? []).map((item) => this.highlightGroup(item)),
    ),
    pricing: this.formBuilder.array<TierGroup>(
      (this.source.pricing ?? []).map((tier) => this.tierGroup(tier)),
    ),
  });

  private readonly selectedCategoryId = toSignal(
    this.form.controls.categoryId.valueChanges,
    { initialValue: this.form.controls.categoryId.value },
  );

  readonly linkableOptions = computed(
    () =>
      this.categories.find((category) => category.id === this.selectedCategoryId())
        ?.options ?? [],
  );

  get highlights(): FormArray<HighlightGroup> {
    return this.form.controls.highlights;
  }

  get pricing(): FormArray<TierGroup> {
    return this.form.controls.pricing;
  }

  addTier() {
    if (this.pricing.length >= 12) return;
    this.pricing.push(
      this.tierGroup({ label: '', subtitle: null, minutes: null, startTime: null, price: 0 }),
    );
  }

  removeTier(index: number) {
    this.pricing.removeAt(index);
  }

  addHighlight() {
    if (this.highlights.length >= 10) return;
    this.highlights.push(this.highlightGroup({ text: '', icon: 'checkmark-circle' }));
  }

  removeHighlight(index: number) {
    this.highlights.removeAt(index);
  }

  moveHighlight(index: number, delta: number) {
    const target = index + delta;
    if (target < 0 || target >= this.highlights.length) return;
    const control = this.highlights.at(index);
    this.highlights.removeAt(index);
    this.highlights.insert(target, control);
  }

  async uploadIcon(index: number, event: Event) {
    const file = this.pickFile(event);
    if (!file) return;
    await this.withUpload(async () => {
      this.highlights.at(index).controls.icon.setValue(await readImageFile(file, 96));
    });
  }

  async uploadImage(event: Event) {
    const file = this.pickFile(event);
    if (!file) return;
    await this.withUpload(async () => {
      this.form.controls.imageUrl.setValue(await readImageFile(file, 720));
    });
  }

  clearImage() {
    this.form.controls.imageUrl.setValue('');
  }

  onCategoryChange() {
    this.form.controls.optionId.setValue('');
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
    const text = (value: string) => value.trim() || null;
    const common = {
      title: raw.title.trim(),
      subtitle: text(raw.subtitle),
      badge: text(raw.badge),
      imageUrl: text(raw.imageUrl),
      sortOrder: Number(raw.sortOrder) || 0,
      isActive: raw.isActive,
    };
    const pricing: HomePricingTier[] = raw.pricing
      .map((tier) => ({
        label: tier.label.trim(),
        subtitle: text(tier.subtitle),
        minutes: tier.minutes === '' ? null : Number(tier.minutes),
        startTime: text(tier.startTime),
        price: Number(tier.price),
      }))
      .filter((tier) => tier.label);
    if (pricing.some((tier) => !(tier.price > 0))) {
      this.notifications.error('Every price option needs a price above 0');
      return;
    }
    if (pricing.some((tier) => tier.minutes !== null && !(tier.minutes >= 15))) {
      this.notifications.error('Duration must be at least 15 minutes');
      return;
    }
    const highlights: HomeHighlight[] = raw.highlights
      .map((item) => ({ text: item.text.trim(), icon: text(item.icon) }))
      .filter((item) => item.text);

    if (this.kind === 'category') {
      this.dialogRef.close({
        ...common,
        tileColor: text(raw.tileColor),
        layout: raw.layout,
        actionType: raw.actionType,
        popupTitle: text(raw.popupTitle),
        highlights,
        pricing,
      });
      return;
    }

    if (this.kind === 'option') {
      this.dialogRef.close({
        ...common,
        priceLabel: text(raw.priceLabel),
        popupTitle: text(raw.popupTitle),
        highlights,
        pricing,
      });
      return;
    }

    const rating = raw.rating.trim() === '' ? null : Number(raw.rating);
    if (rating !== null && (Number.isNaN(rating) || rating < 0 || rating > 5)) {
      this.notifications.error('Rating must be between 0 and 5');
      return;
    }
    this.dialogRef.close({
      ...common,
      priceLabel: text(raw.priceLabel),
      rating: rating === null ? null : Math.round(rating * 10) / 10,
      categoryId: raw.categoryId || null,
      optionId: raw.optionId || null,
    });
  }

  private highlightGroup(item: HomeHighlight): HighlightGroup {
    return this.formBuilder.nonNullable.group({
      text: [item.text, [Validators.required, Validators.maxLength(160)]],
      icon: [item.icon ?? ''],
    });
  }

  private tierGroup(tier: HomePricingTier): TierGroup {
    return this.formBuilder.nonNullable.group({
      label: [tier.label, [Validators.required, Validators.maxLength(40)]],
      subtitle: [tier.subtitle ?? ''],
      minutes: [tier.minutes == null ? '' : String(tier.minutes)],
      startTime: [tier.startTime ?? ''],
      price: [tier.price ? String(tier.price) : '', Validators.required],
    });
  }

  private pickFile(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    return file;
  }

  private async withUpload(task: () => Promise<void>) {
    this.uploading.set(true);
    try {
      await task();
    } catch (error) {
      this.notifications.error((error as Error).message);
    } finally {
      this.uploading.set(false);
    }
  }
}
