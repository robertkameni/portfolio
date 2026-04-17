export type Project = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  contentMarkdown: string | null;
  tags: string[];
  coverImageUrl: string | null;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ProjectListItem = Omit<Project, 'contentMarkdown'>;

/** Body for POST / PUT project admin APIs (matches server CreateProjectDto fields). */
export type ProjectPayload = Omit<Project, 'id' | 'createdAt' | 'updatedAt'>;

export type ProjectFormModel = Omit<
  ProjectPayload,
  'description' | 'contentMarkdown' | 'coverImageUrl' | 'tags'
> & {
  description: string;
  contentMarkdown: string;
  coverImageUrl: string;
  tags: string;
};

export function toProjectPayload(form: ProjectFormModel): ProjectPayload {
  return {
    title: form.title,
    slug: form.slug,
    description: form.description.trim() ? form.description.trim() : null,
    contentMarkdown: form.contentMarkdown.trim() ? form.contentMarkdown.trim() : null,
    coverImageUrl: form.coverImageUrl.trim() ? form.coverImageUrl.trim() : null,
    isPublished: form.isPublished,
    tags: form.tags.trim()
      ? form.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)
      : [],
  };
}
