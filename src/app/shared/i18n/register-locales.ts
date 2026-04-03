import {registerLocaleData} from '@angular/common';
import localeDe from '@angular/common/locales/de';

// Register both ids used in the app mapping (de and de-DE).
registerLocaleData(localeDe);
registerLocaleData(localeDe, 'de-DE');

