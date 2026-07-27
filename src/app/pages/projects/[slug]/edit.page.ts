import { Component, computed, DestroyRef, inject, input, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser, JsonPipe } from '@angular/common';
import { Router } from '@angular/router';
import { httpResource } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouteMeta } from '@analogjs/router';
import { authGuard } from '../../../guards/auth.guard';
import { withRenderMode } from '../../../shared/routing/render-mode.types';
import type { Project } from '../../../shared/types/project.types';
import type { ApiSuccess } from '../../../shared/types/api.types';
import { extractApiErrorMessage } from '../../../shared/utils/api-error.util';
import { AdminProjectsService } from '../../../services/admin-projects.service';
import { ProjectForm, ProjectFormModel, ProjectPayload } from '../../../shared/components/project-form/project-form';
import { FadeInDirective } from '../../../shared/directives/fade-in.directive';
import { DevProxyBar } from '../../../shared/components/dev-proxy-bar/dev-proxy-bar';
import { StatusAlert } from '../../../shared/components/status-alert/status-alert';
import { resolveProjectApiUrl } from './project-api-url';

export const routeMeta: RouteMeta = withRenderMode('client', {
  canActivate: [authGuard],
});

@Component({
  selector: 'edit-project-page',
  standalone: true,
  imports: [ProjectForm, FadeInDirective, JsonPipe, DevProxyBar, StatusAlert],
  templateUrl: './edit.page.html',
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

  projectResource = httpResource<ApiSuccess<Project>>(() =>
    resolveProjectApiUrl({
      slug: this.slug(),
      previewMode: this.previewMode(),
      clientReady: this.clientReady,
    }),
  );

  initialData = computed<ProjectFormModel | null>(() => {
    const project = this.projectResource.value()?.data;
    if (!project) return null;
    return {
      title: project.title,
      slug: project.slug,
      description: project.description ?? '',
      contentMarkdown: project.contentMarkdown ?? '',
      coverImageUrl: project.coverImageUrl ?? '',
      projectUrl: project.projectUrl ?? '',
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
    const project = this.projectResource.value()?.data;
    if (!project || this.isSubmitting()) return;

    this.isSubmitting.set(true);
    this.submitError.set(null);
    this.submitSuccess.set(false);

    this.adminProjectsService
      .updateProject(project.id, {
        ...payload,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.submitSuccess.set(true);
          this.isSubmitting.set(false);
          setTimeout(() => this.router.navigate(['/admin/projects']), 1200);
        },
        error: (err) => {
          const msg = extractApiErrorMessage(err, 'Failed to update project');
          console.error('[EditProjectPage] update error:', err.status, msg);
          this.submitError.set(msg);
          this.isSubmitting.set(false);
        },
      });
  }
}
