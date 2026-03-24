import { prisma } from '../client';
import type { User } from '@prisma/client';

/**
 * Repository for User data access.
 * Encapsulates all database operations related to the User model.
 */
export const userRepository = {
  /**
   * Finds a user by their email address.
   * @param email - The email of the user to find.
   * @returns The user object or null if not found.
   */
  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { email },
    });
  },

  /**
   * Finds a user by their ID.
   * @param id - The UUID of the user to find.
   * @returns The user object or null if not found.
   */
  async findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { id },
    });
  },

  /**
   * Creates a new admin user.
   * Note: In a real application, this would be part of a secure seeding script or a super-admin panel.
   * @param email - The new user's email.
   * @param passwordHash - The securely hashed password.
   * @returns The newly created user object.
   */
  async create(email: string, passwordHash: string): Promise<User> {
    return prisma.user.create({
      data: {
        email,
        passwordHash,
        role: 'ADMIN',
      },
    });
  },
};
