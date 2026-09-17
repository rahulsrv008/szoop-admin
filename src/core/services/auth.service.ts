import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, catchError, of, switchMap, tap, throwError } from 'rxjs';
import {
  AdminProfile,
  ChangePasswordPayload,
  LoginPayload,
  SessionResponse,
} from '@core/models';
import { SessionStore } from '@core/auth/session.store';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(ApiService);
  private readonly session = inject(SessionStore);
  private readonly router = inject(Router);

  readonly admin = this.session.admin;
  readonly isAuthenticated = this.session.isAuthenticated;
  readonly displayName = this.session.displayName;
  readonly role = this.session.role;

  login(payload: LoginPayload): Observable<AdminProfile | null> {
    return this.api.post<SessionResponse>('admin/auth/login', payload).pipe(
      tap((session) => this.session.setSession(session)),
      switchMap((session) =>
        session.admin ? of(session.admin) : this.loadProfile(),
      ),
    );
  }

  loadProfile(): Observable<AdminProfile | null> {
    return this.api.get<AdminProfile>('admin/auth/me').pipe(
      tap((admin) => this.session.setAdmin(admin)),
      catchError(() => of(null)),
    );
  }

  /** Used by the auth interceptor when an access token expires. */
  refreshSession(): Observable<SessionResponse> {
    const refreshToken = this.session.refreshToken();
    if (!refreshToken) {
      return throwError(() => new Error('No refresh token stored'));
    }
    return this.api
      .post<SessionResponse>('admin/auth/refresh-token', { refreshToken })
      .pipe(tap((session) => this.session.setSession(session)));
  }

  changePassword(payload: ChangePasswordPayload) {
    return this.api.post<{ ok?: boolean }>('admin/auth/change-password', payload);
  }

  /**
   * The backend has no self-service reset yet; a super admin resets passwords
   * with `npm run seed:admin`. The call is attempted anyway so the screen starts
   * working the moment that endpoint ships.
   */
  requestPasswordReset(email: string) {
    return this.api.post<{ ok?: boolean }>('admin/auth/forgot-password', { email });
  }

  logout(options: { callApi?: boolean } = { callApi: true }) {
    const refreshToken = this.session.refreshToken();
    const finish = () => {
      this.session.clear();
      void this.router.navigate(['/auth/login']);
    };

    if (!options.callApi || !refreshToken) {
      finish();
      return;
    }

    this.api
      .post('admin/auth/logout', { refreshToken })
      .pipe(catchError(() => of(null)))
      .subscribe(() => finish());
  }
}
