"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const reportsController_1 = require("../controllers/reportsController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const reportsController = new reportsController_1.ReportsController();
router.use(auth_1.authenticate);
router.get('/visitors', auth_1.requireReceptionistOnly, reportsController.getVisitorReports.bind(reportsController));
router.get('/vehicle-movements', auth_1.requireGuard, reportsController.getVehicleMovementReports.bind(reportsController));
router.get('/access-logs', auth_1.requireGuard, reportsController.getAccessLogReports.bind(reportsController));
router.get('/user-activity', auth_1.requireGuard, reportsController.getUserActivityReports.bind(reportsController));
router.get('/security', auth_1.requireGuard, reportsController.getSecurityReports.bind(reportsController));
exports.default = router;
//# sourceMappingURL=reports.js.map