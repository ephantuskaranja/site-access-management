import { Request, Response } from 'express';
export declare class AuthController {
    static register: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static login: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static refreshToken: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static getProfile: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static updateProfile: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static changePassword: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static logout: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static getAllUsers: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static getUserById: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static updateUserById: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static resetUserPassword: (req: Request, res: Response, next: import("express").NextFunction) => void;
}
