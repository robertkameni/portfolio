import '@angular/platform-server/init';
import { render } from '@analogjs/router/server';
import './app/shared/i18n/register-locales';

import { App } from './app/app';
import { config } from './app/app.config.server';

export default render(App, config);
