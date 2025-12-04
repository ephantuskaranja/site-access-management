"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const vehicleMovementController_1 = require("../controllers/vehicleMovementController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
router.get('/', auth_1.requireGuard, vehicleMovementController_1.VehicleMovementController.getAllMovements);
router.get('/stats', auth_1.requireGuard, vehicleMovementController_1.VehicleMovementController.getMovementStats);
router.get('/:id', auth_1.requireGuard, vehicleMovementController_1.VehicleMovementController.getMovement);
router.post('/', auth_1.requireGuard, vehicleMovementController_1.VehicleMovementController.recordMovement);
router.put('/:id', auth_1.requireAdmin, vehicleMovementController_1.VehicleMovementController.updateMovement);
router.delete('/:id', auth_1.requireAdmin, vehicleMovementController_1.VehicleMovementController.deleteMovement);
exports.default = router;
//# sourceMappingURL=vehicleMovements.js.map