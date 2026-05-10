import { defineEventHandler, setResponseHeader } from 'h3';
import { agentHomepageMarkdown } from '../content/agent-homepage';

/**
 * Stable markdown URL for agents — same body as `GET /` when `Accept: text/markdown`.
 * Not linked from the Angular UI; body lives in `src/server/content/agent-homepage.ts`.
 */
export default defineEventHandler((event) => {
  setResponseHeader(event, 'content-type', 'text/markdown; charset=utf-8');
  return agentHomepageMarkdown;
});
