import { Router } from 'express';
import { ReportsController } from '../controllers/reportsController';
import { authenticate, requireActiveSiteContext, requireGuard, authorize } from '../middleware/auth';
import { UserRole } from '../types';

const router = Router();
const reportsController = new ReportsController();

// All report routes require authentication
router.use(authenticate);
router.use(requireActiveSiteContext);

// Visitor Reports - accessible by receptionist and admin/guard
router.get(
	'/visitors',
	authorize(UserRole.ADMIN, UserRole.SECURITY_GUARD, UserRole.RECEPTIONIST, UserRole.SECURITY_MANAGER),
	reportsController.getVisitorReports.bind(reportsController),
);

// Other Reports - accessible by admin and security guard only
router.get(
	'/vehicle-movements',
	authorize(UserRole.ADMIN, UserRole.SECURITY_GUARD, UserRole.LOGISTICS_MANAGER, UserRole.SECURITY_MANAGER),
	reportsController.getVehicleMovementReports.bind(reportsController),
);
router.get('/access-logs', requireGuard, reportsController.getAccessLogReports.bind(reportsController));
router.get('/user-activity', requireGuard, reportsController.getUserActivityReports.bind(reportsController));
router.get('/security', requireGuard, reportsController.getSecurityReports.bind(reportsController));

export default router;