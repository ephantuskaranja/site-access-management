import 'reflect-metadata';
import dataSource from '../config/database';
import { User } from '../entities/User';
import { CompanySettings } from '../entities/CompanySettings';
import { UserRole, UserStatus } from '../types';
import logger from '../config/logger';
import { seedEmployees } from './employees';

async function seedDatabase(): Promise<void> {
  try {
    // Get database connection
    await dataSource.connect();
    const ds = dataSource.getDataSource();
    if (!ds) throw new Error('Database connection failed');
    
    logger.info('Database connection established for seeding');

    // Clear existing data (be careful in production!)
    if (process.env.NODE_ENV !== 'production') {
      // Clear data respecting foreign key dependencies
      await ds.query('DELETE FROM vehicle_movements');
      await ds.query('DELETE FROM alerts');
      await ds.query('DELETE FROM access_logs');
      await ds.query('DELETE FROM visitors');
      // company_settings has FK to users.updatedById, so delete it before users
      await ds.query('DELETE FROM company_settings');
      await ds.query('DELETE FROM users');
      logger.info('Cleared existing data (ordered for FKs)');
    }

    // Create repositories
    const userRepository = ds.getRepository(User);
    const settingsRepository = ds.getRepository(CompanySettings);

    // Seed employees list for visitor selection
    await seedEmployees();

    // Create admin user
    const adminUser = new User();
    adminUser.firstName = 'System';
    adminUser.lastName = 'Administrator';
    adminUser.email = 'admin@company.com';
    adminUser.phone = '+1234567890';
    adminUser.role = UserRole.ADMIN;
    adminUser.status = UserStatus.ACTIVE;
    adminUser.password = 'Admin@123'; // Will be hashed automatically
    adminUser.employeeId = 'ADM001';
    adminUser.department = 'IT';

    const savedAdmin = await userRepository.save(adminUser);
    logger.info(`Created admin user: ${savedAdmin.email}`);

    // Create security guard
    const guardUser = new User();
    guardUser.firstName = 'John';
    guardUser.lastName = 'Guard';
    guardUser.email = 'guard@company.com';
    guardUser.phone = '+1234567891';
    guardUser.role = UserRole.SECURITY_GUARD;
    guardUser.status = UserStatus.ACTIVE;
    guardUser.password = 'Guard@123'; // Will be hashed automatically
    guardUser.employeeId = 'GRD001';
    guardUser.department = 'Security';

    const savedGuard = await userRepository.save(guardUser);
    logger.info(`Created security guard: ${savedGuard.email}`);

    // Create receptionist user
    const receptionistUser = new User();
    receptionistUser.firstName = 'Jane';
    receptionistUser.lastName = 'Receptionist';
    receptionistUser.email = 'receptionist@company.com';
    receptionistUser.phone = '+1234567892';
    receptionistUser.role = UserRole.RECEPTIONIST;
    receptionistUser.status = UserStatus.ACTIVE;
    receptionistUser.password = 'Receptionist@123'; // Will be hashed automatically
    receptionistUser.employeeId = 'REC001';
    receptionistUser.department = 'Reception';

    const savedReceptionist = await userRepository.save(receptionistUser);
    logger.info(`Created receptionist: ${savedReceptionist.email}`);

    // Create company settings
    const settings = new CompanySettings();
    settings.companyName = 'farmers choice ltd';
    settings.address = 'Kahawa West, Nairobi';
    settings.phone = '+1234567890';
    settings.email = 'info@company.com';
    settings.setWorkingHours({
      start: '08:00',
      end: '18:00',
    });
    settings.maxVisitorDuration = 480; // 8 hours
    settings.requirePreApproval = true;
    settings.allowMultipleEntries = false;
    settings.enableQRCode = true;
    settings.enableEmailNotifications = true;
    settings.emergencyContact = '+1234567999';
    settings.updatedById = savedAdmin.id;

    await settingsRepository.save(settings);
    logger.info('Created company settings');

    logger.info('Database seeding completed successfully!');
    logger.info('Default login credentials:');
    logger.info('Admin: admin@company.com / Admin@123');
    logger.info('Guard: guard@company.com / Guard@123');
    logger.info('Receptionist: receptionist@company.com / Receptionist@123');

  } catch (error) {
    logger.error('Error seeding database:', error);
    throw error;
  } finally {
    if (dataSource.isConnected()) {
      await dataSource.disconnect();
    }
  }
}

// Run seeder if called directly
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

export default seedDatabase;