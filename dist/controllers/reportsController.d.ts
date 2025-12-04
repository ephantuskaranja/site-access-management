import { Request, Response } from 'express';
export declare class ReportsController {
    getVisitorReports(req: Request, res: Response): Promise<void>;
    getVehicleMovementReports(req: Request, res: Response): Promise<void>;
    getAccessLogReports(req: Request, res: Response): Promise<void>;
    getUserActivityReports(req: Request, res: Response): Promise<void>;
    getSecurityReports(req: Request, res: Response): Promise<void>;
    private generateDailyVisitorReport;
    private generateWeeklyVisitorReport;
    private generateMonthlyVisitorReport;
    private generateGeneralVisitorReport;
    private generateVehicleMovementReport;
    private generateAccessLogReport;
    private generateUserActivityReport;
    private generateSecurityReport;
}
