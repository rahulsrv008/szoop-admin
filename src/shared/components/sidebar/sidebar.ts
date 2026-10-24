import { Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { NAV_SECTIONS, NavSection } from '@config/navigation';
import { ENVIRONMENT } from '@config/environment';
import { SessionStore } from '@core/auth/session.store';
import { BookingMonitorService } from '@core/services/booking-monitor.service';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive, MatIconModule, MatListModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
})
export class Sidebar {
  private readonly session = inject(SessionStore);

  readonly appName = ENVIRONMENT.appName;
  readonly attention = inject(BookingMonitorService).attention;

  /** Hides sections the current role cannot open. */
  readonly sections = computed<NavSection[]>(() => {
    const role = this.session.role();
    return NAV_SECTIONS.filter(
      (section) =>
        !section.roles?.length || (role && section.roles.includes(role)),
    )
      .map((section) => ({
        ...section,
        items: section.items.filter(
          (item) => !item.roles?.length || (role && item.roles.includes(role)),
        ),
      }))
      .filter((section) => section.items.length);
  });
}
