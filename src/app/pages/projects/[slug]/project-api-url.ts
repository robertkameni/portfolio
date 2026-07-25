export function resolveProjectApiUrl(options: {
  slug: string;
  previewMode: boolean;
  clientReady: boolean;
}): string | undefined {
  const { slug, previewMode, clientReady } = options;
  if (!slug) {
    return undefined;
  }

  if (previewMode) {
    if (!clientReady) {
      return undefined;
    }
    return `/api/admin/projects?slug=${slug}`;
  }

  return `/api/projects/${slug}`;
}
