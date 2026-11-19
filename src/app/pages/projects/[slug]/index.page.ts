import { afterNextRender, Component, computed, DestroyRef, effect, inject, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { httpResource } from '@angular/common/http';
import type { Project } from '../../../shared/types/project.types';
import type { ApiSuccess } from '../../../shared/types/api.types';
import { extractApiErrorMessage } from '../../../shared/utils/api-error.util';
import { getResponsiveImageAttrs } from '../../../shared/utils/image-url';
import { FadeInDirective } from '../../../shared/directives/fade-in.directive';
import { SafeHtmlDirective } from '../../../shared/directives/safe-html.directive';
import { ScreenshotZoom } from '../../../shared/components/screenshot-zoom/screenshot-zoom';
import { getSiteCopy } from '../../../shared/i18n/site-copy';
import { toAngularLocale } from '../../../shared/i18n/app-locale';
import { LocaleService } from '../../../shared/services/locale.service';
import { ProjectsStore } from '../../../store/projects.store';
import { createProjectMarkdownRenderer, normalizeProjectMarkdown } from '../../../shared/markdown/project-markdown-renderer';
import { withRenderMode } from '../../../shared/routing/render-mode.types';
import { resolveProjectApiUrl } from './project-api-url';
import { PageMetaService } from '../../../shared/services/page-meta.service';
import { getPageSeoCopy } from '../../../shared/seo/page-seo-copy';
import { siteAbsoluteUrl } from '../../../shared/seo/site-absolute-url';
import { buildCreativeWorkJsonLd } from '../../../shared/seo/json-ld';

export const routeMeta = withRenderMode('server');

@Component({
  selector: 'project-overview-page',
  standalone: true,
  imports: [DatePipe, RouterLink, FadeInDirective, SafeHtmlDirective, ScreenshotZoom],
  templateUrl: './index.page.html',
})
export default class ProjectOverviewPage {
  private readonly route = inject(ActivatedRoute);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly localeService = inject(LocaleService);
  private readonly projectsStore = inject(ProjectsStore);
  private readonly pageMeta = inject(PageMetaService);
  private readonly destroyRef = inject(DestroyRef);

  /**
   * The params come from the live stream, not from `route.snapshot`.
   *
   * Angular reuses this component when navigating from one case study to
   * another, because both URLs match the same route. The snapshot is read once
   * at construction, so a reused instance kept the first slug: following the
   * "next project" link changed the address but the body stayed on the previous
   * project until a reload. `paramMap` emits on every navigation, and the
   * resource below refetches when this signal changes.
   */
  private readonly paramMap = toSignal(this.route.paramMap, { initialValue: this.route.snapshot.paramMap });
  private readonly queryParamMap = toSignal(this.route.queryParamMap, { initialValue: this.route.snapshot.queryParamMap });

  private readonly slug = computed(() => this.paramMap().get('slug') ?? '');

  protected previewMode = computed(() => this.queryParamMap().get('preview') === 'admin');
  protected clientReady = isPlatformBrowser(this.platformId);
  protected locale = this.localeService.locale;
  protected angularLocale = computed(() => toAngularLocale(this.locale()));
  protected copy = computed(() => getSiteCopy(this.locale()));

  protected readonly project = computed(() => this.projectResource.value()?.data ?? null);

  private markdownParser: ((markdown: string) => string) | null = null;
  private markdownParserLoading = false;
  private readonly markdownReady = signal(false);

  constructor() {
    this.projectsStore.load();

    effect(() => {
      const locale = this.localeService.locale();
      const project = this.project();
      const seo = getPageSeoCopy(locale);
      if (!project) return;
      const tags = project.tags ?? [];
      const url = siteAbsoluteUrl(`/projects/${project.slug}`);
      this.pageMeta.apply({
        title: seo.projectDetail.title(project.title, tags),
        description: seo.projectDetail.description(project.title, tags),
        canonical: url,
        jsonLd: buildCreativeWorkJsonLd({
          name: project.title,
          url,
          description: project.description ?? undefined,
          keywords: tags,
        }),
      });
    });
    this.destroyRef.onDestroy(() => this.pageMeta.restore());

    if (isPlatformBrowser(this.platformId)) {
      afterNextRender(() => {
        void this.loadMarkdownParser();
      });
      return;
    }

    void this.loadMarkdownParser();
  }

  goBackLink = computed(() => (this.previewMode() ? '/admin/projects' : ''));

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

  /**
   * The project after this one in the published list, wrapping at the end.
   * A case study should not end in a dead end. The store is usually already
   * filled by the home page, so this costs nothing.
   */
  protected readonly nextProject = computed(() => {
    const list = this.projectsStore.data() ?? [];
    if (list.length < 2) {
      return null;
    }

    const index = list.findIndex((project) => project.slug === this.slug());
    if (index === -1) {
      return null;
    }

    return list[(index + 1) % list.length] ?? null;
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

  protected zoomTriggerAriaLabel(title: string): string {
    return this.copy().projectDetail.zoomTriggerAriaLabel.replace('{title}', title);
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
