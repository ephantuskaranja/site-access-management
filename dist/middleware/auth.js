"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireOwnershipOrAdmin = exports.optionalAuth = exports.requireAnyUser = exports.requireReceptionistOnly = exports.requireReceptionist = exports.requireGuard = exports.requireAdmin = exports.authorize = exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = require("../entities/User");
const database_1 = __importDefault(require("../config/database"));
const types_1 = require("../types");
const config_1 = __importDefault(require("../config"));
const errorHandler_1 = require("./errorHandler");
const authenticate = async (req, res, next) => {
    try {
        let token;
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }
        if (!token) {
            const response = {
                success: false,
                message: 'Access denied. No token provided.',
            };
            res.status(401).json(response);
            return;
        }
        try {
            const decoded = jsonwebtoken_1.default.verify(token, config_1.default.jwt.secret);
            const ds = database_1.default.getDataSource();
            if (!ds)
                throw new Error('Database not connected');
            const userRepository = ds.getRepository(User_1.User);
            const user = await userRepository.findOne({
                where: { id: decoded.userId },
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    phone: true,
                    role: true,
                    status: true,
                    employeeId: true,
                    department: true,
                    loginAttempts: true,
                    createdAt: true,
                    updatedAt: true
                }
            });
            if (!user) {
                throw new errorHandler_1.AppError('User no longer exists', 401);
            }
            if (user.status !== 'active') {
                throw new errorHandler_1.AppError('User account is inactive', 401);
            }
            req.user = user;
            req.userId = user.id;
            next();
        }
        catch (jwtError) {
            const response = {
                success: false,
                message: 'Invalid token',
            };
            res.status(401).json(response);
            return;
        }
    }
    catch (error) {
        next(error);
    }
};
exports.authenticate = authenticate;
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            const response = {
                success: false,
                message: 'Authentication required',
            };
            res.status(401).json(response);
            return;
        }
        if (!roles.includes(req.user.role)) {
            const response = {
                success: false,
                message: 'Insufficient permissions',
            };
            res.status(403).json(response);
            return;
        }
        next();
    };
};
exports.authorize = authorize;
exports.requireAdmin = (0, exports.authorize)(types_1.UserRole.ADMIN);
exports.requireGuard = (0, exports.authorize)(types_1.UserRole.ADMIN, types_1.UserRole.SECURITY_GUARD);
exports.requireReceptionist = (0, exports.authorize)(types_1.UserRole.ADMIN, types_1.UserRole.SECURITY_GUARD, types_1.UserRole.RECEPTIONIST);
exports.requireReceptionistOnly = (0, exports.authorize)(types_1.UserRole.RECEPTIONIST);
exports.requireAnyUser = (0, exports.authorize)(types_1.UserRole.ADMIN, types_1.UserRole.SECURITY_GUARD, types_1.UserRole.RECEPTIONIST, types_1.UserRole.VISITOR);
const optionalAuth = async (req, _res, next) => {
    try {
        let token;
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }
        if (token) {
            try {
                const decoded = jsonwebtoken_1.default.verify(token, config_1.default.jwt.secret);
                const ds = database_1.default.getDataSource();
                if (!ds)
                    throw new Error('Database not connected');
                const userRepository = ds.getRepository(User_1.User);
                const user = await userRepository.findOne({
                    where: { id: decoded.userId },
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        phone: true,
                        role: true,
                        status: true,
                        employeeId: true,
                        department: true,
                        loginAttempts: true,
                        createdAt: true,
                        updatedAt: true
                    }
                });
                if (user && user.status === 'active') {
                    req.user = user;
                    req.userId = user.id;
                }
            }
            catch (jwtError) {
            }
        }
        next();
    }
    catch (error) {
        next(error);
    }
};
exports.optionalAuth = optionalAuth;
const requireOwnershipOrAdmin = (resourceUserIdField = 'userId') => {
    return (req, res, next) => {
        if (!req.user) {
            const response = {
                success: false,
                message: 'Authentication required',
            };
            res.status(401).json(response);
            return;
        }
        const isAdmin = req.user.role === types_1.UserRole.ADMIN;
        const isOwner = req.params[resourceUserIdField] === req.userId;
        if (!isAdmin && !isOwner) {
            const response = {
                success: false,
                message: 'Access denied. You can only access your own resources.',
            };
            res.status(403).json(response);
            return;
        }
        next();
    };
};
exports.requireOwnershipOrAdmin = requireOwnershipOrAdmin;
//# sourceMappingURL=auth.js.map