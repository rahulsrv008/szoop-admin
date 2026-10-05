import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormBuilder,
  FormControl,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { DEFAULT_PAGE_SIZE } from '@config/constants';
import { AdminUser } from '@core/models';
import { AuthService } from '@core/services/auth.service';
import { NotificationService } from '@core/services/notification.service';
import { ConfirmService } from '@shared/components/confirmation-dialog/confirm.service';
import { DataTable } from '@shared/components/data-table/data-table';
import { SelectOption, toOptions } from '@shared/models/filter.model';
import { matchValidator } from '@shared/validators/form.validators';
import {
  TableAction,
  TableActionEvent,
  TableColumn,
  TablePageEvent,
} from '@shared/models/table.model';
import { ServiceArea } from '@core/models';
import { ServiceAreasService } from '@features/service-areas/service-areas.service';
import { ADMIN_ROLE_OPTIONS } from '../settings.model';
import { SettingsService } from '../settings.service';

@Component({
  selector: 'app-admin-users',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    RouterLinkActive,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatProgressBarModule,
    DataTable,
  ],
  templateUrl: './admin-users.html',
  styleUrl: './admin-users.scss',
})
export class AdminUsers {
  private readonly settingsService = inject(SettingsService);
  private readonly areasService = inject(ServiceAreasService);
  private readonly auth = inject(AuthService);
  private readonly confirm = inject(ConfirmService);
  private readonly notifications = inject(NotificationService);
  private readonly formBuilder = inject(FormBuilder);

  readonly loading = signal(false);
  readonly creating = signal(false);
  readonly savingEdit = signal(false);
  readonly changingPassword = signal(false);
  readonly rows = signal<AdminUser[]>([]);
  readonly total = signal(0);
  readonly page = signal(1);
  readonly limit = signal(DEFAULT_PAGE_SIZE);
  readonly search = signal('');
  readonly role = signal('');
  readonly status = signal('');
  readonly hideCurrent = signal(true);
  readonly hideNew = signal(true);
  readonly editing = signal<AdminUser | null>(null);
  readonly zones = signal<ServiceArea[]>([]);

  readonly searchControl = new FormControl('', { nonNullable: true });

  readonly roleOptions: SelectOption[] = [
    { value: '', label: 'All roles' },
    ...toOptions(ADMIN_ROLE_OPTIONS),
  ];

  readonly statusOptions: SelectOption[] = [
    { value: '', label: 'All accounts' },
    { value: 'true', label: 'Active' },
    { value: 'false', label: 'Inactive' },
  ];

