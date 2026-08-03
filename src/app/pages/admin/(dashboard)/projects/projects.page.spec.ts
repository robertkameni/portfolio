import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PLATFORM_ID, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { AdminProjectsService } from '../../../../services/admin-projects.service';
import { AdminProjectsStore } from '../../../../store/projects.store';
import { LocaleService } from '../../../../shared/services/locale.service';
import AdminProjectsPage from '../projects.page';
import { of } from 'rxjs';

describe('AdminProjectsPage — CRUD happy paths', () => {
  let page: AdminProjectsPage;
  let mockService: Partial<AdminProjectsService>;
  let store: AdminProjectsStore;

  beforeEach(async () => {
    mockService = {
      createProject: vi.fn(),
      deleteProject: vi.fn(),
      updateProject: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [AdminProjectsPage],
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        AdminProjectsStore,
        LocaleService,
        { provide: PLATFORM_ID, useValue: 'browser' },
        { provide: AdminProjectsService, useValue: mockService },
      ],
    }).compileComponents();

    store = TestBed.inject(AdminProjectsStore);
    const fixture = TestBed.createComponent(AdminProjectsPage);
    page = fixture.componentInstance;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('createProject', () => {
    it('calls the service and adds the project to the store on success', () => {
      const project = {
        id: 'new-1',
        slug: 'new-project',
        title: 'New Project',
        tags: ['angular'],
        isPublished: true,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      };

      const mockCreate = mockService.createProject as ReturnType<typeof vi.fn>;
      mockCreate.mockReturnValue(of(project));

      page.createProject({
        title: 'New Project',
        slug: 'new-project',
        description: '',
        contentMarkdown: '',
        coverImageUrl: '',
        projectUrl: '',
        tags: ['angular'],
        isPublished: true,
      });

      expect(mockCreate).toHaveBeenCalledTimes(1);
      expect(store.data()).toEqual([project]);
    });

    it('does not call the service when already submitting', () => {
      page.isSubmitting.set(true);
      page.createProject({
        title: 'Blocked',
        slug: 'blocked',
        tags: [],
        isPublished: false,
      });

      expect(mockService.createProject).not.toHaveBeenCalled();
    });
  });

  describe('deleteProject', () => {
    it('calls the service and removes the project from the store on success', () => {
      vi.spyOn(window, 'confirm').mockReturnValue(true);
      const mockDelete = mockService.deleteProject as ReturnType<typeof vi.fn>;
      mockDelete.mockReturnValue(of(undefined));

      // Pre-populate the store with a project
      store.addProject({
        id: 'del-1',
        slug: 'to-delete',
        title: 'To Delete',
        tags: [],
        isPublished: false,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      });

      page.deleteProject('del-1', 'To Delete');

      expect(window.confirm).toHaveBeenCalled();
      expect(mockDelete).toHaveBeenCalledWith('del-1');
      expect(store.data() ?? []).toHaveLength(0);
    });

    it('does not call the service when confirm is cancelled', () => {
      vi.spyOn(window, 'confirm').mockReturnValue(false);

      page.deleteProject('del-1', 'To Delete');

      expect(window.confirm).toHaveBeenCalled();
      expect(mockService.deleteProject).not.toHaveBeenCalled();
    });
  });
});
