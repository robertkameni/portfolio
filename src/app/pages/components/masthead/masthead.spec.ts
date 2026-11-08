import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { Masthead } from './masthead';
import { VisitorStore } from '../../../store/visitor.store';
import type { IntroData } from './interface/intro-data';

const data: IntroData = {
  name: 'Robert Kameni',
  title: 'Staff Angular Engineer',
  description: 'Scalable Angular platforms and the architecture behind them.',
  socials: [
    { platform: 'LinkedIn', url: 'https://example.com/li', iconPath: 'M0 0' },
    { platform: 'Xing', url: 'https://example.com/xing', iconPath: 'M0 0' },
  ],
};

function render(input: IntroData = data) {
  TestBed.configureTestingModule({
    imports: [Masthead],
    providers: [provideZonelessChangeDetection(), { provide: VisitorStore, useValue: { profile: () => null } }],
  });

  const fixture = TestBed.createComponent(Masthead);
  fixture.componentRef.setInput('data', input);
  fixture.detectChanges();
  return fixture;
}

describe('Masthead', () => {
  it('renders the name as the page h1 and never splits it into letters', () => {
    const fixture = render();

    const h1 = fixture.nativeElement.querySelector('h1') as HTMLElement;
    expect(h1.textContent?.trim()).toBe('Robert Kameni');
    expect(h1.querySelectorAll('span').length).toBe(0);
  });

  it('renders one text link per social platform', () => {
    const fixture = render();

    const links = [...fixture.nativeElement.querySelectorAll('a')] as HTMLAnchorElement[];
    expect(links.map((a) => a.textContent?.trim())).toEqual(['LinkedIn', 'Xing']);
    expect(fixture.nativeElement.querySelector('a svg')).toBeNull();
  });

  it('falls back to the profile title when there is no visitor profile', () => {
    const fixture = render();

    expect(fixture.nativeElement.textContent).toContain('Staff Angular Engineer');
  });

  it('keeps the analytics contract for the section', () => {
    const fixture = render();

    expect(fixture.nativeElement.querySelector('section').getAttribute('trackBehavior')).toBe('intro_viewed');
  });

  it('names the portrait after the profile rather than hardcoding it', () => {
    const fixture = render();

    expect(fixture.nativeElement.querySelector('img').getAttribute('alt')).toBe('Robert Kameni');
  });

  it('omits the social list when there are no valid links', () => {
    const fixture = render({ ...data, socials: [] });

    expect(fixture.nativeElement.querySelector('ul')).toBeNull();
  });
});
