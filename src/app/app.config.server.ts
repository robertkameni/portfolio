import { mergeApplicationConfig, ApplicationConfig, CSP_NONCE, inject } from '@angular/core';
import { provideServerRendering } from '@angular/platform-server';
import { REQUEST } from '@analogjs/router/tokens';
import type { IncomingMessage } from 'node:http';

import { appConfig } from './app.config';

/**
 * Do not call provideFileRouter() here — app.config.ts already provides it.
 * A second registration breaks route matching and can leave <router-outlet> empty
 * (duplicate router state / provider conflicts with SSR + client hydration).
 */

/**
 * Angular writes this nonce onto the inline scripts it emits during SSR. The
 * value comes from `src/server/middleware/00-csp.ts`, which mints one per
 * response and sets the matching `script-src 'nonce-…'`. Reading it off REQUEST
 * is what ties the two together; without it the policy blocks Angular's own
 * bootstrap, which is exactly the failure this replaced.
 */
type NonceRequest = IncomingMessage & { cspNonce?: string };

const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(),
    {
      provide: CSP_NONCE,
      useFactory: () => {
        const request = inject(REQUEST, { optional: true }) as NonceRequest | null;
        return request?.cspNonce ?? null;
      },
    },
  ],
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
