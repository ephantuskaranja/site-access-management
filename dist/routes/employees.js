"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const employeeController_1 = require("../controllers/employeeController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
router.get('/', auth_1.requireGuard, employeeController_1.EmployeeController.getAllEmployees);
router.post('/', auth_1.requireGuard, employeeController_1.EmployeeController.createEmployee);
exports.default = router;
//# sourceMappingURL=employees.js.map