"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const visitorController_1 = require("../controllers/visitorController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use((req, res, next) => {
    if (req.path === '/approve-email') {
        return next();
    }
    return (0, auth_1.authenticate)(req, res, next);
});
router.get('/approve-email', visitorController_1.VisitorController.handleEmailApproval);
router.get('/ready-for-checkin', auth_1.requireGuard, visitorController_1.VisitorController.getApprovedVisitors);
router.get('/', visitorController_1.VisitorController.getAllVisitors);
router.get('/:id', visitorController_1.VisitorController.getVisitorById);
router.post('/', auth_1.requireReceptionist, visitorController_1.VisitorController.createVisitor);
router.put('/:id', auth_1.requireGuard, visitorController_1.VisitorController.updateVisitor);
router.post('/:id/approve', auth_1.requireGuard, visitorController_1.VisitorController.approveVisitor);
router.post('/:id/reject', auth_1.requireGuard, visitorController_1.VisitorController.rejectVisitor);
router.post('/:id/checkin', auth_1.requireGuard, visitorController_1.VisitorController.checkInVisitor);
router.post('/:id/checkout', auth_1.requireGuard, visitorController_1.VisitorController.checkOutVisitor);
router.get('/:id/qrcode', visitorController_1.VisitorController.getVisitorQRCode);
router.delete('/:id', auth_1.requireAdmin, visitorController_1.VisitorController.deleteVisitor);
exports.default = router;
//# sourceMappingURL=visitors.js.map