  readonly createForm = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    firstName: [''],
    lastName: [''],
    role: ['ADMIN' as string, Validators.required],
    zoneIds: [[] as string[]],
  });

  readonly editForm = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    firstName: [''],
    lastName: [''],
    role: ['ADMIN' as string, Validators.required],
    password: [''],
    zoneIds: [[] as string[]],
  });

  readonly passwordForm = this.formBuilder.nonNullable.group(
    {
      currentPassword: ['', [Validators.required, Validators.minLength(6)]],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required],
    },
    { validators: matchValidator('newPassword', 'confirmPassword') },
  );

  readonly columns: TableColumn<AdminUser>[] = [
    {
      key: 'name',
      label: 'Name',
      value: (row) =>
        [row.firstName, row.lastName].filter(Boolean).join(' ').trim() || null,
      fallback: '—',
    },
    { key: 'email', label: 'Email' },
    { key: 'role', label: 'Role', type: 'badge' },
    {
      key: 'zones',
      label: 'Zones',
      value: (row) =>
        row.role === 'SUPER_ADMIN'
          ? 'All zones'
          : (row.zones ?? []).map((zone) => zone.name).join(', ') || 'None',
    },
    { key: 'isActive', label: 'Active', type: 'boolean', align: 'center' },
    { key: 'createdAt', label: 'Created', type: 'date' },
  ];

  readonly actions: TableAction<AdminUser>[] = [
    { id: 'edit', label: 'Edit', icon: 'edit' },
    {
      id: 'deactivate',
      label: 'Deactivate',
      icon: 'person_off',
      color: 'warn',
      hidden: (row) => !row.isActive,
    },
    {
      id: 'activate',
      label: 'Activate',
      icon: 'person',
      hidden: (row) => row.isActive,
    },
  ];

  constructor() {
    this.searchControl.valueChanges
      .pipe(debounceTime(350), distinctUntilChanged(), takeUntilDestroyed())
      .subscribe((value) => {
        this.search.set(value.trim());
        this.page.set(1);
        this.load();
      });

    this.load();
    this.areasService.list({ page: 1, limit: 100, isActive: true }).subscribe({
      next: (result) => this.zones.set(result?.items ?? []),
    });
  }

  load() {
    this.loading.set(true);
    this.settingsService
      .listAdmins({
        page: this.page(),
        limit: this.limit(),
        search: this.search() || undefined,
        role: this.role() || undefined,
        isActive: this.status() ? this.status() === 'true' : undefined,
      })
      .subscribe({
        next: (result) => {
          this.rows.set(result?.items ?? []);
          this.total.set(result?.meta?.total ?? 0);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  onRoleChange(role: string) {
    this.role.set(role);
    this.page.set(1);
    this.load();
  }

  onStatusChange(status: string) {
    this.status.set(status);
    this.page.set(1);
    this.load();
  }

  onPageChange(event: TablePageEvent) {
    this.page.set(event.page);
    this.limit.set(event.limit);
    this.load();
  }

  onAction(event: TableActionEvent) {
    const row = event.row as AdminUser;
    if (event.id === 'edit') this.startEdit(row);
    if (event.id === 'activate') this.activate(row);
    if (event.id === 'deactivate') this.deactivate(row);
  }

  startEdit(row: AdminUser) {
    this.editing.set(row);
    this.editForm.reset({
      email: row.email,
      firstName: row.firstName ?? '',
      lastName: row.lastName ?? '',
      role: row.role,
      password: '',
      zoneIds: (row.zones ?? []).map((zone) => zone.id),
    });
  }

  cancelEdit() {
    this.editing.set(null);
    this.editForm.reset({
      email: '',
      firstName: '',
      lastName: '',
      role: 'ADMIN',
      password: '',
      zoneIds: [],
    });
  }

  private zonesFor(role: string, zoneIds: string[]) {
    if (role === 'SUPER_ADMIN') return [];
    if (!zoneIds.length) {
      this.notifications.error('Assign at least one zone for this role');
      return null;
    }
    return zoneIds;
  }

  saveEdit() {
    const current = this.editing();
    if (!current || this.editForm.invalid || this.savingEdit()) {
      this.editForm.markAllAsTouched();
      return;
    }

    const raw = this.editForm.getRawValue();
    const zoneIds = this.zonesFor(raw.role, raw.zoneIds);
    if (zoneIds === null) return;
    this.savingEdit.set(true);
    this.settingsService
      .updateAdmin(current.id, {
        email: raw.email.trim(),
        firstName: raw.firstName.trim() || undefined,
        lastName: raw.lastName.trim() || undefined,
        role: raw.role,
        password: raw.password.trim() || undefined,
        zoneIds,
      })
      .subscribe({
        next: () => {
          this.savingEdit.set(false);
          this.notifications.success('Admin updated');
          this.cancelEdit();
          this.load();
        },
        error: () => this.savingEdit.set(false),
      });
  }

  create() {
    if (this.createForm.invalid || this.creating()) {
      this.createForm.markAllAsTouched();
      return;
    }

    const raw = this.createForm.getRawValue();
    const zoneIds = this.zonesFor(raw.role, raw.zoneIds);
    if (zoneIds === null) return;
    this.creating.set(true);
    this.settingsService
      .createAdmin({
        email: raw.email.trim(),
        password: raw.password,
        firstName: raw.firstName.trim() || undefined,
        lastName: raw.lastName.trim() || undefined,
        role: raw.role,
        zoneIds,
      })
      .subscribe({
        next: () => {
          this.creating.set(false);
          this.notifications.success('Admin user created');
          this.createForm.reset({
            email: '',
            password: '',
            firstName: '',
            lastName: '',
            role: 'ADMIN',
            zoneIds: [],
          });
          this.load();
        },
        error: () => this.creating.set(false),
      });
  }

  changePassword() {
    if (this.passwordForm.invalid || this.changingPassword()) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    const { currentPassword, newPassword } = this.passwordForm.getRawValue();
    this.changingPassword.set(true);
    this.auth.changePassword({ currentPassword, newPassword }).subscribe({
      next: () => {
        this.changingPassword.set(false);
        this.notifications.success('Password updated');
        this.passwordForm.reset({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
      },
      error: () => this.changingPassword.set(false),
    });
  }

  private activate(row: AdminUser) {
    this.confirm
      .ask({
        title: 'Activate admin',
        message: `${row.email} will be able to sign in again.`,
        confirmLabel: 'Activate',
      })
      .subscribe((result) => {
        if (!result.confirmed) return;
        this.loading.set(true);
        this.settingsService.activateAdmin(row.id).subscribe({
          next: () => {
            this.notifications.success('Admin activated');
            this.load();
          },
          error: () => this.loading.set(false),
        });
      });
  }

  private deactivate(row: AdminUser) {
    this.confirm
      .askDanger(
        'Deactivate admin',
        `${row.email} loses access immediately and active sessions are revoked.`,
        { confirmLabel: 'Deactivate' },
      )
      .subscribe((result) => {
        if (!result.confirmed) return;
        this.loading.set(true);
        this.settingsService.deactivateAdmin(row.id).subscribe({
          next: () => {
            this.notifications.success('Admin deactivated');
            this.load();
          },
          error: () => this.loading.set(false),
        });
      });
  }
}
