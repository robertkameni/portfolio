import { Component, computed, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { httpResource } from '@angular/common/http';
import { DomSanitizer } from '@angular/platform-browser';
import { marked, Renderer } from 'marked';
import type { Project } from '../../../shared/types/project.types';
import type { ApiSuccess } from '../../../shared/types/api.types';
import { extractApiErrorMessage } from '../../../shared/utils/api-error.util';
import { FadeInDirective } from '../../../shared/directives/fade-in.directive';
import { getSiteCopy } from '../../../shared/i18n/site-copy';
import { toAngularLocale } from '../../../shared/i18n/app-locale';
import { LocaleService } from '../../../shared/services/locale.service';

@Component({
  selector: 'project-overview-page',
  standalone: true,
  imports: [DatePipe, RouterLink, FadeInDirective],
  templateUrl: './index.page.html',
})
export default class ProjectOverviewPage {
  private readonly route = inject(ActivatedRoute);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly slug = signal(this.route.snapshot.paramMap.get('slug') ?? '');
  private readonly localeService = inject(LocaleService);

  protected previewMode = signal(this.route.snapshot.queryParamMap.get('preview') === 'admin');
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

    renderer.heading = function ({ tokens, depth }) {
      const sizeMap = {
        1: 'font-size: clamp(1.25rem, 3vw, 1.5rem)',
        2: 'font-size: clamp(1rem, 2.5vw, 1.25rem)',
        3: 'font-size: clamp(0.875rem, 2vw, 1rem)',
      };
      const style = sizeMap[depth as 1 | 2 | 3] || 'font-size: clamp(0.875rem, 1.5vw, 1rem)';
      const text = this.parser.parseInline(tokens);
      return `<h${depth} style="${style}" class="font-bold mt-6 mb-3 text-primary">${text}</h${depth}>`;
    };

    renderer.paragraph = function ({ tokens }) {
      const text = this.parser.parseInline(tokens);
      return `<p style="font-size: clamp(0.875rem, 2vw, 1.125rem)" class="mb-4 leading-7">${text}</p>`;
    };

    renderer.list = function ({ items, ordered }) {
      const listClass = ordered ? 'list-decimal' : 'list-disc';
      const tag = ordered ? 'ol' : 'ul';
      const html = items
        .map((item) => {
          const text = this.parser.parseInline(item.tokens);
          return `<li style="font-size: clamp(0.875rem, 2vw, 1.125rem)" class="ml-5 mb-2">${text}</li>`;
        })
        .join('');
      return `<${tag} class="${listClass} ml-4 mb-4">${html}</${tag}>`;
    };

    renderer.image = ({ href, text, title }) => {
      return `<img src="${href}" alt="${text}" title="${title || ''}" style="max-width: clamp(100%, 90vw, 100%); height: auto;" class="rounded-lg my-6"/>`;
    };

    renderer.strong = ({ text }) => `<strong class="font-semibold">${text}</strong>`;

    return renderer;
  }

  renderedMarkdown(markdown: string) {
    try {
      const cleaned = markdown
        .split('\n')
        .map((line) => line.trimStart())
        .join('\n')
        .trim();

      const html = marked.parse(cleaned, { renderer: this.renderer, async: false });
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
