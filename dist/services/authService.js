"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = __importDefault(require("crypto"));
const config_1 = __importDefault(require("../config"));
class AuthService {
    static generateAccessToken(user) {
        const payload = {
            userId: user.id,
            role: user.role,
            email: user.email,
        };
        return jsonwebtoken_1.default.sign(payload, config_1.default.jwt.secret, {
            expiresIn: config_1.default.jwt.expiresIn,
            issuer: 'site-access-system',
            audience: 'site-users',
        });
    }
    static generateRefreshToken(user) {
        const payload = {
            userId: user.id,
            role: user.role,
            email: user.email,
        };
        return jsonwebtoken_1.default.sign(payload, config_1.default.jwt.refreshSecret, {
            expiresIn: config_1.default.jwt.refreshExpiresIn,
            issuer: 'site-access-system',
            audience: 'site-users',
        });
    }
    static verifyAccessToken(token) {
        return jsonwebtoken_1.default.verify(token, config_1.default.jwt.secret);
    }
    static verifyRefreshToken(token) {
        return jsonwebtoken_1.default.verify(token, config_1.default.jwt.refreshSecret);
    }
    static verifyToken(token, secret) {
        return jsonwebtoken_1.default.verify(token, secret);
    }
    static generateRandomToken() {
        return crypto_1.default.randomBytes(32).toString('hex');
    }
    static generateApiKey() {
        return crypto_1.default.randomBytes(64).toString('base64');
    }
    static hashToken(token) {
        return crypto_1.default.createHash('sha256').update(token).digest('hex');
    }
    static generateAuthTokens(user) {
        const accessToken = this.generateAccessToken(user);
        const refreshToken = this.generateRefreshToken(user);
        return {
            accessToken,
            refreshToken,
        };
    }
    static extractTokenFromHeader(authHeader) {
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return null;
        }
        return authHeader.split(' ')[1];
    }
    static isTokenExpired(token) {
        try {
            const decoded = jsonwebtoken_1.default.decode(token);
            if (!decoded || !decoded.exp) {
                return true;
            }
            const currentTime = Math.floor(Date.now() / 1000);
            return decoded.exp < currentTime;
        }
        catch {
            return true;
        }
    }
    static getTokenExpiration(token) {
        try {
            const decoded = jsonwebtoken_1.default.decode(token);
            if (!decoded || !decoded.exp) {
                return null;
            }
            return new Date(decoded.exp * 1000);
        }
        catch {
            return null;
        }
    }
    static validatePasswordStrength(password) {
        const errors = [];
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
    static generateSessionId() {
        return crypto_1.default.randomUUID();
    }
    static createRateLimitKey(identifier, action) {
        return `rate_limit:${action}:${identifier}`;
    }
}
exports.AuthService = AuthService;
//# sourceMappingURL=authService.js.map