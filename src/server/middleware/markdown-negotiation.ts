import { defineEventHandler, getRequestHeader, setResponseHeader } from 'h3';
import { agentHomepageMarkdown } from '../content/agent-homepage';

/**
 * When the Nitro server handles `GET /`, return markdown if the client prefers it.
 * Production on Vercel also uses `vercel.json` rewrite so static `/` + Accept markdown hits the API.
 */
export default defineEventHandler((event) => {
  if (event.node.req.method !== 'GET') return;
  const path = event.path.split('?')[0];
  if (path !== '/') return;
  const accept = getRequestHeader(event, 'accept') ?? '';
  if (!/\btext\/markdown\b/i.test(accept)) return;
  setResponseHeader(event, 'content-type', 'text/markdown; charset=utf-8');
  return agentHomepageMarkdown;
});
