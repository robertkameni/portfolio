import { Directive, HostBinding, Input, SecurityContext, inject } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

/**
 * Binds HTML after DomSanitizer.sanitize(SecurityContext.HTML).
 * HostBinding routes through Angular's innerHTML + Trusted Types pipeline (CSP-safe in production).
 */
@Directive({
  selector: '[safeHtml]',
  standalone: true,
})
export class SafeHtmlDirective {
  private readonly sanitizer = inject(DomSanitizer);
  private htmlValue = '';

  @Input()
  set safeHtml(value: string | null | undefined) {
    this.htmlValue = value ?? '';
  }

  @HostBinding('innerHTML')
  get boundHtml(): SafeHtml {
    const sanitized = this.sanitizer.sanitize(SecurityContext.HTML, this.htmlValue) ?? '';
    return this.sanitizer.bypassSecurityTrustHtml(sanitized);
  }
}
