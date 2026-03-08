import { bootstrapApplication } from '@angular/platform-browser';
import './styles.css';

import { App } from './app/app';
import { appConfig } from './app/app.config';

import './styles.css';

bootstrapApplication(App, appConfig).catch((err) =>
  console.error(err)
);
