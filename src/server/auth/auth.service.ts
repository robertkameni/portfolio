import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { ACCESS_TOKEN_EXPIRES_IN } from './access-token-expiry';

const BCRYPT_SALT_ROUNDS = 12;

function getRequiredEnv(name: 'ACCESS_TOKEN_SECRET' | 'REFRESH_TOKEN_SECRET'): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Server configuration error: Missing ${name}`);
  }
  return value;
}

function getJwtSecrets(): { accessTokenSecret: string; refreshTokenSecret: string } {
  return {
    accessTokenSecret: getRequiredEnv('ACCESS_TOKEN_SECRET'),
    refreshTokenSecret: getRequiredEnv('REFRESH_TOKEN_SECRET'),
  };
}

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
    const { accessTokenSecret } = getJwtSecrets();
    return jwt.sign(payload, accessTokenSecret, { algorithm: 'HS256', expiresIn: ACCESS_TOKEN_EXPIRES_IN });
  },

  /**
   * Generates a long-lived refresh token.
   * @param payload The data to include in the token (e.g., { userId: '...' }).
   * @returns The signed JWT refresh token.
   */
  generateRefreshToken(payload: { userId: string }): string {
    const { refreshTokenSecret } = getJwtSecrets();
    return jwt.sign(payload, refreshTokenSecret, { algorithm: 'HS256', expiresIn: REFRESH_TOKEN_EXPIRATION });
  },

  /**
   * Verifies an access token.
   * @param token The access token to verify.
   * @returns The decoded token payload if valid, otherwise null.
   */
  verifyAccessToken<T>(token: string): T | null {
    try {
      const { accessTokenSecret } = getJwtSecrets();
      return jwt.verify(token, accessTokenSecret, { algorithms: ['HS256'] }) as T;
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
      const { refreshTokenSecret } = getJwtSecrets();
      return jwt.verify(token, refreshTokenSecret, { algorithms: ['HS256'] }) as T;
    } catch (error) {
      return null;
    }
  },
};
