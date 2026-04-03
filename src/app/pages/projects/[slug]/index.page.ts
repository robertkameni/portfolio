import {Component, computed, PLATFORM_ID, inject, signal} from '@angular/core';
import {isPlatformBrowser} from '@angular/common';
import {DatePipe} from '@angular/common';
import {ActivatedRoute, RouterLink} from '@angular/router';
import {httpResource} from '@angular/common/http';
import {DomSanitizer} from '@angular/platform-browser';
import {marked, Renderer} from 'marked';
import type {Project} from '../../../shared/types/project.types';
import type {ApiSuccess} from '../../../shared/types/api.types';
import {extractApiErrorMessage} from '../../../shared/utils/api-error.util';
import {FadeInDirective} from "../../../shared/directives/fade-in.directive";
import {getSiteCopy} from '../../../shared/i18n/site-copy';
import {toAngularLocale} from '../../../shared/i18n/app-locale';
import {LocaleService} from '../../../shared/services/locale.service';

@Component({
  selector: 'project-overview-page',
  standalone: true,
  imports: [DatePipe, RouterLink, FadeInDirective],
  template: `
    <main class="min-h-screen bg-background text-white px-4 py-8 md:py-12 md:px-8" fadeIn>
      <div class="max-w-5xl mx-auto">
        <a [routerLink]="goBackLink()" class="inline-flex items-center gap-2 text-base font-bold link-color-primary-hover
            decoration-transparent underline-offset-4 transition-all duration-700 ease-in-out
            hover:underline hover:decoration-current hover:font-bold">
          <span aria-hidden="true" class="text-current">←</span>
          {{ copy().projectDetail.backToProjects }}
        </a>

        @if (projectResource.isLoading()) {
          <div class="py-24 text-center text-gray-400 font-mono">{{ copy().projectDetail.loading }}</div>
        } @else if (projectResource.error()) {
          <div class="rounded-xl border border-red-900 bg-red-950/30 p-6">
            <h1 class="text-2xl font-bold text-red-300 mb-2">{{ getErrorTitle(projectResource.error()) }}</h1>
            <p class="text-sm text-red-200/80">{{ getErrorMessage(projectResource.error()) }}</p>
          </div>
        } @else if (projectResource.value()?.data; as project) {
          <article class="mt-3 space-y-8">
            <header class="space-y-4">
              <div class="flex flex-wrap items-center gap-3 text-xs text-gray-400">
                <span class="rounded-full border border-[#143c1a] px-2 py-1 text-primary">
                  {{ project.isPublished ? copy().projectDetail.published : copy().projectDetail.draft }}
                </span>
                <time [attr.datetime]="project.createdAt">{{ project.createdAt | date: 'mediumDate' : undefined : angularLocale() }}</time>
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
              <h2 class="text-xl font-semibold text-white">{{ copy().projectDetail.overview }}</h2>
              @if (project.contentMarkdown) {
                <div class="prose prose-invert max-w-none text-gray-300"
                     [innerHTML]="renderedMarkdown(project.contentMarkdown)"></div>
              } @else {
                <p class="text-gray-300 leading-7">{{ copy().projectDetail.emptyDescription }}</p>
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
  private readonly sanitizer = inject(DomSanitizer);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly slug = signal(this.route.snapshot.paramMap.get('slug') ?? '');
  private readonly previewMode = signal(this.route.snapshot.queryParamMap.get('preview') === 'admin');
  private readonly localeService = inject(LocaleService);

  protected clientReady = isPlatformBrowser(this.platformId);
  protected locale = this.localeService.locale;
  protected angularLocale = computed(() => toAngularLocale(this.locale()));
  protected copy = computed(() => getSiteCopy(this.locale()));

  private readonly renderer = this.setupRenderer();

  goBackLink = computed(() => (this.previewMode() ? '/admin/projects' : '/'));

  projectResource = httpResource<ApiSuccess<Project>>(() => {
    const slug = this.slug();
    if (!slug) return undefined;

    if (this.previewMode()) {
      if (!this.clientReady) return undefined;
      return `/api/admin/projects?slug=${slug}`;
    }

    return `/api/projects/${slug}`;
  });

  private setupRenderer(): Renderer {
    const renderer = new Renderer();

    renderer.heading = ({text, depth}) => {
      const sizeMap = {
        1: 'font-size: clamp(1.25rem, 3vw, 1.5rem)',
        2: 'font-size: clamp(1rem, 2.5vw, 1.25rem)',
        3: 'font-size: clamp(0.875rem, 2vw, 1rem)'
      };
      const style = sizeMap[depth as 1 | 2 | 3] || 'font-size: clamp(0.875rem, 1.5vw, 1rem)';
      return `<h${depth} style="${style}" class="font-bold mt-6 mb-3 text-primary">${text}</h${depth}>`;
    };

    renderer.paragraph = ({text}) => `<p style="font-size: clamp(0.875rem, 2vw, 1.125rem)" class="mb-4 leading-7">${text}</p>`;

    renderer.list = ({items, ordered}) => {
      const listClass = ordered ? 'list-decimal' : 'list-disc';
      const html = items.map(item => `<li style="font-size: clamp(0.875rem, 2vw, 1.125rem)" class="ml-5 mb-2">${item.text}</li>`).join('');
      return `<${ordered ? 'ol' : 'ul'} class="${listClass} ml-4 mb-4">${html}</${ordered ? 'ol' : 'ul'}>`;
    };

    renderer.image = ({href, text, title}) => {
      return `<img src="${href}" alt="${text}" title="${title || ''}" style="max-width: clamp(100%, 90vw, 100%); height: auto;" class="rounded-lg my-6"/>`;
    };

    renderer.strong = ({text}) => `<strong class="font-semibold">${text}</strong>`;

    return renderer;
  }

  renderedMarkdown(markdown: string) {
    try {
      const cleaned = markdown
        .split('\n')
        .map(line => line.trimStart())
        .join('\n')
        .trim();

      const html = marked.parse(cleaned, {renderer: this.renderer, async: false});
      return this.sanitizer.bypassSecurityTrustHtml(html as string);
    } catch (e) {
      console.error('Markdown parsing error:', e);
      return this.sanitizer.bypassSecurityTrustHtml(`<p>${markdown}</p>`);
    }
  }

  getErrorTitle(error: unknown): string {
    const status = (error as { status?: number })?.status;
    if (status === 404) return this.copy().projectDetail.notFoundTitle;
    return this.copy().projectDetail.loadErrorTitle;
  }

  getErrorMessage(error: unknown): string {
    const e = error as { status?: number };
    if (e?.status === 404) return this.copy().projectDetail.notFoundMessage;
    return extractApiErrorMessage(error, this.copy().projectDetail.loadErrorMessage);
  }
}
