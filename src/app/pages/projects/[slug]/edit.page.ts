import { Component, computed, DestroyRef, inject, input, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser, JsonPipe } from '@angular/common';
import { Router } from '@angular/router';
import { httpResource } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouteMeta } from '@analogjs/router';
import { authGuard } from '../../../guards/auth.guard';
import type { Project } from '../../../shared/types/project.types';
import type { ApiSuccess } from '../../../shared/types/api.types';
import { extractApiErrorMessage } from '../../../shared/utils/api-error.util';
import { AdminProjectsService } from '../../../services/admin-projects.service';
import { ProjectFormComponent, ProjectFormModel, ProjectPayload } from '../../../shared/components/project-form/project-form.component';
import { FadeInDirective } from '../../../shared/directives/fade-in.directive';
import { DevProxyBarComponent } from '../../../shared/components/dev-proxy-bar/dev-proxy-bar.component';
import { StatusAlertComponent } from '../../../shared/components/status-alert/status-alert.component';

export const routeMeta: RouteMeta = {
  canActivate: [authGuard],
};

@Component({
  selector: 'edit-project-page',
  standalone: true,
  imports: [ProjectFormComponent, FadeInDirective, JsonPipe, DevProxyBarComponent, StatusAlertComponent],
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

  projectResource = httpResource<ApiSuccess<Project>>(() => {
    const slug = this.slug();
    if (!slug) return undefined;

    if (this.previewMode()) {
      if (!this.clientReady) return undefined;
      return `/api/admin/projects?slug=${slug}`;
    }

    return `/api/projects/${slug}`;
  });

  initialData = computed<ProjectFormModel | null>(() => {
    const project = this.projectResource.value()?.data;
    if (!project) return null;
    return {
      title: project.title,
      slug: project.slug,
      description: project.description ?? '',
      contentMarkdown: project.contentMarkdown ?? '',
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
