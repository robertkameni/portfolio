import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { PLATFORM_ID, TransferState, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ProjectsStore } from './projects.store';

describe('ProjectsStore', () => {
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        ProjectsStore,
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
    });

    httpMock = TestBed.inject(HttpTestingController);
    TestBed.inject(TransferState);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('deduplicates concurrent load requests with exhaustMap', () => {
    const store = TestBed.inject(ProjectsStore);

    store.load();
    store.load();

    const request = httpMock.expectOne('/api/projects');
    request.flush({ data: [{ id: '1', slug: 'demo', title: 'Demo', tags: [], isPublished: true, createdAt: '', updatedAt: '' }] });

    httpMock.expectNone('/api/projects');
    expect(store.data()?.length).toBe(1);
  });
});
