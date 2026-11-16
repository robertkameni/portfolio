import { isPlatformBrowser } from '@angular/common';
import { Component, inject, PLATFORM_ID } from '@angular/core';
import { RouterLink } from '@angular/router';
import { withRenderMode } from '../../shared/routing/render-mode.types';
import { LocaleService } from '../../shared/services/locale.service';
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
 * The content is German whatever the visitor's language, so the page declares
 * `lang="de"` on its main element. Without it an English visitor got German text
 * announced with an English voice, which is unreadable in a screen reader even
 * though it looks fine.
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
  private readonly localeService = inject(LocaleService);

  protected readonly cv = CV_DATA;
  protected readonly locale = this.localeService.locale;

  protected print(): void {
    if (isPlatformBrowser(this.platformId)) {
      window.print();
    }
  }
}
