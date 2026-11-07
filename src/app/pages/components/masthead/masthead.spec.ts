import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Masthead } from './masthead';
import { VisitorStore } from '../../../store/visitor.store';
import type { IntroData } from './interface/intro-data';

const data: IntroData = {
  name: 'Robert Kameni',
  title: 'Technical Lead Frontend Specialist',
  description: 'Scalable Angular platforms and the architecture behind them.',
  socials: [
    { platform: 'LinkedIn', url: 'https://example.com/li', iconPath: 'M0 0' },
    { platform: 'Xing', url: 'https://example.com/xing', iconPath: 'M0 0' },
  ],
};

describe('Masthead', () => {
  beforeEach(() => {
    // jsdom does not implement IntersectionObserver, which TrackBehaviorDirective needs.
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        constructor(_callback: IntersectionObserverCallback) {}
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

    TestBed.configureTestingModule({
      imports: [Masthead],
      providers: [provideZonelessChangeDetection(), { provide: VisitorStore, useValue: { profile: () => null } }],
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders the name as the page h1 and never splits it into letters', () => {
    const fixture = TestBed.createComponent(Masthead);
    fixture.componentRef.setInput('data', data);
    fixture.detectChanges();

    const h1 = fixture.nativeElement.querySelector('h1') as HTMLElement;
    expect(h1.textContent?.trim()).toBe('Robert Kameni');
    expect(h1.querySelectorAll('span').length).toBe(0);
  });

  it('renders one text link per social platform', () => {
    const fixture = TestBed.createComponent(Masthead);
    fixture.componentRef.setInput('data', data);
    fixture.detectChanges();

    const links = [...fixture.nativeElement.querySelectorAll('a')] as HTMLAnchorElement[];
    expect(links.map((a) => a.textContent?.trim())).toEqual(['LinkedIn', 'Xing']);
    expect(fixture.nativeElement.querySelector('a svg')).toBeNull();
  });

  it('falls back to the profile title when there is no visitor profile', () => {
    const fixture = TestBed.createComponent(Masthead);
    fixture.componentRef.setInput('data', data);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Technical Lead Frontend Specialist');
  });
});
