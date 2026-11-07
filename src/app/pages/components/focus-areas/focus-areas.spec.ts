import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { beforeEach, describe, expect, it } from 'vitest';
import { TrackBehaviorDirective } from '../../../ai-engine';
import { FocusAreas } from './focus-areas';
import { VisitorStore } from '../../../store/visitor.store';
import type { SkillCard } from './interface/skill-card';

const cards: SkillCard[] = [
  {
    // Deliberately not named "Frontend": a matching title is replaced by the
    // adaptive hero copy, so the base items (the ones that carry colons) must
    // be the ones rendered for the normalisation assertion to be meaningful.
    title: 'Interface Engineering',
    subtitle: 'Angular | RxJS | TypeScript',
    iconPath: 'M0 0',
    description: 'Reactive UI architecture.',
    items: [
      { title: 'Reactive UI:', description: 'Signals and Signal Store.' },
      { title: 'Testing:', description: 'Playwright and Jest.' },
    ],
  },
  {
    title: 'Backend & Quality',
    subtitle: 'Java 17 | Spring Boot 3',
    iconPath: 'M0 0',
    description: 'Typed APIs.',
    items: [{ title: 'APIs:', description: 'Nitro and Spring Boot.' }],
  },
];

describe('FocusAreas', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [FocusAreas],
      providers: [provideZonelessChangeDetection(), { provide: VisitorStore, useValue: { profile: () => null } }],
    });
  });

  it('renders one article per card with no icons and no trailing colon in item titles', () => {
    const fixture = TestBed.createComponent(FocusAreas);
    fixture.componentRef.setInput('cards', cards);
    fixture.detectChanges();

    const articles = fixture.nativeElement.querySelectorAll('article');
    expect(articles.length).toBe(2);
    expect(fixture.nativeElement.querySelector('svg')).toBeNull();

    const firstItemTitle = fixture.nativeElement.querySelector('article ul h3') as HTMLElement;
    expect(firstItemTitle.textContent?.trim()).toBe('Reactive UI');
  });

  it('gives the section an h2 so item titles do not skip a heading level', () => {
    const fixture = TestBed.createComponent(FocusAreas);
    fixture.componentRef.setInput('cards', cards);
    fixture.detectChanges();

    const heading = fixture.nativeElement.querySelector('h2') as HTMLElement | null;
    expect(heading?.textContent?.trim()).toBe('What I do');
  });

  it('keeps the analytics contract for the section and each card', () => {
    const fixture = TestBed.createComponent(FocusAreas);
    fixture.componentRef.setInput('cards', cards);
    fixture.detectChanges();

    const section = fixture.nativeElement.querySelector('section') as HTMLElement;
    expect(section.getAttribute('trackBehavior')).toBe('hero_viewed');

    // trackBehavior is a signal input, so Angular compiles interpolated values
    // into property bindings and strips the attribute from the DOM. Read the
    // directive instances to see the keys AnalyticsService actually receives.
    const tracked = fixture.debugElement
      .queryAll(By.directive(TrackBehaviorDirective))
      .filter((node) => node.nativeElement.tagName === 'ARTICLE')
      .map((node) => node.injector.get(TrackBehaviorDirective).trackBehavior());

    expect(tracked).toEqual(['hero_card_viewed_Interface Engineering', 'hero_card_viewed_Backend & Quality']);
  });
});
