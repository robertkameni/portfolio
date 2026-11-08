import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, expect, it } from 'vitest';
import { ProjectsList } from './projects-list';
import type { ProjectListItem } from '../../../shared/types/project.types';

function project(overrides: Partial<ProjectListItem> = {}): ProjectListItem {
  return {
    id: 'p1',
    slug: 'demo-project',
    title: 'Demo Project',
    description: 'A short description.',
    tags: ['Angular'],
    coverImageUrl: null,
    projectUrl: null,
    isPublished: true,
    createdAt: '2026-10-20T10:00:00.000Z',
    updatedAt: '2026-10-20T10:00:00.000Z',
    ...overrides,
  };
}

function render(projects: ProjectListItem[]) {
  TestBed.configureTestingModule({
    imports: [ProjectsList],
    providers: [provideZonelessChangeDetection(), provideRouter([])],
  });

  const fixture = TestBed.createComponent(ProjectsList);
  fixture.componentRef.setInput('projects', projects);
  fixture.detectChanges();
  return fixture;
}

describe('ProjectsList', () => {
  it('renders a real live-site link when the project has a URL', () => {
    const fixture = render([project({ projectUrl: 'https://atlas.lucastar.de' })]);

    const external = [...(fixture.nativeElement.querySelectorAll('a') as NodeListOf<HTMLAnchorElement>)].filter((a) => a.getAttribute('href') === 'https://atlas.lucastar.de');

    expect(external).toHaveLength(1);
    expect(external[0]?.getAttribute('target')).toBe('_blank');
    expect(external[0]?.getAttribute('rel')).toContain('noopener');
  });

  it('omits the live link when the project has no URL', () => {
    const fixture = render([project({ projectUrl: null })]);

    const hrefs = [...(fixture.nativeElement.querySelectorAll('a') as NodeListOf<HTMLAnchorElement>)].map((a) => a.getAttribute('href'));

    // Only the case-study router link remains, so no dead external affordance is shown.
    expect(hrefs).toEqual(['/projects/demo-project']);
  });

  it('keeps the case-study link and the live link as separate intents', () => {
    const fixture = render([project({ projectUrl: 'https://aisim.lucastar.de' })]);

    const hrefs = [...(fixture.nativeElement.querySelectorAll('a') as NodeListOf<HTMLAnchorElement>)].map((a) => a.getAttribute('href'));

    expect(hrefs).toEqual(['/projects/demo-project', 'https://aisim.lucastar.de']);
  });

  it('renders the project start as month and year', () => {
    const fixture = render([project({ createdAt: '2026-10-20T10:00:00.000Z' })]);

    expect(fixture.nativeElement.textContent).toMatch(/2026/);
  });
});
