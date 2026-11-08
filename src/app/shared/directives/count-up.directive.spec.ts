import { Component, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CountUpDirective } from './count-up.directive';

@Component({
  standalone: true,
  imports: [CountUpDirective],
  template: '<p [countUp]="label()" data-testid="metric">{{ label() }}</p>',
})
class HostComponent {
  label = () => '50%';
}

let trigger: IntersectionObserverCallback = () => undefined;

class FakeObserver {
  constructor(callback: IntersectionObserverCallback) {
    trigger = callback;
  }
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
  root = null;
  rootMargin = '';
  thresholds: ReadonlyArray<number> = [];
}

describe('CountUpDirective', () => {
  beforeEach(() => {
    trigger = () => undefined;
    vi.stubGlobal('IntersectionObserver', FakeObserver);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  function render(label = '50%'): HTMLElement {
    TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [provideZonelessChangeDetection()],
    });

    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.label = () => label;
    fixture.detectChanges();

    return fixture.nativeElement.querySelector('[data-testid="metric"]') as HTMLElement;
  }

  it('starts at zero before the metric is seen', () => {
    const el = render();

    expect(el.textContent?.trim()).toBe('0%');
  });

  it('lands on the exact published string after the count', () => {
    vi.useFakeTimers();
    const el = render();

    trigger([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver);
    vi.advanceTimersByTime(1200);

    expect(el.textContent?.trim()).toBe('50%');
  });

  it('renders the final value immediately when motion is reduced', () => {
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: query.includes('prefers-reduced-motion'),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    const el = render('4+');

    expect(el.textContent?.trim()).toBe('4+');
  });

  it('leaves a label without a number untouched', () => {
    const el = render('n/a');

    expect(el.textContent?.trim()).toBe('n/a');
  });

  it('settles on the real value when a jump scrolls past the metric', () => {
    const el = render();

    trigger([{ isIntersecting: false, boundingClientRect: { bottom: -40 } } as unknown as IntersectionObserverEntry], {} as IntersectionObserver);

    expect(el.textContent?.trim()).toBe('50%');
  });
});
