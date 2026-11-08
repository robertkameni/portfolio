import { Component, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FadeInDirective } from './fade-in.directive';

@Component({
  standalone: true,
  imports: [FadeInDirective],
  template: '<div fadeIn data-testid="box">content</div>',
})
class HostComponent {}

describe('FadeInDirective', () => {
  let trigger: IntersectionObserverCallback;

  beforeEach(() => {
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        constructor(cb: IntersectionObserverCallback) {
          trigger = cb;
        }
        observe() {}
        unobserve() {}
        disconnect() {}
        takeRecords() {
          return [];
        }
        root = null;
        rootMargin = '';
        thresholds = [];
      },
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function render() {
    TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [provideZonelessChangeDetection()],
    });
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    return fixture.nativeElement.querySelector('[data-testid="box"]') as HTMLElement;
  }

  it('hides the element until it intersects', () => {
    const box = render();
    expect(box.classList.contains('reveal')).toBe(true);
    expect(box.dataset['visible']).toBeUndefined();
  });

  it('never writes inline styles', () => {
    const box = render();
    expect(box.getAttribute('style')).toBeNull();
  });

  it('reveals immediately when IntersectionObserver is unavailable', () => {
    vi.stubGlobal('IntersectionObserver', undefined);

    const box = render();
    expect(box.classList.contains('reveal')).toBe(false);
    expect(box.dataset['visible']).toBe('true');
  });

  it('reveals the element on intersection', () => {
    const box = render();
    trigger([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver);
    expect(box.dataset['visible']).toBe('true');
  });

  it('does not hide anything when the user prefers reduced motion', () => {
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

    const box = render();
    expect(box.classList.contains('reveal')).toBe(false);
    expect(box.dataset['visible']).toBe('true');
  });
});
