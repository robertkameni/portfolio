import {prisma} from '../client';
import type {Project} from '../../../../prisma/generated/client';

// Default cover images for projects without provided URLs
const DEFAULT_IMAGES = [
  'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1487058792275-0ad4aaf24ca7?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1400&q=80'
];

/**
 * Data Transfer Object for creating a project.
 */
export type CreateProjectDto = Pick<
  Project,
  'slug' | 'title' | 'description' | 'contentMarkdown' | 'tags' | 'coverImageUrl' | 'isPublished'
>;

/**
 * Data Transfer Object for updating a project.
 * All fields are optional.
 */
export type UpdateProjectDto = Partial<CreateProjectDto & { isPublished: boolean }>;

/**
 * Repository for Project data access.
 * Encapsulates all database operations related to the Project model.
 */
export const projectRepository = {
  /**
   * Finds all published projects, ordered by creation date descending.
   * @returns A list of published projects.
   */
  async findAllPublished(): Promise<Project[]> {
    return prisma.project.findMany({
      where: {isPublished: true},
      orderBy: {createdAt: 'desc'}
    });
  },

  /**
   * Finds a single published project by its unique slug.
   * @param slug The slug of the project to find.
   * @returns The project object or null if not found or not published.
   */
  async findPublishedBySlug(slug: string): Promise<Project | null> {
    return prisma.project.findFirst({
      where: {slug, isPublished: true}
    });
  },

  /**
   * Finds a project by its slug regardless of publish state (admin-only).
   */
  async findBySlug(slug: string): Promise<Project | null> {
    return prisma.project.findUnique({
      where: {slug}
    });
  },

  /**
   * Finds all projects, including drafts. (Admin only)
   * @returns A list of all projects.
   */
  async findAll(): Promise<Project[]> {
    return prisma.project.findMany({
      orderBy: {createdAt: 'desc'}
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
    const coverImageUrl = data.coverImageUrl?.trim()
      ? data.coverImageUrl
      : DEFAULT_IMAGES[Math.floor(Math.random() * DEFAULT_IMAGES.length)];

    return prisma.project.create({
      data: {
        ...data,
        coverImageUrl
      }
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
      where: {id},
      data
    });
  },

  /**
   * Deletes a project by its ID.
   * @param id The UUID of the project to delete.
   */
  async deleteById(id: string): Promise<void> {
    await prisma.project.delete({
      where: {id}
    });
  }
};
