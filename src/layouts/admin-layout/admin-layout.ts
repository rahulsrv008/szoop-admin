import { Component, DestroyRef, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  ActivatedRouteSnapshot,
  NavigationEnd,
  Router,
  RouterOutlet,
} from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { BreakpointObserver } from '@angular/cdk/layout';
import { filter, map, startWith } from 'rxjs';
import { Header } from '@shared/components/header/header';
import { Sidebar } from '@shared/components/sidebar/sidebar';
import { Footer } from '@shared/components/footer/footer';
import { AuthService } from '@core/services/auth.service';
import { BookingMonitorService } from '@core/services/booking-monitor.service';

/** Shell for every authenticated screen: sidebar + header + content + footer. */
@Component({
  selector: 'app-admin-layout',
  imports: [RouterOutlet, MatSidenavModule, Header, Sidebar, Footer],
  templateUrl: './admin-layout.html',
  styleUrl: './admin-layout.scss',
})
export class AdminLayout {
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly breakpointObserver = inject(BreakpointObserver);

  readonly isMobile = toSignal(
    this.breakpointObserver.observe('(max-width: 720px)').pipe(map(({ matches }) => matches)),
    { initialValue: false },
  );

  constructor() {
    this.auth.loadProfile().subscribe();

    // The header pill and sidebar badge watch live bookings on every screen.
    const monitor = inject(BookingMonitorService);
    monitor.start();
    inject(DestroyRef).onDestroy(() => monitor.stop());

    effect(() => {
      if (this.isMobile()) this.sidebarOpen.set(false);
    });
  }

  readonly sidebarOpen = signal(true);

  /** Deepest `data.title` on the active route, shown in the header. */
  readonly pageTitle = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      startWith(null),
      map(() => this.resolveTitle()),
    ),
    { initialValue: '' },
  );

  toggleSidebar() {
    this.sidebarOpen.update((open) => !open);
  }

  private resolveTitle(): string {
    let route: ActivatedRouteSnapshot | null = this.router.routerState.snapshot.root;
    let title = '';
    while (route) {
      const routeTitle = route.data?.['title'] as string | undefined;
      if (routeTitle) title = routeTitle;
      route = route.firstChild;
    }
    return title;
  }
}
