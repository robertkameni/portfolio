import {Component, computed, DestroyRef, inject, PLATFORM_ID, signal} from '@angular/core';
import {isPlatformBrowser} from '@angular/common';
import {ActivatedRoute, Router, RouterLink} from '@angular/router';
import {httpResource} from '@angular/common/http';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import type {Project} from '../../../shared/types/project.types';
import {AdminProjectsService} from '../../../services/admin-projects.service';
import {
  ProjectFormComponent,
  ProjectFormModel,
  ProjectPayload
} from '../../../shared/components/project-form.component';

@Component({
  selector: 'edit-project-page',
  standalone: true,
  imports: [RouterLink, ProjectFormComponent],
  template: `
    <div class="p-8 text-white max-w-5xl mx-auto">
      <div class="mb-8">
        <a [routerLink]="['/admin/projects']"
           class="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-primary transition mb-3">
          <span aria-hidden="true">←</span> Back to projects
        </a>
        <h1 class="text-3xl font-bold text-primary">Edit Project</h1>
        <p class="text-gray-400 text-sm mt-1">Update the project details below</p>
      </div>

      @if (submitSuccess()) {
        <div
          class="mb-6 flex items-center gap-3 bg-green-900/30 border border-green-700 text-green-300 px-4 py-3 rounded-lg text-sm">
          <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
          </svg>
          Project updated successfully. Redirecting...
        </div>
      }

      @if (submitError()) {
        <div
          class="mb-6 flex items-center gap-3 bg-red-900/30 border border-red-700 text-red-300 px-4 py-3 rounded-lg text-sm">
          <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          {{ submitError() }}
        </div>
      }

      @if (projectResource.isLoading()) {
        <div class="text-gray-400 font-mono py-12 text-center">Loading project...</div>
      } @else if (projectResource.error()) {
        <div class="text-red-400 py-8 text-center text-sm">Failed to load project.</div>
      } @else if (projectResource.value()) {
        <project-form
          [formTitle]="'Edit: ' + projectResource.value()!.title"
          submitLabel="Save Changes"
          submittingLabel="Saving..."
          publishLabel="Published"
          [isSubmitting]="isSubmitting()"
          [initialData]="initialData()"
          (formSubmit)="updateProject($event)"
          (cancel)="router.navigate(['/admin/projects'])"
        />
      }
    </div>
  `
})
export default class EditProjectPage {
  private readonly route = inject(ActivatedRoute);
  readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly adminProjectsService = inject(AdminProjectsService);
  private readonly clientReady = isPlatformBrowser(this.platformId);

  private readonly slug = signal(this.route.snapshot.paramMap.get('slug') ?? '');

  projectResource = httpResource<Project>(() => {
    const slug = this.slug();
    if (!this.clientReady || !slug) return undefined;
    return `/api/projects/${slug}?preview=admin`;
  });

  initialData = computed<ProjectFormModel | null>(() => {
    const project = this.projectResource.value();
    if (!project) return null;
    return {
      title: project.title,
      slug: project.slug,
      description: project.description ?? '',
      coverImageUrl: project.coverImageUrl ?? '',
      tags: project.tags.join(', '),
      isPublished: project.isPublished
    };
  });

  submitError = signal<string | null>(null);
  submitSuccess = signal(false);
  isSubmitting = signal(false);

  updateProject(payload: ProjectPayload) {
    const project = this.projectResource.value();
    if (!project || this.isSubmitting()) return;

    this.isSubmitting.set(true);
    this.submitError.set(null);
    this.submitSuccess.set(false);

    this.adminProjectsService
      .updateProject(project.id, {...payload, contentMarkdown: project.contentMarkdown})
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.submitSuccess.set(true);
          this.isSubmitting.set(false);
          setTimeout(() => this.router.navigate(['/admin/projects']), 1200);
        },
        error: (err) => {
          const msg = err?.error?.statusMessage || err?.message || 'Failed to update project';
          console.error('[EditProjectPage] update error:', err.status, msg);
          this.submitError.set(msg);
          this.isSubmitting.set(false);
        }
      });
  }
}
