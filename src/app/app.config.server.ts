import { mergeApplicationConfig, ApplicationConfig } from '@angular/core';
import { provideServerRendering } from '@angular/platform-server';
import { provideFileRouter } from '@analogjs/router';

import { appConfig } from './app.config';

const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(),
    provideFileRouter(),
  ],
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
