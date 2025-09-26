import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import config from '../config';
import { AuthTokenPayload, IUser } from '../types';

export class AuthService {
  /**
   * Generate JWT access token
   */
  static generateAccessToken(user: IUser): string {
    const payload: AuthTokenPayload = {
      userId: user.id as string,
      role: user.role,
      email: user.email,
    };

    return jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn,
      issuer: 'site-access-system',
      audience: 'site-users',
    } as jwt.SignOptions);
  }

  /**
   * Generate JWT refresh token
   */
  static generateRefreshToken(user: IUser): string {
    const payload: AuthTokenPayload = {
      userId: user.id as string,
      role: user.role,
      email: user.email,
    };

    return jwt.sign(payload, config.jwt.refreshSecret, {
      expiresIn: config.jwt.refreshExpiresIn,
      issuer: 'site-access-system',
      audience: 'site-users',
    } as jwt.SignOptions);
  }

  /**
   * Verify access token
   */
  static verifyAccessToken(token: string): AuthTokenPayload {
    return jwt.verify(token, config.jwt.secret) as AuthTokenPayload;
  }

  /**
   * Verify refresh token
   */
  static verifyRefreshToken(token: string): AuthTokenPayload {
    return jwt.verify(token, config.jwt.refreshSecret) as AuthTokenPayload;
  }

  /**
   * Generic token verification
   */
  static verifyToken(token: string, secret: string): AuthTokenPayload {
    return jwt.verify(token, secret) as AuthTokenPayload;
  }

  /**
   * Generate random token for password reset, email verification, etc.
   */
  static generateRandomToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Generate secure API key
   */
  static generateApiKey(): string {
    return crypto.randomBytes(64).toString('base64');
  }

  /**
   * Hash token for secure storage
   */
  static hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * Generate tokens for user authentication
   */
  static generateAuthTokens(user: IUser) {
    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);

    return {
      accessToken,
      refreshToken,
    };
  }

  /**
   * Extract token from Authorization header
   */
  static extractTokenFromHeader(authHeader?: string): string | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.split(' ')[1];
  }

  /**
   * Check if token is expired
   */
  static isTokenExpired(token: string): boolean {
    try {
      const decoded = jwt.decode(token) as any;
      if (!decoded || !decoded.exp) {
        return true;
      }
      
      const currentTime = Math.floor(Date.now() / 1000);
      return decoded.exp < currentTime;
    } catch {
      return true;
    }
  }

  /**
   * Get token expiration time
   */
  static getTokenExpiration(token: string): Date | null {
    try {
      const decoded = jwt.decode(token) as any;
      if (!decoded || !decoded.exp) {
        return null;
      }
      
      return new Date(decoded.exp * 1000);
    } catch {
      return null;
    }
  }

  /**
   * Validate password strength
   */
  static validatePasswordStrength(password: string): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }

    if (password.length > 128) {
      errors.push('Password must not exceed 128 characters');
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Generate secure session ID
   */
  static generateSessionId(): string {
    return crypto.randomUUID();
  }

  /**
   * Create rate limiting key
   */
  static createRateLimitKey(identifier: string, action: string): string {
    return `rate_limit:${action}:${identifier}`;
  }
}