import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { PLATFORM_ID, TransferState, makeStateKey, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { PortfolioStore } from './portfolio.store';
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

describe('PortfolioStore', () => {
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [provideZonelessChangeDetection(), PortfolioStore, LocaleService, { provide: PLATFORM_ID, useValue: 'browser' }],
    });

    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
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
});
