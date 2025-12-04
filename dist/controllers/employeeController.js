"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmployeeController = void 0;
const Employee_1 = require("../entities/Employee");
const errorHandler_1 = require("../middleware/errorHandler");
const database_1 = __importDefault(require("../config/database"));
const logger_1 = __importDefault(require("../config/logger"));
class EmployeeController {
}
exports.EmployeeController = EmployeeController;
_a = EmployeeController;
EmployeeController.getAllEmployees = (0, errorHandler_1.asyncHandler)(async (_req, res) => {
    const dataSource = database_1.default.getDataSource();
    if (!dataSource) {
        const response = {
            success: false,
            message: 'Database connection not available',
        };
        res.status(500).json(response);
        return;
    }
    const employeeRepository = dataSource.getRepository(Employee_1.Employee);
    try {
        const employees = await employeeRepository.find({
            where: { isActive: true },
            order: { firstName: 'ASC', lastName: 'ASC' },
            select: ['id', 'employeeId', 'firstName', 'lastName', 'email', 'department', 'position']
        });
        const response = {
            success: true,
            message: 'Employees retrieved successfully',
            data: { employees },
        };
        res.status(200).json(response);
    }
    catch (error) {
        logger_1.default.error('Error fetching employees:', error);
        const response = {
            success: false,
            message: 'Error fetching employees',
        };
        res.status(500).json(response);
    }
});
EmployeeController.createEmployee = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const employeeData = req.body;
    const dataSource = database_1.default.getDataSource();
    if (!dataSource) {
        const response = {
            success: false,
            message: 'Database connection not available',
        };
        res.status(500).json(response);
        return;
    }
    const employeeRepository = dataSource.getRepository(Employee_1.Employee);
    try {
        const existingEmployee = await employeeRepository.findOne({
            where: [
                { email: employeeData.email },
                { employeeId: employeeData.employeeId }
            ]
        });
        if (existingEmployee) {
            const response = {
                success: false,
                message: 'Employee with this email or employee ID already exists',
            };
            res.status(400).json(response);
            return;
        }
        const employee = employeeRepository.create(employeeData);
        const savedEmployee = await employeeRepository.save(employee);
        const employeeEntity = Array.isArray(savedEmployee) ? savedEmployee[0] : savedEmployee;
        logger_1.default.info(`New employee created: ${employeeEntity.fullName} (${employeeEntity.employeeId})`);
        const response = {
            success: true,
            message: 'Employee created successfully',
            data: { employee: employeeEntity },
        };
        res.status(201).json(response);
    }
    catch (error) {
        logger_1.default.error('Error creating employee:', error);
        const response = {
            success: false,
            message: 'Error creating employee',
        };
        res.status(500).json(response);
    }
});
//# sourceMappingURL=employeeController.js.map