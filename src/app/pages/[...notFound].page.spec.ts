import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RESPONSE } from '@analogjs/router/tokens';
import { beforeEach, describe, expect, it } from 'vitest';
import NotFoundPage from './[...notFound].page';
import { HYBRID_RENDER_ROUTES } from '../shared/routing/hybrid-render.config';
import { getSiteCopy } from '../shared/i18n/site-copy';
import { LocaleService } from '../shared/services/locale.service';

describe('NotFoundPage', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [NotFoundPage],
      providers: [provideZonelessChangeDetection(), provideRouter([])],
    });
  });

  function render() {
    const fixture = TestBed.createComponent(NotFoundPage);
    fixture.detectChanges();
    return (fixture.nativeElement as HTMLElement).querySelector('main') as HTMLElement;
  }

  /* The active locale depends on the browser, so the expectations come from the
     same copy source the page reads instead of hardcoding one language. */
  function expected() {
    return getSiteCopy(TestBed.inject(LocaleService).locale()).notFoundPage;
  }

  it('renders a heading instead of an empty document', () => {
    const main = render();

    expect(main.querySelector('h1')?.textContent?.trim()).toBe(expected().title);
    expect(expected().title.length).toBeGreaterThan(0);
  });

  it('offers links to the destinations that actually resolve', () => {
    const main = render();
    const hrefs = [...main.querySelectorAll('nav a')].map((a) => a.getAttribute('href'));

    // A contact link is deliberately absent: the contact section has no anchor.
    expect(hrefs).toEqual(['/', '/projects']);
  });

  it('labels each destination', () => {
    const main = render();
    const labels = [...main.querySelectorAll('nav a')].map((a) => a.textContent?.replace(/\s+/g, ' ').trim());

    expect(labels[0]).toContain(expected().home);
    expect(labels[1]).toContain(expected().projects);
  });

  it('names the list of destinations for assistive tech', () => {
    const main = render();

    expect(main.querySelector('nav')?.getAttribute('aria-label')).toBe(expected().linksLabel);
  });

  it('keeps the catch-all last so it cannot outrank a real route', () => {
    const last = HYBRID_RENDER_ROUTES.at(-1);

    expect(last?.path).toBe('/**');
  });

  it('answers the server with a 404, not a successful response', () => {
    /* A rendered page is still a 200 unless the status is set, and search
       engines index a 200. Angular's RESPONSE_INIT is ignored by the Analog
       render pipeline, so the page sets the status on the Node response. */
    const response = { statusCode: 200, statusMessage: 'OK' };
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [NotFoundPage],
      providers: [provideZonelessChangeDetection(), provideRouter([]), { provide: RESPONSE, useValue: response }],
    });

    TestBed.createComponent(NotFoundPage).detectChanges();

    expect(response.statusCode).toBe(404);
  });

  it('does not touch the response when there is none, as in the browser', () => {
    // The token is absent client-side; the page must still render.
    const fixture = TestBed.createComponent(NotFoundPage);
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).querySelector('main')).not.toBeNull();
  });
});
