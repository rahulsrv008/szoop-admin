import { Component, inject, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { SessionStore } from '@core/auth/session.store';
import { AuthService } from '@core/services/auth.service';

@Component({
  selector: 'app-header',
  imports: [
    RouterLink,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
  ],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {
  private readonly auth = inject(AuthService);
  private readonly session = inject(SessionStore);

  readonly title = input('');
  readonly toggleSidebar = output<void>();

  readonly displayName = this.session.displayName;
  readonly role = this.session.role;
  readonly isSuperAdmin = () => this.session.role() === 'SUPER_ADMIN';
  readonly zoneLabel = () => {
    const admin = this.session.admin();
    if (!admin || admin.unrestricted || admin.role === 'SUPER_ADMIN') return 'All zones';
    const names = (admin.zones ?? []).map((zone) => zone.name);
    return names.length ? names.join(', ') : 'No zones assigned';
  };
  readonly initials = () => {
    const name = this.session.displayName();
    return name ? name.trim().charAt(0).toUpperCase() : 'A';
  };

  logout() {
    this.auth.logout();
  }
}
