import { afterNextRender, Component, computed, inject, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { httpResource } from '@angular/common/http';
import type { Project } from '../../../shared/types/project.types';
import type { ApiSuccess } from '../../../shared/types/api.types';
import { extractApiErrorMessage } from '../../../shared/utils/api-error.util';
import { getResponsiveImageAttrs } from '../../../shared/utils/image-url';
import { FadeInDirective } from '../../../shared/directives/fade-in.directive';
import { SafeHtmlDirective } from '../../../shared/directives/safe-html.directive';
import { getSiteCopy } from '../../../shared/i18n/site-copy';
import { toAngularLocale } from '../../../shared/i18n/app-locale';
import { LocaleService } from '../../../shared/services/locale.service';
import { createProjectMarkdownRenderer, normalizeProjectMarkdown } from '../../../shared/markdown/project-markdown-renderer';
import { withRenderMode } from '../../../shared/routing/render-mode.types';
import { resolveProjectApiUrl } from './project-api-url';

export const routeMeta = withRenderMode('server');

@Component({
  selector: 'project-overview-page',
  standalone: true,
  imports: [DatePipe, RouterLink, FadeInDirective, SafeHtmlDirective],
  templateUrl: './index.page.html',
})
export default class ProjectOverviewPage {
  private readonly route = inject(ActivatedRoute);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly slug = signal(this.route.snapshot.paramMap.get('slug') ?? '');
  private readonly localeService = inject(LocaleService);

  protected previewMode = signal(this.route.snapshot.queryParamMap.get('preview') === 'admin');
  protected clientReady = isPlatformBrowser(this.platformId);
  protected locale = this.localeService.locale;
  protected angularLocale = computed(() => toAngularLocale(this.locale()));
  protected copy = computed(() => getSiteCopy(this.locale()));

  private markdownParser: ((markdown: string) => string) | null = null;
  private markdownParserLoading = false;
  private readonly markdownReady = signal(false);

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      afterNextRender(() => {
        void this.loadMarkdownParser();
      });
      return;
    }

    void this.loadMarkdownParser();
  }

  goBackLink = computed(() => (this.previewMode() ? '/admin/projects' : '/'));

  projectResource = httpResource<ApiSuccess<Project>>(() =>
    resolveProjectApiUrl({
      slug: this.slug(),
      previewMode: this.previewMode(),
      clientReady: this.clientReady,
    }),
  );

  protected readonly coverImageAttrs = computed(() => {
    const url = this.projectResource.value()?.data?.coverImageUrl;
    if (!url) return null;
    return getResponsiveImageAttrs(url);
  });

  protected readonly renderedMarkdown = computed(() => {
    this.markdownReady();
    const md = this.projectResource.value()?.data?.contentMarkdown;
    if (!md || !this.markdownParser) {
      return '';
    }

    try {
      return this.markdownParser(normalizeProjectMarkdown(md));
    } catch (e) {
      console.error('Markdown parsing error:', e);
      return `<p>${md}</p>`;
    }
  });

  private async loadMarkdownParser(): Promise<void> {
    if (this.markdownParser || this.markdownParserLoading) {
      return;
    }

    this.markdownParserLoading = true;
    try {
      const { marked, Renderer } = await import('marked');
      const renderer = createProjectMarkdownRenderer(Renderer);
      this.markdownParser = (markdown: string) => marked.parse(markdown, { renderer, async: false, gfm: true }) as string;
      this.markdownReady.set(true);
    } finally {
      this.markdownParserLoading = false;
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
