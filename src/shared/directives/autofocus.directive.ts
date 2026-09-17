import {
  AfterViewInit,
  Directive,
  ElementRef,
  booleanAttribute,
  inject,
  input,
} from '@angular/core';

/** Focuses an input once it is rendered — handy on search fields and dialogs. */
@Directive({ selector: '[appAutofocus]' })
export class AutofocusDirective implements AfterViewInit {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  /** Bare attribute usage (`appAutofocus`) counts as true. */
  readonly appAutofocus = input(true, { transform: booleanAttribute });

  ngAfterViewInit() {
    if (!this.appAutofocus()) return;
    setTimeout(() => this.host.nativeElement.focus());
  }
}
