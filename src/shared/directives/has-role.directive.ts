import {
  Directive,
  TemplateRef,
  ViewContainerRef,
  effect,
  inject,
  input,
} from '@angular/core';
import { SessionStore } from '@core/auth/session.store';

/**
 * Structural directive: `<button *appHasRole="['SUPER_ADMIN']">` only renders
 * for the listed admin roles.
 */
@Directive({ selector: '[appHasRole]' })
export class HasRoleDirective {
  private readonly template = inject(TemplateRef<unknown>);
  private readonly viewContainer = inject(ViewContainerRef);
  private readonly session = inject(SessionStore);

  readonly appHasRole = input<string[] | string>([]);

  private rendered = false;

  constructor() {
    effect(() => {
      const allowed = this.appHasRole();
      const roles = Array.isArray(allowed) ? allowed : [allowed];
      const role = this.session.role();
      const visible = !roles.length || (!!role && roles.includes(role));

      if (visible && !this.rendered) {
        this.viewContainer.createEmbeddedView(this.template);
        this.rendered = true;
      } else if (!visible && this.rendered) {
        this.viewContainer.clear();
        this.rendered = false;
      }
    });
  }
}
