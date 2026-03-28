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

