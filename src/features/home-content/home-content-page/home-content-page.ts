import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Observable } from 'rxjs';
import { NotificationService } from '@core/services/notification.service';
import { ConfirmService } from '@shared/components/confirmation-dialog/confirm.service';
import {
  ACTION_LABELS,
  HomeCategory,
  HomeCategoryOption,
  HomeCategoryOptionPayload,
  HomeCategoryPayload,
  HomePopularItem,
  HomePopularPayload,
} from '../home-content.model';
import { HomeContentService } from '../home-content.service';
import {
  HomeItemDialog,
  HomeItemDialogData,
} from '../home-item-dialog/home-item-dialog';
import { isImageRef } from '../image-file';

@Component({
  selector: 'app-home-content-page',
  imports: [
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatTabsModule,
    MatTooltipModule,
  ],
  templateUrl: './home-content-page.html',
  styleUrl: './home-content-page.scss',
})
export class HomeContentPage {
  private readonly homeContent = inject(HomeContentService);
  private readonly dialog = inject(MatDialog);
  private readonly confirm = inject(ConfirmService);
  private readonly notifications = inject(NotificationService);

  readonly loading = signal(false);
  readonly categories = signal<HomeCategory[]>([]);
  readonly popular = signal<HomePopularItem[]>([]);
  readonly actionLabels = ACTION_LABELS;
  readonly isImageRef = isImageRef;

  /** Mirrors the customer app: HALF tiles pair up, FULL takes a whole row. */
  readonly previewRows = computed(() => {
    const rows: HomeCategory[][] = [];
    let pending: HomeCategory[] = [];
    for (const category of this.categories().filter((c) => c.isActive)) {
      if (category.layout === 'FULL') {
        if (pending.length) rows.push(pending);
        pending = [];
        rows.push([category]);
        continue;
      }
      pending.push(category);
      if (pending.length === 2) {
        rows.push(pending);
        pending = [];
      }
    }
    if (pending.length) rows.push(pending);
    return rows;
  });

  constructor() {
    this.load();
  }

  load() {
    this.loading.set(true);
    this.homeContent.categories().subscribe({
      next: (categories) => {
        this.categories.set(categories ?? []);
        this.homeContent.popular().subscribe({
          next: (items) => {
            this.popular.set(items ?? []);
            this.loading.set(false);
          },
          error: () => this.loading.set(false),
        });
      },
      error: () => this.loading.set(false),
    });
  }

  categoryTitle(id: string | null) {
    return this.categories().find((category) => category.id === id)?.title ?? null;
  }

  optionTitle(id: string | null) {
    for (const category of this.categories()) {
      const option = category.options.find((item) => item.id === id);
      if (option) return option.title;
    }
    return null;
  }

  addCategory() {
    this.open({ kind: 'category', nextSortOrder: this.nextSort(this.categories()) }, (payload: HomeCategoryPayload) =>
      this.homeContent.createCategory(payload),
    'Category created');
  }

  editCategory(category: HomeCategory) {
    this.open({ kind: 'category', item: category }, (payload: HomeCategoryPayload) =>
      this.homeContent.updateCategory(category.id, payload),
    'Category updated');
  }

  toggleCategory(category: HomeCategory) {
    this.run(
      this.homeContent.updateCategory(category.id, { isActive: !category.isActive }),
      category.isActive ? 'Category hidden' : 'Category visible',
    );
  }

  removeCategory(category: HomeCategory) {
    this.confirm
      .askDanger(
        'Delete category',
        `${category.title} and its ${category.options.length} option(s) will be removed from the customer app.`,
        { confirmLabel: 'Delete' },
      )
      .subscribe((result) => {
        if (result.confirmed) {
          this.run(this.homeContent.removeCategory(category.id), 'Category deleted');
        }
      });
  }

  addOption(category: HomeCategory) {
    this.open(
      { kind: 'option', nextSortOrder: this.nextSort(category.options) },
      (payload: HomeCategoryOptionPayload) => this.homeContent.createOption(category.id, payload),
      'Option added',
    );
  }

  editOption(option: HomeCategoryOption) {
    this.open({ kind: 'option', item: option }, (payload: HomeCategoryOptionPayload) =>
      this.homeContent.updateOption(option.id, payload),
    'Option updated');
  }

  removeOption(option: HomeCategoryOption) {
    this.confirm
      .askDanger('Delete option', `${option.title} will be removed.`, {
        confirmLabel: 'Delete',
      })
      .subscribe((result) => {
        if (result.confirmed) {
          this.run(this.homeContent.removeOption(option.id), 'Option deleted');
        }
      });
  }

  addPopular() {
    this.open(
      {
        kind: 'popular',
        categories: this.categories(),
        nextSortOrder: this.nextSort(this.popular()),
      },
      (payload: HomePopularPayload) => this.homeContent.createPopular(payload),
      'Popular card added',
    );
  }

  editPopular(item: HomePopularItem) {
    this.open({ kind: 'popular', item, categories: this.categories() }, (payload: HomePopularPayload) =>
      this.homeContent.updatePopular(item.id, payload),
    'Popular card updated');
  }

  togglePopular(item: HomePopularItem) {
    this.run(
      this.homeContent.updatePopular(item.id, { isActive: !item.isActive }),
      item.isActive ? 'Card hidden' : 'Card visible',
    );
  }

  removePopular(item: HomePopularItem) {
    this.confirm
      .askDanger('Remove popular card', `${item.title} will be removed.`, {
        confirmLabel: 'Remove',
      })
      .subscribe((result) => {
        if (result.confirmed) {
          this.run(this.homeContent.removePopular(item.id), 'Popular card removed');
        }
      });
  }

  private open<T>(
    data: HomeItemDialogData,
    save: (payload: T) => Observable<unknown>,
    message: string,
  ) {
    this.dialog
      .open<HomeItemDialog, HomeItemDialogData, T | null>(HomeItemDialog, {
        data,
        width: '760px',
        maxWidth: '95vw',
        autoFocus: 'first-tabbable',
      })
      .afterClosed()
      .subscribe((payload) => {
        if (payload) this.run(save(payload), message);
      });
  }

  private run(request: Observable<unknown>, message: string) {
    this.loading.set(true);
    request.subscribe({
      next: () => {
        this.notifications.success(message);
        this.load();
      },
      error: () => this.loading.set(false),
    });
  }

  private nextSort(list: { sortOrder: number }[]) {
    return list.reduce((max, item) => Math.max(max, item.sortOrder), 0) + 1;
  }
}
