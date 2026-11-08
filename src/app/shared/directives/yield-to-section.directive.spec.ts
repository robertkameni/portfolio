import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { YieldToSectionDirective } from './yield-to-section.directive';

@Component({
  standalone: true,
  imports: [YieldToSectionDirective],
  template: `
    <contact style="display: block; height: 600px">Contact</contact>
    <div [yieldToSection]="'contact'" [enabled]="enabled()" data-testid="launcher">Chat</div>
  `,
})
class HostComponent {
  enabled = signal(true);
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

/* Flush the microtask the directive uses to wait for a deferred target, then
   let Angular apply the input change. */
async function settle(fixture: { detectChanges: () => void }): Promise<void> {
  fixture.detectChanges();
  await Promise.resolve();
  fixture.detectChanges();
}

describe('YieldToSectionDirective', () => {
  let viewportMatches = true;

  beforeEach(() => {
    globalThis.IntersectionObserver = FakeObserver as unknown as typeof IntersectionObserver;
    // jsdom has no matchMedia; the directive only needs `matches` and events.
    viewportMatches = true;
    window.matchMedia = ((query: string) => ({
      matches: viewportMatches,
      media: query,
      onchange: null,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      addListener: () => undefined,
      removeListener: () => undefined,
      dispatchEvent: () => false,
    })) as unknown as typeof window.matchMedia;

    TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [provideZonelessChangeDetection()],
    });
  });

  function render() {
    const fixture = TestBed.createComponent(HostComponent);
    const launcher = fixture.nativeElement.querySelector('[data-testid="launcher"]') as HTMLElement;
    return { fixture, launcher };
  }

  it('does not hide the control before its section is on screen', async () => {
    const { fixture, launcher } = render();

    await settle(fixture);

    expect(launcher.hasAttribute('data-yielded')).toBe(false);
  });

  it('steps aside while the competing section is visible', async () => {
    const { fixture, launcher } = render();
    await settle(fixture);

    trigger([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver);

    expect(launcher.hasAttribute('data-yielded')).toBe(true);
  });

  it('comes back once the section has scrolled away', async () => {
    const { fixture, launcher } = render();
    await settle(fixture);

    trigger([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver);
    trigger([{ isIntersecting: false } as IntersectionObserverEntry], {} as IntersectionObserver);

    expect(launcher.hasAttribute('data-yielded')).toBe(false);
  });

  it('stays out of the way while disabled, even inside the section', async () => {
    const { fixture, launcher } = render();
    fixture.componentInstance.enabled.set(false);
    await settle(fixture);

    trigger([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver);

    // Opening the chat must not hide the control that closes it.
    expect(launcher.hasAttribute('data-yielded')).toBe(false);
  });

  it('clears a previous mark when it becomes disabled', async () => {
    const { fixture, launcher } = render();
    await settle(fixture);
    trigger([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver);
    expect(launcher.hasAttribute('data-yielded')).toBe(true);

    fixture.componentInstance.enabled.set(false);
    await settle(fixture);

    expect(launcher.hasAttribute('data-yielded')).toBe(false);
  });

  it('leaves the control alone on a wide viewport', async () => {
    viewportMatches = false;
    const { fixture, launcher } = render();
    await settle(fixture);

    trigger([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver);

    // On desktop the launcher is the only way into the chat; a corner clip on
    // the submit button is not worth removing it for.
    expect(launcher.hasAttribute('data-yielded')).toBe(false);
  });
});
