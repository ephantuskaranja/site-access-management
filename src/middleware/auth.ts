import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { User } from '../entities/User';
import { IUser } from '../types';
import dataSource from '../config/database';
import { AuthTokenPayload, UserRole, ApiResponse } from '../types';
import config from '../config';
import { AppError } from './errorHandler';

export interface AuthRequest extends Request {
  user?: IUser;
  userId?: string;
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    let token: string | undefined;

    // Check for token in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      const response: ApiResponse = {
        success: false,
        message: 'Access denied. No token provided.',
      };
      res.status(401).json(response);
      return;
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, config.jwt.secret) as AuthTokenPayload;
      
      // Get user from database
      const ds = dataSource.getDataSource();
      if (!ds) throw new Error('Database not connected');
      
      const userRepository = ds.getRepository(User);
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
          lastActivity: true,
          createdAt: true,
          updatedAt: true
        }
      });
      
      if (!user) {
        throw new AppError('User no longer exists', 401);
      }

      // Check if user is active
      if (user.status !== 'active') {
        throw new AppError('User account is inactive', 401);
      }

      // Attach user to request
      req.user = user;
      req.userId = user.id;

      // Update lastActivity with throttle (reduce DB writes)
      try {
        const now = Date.now();
        const last = user.lastActivity ? user.lastActivity.getTime() : 0;
        if (!last || (now - last) > 60 * 1000) { // 60s throttle
          user.lastActivity = new Date(now);
          await userRepository.save(user);
        }
      } catch (_) {
        // Best-effort; ignore failures
      }
      
      next();
    } catch (jwtError) {
      const response: ApiResponse = {
        success: false,
        message: 'Invalid token',
      };
      res.status(401).json(response);
      return;
    }
  } catch (error) {
    next(error);
  }
};

export const authorize = (...roles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      const response: ApiResponse = {
        success: false,
        message: 'Authentication required',
      };
      res.status(401).json(response);
      return;
    }

    if (!roles.includes(req.user.role)) {
      const response: ApiResponse = {
        success: false,
        message: 'Insufficient permissions',
      };
      res.status(403).json(response);
      return;
    }

    next();
  };
};

// Specific authorization helpers
export const requireAdmin = authorize(UserRole.ADMIN);

export const requireGuard = authorize(UserRole.ADMIN, UserRole.SECURITY_GUARD, UserRole.LOGISTICS_MANAGER);

export const requireReceptionist = authorize(UserRole.ADMIN, UserRole.SECURITY_GUARD, UserRole.RECEPTIONIST);

export const requireReceptionistOnly = authorize(UserRole.RECEPTIONIST);

export const requireAnyUser = authorize(
  UserRole.ADMIN,
  UserRole.SECURITY_GUARD,
  UserRole.RECEPTIONIST,
  UserRole.LOGISTICS_MANAGER,
  UserRole.VISITOR,
);

// Optional authentication (for public endpoints that benefit from user context)
export const optionalAuth = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    let token: string | undefined;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      try {
        const decoded = jwt.verify(token, config.jwt.secret) as AuthTokenPayload;
        // Get user from database for optional auth
        const ds = dataSource.getDataSource();
        if (!ds) throw new Error('Database not connected');
        
        const userRepository = ds.getRepository(User);
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
      } catch (jwtError) {
        // Ignore invalid tokens in optional auth
      }
    }

    next();
  } catch (error) {
    next(error);
  }
};

// Check if user owns resource or has admin privileges
export const requireOwnershipOrAdmin = (
  resourceUserIdField: string = 'userId',
) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      const response: ApiResponse = {
        success: false,
        message: 'Authentication required',
      };
      res.status(401).json(response);
      return;
    }

    const isAdmin = req.user.role === UserRole.ADMIN;
    const isOwner = req.params[resourceUserIdField] === req.userId;

    if (!isAdmin && !isOwner) {
      const response: ApiResponse = {
        success: false,
        message: 'Access denied. You can only access your own resources.',
      };
      res.status(403).json(response);
      return;
    }

    next();
  };
};