import { Router } from 'express';
import { ReportsController } from '../controllers/reportsController';
import { authenticate, requireGuard, requireReceptionistOnly } from '../middleware/auth';

const router = Router();
const reportsController = new ReportsController();

// All report routes require authentication
router.use(authenticate);

// Visitor Reports - accessible by receptionists
router.get('/visitors', requireReceptionistOnly, reportsController.getVisitorReports.bind(reportsController));

// Other Reports - accessible by admin and security guard only
router.get('/vehicle-movements', requireGuard, reportsController.getVehicleMovementReports.bind(reportsController));
router.get('/access-logs', requireGuard, reportsController.getAccessLogReports.bind(reportsController));
router.get('/user-activity', requireGuard, reportsController.getUserActivityReports.bind(reportsController));
router.get('/security', requireGuard, reportsController.getSecurityReports.bind(reportsController));

export default router;