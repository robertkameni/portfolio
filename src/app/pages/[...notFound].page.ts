import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { injectResponse } from '@analogjs/router/tokens';
import { getSiteCopy } from '../shared/i18n/site-copy';
import { LocaleService } from '../shared/services/locale.service';
import { withRenderMode } from '../shared/routing/render-mode.types';

export const routeMeta = withRenderMode('server');

/**
 * Catch-all for addresses that match no route. Without it an unknown URL
 * rendered an empty document: no heading, no text, no way back. A portfolio is
 * shared as a link, so a stale or mistyped one is a realistic arrival.
 *
 * The two links are the ones that actually resolve. A contact link is
 * deliberately absent: the contact section has no anchor, so the link would
 * promise a destination it cannot reach.
 */
@Component({
  selector: 'not-found-page',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './[...notFound].page.html',
})
export default class NotFoundPage {
  private readonly localeService = inject(LocaleService);
  protected locale = this.localeService.locale;
  protected copy = computed(() => getSiteCopy(this.locale()).notFoundPage);

  constructor() {
    /* A rendered not-found page is still a successful HTTP response, and search
       engines index a 200. Angular's own RESPONSE_INIT is declared but consumed
       nowhere in this render pipeline, so the status is set on the Node response
       that Analog exposes. Optional: this component also runs in the browser,
       where the token is absent.

       Verified against the built deployment, not just the dev server: an unknown
       path answers 404 there, while home, the projects index and a project page
       still answer 200. */
    const response = injectResponse();
    if (response) {
      response.statusCode = 404;
      response.statusMessage = 'Not Found';
    }
  }
}
