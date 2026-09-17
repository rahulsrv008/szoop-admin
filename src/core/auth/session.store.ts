import { Injectable, computed, signal } from '@angular/core';
import { STORAGE_KEYS } from '@config/constants';
import { AdminProfile, SessionResponse } from '@core/models';

/**
 * Holds the signed-in admin and their tokens. localStorage keeps the session
 * across reloads; every read goes through the signals so components stay in sync.
 */
@Injectable({ providedIn: 'root' })
export class SessionStore {
  private readonly accessTokenSignal = signal<string | null>(
    localStorage.getItem(STORAGE_KEYS.accessToken),
  );
  private readonly refreshTokenSignal = signal<string | null>(
    localStorage.getItem(STORAGE_KEYS.refreshToken),
  );
  private readonly adminSignal = signal<AdminProfile | null>(this.readAdmin());

  readonly accessToken = this.accessTokenSignal.asReadonly();
  readonly refreshToken = this.refreshTokenSignal.asReadonly();
  readonly admin = this.adminSignal.asReadonly();
  readonly isAuthenticated = computed(() => !!this.accessTokenSignal());
  readonly role = computed(() => this.adminSignal()?.role ?? null);
  readonly displayName = computed(() => {
    const admin = this.adminSignal();
    if (!admin) return '';
    const name = [admin.firstName, admin.lastName].filter(Boolean).join(' ').trim();
    return name || admin.email;
  });

  setSession(session: SessionResponse) {
    this.accessTokenSignal.set(session.accessToken);
    this.refreshTokenSignal.set(session.refreshToken);
    localStorage.setItem(STORAGE_KEYS.accessToken, session.accessToken);
    localStorage.setItem(STORAGE_KEYS.refreshToken, session.refreshToken);
    if (session.admin) this.setAdmin(session.admin);
  }

  setAdmin(admin: AdminProfile) {
    this.adminSignal.set(admin);
    localStorage.setItem(STORAGE_KEYS.admin, JSON.stringify(admin));
  }

  clear() {
    this.accessTokenSignal.set(null);
    this.refreshTokenSignal.set(null);
    this.adminSignal.set(null);
    localStorage.removeItem(STORAGE_KEYS.accessToken);
    localStorage.removeItem(STORAGE_KEYS.refreshToken);
    localStorage.removeItem(STORAGE_KEYS.admin);
  }

  private readAdmin(): AdminProfile | null {
    const raw = localStorage.getItem(STORAGE_KEYS.admin);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as AdminProfile;
    } catch {
      return null;
    }
  }
}
