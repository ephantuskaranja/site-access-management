import { Request, Response, NextFunction } from 'express';
import { IUser } from '../types';
import { UserRole } from '../types';
export interface AuthRequest extends Request {
    user?: IUser;
    userId?: string;
}
export declare const authenticate: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const authorize: (...roles: UserRole[]) => (req: AuthRequest, res: Response, next: NextFunction) => void;
export declare const requireAdmin: (req: AuthRequest, res: Response, next: NextFunction) => void;
export declare const requireGuard: (req: AuthRequest, res: Response, next: NextFunction) => void;
export declare const requireReceptionist: (req: AuthRequest, res: Response, next: NextFunction) => void;
export declare const requireReceptionistOnly: (req: AuthRequest, res: Response, next: NextFunction) => void;
export declare const requireAnyUser: (req: AuthRequest, res: Response, next: NextFunction) => void;
export declare const optionalAuth: (req: AuthRequest, _res: Response, next: NextFunction) => Promise<void>;
export declare const requireOwnershipOrAdmin: (resourceUserIdField?: string) => (req: AuthRequest, res: Response, next: NextFunction) => void;
