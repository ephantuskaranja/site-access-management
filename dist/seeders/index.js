"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const database_1 = __importDefault(require("../config/database"));
const User_1 = require("../entities/User");
const CompanySettings_1 = require("../entities/CompanySettings");
const types_1 = require("../types");
const logger_1 = __importDefault(require("../config/logger"));
const employees_1 = require("./employees");
async function seedDatabase() {
    try {
        await database_1.default.connect();
        const ds = database_1.default.getDataSource();
        if (!ds)
            throw new Error('Database connection failed');
        logger_1.default.info('Database connection established for seeding');
        if (process.env.NODE_ENV !== 'production') {
            await ds.query('DELETE FROM vehicle_movements');
            await ds.query('DELETE FROM alerts');
            await ds.query('DELETE FROM access_logs');
            await ds.query('DELETE FROM visitors');
            await ds.query('DELETE FROM company_settings');
            await ds.query('DELETE FROM users');
            logger_1.default.info('Cleared existing data (ordered for FKs)');
        }
        const userRepository = ds.getRepository(User_1.User);
        const settingsRepository = ds.getRepository(CompanySettings_1.CompanySettings);
        await (0, employees_1.seedEmployees)();
        const adminUser = new User_1.User();
        adminUser.firstName = 'System';
        adminUser.lastName = 'Administrator';
        adminUser.email = 'admin@company.com';
        adminUser.phone = '+1234567890';
        adminUser.role = types_1.UserRole.ADMIN;
        adminUser.status = types_1.UserStatus.ACTIVE;
        adminUser.password = 'Admin@123';
        adminUser.employeeId = 'ADM001';
        adminUser.department = 'IT';
        const savedAdmin = await userRepository.save(adminUser);
        logger_1.default.info(`Created admin user: ${savedAdmin.email}`);
        const guardUser = new User_1.User();
        guardUser.firstName = 'John';
        guardUser.lastName = 'Guard';
        guardUser.email = 'guard@company.com';
        guardUser.phone = '+1234567891';
        guardUser.role = types_1.UserRole.SECURITY_GUARD;
        guardUser.status = types_1.UserStatus.ACTIVE;
        guardUser.password = 'Guard@123';
        guardUser.employeeId = 'GRD001';
        guardUser.department = 'Security';
        const savedGuard = await userRepository.save(guardUser);
        logger_1.default.info(`Created security guard: ${savedGuard.email}`);
        const receptionistUser = new User_1.User();
        receptionistUser.firstName = 'Jane';
        receptionistUser.lastName = 'Receptionist';
        receptionistUser.email = 'receptionist@company.com';
        receptionistUser.phone = '+1234567892';
        receptionistUser.role = types_1.UserRole.RECEPTIONIST;
        receptionistUser.status = types_1.UserStatus.ACTIVE;
        receptionistUser.password = 'Receptionist@123';
        receptionistUser.employeeId = 'REC001';
        receptionistUser.department = 'Reception';
        const savedReceptionist = await userRepository.save(receptionistUser);
        logger_1.default.info(`Created receptionist: ${savedReceptionist.email}`);
        const settings = new CompanySettings_1.CompanySettings();
        settings.companyName = 'farmers choice ltd';
        settings.address = 'Kahawa West, Nairobi';
        settings.phone = '+1234567890';
        settings.email = 'info@company.com';
        settings.setWorkingHours({
            start: '08:00',
            end: '18:00',
        });
        settings.maxVisitorDuration = 480;
        settings.requirePreApproval = true;
        settings.allowMultipleEntries = false;
        settings.enableQRCode = true;
        settings.enableEmailNotifications = true;
        settings.emergencyContact = '+1234567999';
        settings.updatedById = savedAdmin.id;
        await settingsRepository.save(settings);
        logger_1.default.info('Created company settings');
        logger_1.default.info('Database seeding completed successfully!');
        logger_1.default.info('Default login credentials:');
        logger_1.default.info('Admin: admin@company.com / Admin@123');
        logger_1.default.info('Guard: guard@company.com / Guard@123');
        logger_1.default.info('Receptionist: receptionist@company.com / Receptionist@123');
    }
    catch (error) {
        logger_1.default.error('Error seeding database:', error);
        throw error;
    }
    finally {
        if (database_1.default.isConnected()) {
            await database_1.default.disconnect();
        }
    }
}
if (require.main === module) {
    seedDatabase()
        .then(() => {
        console.log('Seeding completed successfully!');
        process.exit(0);
    })
        .catch((error) => {
        console.error('Seeding failed:', error);
        process.exit(1);
    });
}
exports.default = seedDatabase;
//# sourceMappingURL=index.js.map