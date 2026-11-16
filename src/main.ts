import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import './app/shared/i18n/register-locales';

import './fonts.css';
import './styles.css';

bootstrapApplication(App, appConfig)
  .then(() => {
    /* Drop the shell loader as soon as the app is running, not when the
       `load` event fires. `load` waits on every font and image on the page,
       which on a slow connection is seconds after the app is interactive — and
       while the loader sits on top, it is the thing Lighthouse paints as LCP.
       `index.html` already hides it with `:has()` for server-rendered pages;
       this removes it from the DOM for client-only routes. */
    document.getElementById('boot-loader')?.remove();
  })
  .catch((err) => console.error(err));
