import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AdminProjectsService } from './admin-projects.service';
import type { Project } from '../shared/types/project.types';

const mockProject: Project = {
  id: 'proj-1',
  slug: 'demo-project',
  title: 'Demo Project',
  description: 'A demo project',
  contentMarkdown: '# Demo',
  coverImageUrl: 'https://images.unsplash.com/photo-1',
  projectUrl: 'https://example.com',
  tags: ['angular', 'analog'],
  isPublished: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-02T00:00:00.000Z',
};

describe('AdminProjectsService', () => {
  let service: AdminProjectsService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), AdminProjectsService],
    });
    service = TestBed.inject(AdminProjectsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('createProject', () => {
    it('sends a POST with the project payload and returns the created project', () => {
      const payload = { title: 'New', slug: 'new', description: '', contentMarkdown: '', coverImageUrl: '', projectUrl: '', tags: [], isPublished: false };

      service.createProject(payload).subscribe((result) => {
        expect(result).toEqual(mockProject);
      });

      const req = httpMock.expectOne('/api/admin/projects');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(payload);
      req.flush({ data: mockProject });
    });

    it('propagates server errors', () => {
      service.createProject({ title: 'Fail', slug: 'fail', description: '', contentMarkdown: '', coverImageUrl: '', projectUrl: '', tags: [], isPublished: false }).subscribe({
        error: (err) => {
          expect(err.status).toBe(409);
        },
      });

      httpMock.expectOne('/api/admin/projects').flush('Conflict', { status: 409, statusText: 'Conflict' });
    });
  });

  describe('updateProject', () => {
    it('sends a PUT with the partial payload and returns the updated project', () => {
      const payload = { title: 'Updated Title' };

      service.updateProject('proj-1', payload).subscribe((result) => {
        expect(result.title).toBe('Updated Title');
      });

      const req = httpMock.expectOne('/api/admin/projects/proj-1');
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(payload);
      req.flush({ data: { ...mockProject, title: 'Updated Title' } });
    });
  });

  describe('deleteProject', () => {
    it('sends a DELETE and completes', () => {
      service.deleteProject('proj-1').subscribe({
        next: () => {
          // void observable — next emits undefined
        },
        complete: () => {
          expect(true).toBe(true);
        },
      });

      const req = httpMock.expectOne('/api/admin/projects/proj-1');
      expect(req.request.method).toBe('DELETE');
      req.flush({ acknowledged: true });
    });
  });
});
