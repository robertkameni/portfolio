import {Component, computed, inject, PLATFORM_ID, signal} from '@angular/core';
import {DatePipe, isPlatformBrowser} from '@angular/common';
import {ActivatedRoute, RouterLink} from '@angular/router';
import {httpResource} from '@angular/common/http';
import type {Project} from '../../../store/projects.store';

@Component({
  selector: 'project-overview-page',
  standalone: true,
  imports: [DatePipe, RouterLink],
  template: `
    <main class="min-h-screen bg-background text-white px-6 py-10 md:px-12 lg:px-16">
      <div class="max-w-5xl mx-auto">
        <a [routerLink]="goBackLink()"
           class="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-primary transition mb-8">
          <span aria-hidden="true">←</span>
          Back to projects
        </a>

        @if (projectResource.isLoading()) {
          <div class="py-24 text-center text-gray-400 font-mono">
            Loading project...
          </div>
        } @else if (projectResource.error()) {
          <div class="rounded-xl border border-red-900 bg-red-950/30 p-6">
            <h1 class="text-2xl font-bold text-red-300 mb-2">{{ getErrorTitle(projectResource.error()) }}</h1>
            <p class="text-sm text-red-200/80">{{ getErrorMessage(projectResource.error()) }}</p>
          </div>
        } @else if (projectResource.value(); as project) {
          <article class="space-y-8">
            <header class="space-y-4">
              <div class="flex flex-wrap items-center gap-3 text-xs text-gray-400">
                <span class="rounded-full border border-[#143c1a] px-2 py-1 text-primary">
                  {{ project.isPublished ? 'Published' : 'Draft' }}
                </span>
                <time [attr.datetime]="project.createdAt">{{ project.createdAt | date:'mediumDate' }}</time>
              </div>

              <h1 class="text-4xl md:text-5xl font-bold leading-tight text-primary">{{ project.title }}</h1>

              @if (project.description) {
                <p class="text-lg text-gray-300 max-w-3xl">{{ project.description }}</p>
              }
            </header>

            @if (project.coverImageUrl) {
              <div class="overflow-hidden rounded-2xl border border-[#143c1a] bg-[#07120a]">
                <img [src]="project.coverImageUrl" [alt]="project.title" class="h-80 w-full object-cover"/>
              </div>
            }

            @if (project.tags.length > 0) {
              <section class="flex flex-wrap gap-2">
                @for (tag of project.tags; track tag) {
                  <span
                    class="rounded-full bg-[#07200f] px-3 py-1 text-xs text-primary border border-[#143c1a] hover:text-white">
                    {{ tag }}
                  </span>
                }
              </section>
            }

            <section class="rounded-2xl border border-[#143c1a] bg-surface p-6 md:p-8 space-y-4">
              <h2 class="text-xl font-semibold text-white">Overview</h2>
              @if (project.contentMarkdown) {
                <pre
                  class="whitespace-pre-wrap text-sm leading-7 text-gray-300 font-sans">{{ project.contentMarkdown }}</pre>
              } @else {
                <p class="text-gray-300 leading-7">
                  This project does not have a long-form description yet. The summary above is the current overview.
                </p>
              }
            </section>
          </article>
        }
      </div>
    </main>
  `
})
export default class ProjectOverviewPage {
  private readonly route = inject(ActivatedRoute);
  private readonly slug = signal(this.route.snapshot.paramMap.get('slug') ?? '');
  private readonly previewMode = signal(this.route.snapshot.queryParamMap.get('preview') === 'admin');

  private readonly clientReady = isPlatformBrowser(inject(PLATFORM_ID));

  goBackLink = computed(() => (this.previewMode() ? '/admin/projects' : '/projects'));

  projectResource = httpResource<Project>(() => {
    const slug = this.slug();
    if (!slug) return undefined;

    if (this.previewMode()) {
      // Skip SSR fetch for admin preview.
      // Bearer token is added automatically by the authInterceptor for /api/admin/* routes.
      if (!this.clientReady) return undefined;
      return `/api/admin/projects?slug=${slug}`;
    }

    return `/api/projects/${slug}`;
  });

  getErrorTitle(error: unknown): string {
    const status = (error as { status?: number })?.status;
    if (status === 404) return 'Project not found';
    return 'Could not load project';
  }

  getErrorMessage(error: unknown): string {
    const e = error as { error?: { statusMessage?: string }; message?: string; status?: number };
    if (e?.status === 404) return 'The project slug does not exist or the project is not published yet.';
    return e?.error?.statusMessage || e?.message || 'Failed to load project details.';
  }
}
