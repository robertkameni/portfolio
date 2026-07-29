import type { User } from '../db/prisma-types';

declare module 'h3' {
  interface H3EventContext {
    user?: User;
  }
}
