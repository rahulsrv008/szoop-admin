import {
  AfterViewInit,
  Component,
  DestroyRef,
  ElementRef,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import {
  DashboardLiveMap,
  DashboardMapAgent,
  DashboardMapCustomer,
  DashboardMapZone,
} from '@core/models';
import { ENVIRONMENT } from '@config/environment';
import { timer } from 'rxjs';
import { DashboardService } from '../dashboard.service';

let googleMapsLoadPromise: Promise<void> | undefined;

function loadGoogleMaps(apiKey: string) {
  if (typeof google !== 'undefined' && google.maps) return Promise.resolve();
  if (!apiKey) {
    return Promise.reject(
      new Error('Add GOOGLE_MAPS_API_KEY to admin-panel/.env to enable the map.'),
    );
  }
  if (googleMapsLoadPromise) return googleMapsLoadPromise;

  googleMapsLoadPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&v=weekly`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (typeof google !== 'undefined' && google.maps) {
        resolve();
      } else {
        googleMapsLoadPromise = undefined;
        reject(new Error('Google Maps JavaScript API did not initialize.'));
      }
    };
    script.onerror = () => {
      googleMapsLoadPromise = undefined;
      reject(new Error('Google Maps JavaScript API could not be loaded.'));
    };
    document.head.appendChild(script);
  });
  return googleMapsLoadPromise;
}

@Component({
  selector: 'app-live-map',
  imports: [DatePipe, MatButtonModule, MatIconModule],
  templateUrl: './live-map.html',
  styleUrl: './live-map.scss',
})
export class LiveMap implements AfterViewInit {
  @ViewChild('mapCanvas', { static: true })
  private readonly mapCanvas!: ElementRef<HTMLDivElement>;

  private readonly dashboardService = inject(DashboardService);
  private readonly destroyRef = inject(DestroyRef);
  private map?: google.maps.Map;
  private infoWindow?: google.maps.InfoWindow;
  private readonly markers: google.maps.Marker[] = [];
  private readonly zoneCircles: google.maps.Circle[] = [];
  private mapBounds?: google.maps.LatLngBounds;
  private didFitBounds = false;

  readonly data = signal<DashboardLiveMap | null>(null);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly lastUpdated = signal<Date | null>(null);

  constructor() {
    this.destroyRef.onDestroy(() => this.clearMapItems());
  }

  ngAfterViewInit() {
    loadGoogleMaps(ENVIRONMENT.googleMapsApiKey)
      .then(() => {
        if (this.destroyRef.destroyed) return;
        this.map = new google.maps.Map(this.mapCanvas.nativeElement, {
          center: { lat: 20.5937, lng: 78.9629 },
          zoom: 5,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
          gestureHandling: 'greedy',
        });
        this.infoWindow = new google.maps.InfoWindow();
        timer(0, ENVIRONMENT.livePollIntervalMs)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe(() => this.load());
      })
      .catch((error: unknown) => {
        this.loading.set(false);
        this.error.set(
          error instanceof Error ? error.message : 'Google Maps could not be initialized.',
        );
      });
  }

  load() {
    if (this.loading() && this.data()) return;
    this.loading.set(true);
    this.error.set('');

    this.dashboardService.liveMap().subscribe({
      next: (data) => {
        this.data.set(data);
        this.lastUpdated.set(new Date(data.generatedAt));
        this.loading.set(false);
        this.renderMap(data);
      },
      error: () => {
        this.loading.set(false);
        this.error.set(
          'Live locations could not be refreshed. Check the connection and try again.',
        );
      },
    });
  }

  fitMap() {
    if (this.map && this.mapBounds && !this.mapBounds.isEmpty()) {
      this.map.fitBounds(this.mapBounds, 48);
      google.maps.event.addListenerOnce(this.map, 'bounds_changed', () => {
        if ((this.map?.getZoom() ?? 0) > 14) this.map?.setZoom(14);
      });
    }
  }

  hasZoneCoordinates(zones: DashboardMapZone[]) {
    return zones.some((zone) => zone.latitude !== null && zone.longitude !== null);
  }

  private renderMap(data: DashboardLiveMap) {
    if (!this.map || !this.infoWindow) return;
    this.clearMapItems();

    const bounds = new google.maps.LatLngBounds();
    const zoneNames = new Map(data.zones.map((zone) => [zone.id, zone.name]));
    for (const zone of data.zones) {
      if (zone.latitude === null || zone.longitude === null) continue;
      const center = { lat: zone.latitude, lng: zone.longitude };
      const serviceRadius = new google.maps.Circle({
        map: this.map,
        center,
        radius: Math.max(zone.serviceRadiusKm, 0) * 1000,
        strokeColor: '#4263eb',
        strokeOpacity: 0.85,
        strokeWeight: 2,
        fillColor: '#4263eb',
        fillOpacity: 0.09,
        clickable: true,
      });
      serviceRadius.addListener('click', () => {
        this.openInfoWindow(
          zone.name,
          `${zone.city ?? 'Service zone'} · ${zone.serviceRadiusKm} km radius`,
          center,
        );
      });
      this.zoneCircles.push(serviceRadius);
      this.addMarker(
        zone.name,
        zone.city ?? `Service zone · ${zone.serviceRadiusKm} km radius`,
        center,
        '#4263eb',
      );
      const circleBounds = serviceRadius.getBounds();
      if (circleBounds) bounds.union(circleBounds);
    }

    for (const customer of data.customers) {
      this.addMarker(
        customer.name,
        this.customerDetail(customer, zoneNames),
        { lat: customer.latitude, lng: customer.longitude },
        '#e8590c',
      );
      bounds.extend({ lat: customer.latitude, lng: customer.longitude });
    }

    for (const agent of data.agents) {
      this.addMarker(
        agent.name,
        this.agentDetail(agent, zoneNames),
        { lat: agent.latitude, lng: agent.longitude },
        '#2f9e44',
      );
      bounds.extend({ lat: agent.latitude, lng: agent.longitude });
    }

    this.mapBounds = bounds.isEmpty() ? undefined : bounds;
    if (!this.didFitBounds && !bounds.isEmpty()) {
      this.fitMap();
      this.didFitBounds = true;
    }
  }

  private customerDetail(customer: DashboardMapCustomer, zoneNames: Map<string, string>) {
    const zone = customer.zoneId ? zoneNames.get(customer.zoneId) : undefined;
    return `Active booking · ${customer.status} · ${customer.bookingId}${zone ? ` · ${zone}` : ''}`;
  }

  private agentDetail(agent: DashboardMapAgent, zoneNames: Map<string, string>) {
    const zones = agent.zoneIds
      .map((id) => zoneNames.get(id))
      .filter((name): name is string => !!name);
    return `Available agent · ${zones.join(', ') || 'Assigned service zone'} · updated ${new Date(
      agent.recordedAt,
    ).toLocaleTimeString()}`;
  }

  private addMarker(
    title: string,
    detail: string,
    position: google.maps.LatLngLiteral,
    color: string,
  ) {
    if (!this.map) return;
    const marker = new google.maps.Marker({
      map: this.map,
      position,
      title,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        fillColor: color,
        fillOpacity: 1,
        strokeColor: '#fff',
        strokeWeight: 2,
        scale: 8,
      },
    });
    marker.addListener('click', () => this.openInfoWindow(title, detail, position));
    this.markers.push(marker);
  }

  private openInfoWindow(title: string, detail: string, position: google.maps.LatLngLiteral) {
    if (!this.map || !this.infoWindow) return;
    const content = document.createElement('div');
    const heading = document.createElement('strong');
    heading.textContent = title;
    const description = document.createElement('div');
    description.textContent = detail;
    content.append(heading, description);
    this.infoWindow.setContent(content);
    this.infoWindow.setPosition(position);
    this.infoWindow.open(this.map);
  }

  private clearMapItems() {
    this.infoWindow?.close();
    for (const marker of this.markers) marker.setMap(null);
    for (const circle of this.zoneCircles) circle.setMap(null);
    this.markers.length = 0;
    this.zoneCircles.length = 0;
  }
}
