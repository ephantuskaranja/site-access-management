"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedEmployees = seedEmployees;
const data_source_1 = require("../config/data-source");
const Employee_1 = require("../entities/Employee");
const logger_1 = __importDefault(require("../config/logger"));
async function seedEmployees() {
    try {
        if (!data_source_1.AppDataSource.isInitialized) {
            await data_source_1.AppDataSource.initialize();
        }
        const employeeRepository = data_source_1.AppDataSource.getRepository(Employee_1.Employee);
        const existingCount = await employeeRepository.count();
        if (existingCount > 0) {
            logger_1.default.info('Employees already exist, skipping seeding');
            return;
        }
        const employees = [
            {
                employeeId: 'FCL001',
                firstName: 'Ephantus',
                lastName: 'Karanja',
                email: 'ekaranja@farmerschoice.co.ke',
                phone: '+254724401515',
                department: 'IT',
                position: 'Software Developer'
            },
            {
                employeeId: 'FCL002',
                firstName: 'Eric',
                lastName: 'Muga',
                email: 'emuga@farmerschoice.co.ke',
                phone: '+254701234568',
                department: 'HR',
                position: 'HR Manager'
            }
        ];
        for (const employeeData of employees) {
            const employee = employeeRepository.create(employeeData);
            await employeeRepository.save(employee);
            logger_1.default.info(`Created employee: ${employee.fullName} (${employee.employeeId})`);
        }
        logger_1.default.info('✅ Employee seeding completed successfully');
    }
    catch (error) {
        logger_1.default.error('❌ Error seeding employees:', error);
        throw error;
    }
}
if (require.main === module) {
    seedEmployees()
        .then(() => {
        console.log('Employee seeding completed');
        process.exit(0);
    })
        .catch((error) => {
        console.error('Employee seeding failed:', error);
        process.exit(1);
    });
}
//# sourceMappingURL=employees.js.map