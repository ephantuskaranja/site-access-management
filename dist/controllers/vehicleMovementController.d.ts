import { Request, Response } from 'express';
export declare class VehicleMovementController {
    static getAllMovements: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static getMovement: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static recordMovement: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static updateMovement: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static deleteMovement: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static getMovementStats: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static getVehicleMovements: (req: Request, res: Response, next: import("express").NextFunction) => void;
}
