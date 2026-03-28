import type { User } from '../../prisma/generated/client';

declare module 'h3' {
  interface H3EventContext {
    user?: User;
  }
}
