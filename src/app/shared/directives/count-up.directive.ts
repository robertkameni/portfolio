import { isPlatformBrowser } from '@angular/common';
import { Directive, ElementRef, inject, input, OnDestroy, OnInit, PLATFORM_ID } from '@angular/core';

type ParsedValue = {
  prefix: string;
  suffix: string;
  value: number;
  isDecimal: boolean;
};

const DURATION_MS = 900;
const THRESHOLD = 0.4;

/**
 * Counts a numeric label up from zero the first time it enters the viewport.
 * Used once, for the single metric in the About rail, so the number reads as a
 * claim rather than as decoration. The final, exact string is always restored.
 */
@Directive({
  selector: '[countUp]',
  standalone: true,
})
export class CountUpDirective implements OnInit, OnDestroy {
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly platformId = inject(PLATFORM_ID);

  countUp = input.required<string>();

  private observer: IntersectionObserver | null = null;
  private frame: number | null = null;

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const parsed = parseLabel(this.countUp());
    if (!parsed) {
      return;
    }

    // Reduced motion: show the answer, skip the performance.
    if (this.prefersReducedMotion()) {
      this.render(parsed, parsed.value);
      return;
    }

    this.render(parsed, 0);

    this.observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) {
          return;
        }

        if (entry.isIntersecting) {
          this.start(parsed);
          return;
        }

        // A jump (anchor link, restored scroll position, End key) can skip past
        // the element entirely. Showing 0% forever would state a false number,
        // so settle on the real value instead.
        if (entry.boundingClientRect.bottom < 0) {
          this.observer?.disconnect();
          this.observer = null;
          this.render(parsed, parsed.value);
        }
      },
      { threshold: THRESHOLD },
    );
    this.observer.observe(this.el.nativeElement);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
    this.observer = null;
    this.stopFrame();
  }

  private start(parsed: ParsedValue): void {
    this.observer?.disconnect();
    this.observer = null;

    const start = performance.now();

    const step = (now: number): void => {
      const progress = Math.min((now - start) / DURATION_MS, 1);
      // Ease-out cubic: fast arrival, gentle settle.
      const eased = 1 - Math.pow(1 - progress, 3);

      if (progress < 1) {
        this.render(parsed, parsed.value * eased);
        this.frame = requestAnimationFrame(step);
        return;
      }

      // Always land on the exact published string, never a rounded approximation.
      this.render(parsed, parsed.value);
      this.frame = null;
    };

    this.frame = requestAnimationFrame(step);
  }

  private render(parsed: ParsedValue, value: number): void {
    const rounded = parsed.isDecimal ? Number(value.toFixed(1)) : Math.round(value);
    this.el.nativeElement.textContent = `${parsed.prefix}${rounded}${parsed.suffix}`;
  }

  private stopFrame(): void {
    if (this.frame !== null) {
      cancelAnimationFrame(this.frame);
      this.frame = null;
    }
  }

  private prefersReducedMotion(): boolean {
    return typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
}

function parseLabel(label: string): ParsedValue | null {
  const match = /(\d+(?:[.,]\d+)?)/.exec(label);
  if (!match) {
    return null;
  }

  const raw = match[1] ?? '';
  const value = Number(raw.replace(',', '.'));
  if (!Number.isFinite(value)) {
    return null;
  }

  return {
    prefix: label.slice(0, match.index),
    suffix: label.slice(match.index + raw.length),
    value,
    isDecimal: raw.includes('.') || raw.includes(','),
  };
}
