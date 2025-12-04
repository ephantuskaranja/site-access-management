import { Request, Response, NextFunction } from 'express';
import { ObjectSchema } from 'joi';
export declare const validate: (schema: ObjectSchema) => (req: Request, res: Response, next: NextFunction) => void;
export declare const validateQuery: (schema: ObjectSchema) => (req: Request, res: Response, next: NextFunction) => void;
export declare const validateParams: (schema: ObjectSchema) => (req: Request, res: Response, next: NextFunction) => void;
