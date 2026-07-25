import { Directive, ElementRef, Input, SecurityContext, inject } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

/**
 * Binds HTML after DomSanitizer.sanitize(SecurityContext.HTML).
 * Prefer this over template [innerHTML] so sanitization is centralized.
 */
@Directive({
  selector: '[safeHtml]',
  standalone: true,
})
export class SafeHtmlDirective {
  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly sanitizer = inject(DomSanitizer);

  @Input()
  set safeHtml(value: string | null | undefined) {
    this.el.nativeElement.innerHTML = this.sanitizer.sanitize(SecurityContext.HTML, value ?? '') ?? '';
  }
}
