import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ENVIRONMENT } from '@config/environment';

type ParamValue = string | number | boolean | undefined | null;

/**
 * Thin typed wrapper around HttpClient: prefixes the API base url and drops
 * empty query params so filter forms can bind straight to it.
 */
@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);

  get<T>(path: string, params?: Record<string, ParamValue | ParamValue[]>): Observable<T> {
    return this.http.get<T>(this.url(path), { params: this.toParams(params) });
  }

  post<T>(path: string, body?: unknown): Observable<T> {
    return this.http.post<T>(this.url(path), body ?? {});
  }

  patch<T>(path: string, body?: unknown): Observable<T> {
    return this.http.patch<T>(this.url(path), body ?? {});
  }

  put<T>(path: string, body?: unknown): Observable<T> {
    return this.http.put<T>(this.url(path), body ?? {});
  }

  delete<T>(path: string, params?: Record<string, ParamValue>): Observable<T> {
    return this.http.delete<T>(this.url(path), { params: this.toParams(params) });
  }

  private url(path: string) {
    const clean = path.startsWith('/') ? path.slice(1) : path;
    return `${ENVIRONMENT.apiBaseUrl}/${clean}`;
  }

  private toParams(params?: Record<string, ParamValue | ParamValue[]>) {
    let httpParams = new HttpParams();
    if (!params) return httpParams;

    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null || value === '') continue;
      if (Array.isArray(value)) {
        for (const entry of value) {
          if (entry === undefined || entry === null || entry === '') continue;
          httpParams = httpParams.append(key, String(entry));
        }
        continue;
      }
      httpParams = httpParams.set(key, String(value));
    }
    return httpParams;
  }
}
