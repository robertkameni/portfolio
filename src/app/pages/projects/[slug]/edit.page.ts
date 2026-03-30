import { Component, computed, DestroyRef, inject, input, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser, JsonPipe } from '@angular/common';
import { Router } from '@angular/router';
import { httpResource } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import type { Project } from '../../../shared/types/project.types';
import { AdminProjectsService } from '../../../services/admin-projects.service';
import { ProjectFormComponent, ProjectFormModel, ProjectPayload } from '../../../shared/components/project-form.component';
import { FadeInDirective } from '../../../shared/directives/fade-in.directive';
import { DevProxyBarComponent } from '../../../shared/components/dev-proxy-bar.component';
import { StatusAlertComponent } from '../../../shared/components/status-alert.component';

@Component({
  selector: 'edit-project-page',
  standalone: true,
  imports: [ProjectFormComponent, FadeInDirective, JsonPipe, DevProxyBarComponent, StatusAlertComponent],
  template: `
    <dev-proxy-bar backUrl="/admin/projects" />

    <div class="p-8 text-white max-w-5xl mx-auto" fadeIn>
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-primary">Edit Project</h1>
        <p class="text-gray-400 text-sm mt-1">Update the project details below</p>
      </div>

      @if (submitSuccess()) {
        <status-alert type="success">Project updated successfully. Redirecting...</status-alert>
      }

      @if (submitError()) {
        <status-alert type="error">{{ submitError() }}</status-alert>
      }

      @if (projectResource.isLoading()) {
        <div class="text-gray-400 font-mono py-12 text-center">Loading project...</div>
      } @else if (projectResource.status() === 'idle') {
        <div class="text-gray-400 font-mono py-12 text-center">Waiting for data...</div>
      } @else if (projectResource.error()) {
        <div class="text-red-400 py-8 text-center text-sm">Failed to load project: {{ projectResource.error() | json }}</div>
      } @else if (projectResource.value()) {
        <project-form
          [formTitle]="'Edit: ' + projectResource.value()!.title"
          submitLabel="Save Changes"
          submittingLabel="Saving..."
          publishLabel="Published"
          [isSubmitting]="isSubmitting()"
          [initialData]="initialData()"
          (formSubmit)="updateProject($event)"
          (cancel)="navigateBack()"
        />
      }
    </div>
  `,
})
export default class EditProjectPage {
  readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly adminProjectsService = inject(AdminProjectsService);

  protected readonly slug = input('');
  protected readonly preview = input('');
  protected readonly previewMode = computed(() => this.preview() === 'admin');

  private readonly clientReady = isPlatformBrowser(this.platformId);

  projectResource = httpResource<Project>(() => {
    const slug = this.slug();
    if (!slug) return undefined;

    if (this.previewMode()) {
      if (!this.clientReady) return undefined;
      return `/api/admin/projects?slug=${slug}`;
    }

    return `/api/projects/${slug}`;
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
      isPublished: project.isPublished,
    };
  });

  submitError = signal<string | null>(null);
  submitSuccess = signal(false);
  isSubmitting = signal(false);

  navigateBack() {
    this.router.navigate(['/admin/projects']);
  }

  updateProject(payload: ProjectPayload) {
    const project = this.projectResource.value();
    if (!project || this.isSubmitting()) return;

    this.isSubmitting.set(true);
    this.submitError.set(null);
    this.submitSuccess.set(false);

    this.adminProjectsService
      .updateProject(project.id, {
        ...payload,
        contentMarkdown: project.contentMarkdown,
      })
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
        },
      });
  }
}
