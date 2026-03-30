import { Component, DestroyRef, inject, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { httpResource } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import type { Project } from '../../../shared/types/project.types';
import { AdminProjectsService } from '../../../services/admin-projects.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ProjectFormComponent, ProjectPayload } from '../../../shared/components/project-form.component';
import { FadeInDirective } from '../../../shared/directives/fade-in.directive';
import { DevProxyBarComponent } from '../../../shared/components/dev-proxy-bar.component';
import { StatusAlertComponent } from '../../../shared/components/status-alert.component';

@Component({
  selector: 'admin-projects',
  standalone: true,
  imports: [RouterLink, ProjectFormComponent, FadeInDirective, DevProxyBarComponent, StatusAlertComponent],
  template: `
    <dev-proxy-bar homeUrl="/">
      <div class="hidden sm:block flex-1"></div>
      <div class="w-full sm:w-auto flex justify-end">
        <button
          (click)="toggleForm()"
          class="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-primary text-black font-semibold rounded-lg 
          hover:bg-[#16a34a] transition w-full sm:w-auto mt-2 sm:mt-0 justify-center"
        >
          <span>+</span>
          {{ showForm() ? 'Cancel' : 'New Project' }}
        </button>
      </div>
    </dev-proxy-bar>

    <div class="p-8 text-white max-w-5xl mx-auto" fadeIn>
      <div class="mb-8 flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold text-primary">Projects</h1>
          <p class="text-gray-400 text-sm mt-1">Manage published and draft projects</p>
        </div>
      </div>

      @if (submitSuccess()) {
        <status-alert type="success">Project created successfully.</status-alert>
      }

      @if (submitError()) {
        <status-alert type="error">{{ submitError() }}</status-alert>
      }

      @if (showForm()) {
        <div class="mb-8">
          <project-form
            formTitle="Create Project"
            submitLabel="Create Project"
            submittingLabel="Creating..."
            [isSubmitting]="isSubmitting()"
            (formSubmit)="createProject($event)"
            (cancel)="toggleForm()"
          />
        </div>
      }

      @if (projectsResource.isLoading()) {
        <div class="text-gray-400 font-mono py-12 text-center">Loading projects...</div>
      } @else if (projectsResource.status() === 'idle') {
        <div class="text-gray-500 py-12 text-center text-sm">Loading...</div>
      } @else if (projectsResource.error()) {
        <div class="text-red-400 py-8 text-center text-sm">
          {{ getErrorMessage(projectsResource.error()) }}
        </div>
      } @else {
        <div class="space-y-3" fadeIn>
          @for (project of projectsResource.value(); track project.id) {
            <div class="bg-surface border border-[#143c1a] rounded-xl p-4 flex items-center justify-between">
              <div class="flex items-center gap-4">
                <span class="px-2 py-0.5 rounded text-xs font-medium" [class]="project.isPublished ? 'bg-green-900 text-green-300' : 'bg-gray-800 text-gray-400'">
                  {{ project.isPublished ? 'Published' : 'Draft' }}
                </span>
                <div>
                  <p class="text-white font-medium">{{ project.title }}</p>
                  <p class="text-gray-500 text-xs">/projects/{{ project.slug }}</p>
                </div>
              </div>
              <div class="flex items-center gap-3">
                @if (project.tags.length > 0) {
                  <div class="hidden md:flex gap-2 mr-18">
                    @for (tag of project.tags.slice(0, 3); track tag) {
                      <span class="text-xs px-2 py-0.5 bg-[#07200f] text-primary rounded">
                        {{ tag }}
                      </span>
                    }
                  </div>
                }

                <a [routerLink]="['/projects', project.slug]" [queryParams]="{ preview: 'admin' }" class="text-sm text-gray-400 transition cursor-pointer hover:text-primary">
                  View👁️
                </a>

                <a
                  [routerLink]="['/projects', project.slug, 'edit']"
                  [queryParams]="{ preview: 'admin' }"
                  class="text-sm text-gray-400 transition cursor-pointer hover:text-primary"
                >
                  Edit ✏️
                </a>

                <a class="text-sm text-gray-400 transition cursor-pointer hover:text-primary" (click)="deleteProject(project)">Delete🗑️</a>
              </div>
            </div>
          } @empty {
            <p class="text-gray-500 text-center py-12">No projects yet. Create your first one.</p>
          }
        </div>
      }
    </div>
  `,
})
export default class AdminProjectsPage {
  private platformId = inject(PLATFORM_ID);
  private destroyRef = inject(DestroyRef);
  private router = inject(Router);
  private readonly clientReady = isPlatformBrowser(this.platformId);
  private readonly adminProjectsService = inject(AdminProjectsService);

  projectsResource = httpResource<Project[] | undefined>(() => (this.clientReady ? '/api/admin/projects' : undefined));

  showForm = signal(false);
  submitError = signal<string | null>(null);
  submitSuccess = signal(false);
  isSubmitting = signal(false);

  navigateHome() {
    this.router.navigate(['/']);
  }

  toggleForm() {
    this.showForm.set(!this.showForm());
    this.submitError.set(null);
    this.submitSuccess.set(false);
  }

  getErrorMessage(err: unknown): string {
    if (!err) return '';
    const e = err as any;
    return e?.error?.statusMessage || e?.message || 'Failed to load projects';
  }

  createProject(payload: ProjectPayload) {
    if (this.isSubmitting()) return;
    this.isSubmitting.set(true);
    this.submitError.set(null);
    this.submitSuccess.set(false);

    this.adminProjectsService
      .createProject({ ...payload, contentMarkdown: null })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (project) => {
          this.projectsResource.set([project, ...(this.projectsResource.value() ?? [])]);
          this.submitSuccess.set(true);
          this.isSubmitting.set(false);
          this.showForm.set(false);
        },
        error: (err) => {
          const msg = err?.error?.statusMessage || err?.message || 'Failed to create project';
          console.error('[AdminProjects] create error:', err.status, msg);
          this.submitError.set(msg);
          this.isSubmitting.set(false);
        },
      });
  }

  deleteProject(project: Project) {
    if (!confirm(`Are you sure you want to delete the project "${project.title}"?`)) return;

    this.adminProjectsService
      .deleteProject(project.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.projectsResource.set((this.projectsResource.value() ?? []).filter((p) => p.id !== project.id));
        },
        error: (err) => console.error('[AdminProjects] delete error:', err),
      });
  }
}
