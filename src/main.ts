import {bootstrapApplication} from '@angular/platform-browser';
import {appConfig} from './app/app.config';
import {App} from "./app/app";

import './styles.css';

bootstrapApplication(App, appConfig)
  .then(() => {
    const removeLoader = () => document.getElementById('boot-loader')?.remove();
    if (document.readyState === 'complete') {
      removeLoader();
    } else {
      window.addEventListener('load', removeLoader, {once: true});
    }
  })
  .catch((err) => console.error(err));

