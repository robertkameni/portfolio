import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const BCRYPT_SALT_ROUNDS = 12;

// Ensure these are set in your .env file for production
const ACCESS_TOKEN_SECRET = process.env['ACCESS_TOKEN_SECRET'] || 'your-super-secret-access-key';
const REFRESH_TOKEN_SECRET = process.env['REFRESH_TOKEN_SECRET'] || 'your-super-secret-refresh-key';

const ACCESS_TOKEN_EXPIRATION = '20m';
const REFRESH_TOKEN_EXPIRATION = '7d';

/**
 * Service for handling security-related operations like
 * password hashing and JSON Web Token (JWT) management.
 */
export const authService = {
  /**
   * Hashes a plain-text password using bcrypt.
   * @param password The plain-text password.
   * @returns A promise that resolves to the hashed password.
   */
  hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
  },

  /**
   * Compares a plain-text password with a hash.
   * @param password The plain-text password to check.
   * @param hash The hash to compare against.
   * @returns A promise that resolves to true if the password matches the hash, false otherwise.
   */
  comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  },

  /**
   * Generates a short-lived access token.
   * @param payload The data to include in the token (e.g., { userId: '...' }).
   * @returns The signed JWT access token.
   */
  generateAccessToken(payload: { userId: string; role: string }): string {
    return jwt.sign(payload, ACCESS_TOKEN_SECRET, {expiresIn: ACCESS_TOKEN_EXPIRATION});
  },

  /**
   * Generates a long-lived refresh token.
   * @param payload The data to include in the token (e.g., { userId: '...' }).
   * @returns The signed JWT refresh token.
   */
  generateRefreshToken(payload: { userId: string }): string {
    return jwt.sign(payload, REFRESH_TOKEN_SECRET, {expiresIn: REFRESH_TOKEN_EXPIRATION});
  },

  /**
   * Verifies an access token.
   * @param token The access token to verify.
   * @returns The decoded token payload if valid, otherwise null.
   */
  verifyAccessToken<T>(token: string): T | null {
    try {
      return jwt.verify(token, ACCESS_TOKEN_SECRET) as T;
    } catch (error) {
      return null;
    }
  },

  /**
   * Verifies a refresh token.
   * @param token The refresh token to verify.
   * @returns The decoded token payload if valid, otherwise null.
   */
  verifyRefreshToken<T>(token: string): T | null {
    try {
      return jwt.verify(token, REFRESH_TOKEN_SECRET) as T;
    } catch (error) {
      return null;
    }
  }
};
