// @vitest-environment jsdom
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { TransferState, PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { LocaleService } from './locale.service';
import { REQUEST } from '@analogjs/router/tokens';

describe('LocaleService.setLocale', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
    window.localStorage.clear();
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
