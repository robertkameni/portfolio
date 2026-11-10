/**
 * Property the not-found page sets on the Node response during SSR.
 *
 * Defined outside `src/server` on purpose: the page is a client component too,
 * and importing from the server tree would pull h3 into the browser bundle.
 *
 * The server middleware reads this flag to force a 404 status; see
 * `src/server/middleware/not-found-status.ts`.
 */
export const NOT_FOUND_FLAG = '__portfolioNotFound';

/** Shape of the response object the flag is written to. */
export type FlaggedResponse = {
  [NOT_FOUND_FLAG]?: boolean;
};
