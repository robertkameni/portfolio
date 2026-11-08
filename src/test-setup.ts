import '@angular/compiler';
import '@analogjs/vitest-angular/setup-snapshots';
import { setupTestBed } from '@analogjs/vitest-angular/setup-testbed';

// jsdom ships no IntersectionObserver, and every component that uses
// TrackBehaviorDirective or FadeInDirective constructs one on init. A no-op
// stub here keeps those specs focused on their own behaviour; a spec that
// needs to drive intersections still overrides this with vi.stubGlobal.
if (typeof globalThis.IntersectionObserver === 'undefined') {
  globalThis.IntersectionObserver = class {
    readonly root = null;
    readonly rootMargin = '0px';
    readonly thresholds: ReadonlyArray<number> = [];
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
    takeRecords(): IntersectionObserverEntry[] {
      return [];
    }
  } as unknown as typeof IntersectionObserver;
}

setupTestBed();
