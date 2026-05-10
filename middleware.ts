import { next, rewrite } from '@vercel/functions';

/**
 * Runs on Vercel **before** static routes. Rewrites `GET /` to the markdown API when the
 * client prefers `text/markdown`, so agent scanners receive `Content-Type: text/markdown`.
 * (`vercel.json` rewrites alone are not reliable with Nitro Build Output API + static `/`.)
 */
export const config = {
  matcher: '/',
};

export default function middleware(request: Request): Response {
  if (request.method !== 'GET') {
    return next();
  }
  const url = new URL(request.url);
  if (url.pathname !== '/') {
    return next();
  }
  const accept = request.headers.get('accept') ?? '';
  if (!/\btext\/markdown\b/i.test(accept)) {
    return next();
  }
  return rewrite(new URL('/api/agent-site-markdown', request.url));
}
