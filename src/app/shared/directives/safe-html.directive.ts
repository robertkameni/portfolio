import { Directive, ElementRef, Input, Renderer2, SecurityContext, inject } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

/**
 * Binds HTML after DomSanitizer.sanitize(SecurityContext.HTML).
 * Uses Renderer2 so Trusted Types (CSP) accepts the assignment in production.
 */
@Directive({
  selector: '[safeHtml]',
  standalone: true,
})
export class SafeHtmlDirective {
  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly renderer = inject(Renderer2);
  private readonly sanitizer = inject(DomSanitizer);

  @Input()
  set safeHtml(value: string | null | undefined) {
    const sanitized = this.sanitizer.sanitize(SecurityContext.HTML, value ?? '') ?? '';
    this.renderer.setProperty(
      this.el.nativeElement,
      'innerHTML',
      this.sanitizer.bypassSecurityTrustHtml(sanitized),
    );
  }
}
