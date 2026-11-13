import { Component, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ActiveSectionDirective } from './active-section.directive';

@Component({
  standalone: true,
  imports: [ActiveSectionDirective],
  template: `
    <nav activeSection>
      <a href="#focus">Focus</a>
      <a href="#about">About</a>
    </nav>
    <main id="main">
      <section id="focus"></section>
      <section id="about"></section>
    </main>
  `,
})
class HostComponent {}

describe('ActiveSectionDirective', () => {
  let trigger: IntersectionObserverCallback;

  beforeEach(() => {
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 800 });
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

  async function render(): Promise<HTMLElement> {
    TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [provideZonelessChangeDetection()],
    });
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  function place(node: HTMLElement, top: number): void {
    node.getBoundingClientRect = () =>
      ({
        top,
        bottom: top + 400,
        left: 0,
        right: 100,
        width: 100,
        height: 400,
        x: 0,
        y: top,
        toJSON: () => ({}),
      }) as DOMRect;
  }

  it('marks the last section that has crossed the reading line', async () => {
    const root = await render();
    const focus = root.querySelector('#focus') as HTMLElement;
    const about = root.querySelector('#about') as HTMLElement;
    place(focus, 40);
    place(about, 900);

    trigger([{ target: focus, isIntersecting: true } as unknown as IntersectionObserverEntry], {} as IntersectionObserver);

    expect(root.querySelector('a[href="#focus"]')?.getAttribute('aria-current')).toBe('true');
    expect(root.querySelector('a[href="#about"]')?.hasAttribute('aria-current')).toBe(false);
  });

  it('clears the mark while the hero is still above every section', async () => {
    const root = await render();
    const focus = root.querySelector('#focus') as HTMLElement;
    const about = root.querySelector('#about') as HTMLElement;
    place(focus, 40);
    place(about, 900);
    trigger([{ target: focus, isIntersecting: true } as unknown as IntersectionObserverEntry], {} as IntersectionObserver);

    place(focus, 700);
    place(about, 1400);
    trigger([{ target: focus, isIntersecting: false } as unknown as IntersectionObserverEntry], {} as IntersectionObserver);

    expect(root.querySelector('[aria-current]')).toBeNull();
  });
});
