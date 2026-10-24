import { Component, computed, inject, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SessionStore } from '@core/auth/session.store';
import { AuthService } from '@core/services/auth.service';
import { BookingMonitorService } from '@core/services/booking-monitor.service';

@Component({
  selector: 'app-header',
  imports: [
    RouterLink,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatTooltipModule,
  ],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {
  private readonly auth = inject(AuthService);
  private readonly session = inject(SessionStore);
  private readonly monitor = inject(BookingMonitorService);

  readonly monitorReady = computed(() => !!this.monitor.board());
  readonly attention = this.monitor.attention;
  readonly monitorTip = computed(() => {
    const counts = this.monitor.counts();
    const parts = [
      `Jobs: ${counts.red} red, ${counts.orange} orange, ${counts.ok} on track`,
      `Agents online: ${counts.online} of ${counts.agents}`,
    ];
    if (counts.agentRed + counts.agentOrange) {
      parts.push(`${counts.agentRed + counts.agentOrange} offline with work today`);
    }
    return parts.join(' · ');
  });

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
