import { provideZonelessChangeDetection, PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import ProjectOverviewPage from './index.page';
import { ProjectsStore } from '../../../store/projects.store';

/**
 * Navigating from one case study to another reuses the component instance,
 * because both URLs match the same route. The page used to read its slug from
 * `route.snapshot` once at construction, so a reused instance kept the first
 * slug: the URL changed and the body did not, until a reload.
 *
 * These tests drive `paramMap` the way the router does, then assert the page
 * asked the API for the new slug.
 */
function projectPayload(slug: string, title: string) {
  return {
    success: true,
    message: 'ok',
    data: {
      id: slug,
      slug,
      title,
      description: 'A project.',
      contentMarkdown: null,
      tags: ['Angular'],
      coverImageUrl: null,
      projectUrl: null,
      isPublished: true,
      createdAt: '2026-10-20T10:00:00.000Z',
      updatedAt: '2026-10-20T10:00:00.000Z',
    },
  };
}

describe('ProjectOverviewPage route reuse', () => {
  let paramMap: BehaviorSubject<ReturnType<typeof convertToParamMap>>;
  let http: HttpTestingController;

  beforeEach(() => {
    paramMap = new BehaviorSubject(convertToParamMap({ slug: 'first-project' }));

    TestBed.configureTestingModule({
      imports: [ProjectOverviewPage],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        ProjectsStore,
        { provide: PLATFORM_ID, useValue: 'server' },
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap,
            queryParamMap: new BehaviorSubject(convertToParamMap({})),
            snapshot: { paramMap: convertToParamMap({ slug: 'first-project' }), queryParamMap: convertToParamMap({}) },
          },
        },
      ],
    });

    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    try {
      // Every request is answered by the test body, including the page's own
      // `projects` call. `verify()` inside the try means a pending request
      // still runs the reset below instead of failing the next test for the
      // wrong reason.
      http.verify();
    } finally {
      TestBed.resetTestingModule();
    }
  });

  /** Answers the page's own `projects` call with an empty list. */
  function flushProjectList(): void {
    http.expectOne('/api/projects').flush({ success: true, message: 'ok', data: [] });
  }

  it('requests the slug it was created with', async () => {
    const fixture = TestBed.createComponent(ProjectOverviewPage);
    fixture.detectChanges();
    flushProjectList();

    http.expectOne('/api/projects/first-project').flush(projectPayload('first-project', 'First Project'));
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('First Project');
  });

  it('refetches when the route slug changes on the same instance', async () => {
    const fixture = TestBed.createComponent(ProjectOverviewPage);
    fixture.detectChanges();
    flushProjectList();

    http.expectOne('/api/projects/first-project').flush(projectPayload('first-project', 'First Project'));
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('First Project');

    // What the router does when the "next project" link is followed: the same
    // component instance stays mounted and only the param changes.
    paramMap.next(convertToParamMap({ slug: 'second-project' }));
    fixture.detectChanges();

    http.expectOne('/api/projects/second-project').flush(projectPayload('second-project', 'Second Project'));
    await fixture.whenStable();
    fixture.detectChanges();

    // The failure was visible here: the previous title stayed on screen.
    expect(fixture.nativeElement.textContent).toContain('Second Project');
    expect(fixture.nativeElement.textContent).not.toContain('First Project');
  });
});
