// @vitest-environment jsdom
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { TransferState, PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { LocaleService } from './locale.service';
import { REQUEST } from '@analogjs/router/tokens';

describe('LocaleService on the server', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
  });

  function serverLocale(request: unknown): string {
    TestBed.configureTestingModule({
      providers: [LocaleService, TransferState, { provide: PLATFORM_ID, useValue: 'server' }, { provide: REQUEST, useValue: request }],
    });
    return TestBed.inject(LocaleService).locale();
  }

  it('reads ?lang= from originalUrl because Nitro rewrites url to the SSR entry', () => {
    const locale = serverLocale({
      url: '/index.html',
      originalUrl: '/projects/atlas-bio-micronutrition-pwa?lang=en',
      headers: { 'accept-language': 'de-DE,de;q=0.9' },
    });

    expect(locale).toBe('en');
  });

  it('falls back to Accept-Language when the URL carries no choice', () => {
    const locale = serverLocale({
      url: '/index.html',
      originalUrl: '/projects/atlas-bio-micronutrition-pwa',
      headers: { 'accept-language': 'de-DE,de;q=0.9' },
    });

    expect(locale).toBe('de');
  });
});

describe('LocaleService.syncLangQueryParam', () => {
  const providers = [LocaleService, TransferState, { provide: PLATFORM_ID, useValue: 'browser' }, { provide: REQUEST, useValue: null }];

  function injectService(): LocaleService {
    TestBed.configureTestingModule({ providers });
    return TestBed.inject(LocaleService);
  }

  function currentLangParam(): string | null {
    return new URL(window.location.href).searchParams.get('lang');
  }

  beforeEach(() => {
    TestBed.resetTestingModule();
    window.localStorage.clear();
    window.history.replaceState(null, '', '/');
  });

  it('re-attaches a chosen language after navigation drops it', () => {
    const service = injectService();
    service.setLocale('en');

    // A routerLink navigation replaces the URL without query params.
    window.history.replaceState(null, '', '/projects/datev');
    service.syncLangQueryParam();

    expect(currentLangParam()).toBe('en');
  });

  it('keeps the choice when clicking the active language again', () => {
    const service = injectService();
    const active = service.locale();
    service.setLocale(active);

    window.history.replaceState(null, '', '/cv');
    service.syncLangQueryParam();

    expect(currentLangParam()).toBe(active);
  });

  it('treats an incoming ?lang= link as an explicit choice', () => {
    window.history.replaceState(null, '', '/?lang=en');
    const service = injectService();

    window.history.replaceState(null, '', '/projects');
    service.syncLangQueryParam();

    expect(currentLangParam()).toBe('en');
  });

  it('leaves the URL alone when the language came from the browser heuristic', () => {
    const service = injectService();

    window.history.replaceState(null, '', '/projects');
    service.syncLangQueryParam();

    expect(currentLangParam()).toBeNull();
  });
});

describe('LocaleService.setLocale', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
    window.localStorage.clear();
    window.history.replaceState(null, '', '/');
  });

  it('updates the locale signal and localStorage on the client', () => {
    TestBed.configureTestingModule({
      providers: [LocaleService, TransferState, { provide: PLATFORM_ID, useValue: 'browser' }, { provide: REQUEST, useValue: null }],
    });

    const service = TestBed.inject(LocaleService);
    const replaceState = vi.spyOn(window.history, 'replaceState');
    const start = service.locale();
    const next = start === 'en' ? 'de' : 'en';

    service.setLocale(next);
    expect(service.locale()).toBe(next);
    expect(window.localStorage.getItem('app-locale')).toBe(next);
    expect(replaceState).toHaveBeenCalled();

    service.setLocale(start);
    expect(service.locale()).toBe(start);
    expect(window.localStorage.getItem('app-locale')).toBe(start);
  });
});
