import { defineNitroPlugin } from 'nitropack/runtime';
import { validateServerEnv } from '../utils/env.util';

export default defineNitroPlugin(() => {
  // Static prerender runs with NODE_ENV=production but does not need runtime secrets.
  if (import.meta.prerender) {
    return;
  }

  validateServerEnv();
});
