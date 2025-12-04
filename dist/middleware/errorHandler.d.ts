import { Request, Response, NextFunction } from 'express';
export declare class AppError extends Error {
    statusCode: number;
    isOperational: boolean;
    constructor(message: string, statusCode: number, isOperational?: boolean);
}
export declare const errorHandler: (err: Error, req: Request, res: Response, _next: NextFunction) => void;
export declare const notFound: (req: Request, res: Response, _next: NextFunction) => void;
export declare const asyncHandler: (fn: Function) => (req: Request, res: Response, next: NextFunction) => void;
