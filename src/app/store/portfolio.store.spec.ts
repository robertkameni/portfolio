import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PLATFORM_ID, TransferState, makeStateKey, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { CLIENT_CACHE_TTL_MS, PortfolioStore } from './portfolio.store';
import { LocaleService } from '../shared/services/locale.service';
import type { LocalizedProfileData } from '../shared/types/profile-data';

const mockProfile: LocalizedProfileData = {
  locale: 'en',
  name: 'Test User',
  title: 'Engineer',
  phone: '+1',
  email: 'test@example.com',
  intro: { name: 'Test', title: 'Engineer', description: 'Bio', socials: [] },
  heroCards: [],
  skills: [],
  about: { title: 'About', paragraphs: [], highlights: [] },
  contact: {
    title: 'Contact',
    description: 'Reach out',
    features: [],
    formCard: { title: 'Form', description: 'Send a message' },
  },
};

function configurePortfolioStoreTestBed() {
  TestBed.configureTestingModule({
    providers: [provideZonelessChangeDetection(), provideHttpClient(), provideHttpClientTesting(), PortfolioStore, LocaleService, { provide: PLATFORM_ID, useValue: 'browser' }],
  });
}

describe('PortfolioStore', () => {
  let httpMock: HttpTestingController;

  beforeEach(() => {
    configurePortfolioStoreTestBed();
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    vi.useRealTimers();
    TestBed.resetTestingModule();
  });

  it('hydrates profile data from TransferState without refetching on the browser', () => {
    const transferState = TestBed.inject(TransferState);
    transferState.set(makeStateKey<LocalizedProfileData>('portfolio.profile.en'), mockProfile);

    const store = TestBed.inject(PortfolioStore);
    store.loadProfile();

    httpMock.expectNone('/api/v1/profile?locale=en');
    expect(store.data()).toEqual(mockProfile);
    expect(store.isLoading()).toBe(false);
  });

  it('refetches after the client TTL expires', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T12:00:00Z'));

    const store = TestBed.inject(PortfolioStore);
    store.loadProfile();

    const first = httpMock.expectOne('/api/v1/profile?locale=en');
    first.flush(mockProfile);
    expect(store.data()).toEqual(mockProfile);
    expect(store.lastFetchedAt()).toBe(Date.now());

    vi.setSystemTime(new Date('2026-01-01T12:00:00Z').getTime() + CLIENT_CACHE_TTL_MS + 1);

    store.loadProfile();
    const second = httpMock.expectOne('/api/v1/profile?locale=en');
    second.flush({ ...mockProfile, name: 'Refreshed User' });

    expect(store.data()?.name).toBe('Refreshed User');
  });

  it('does not share TTL cache state between separate TestBed instances', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T12:00:00Z'));

    const storeA = TestBed.inject(PortfolioStore);
    storeA.loadProfile();
    httpMock.expectOne('/api/v1/profile?locale=en').flush(mockProfile);

    TestBed.resetTestingModule();
    configurePortfolioStoreTestBed();
    const httpMockB = TestBed.inject(HttpTestingController);

    const storeB = TestBed.inject(PortfolioStore);
    storeB.loadProfile();
    httpMockB.expectOne('/api/v1/profile?locale=en').flush(mockProfile);

    expect(storeA.lastFetchedAt()).toBeGreaterThan(0);
    expect(storeB.lastFetchedAt()).toBeGreaterThan(0);
    httpMockB.verify();
  });
});
