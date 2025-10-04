import { AppDataSource } from '../config/ormconfig';
import { Employee } from '../entities/Employee';
import logger from '../config/logger';

export async function seedEmployees() {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    const employeeRepository = AppDataSource.getRepository(Employee);

    // Check if employees already exist
    const existingCount = await employeeRepository.count();
    if (existingCount > 0) {
      logger.info('Employees already exist, skipping seeding');
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
      logger.info(`Created employee: ${employee.fullName} (${employee.employeeId})`);
    }

    logger.info('✅ Employee seeding completed successfully');
  } catch (error) {
    logger.error('❌ Error seeding employees:', error);
    throw error;
  }
}

// Run seeder if called directly
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