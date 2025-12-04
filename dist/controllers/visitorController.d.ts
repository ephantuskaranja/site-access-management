import { Request, Response } from 'express';
export declare class VisitorController {
    static getAllVisitors: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static getApprovedVisitors: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static getVisitorById: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static createVisitor: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static handleEmailApproval: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static updateVisitor: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static approveVisitor: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static rejectVisitor: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static checkInVisitor: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static checkOutVisitor: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static getVisitorQRCode: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static deleteVisitor: (req: Request, res: Response, next: import("express").NextFunction) => void;
}
