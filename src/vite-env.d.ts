/// <reference types="vite/client" />

interface ImportMeta {
  /** Injected by Nitro during build — true in the prerender server bundle. */
  readonly prerender?: boolean;
}
