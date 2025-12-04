"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const vehicleController_1 = require("../controllers/vehicleController");
const vehicleMovementController_1 = require("../controllers/vehicleMovementController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
router.get('/', auth_1.requireGuard, vehicleController_1.VehicleController.getAllVehicles);
router.get('/active', auth_1.requireGuard, vehicleController_1.VehicleController.getActiveVehicles);
router.get('/stats', auth_1.requireGuard, vehicleController_1.VehicleController.getVehicleStats);
router.get('/:id', auth_1.requireGuard, vehicleController_1.VehicleController.getVehicle);
router.post('/', auth_1.requireAdmin, vehicleController_1.VehicleController.createVehicle);
router.put('/:id', auth_1.requireAdmin, vehicleController_1.VehicleController.updateVehicle);
router.get('/:vehicleId/movements', auth_1.requireGuard, vehicleMovementController_1.VehicleMovementController.getVehicleMovements);
router.delete('/:id', auth_1.requireAdmin, vehicleController_1.VehicleController.deleteVehicle);
exports.default = router;
//# sourceMappingURL=vehicles.js.map