import { prisma } from '../client';
import type { Project } from '../prisma-types';
import { DEFAULT_PROJECT_COVER_IMAGES } from '../../data/project-cover-images';

export type CreateProjectDto = Pick<Project, 'slug' | 'title' | 'description' | 'contentMarkdown' | 'tags' | 'coverImageUrl' | 'projectUrl' | 'isPublished'>;
export type UpdateProjectDto = Partial<CreateProjectDto & { isPublished: boolean }>;
export type ProjectDetail = Project;
export type ProjectListItem = Omit<Project, 'contentMarkdown'>;

const LIST_SELECT = {
  id: true,
  slug: true,
  title: true,
  description: true,
  tags: true,
  coverImageUrl: true,
  projectUrl: true,
  isPublished: true,
  createdAt: true,
  updatedAt: true,
} as const;

export const projectRepository = {
  async findAllPublished(): Promise<ProjectListItem[]> {
    return prisma.project.findMany({
      select: LIST_SELECT,
      where: { isPublished: true },
      orderBy: { createdAt: 'desc' },
    });
  },

  async findPublishedBySlug(slug: string): Promise<ProjectDetail | null> {
    return prisma.project.findFirst({
      where: { slug, isPublished: true },
    });
  },

  async findBySlug(slug: string): Promise<ProjectDetail | null> {
    return prisma.project.findUnique({
      where: { slug },
    });
  },

  async findAll(): Promise<ProjectListItem[]> {
    return prisma.project.findMany({
      select: LIST_SELECT,
      orderBy: { createdAt: 'desc' },
    });
  },

  /**
   * Creates a new project.
   * Assigns a random default cover image if none provided.
   * @param data The data for the new project.
   * @returns The newly created project.
   */
  async create(data: CreateProjectDto): Promise<Project> {
    // Only use defaults when no URL was provided
    const coverImageUrl = data.coverImageUrl?.trim() ? data.coverImageUrl : DEFAULT_PROJECT_COVER_IMAGES[Math.floor(Math.random() * DEFAULT_PROJECT_COVER_IMAGES.length)];

    return prisma.project.create({
      data: {
        ...data,
        coverImageUrl,
      },
    });
  },

  /**
   * Updates an existing project by its ID.
   * @param id The UUID of the project to update.
   * @param data The data to update.
   * @returns The updated project.
   */
  async update(id: string, data: UpdateProjectDto): Promise<Project> {
    return prisma.project.update({
      where: { id },
      data,
    });
  },

  /**
   * Deletes a project by its ID.
   * @param id The UUID of the project to delete.
   */
  async deleteById(id: string): Promise<void> {
    await prisma.project.delete({
      where: { id },
    });
  },
};
