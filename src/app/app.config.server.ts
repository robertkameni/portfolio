import { mergeApplicationConfig, ApplicationConfig } from '@angular/core';
import { provideServerRendering } from '@angular/platform-server';

import { appConfig } from './app.config';

/**
 * Do not call provideFileRouter() here — app.config.ts already provides it.
 * A second registration breaks route matching and can leave <router-outlet> empty
 * (duplicate router state / provider conflicts with SSR + client hydration).
 */
const serverConfig: ApplicationConfig = {
  providers: [provideServerRendering()],
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
