import { defineEventHandler } from 'h3';

/**
 * Makes a rendered not-found page answer 404 instead of 200.
 *
 * The not-found component sets `statusCode = 404` on the Node response it gets
 * from Analog's server context, which works in the dev SSR server. In the built
 * deployment the status arrived as 200: the renderer writes the status itself
 * afterwards, so the value set during rendering is overwritten.
 *
 * This middleware wraps `writeHead` before rendering starts, so whatever status
 * the renderer passes is replaced when the page marked itself as not found. The
 * mark is set by the component, so routes that exist are untouched.
 *
 * The flag lives on the response object rather than in `event.context`, because
 * the component's injection token exposes the response and nothing else.
 */

/** Property the not-found page sets on the Node response. */
export const NOT_FOUND_FLAG = '__portfolioNotFound';

type FlaggedResponse = {
  [NOT_FOUND_FLAG]?: boolean;
  writeHead: ((...args: unknown[]) => unknown) & { __patched?: boolean };
};

export default defineEventHandler((event) => {
  const res = event.node.res as unknown as FlaggedResponse;
  if (res[NOT_FOUND_FLAG] === undefined) {
    res[NOT_FOUND_FLAG] = false;
  }

  if (res.writeHead.__patched === true) {
    return;
  }

  const original = res.writeHead.bind(res);

  const patched = function (this: unknown, statusCode: number, ...rest: unknown[]) {
    if (res[NOT_FOUND_FLAG] === true) {
      // Keep the caller's reason phrase and headers, replace only the status.
      const [statusMessage, headers] = rest;
      if (typeof statusMessage === 'string') {
        return original(404, statusMessage, headers);
      }
      return original(404, 'Not Found', statusMessage);
    }
    return original(statusCode, ...rest);
  } as FlaggedResponse['writeHead'];

  patched.__patched = true;
  res.writeHead = patched;
});
