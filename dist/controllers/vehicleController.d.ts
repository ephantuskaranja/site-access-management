import { Request, Response } from 'express';
export declare class VehicleController {
    static getAllVehicles: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static getVehicle: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static createVehicle: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static updateVehicle: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static deleteVehicle: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static getVehicleStats: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static getActiveVehicles: (req: Request, res: Response, next: import("express").NextFunction) => void;
}
