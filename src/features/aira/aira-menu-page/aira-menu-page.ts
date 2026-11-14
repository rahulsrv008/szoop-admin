import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NotificationService } from '@core/services/notification.service';
import { ConfirmService } from '@shared/components/confirmation-dialog/confirm.service';
import { Observable } from 'rxjs';
import { AiraMenuDialog, AiraMenuDialogData } from '../aira-menu-dialog/aira-menu-dialog';
import { AiraGroup, AiraGroupPayload, AiraItem, AiraItemPayload, AiraMenu } from '../aira-menu.model';
import { AiraMenuService } from '../aira-menu.service';

/** Admin → Aira → Services & menu: the groups and priced services the Aira app shows and books. */
@Component({
  selector: 'app-aira-menu-page',
  imports: [MatButtonModule, MatIconModule, MatProgressBarModule, MatSlideToggleModule, MatTooltipModule],
  templateUrl: './aira-menu-page.html',
  styleUrl: './aira-menu-page.scss',
})
export class AiraMenuPage {
  private readonly menuService = inject(AiraMenuService);
  private readonly dialog = inject(MatDialog);
  private readonly confirm = inject(ConfirmService);
  private readonly notifications = inject(NotificationService);

  readonly loading = signal(false);
  readonly menu = signal<AiraMenu>({ groups: [], items: [] });
  readonly selectedGroup = signal<string | null>(null);

  readonly groupTitles = computed(() => new Map(this.menu().groups.map((group) => [group.id, group.title])));
  readonly sections = computed(() => [...new Set(this.menu().items.map((item) => item.section))]);
  readonly visibleItems = computed(() => {
    const group = this.selectedGroup();
    return group ? this.menu().items.filter((item) => item.group === group) : this.menu().items;
  });

  constructor() {
    this.load();
  }

  load() {
    this.loading.set(true);
    this.menuService.menu().subscribe({
      next: (menu) => {
        this.menu.set(menu);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  selectGroup(id: string | null) {
    this.selectedGroup.set(this.selectedGroup() === id ? null : id);
  }

  addGroup() {
    this.openDialog<AiraGroupPayload>(
      { kind: 'group', nextSortOrder: this.nextSort(this.menu().groups) },
      (payload) => this.menuService.createGroup(payload),
      'Group added',
    );
  }

  editGroup(group: AiraGroup) {
    this.openDialog<AiraGroupPayload>(
      { kind: 'group', group, nextSortOrder: group.sortOrder },
      (payload) => this.menuService.updateGroup(group.id, payload),
      'Group saved',
    );
  }

  toggleGroup(group: AiraGroup) {
    this.run(this.menuService.updateGroup(group.id, { isActive: !group.isActive }), group.isActive ? 'Group hidden' : 'Group visible');
  }

  removeGroup(group: AiraGroup) {
    if (group.itemCount) {
      this.notifications.error(`Move or delete the ${group.itemCount} service(s) in ${group.title} first`);
      return;
    }
    this.confirm
      .askDanger('Delete group', `${group.title} will be removed from the Aira app.`, { confirmLabel: 'Delete' })
      .subscribe((result) => {
        if (result.confirmed) this.run(this.menuService.removeGroup(group.id), 'Group deleted');
      });
  }

  addItem() {
    this.openDialog<AiraItemPayload>(
      {
        kind: 'item',
        groups: this.menu().groups,
        sections: this.sections(),
        groupId: this.selectedGroup() ?? undefined,
        nextSortOrder: this.nextSort(this.menu().items),
      },
      (payload) => this.menuService.createItem(payload),
      'Service added',
    );
  }

  editItem(item: AiraItem) {
    this.openDialog<AiraItemPayload>(
      { kind: 'item', item, groups: this.menu().groups, sections: this.sections(), nextSortOrder: item.sortOrder },
      (payload) => this.menuService.updateItem(item.id, payload),
      'Service saved',
    );
  }

  toggleItem(item: AiraItem) {
    this.run(this.menuService.updateItem(item.id, { isActive: !item.isActive }), item.isActive ? 'Service hidden' : 'Service visible');
  }

  removeItem(item: AiraItem) {
    this.confirm
      .askDanger('Delete service', `${item.title} will no longer be bookable. Past bookings keep their price.`, { confirmLabel: 'Delete' })
      .subscribe((result) => {
        if (result.confirmed) this.run(this.menuService.removeItem(item.id), 'Service deleted');
      });
  }

  discount(item: AiraItem) {
    if (!item.originalPrice || item.originalPrice <= item.price) return null;
    return Math.round((1 - item.price / item.originalPrice) * 100);
  }

  private nextSort(rows: { sortOrder: number }[]) {
    return rows.reduce((max, row) => Math.max(max, row.sortOrder), 0) + 10;
  }

  private openDialog<T>(data: AiraMenuDialogData, save: (payload: T) => Observable<unknown>, message: string) {
    this.dialog
      .open<AiraMenuDialog, AiraMenuDialogData, T | null>(AiraMenuDialog, {
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
}
