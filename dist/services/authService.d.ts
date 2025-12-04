import { AuthTokenPayload, IUser } from '../types';
export declare class AuthService {
    static generateAccessToken(user: IUser): string;
    static generateRefreshToken(user: IUser): string;
    static verifyAccessToken(token: string): AuthTokenPayload;
    static verifyRefreshToken(token: string): AuthTokenPayload;
    static verifyToken(token: string, secret: string): AuthTokenPayload;
    static generateRandomToken(): string;
    static generateApiKey(): string;
    static hashToken(token: string): string;
    static generateAuthTokens(user: IUser): {
        accessToken: string;
        refreshToken: string;
    };
    static extractTokenFromHeader(authHeader?: string): string | null;
    static isTokenExpired(token: string): boolean;
    static getTokenExpiration(token: string): Date | null;
    static validatePasswordStrength(password: string): {
        isValid: boolean;
        errors: string[];
    };
    static generateSessionId(): string;
    static createRateLimitKey(identifier: string, action: string): string;
}
