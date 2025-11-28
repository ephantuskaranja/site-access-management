import { Router } from 'express';
import { ReportsController } from '../controllers/reportsController';
import { authenticate, requireReceptionist } from '../middleware/auth';

const router = Router();
const reportsController = new ReportsController();

// All report routes require authentication and receptionist+ permissions
router.use(authenticate);
router.use(requireReceptionist);

// Visitor Reports
router.get('/visitors', reportsController.getVisitorReports.bind(reportsController));

// Vehicle Movement Reports
router.get('/vehicle-movements', reportsController.getVehicleMovementReports.bind(reportsController));

// Access Log Reports
router.get('/access-logs', reportsController.getAccessLogReports.bind(reportsController));

// User Activity Reports
router.get('/user-activity', reportsController.getUserActivityReports.bind(reportsController));

// Security Reports
router.get('/security', reportsController.getSecurityReports.bind(reportsController));

export default router;