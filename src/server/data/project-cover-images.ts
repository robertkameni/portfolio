export const DEFAULT_PROJECT_COVER_IMAGES = [
  'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1487058792275-0ad4aaf24ca7?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1400&q=80',
] as const;

export const DEFAULT_PROJECT_COVER_IMAGE_BY_SLUG: Record<string, string> = {
  'datev-kanzlei-management-platform-angular20': DEFAULT_PROJECT_COVER_IMAGES[0],
  'factoring-modernization-angular15-omnia-optica': DEFAULT_PROJECT_COVER_IMAGES[1],
  'deployment-control-platform-angular-monorepo-upgrade': DEFAULT_PROJECT_COVER_IMAGES[2],
  'employee-management-system-angular-springboot': DEFAULT_PROJECT_COVER_IMAGES[3],
};

export function getDefaultProjectCoverImageBySlug(slug: string): string {
  return DEFAULT_PROJECT_COVER_IMAGE_BY_SLUG[slug] ?? DEFAULT_PROJECT_COVER_IMAGES[0];
}

