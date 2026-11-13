import { Component, CUSTOM_ELEMENTS_SCHEMA, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ActiveSectionDirective } from './active-section.directive';

@Component({
  standalone: true,
  imports: [ActiveSectionDirective],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <site-toolbar></site-toolbar>
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

  function place(node: HTMLElement, top: number, height = 400): void {
    node.getBoundingClientRect = () =>
      ({
        top,
        bottom: top + height,
        left: 0,
        right: 100,
        width: 100,
        height,
        x: 0,
        y: top,
        toJSON: () => ({}),
      }) as DOMRect;
  }

  it('marks the last section that has reached the header', async () => {
    const root = await render();
    const bar = root.querySelector('site-toolbar') as HTMLElement;
    const focus = root.querySelector('#focus') as HTMLElement;
    const about = root.querySelector('#about') as HTMLElement;
    place(bar, 0, 64);
    place(focus, 40);
    place(about, 900);

    trigger([{ target: focus, isIntersecting: true } as unknown as IntersectionObserverEntry], {} as IntersectionObserver);

    expect(root.querySelector('a[href="#focus"]')?.getAttribute('aria-current')).toBe('true');
    expect(root.querySelector('a[href="#about"]')?.hasAttribute('aria-current')).toBe(false);
  });

  it('marks the section parked under the header on a short phone', async () => {
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 500 });
    const root = await render();
    const bar = root.querySelector('site-toolbar') as HTMLElement;
    const focus = root.querySelector('#focus') as HTMLElement;
    const about = root.querySelector('#about') as HTMLElement;
    // Header bottom is 160. 28% of this viewport is 140, which used to leave
    // the mark on Focus even though About is the section on screen.
    place(bar, 0, 160);
    place(focus, -500);
    place(about, 164);

    trigger([{ target: about, isIntersecting: true } as unknown as IntersectionObserverEntry], {} as IntersectionObserver);

    expect(root.querySelector('a[href="#about"]')?.getAttribute('aria-current')).toBe('true');
    expect(root.querySelector('a[href="#focus"]')?.hasAttribute('aria-current')).toBe(false);
  });

  it('moves the mark to the section the reader is looking at when an unlinked block sits between two sections', async () => {
    const root = await render();
    const bar = root.querySelector('site-toolbar') as HTMLElement;
    const focus = root.querySelector('#focus') as HTMLElement;
    const about = root.querySelector('#about') as HTMLElement;
    place(bar, 0, 64);
    // The reading line is at 76. About has not reached it yet, but it fills
    // most of the screen, so it is the section being read. This is the twin
    // invite sitting between the project list and the contact form: the mark
    // used to stay on the previous section for the whole stretch.
    place(focus, -900, 400);
    place(about, 114, 600);

    trigger([{ target: about, isIntersecting: true } as unknown as IntersectionObserverEntry], {} as IntersectionObserver);

    expect(root.querySelector('a[href="#about"]')?.getAttribute('aria-current')).toBe('true');
    expect(root.querySelector('a[href="#focus"]')?.hasAttribute('aria-current')).toBe(false);
  });

  it('clears the mark through a stretch that has no link and no section on screen', async () => {
    const root = await render();
    const bar = root.querySelector('site-toolbar') as HTMLElement;
    const focus = root.querySelector('#focus') as HTMLElement;
    const about = root.querySelector('#about') as HTMLElement;
    place(bar, 0, 64);
    // Focus has scrolled past, About has not arrived: the reader is inside an
    // unlinked block, so no menu item is current.
    place(focus, -2000, 400);
    place(about, 2000, 400);

    trigger([{ target: focus, isIntersecting: false } as unknown as IntersectionObserverEntry], {} as IntersectionObserver);

    expect(root.querySelector('[aria-current]')).toBeNull();
  });

  it('clears the mark while the hero is still above every section', async () => {
    const root = await render();
    const bar = root.querySelector('site-toolbar') as HTMLElement;
    const focus = root.querySelector('#focus') as HTMLElement;
    const about = root.querySelector('#about') as HTMLElement;
    place(bar, 0, 64);
    place(focus, 40);
    place(about, 900);
    trigger([{ target: focus, isIntersecting: true } as unknown as IntersectionObserverEntry], {} as IntersectionObserver);

    place(focus, 700);
    place(about, 1400);
    trigger([{ target: focus, isIntersecting: false } as unknown as IntersectionObserverEntry], {} as IntersectionObserver);

    expect(root.querySelector('[aria-current]')).toBeNull();
  });
});
