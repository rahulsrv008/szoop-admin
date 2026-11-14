import { Injectable, signal } from '@angular/core';
import { Subject } from 'rxjs';

export type AppScope = 'SZOOP' | 'AIRA';
const STORAGE_KEY = 'szoop.admin.appScope';

@Injectable({ providedIn: 'root' })
export class AppScopeService {
  private readonly currentSignal = signal<AppScope>(
    typeof localStorage !== 'undefined' && localStorage.getItem(STORAGE_KEY) === 'AIRA'
      ? 'AIRA'
      : 'SZOOP',
  );
  readonly current = this.currentSignal.asReadonly();
  readonly changed = new Subject<AppScope>();

  set(app: AppScope) {
    if (app === this.currentSignal()) return;
    this.currentSignal.set(app);
    if (typeof localStorage !== 'undefined') localStorage.setItem(STORAGE_KEY, app);
    this.changed.next(app);
  }
}
