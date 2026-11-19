import { isPlatformBrowser } from '@angular/common';
import { Component, DestroyRef, inject, PLATFORM_ID } from '@angular/core';
import { RouterLink } from '@angular/router';
import { withRenderMode } from '../../shared/routing/render-mode.types';
import { PageMetaService } from '../../shared/services/page-meta.service';
import { buildPersonJsonLd } from '../../shared/seo/json-ld';
import { getPageSeoCopy } from '../../shared/seo/page-seo-copy';
import { siteAbsoluteUrl } from '../../shared/seo/site-absolute-url';
import { cvKnowsAbout } from '../../shared/seo/cv-knows-about';
import { CV_DATA } from './cv-data';

export const routeMeta = withRenderMode('server');

/**
 * The CV as a page, so it prints.
 *
 * The document is German because a Lebenslauf is what German recruiters read.
 * The page is server-rendered like the rest of the public site; the data lives
 * in `cv-data.ts`, copied from the CV file rather than derived from the profile,
 * so the printed page cannot quietly disagree with the document.
 *
 * The content is German whatever the visitor's language, so the page claims the
 * document language as well as `main lang="de"`. Without that an English
 * visitor printed a PDF tagged `lang="en"` around German text, and an ATS that
 * trusts the document language indexed it in the wrong one.
 *
 * The head tags are set here too: the title is what the browser suggests as the
 * PDF filename, and the canonical URL is the page an ATS or search engine
 * should index. Both are restored on navigation away.
 */
@Component({
  selector: 'cv-page',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './index.page.html',
  styleUrl: './index.page.css',
})
export default class CvPage {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly pageMeta = inject(PageMetaService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly cv = CV_DATA;

  constructor() {
    const seo = getPageSeoCopy('de');
    this.pageMeta.apply({
      title: seo.cv.title,
      description: seo.cv.description,
      canonical: siteAbsoluteUrl('/cv'),
      lang: 'de',
      jsonLd: buildPersonJsonLd({
        jobTitle: CV_DATA.headline,
        knowsAbout: cvKnowsAbout(),
        url: siteAbsoluteUrl('/cv'),
      }),
    });

    this.destroyRef.onDestroy(() => this.pageMeta.restore());
  }

  protected print(): void {
    if (isPlatformBrowser(this.platformId)) {
      window.print();
    }
  }
}
