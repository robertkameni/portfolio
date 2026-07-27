import { defineNitroPlugin } from 'nitropack/runtime';
import { validateServerEnv } from '../utils/env.util';

export default defineNitroPlugin(() => {
  validateServerEnv();
});
