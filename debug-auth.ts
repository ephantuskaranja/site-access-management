import 'reflect-metadata';
import dataSource from './src/config/database';
import { User } from './src/entities/User';
import bcrypt from 'bcryptjs';

async function debugAuth(): Promise<void> {
  try {
    await dataSource.connect();
    const ds = dataSource.getDataSource();
    if (!ds) throw new Error('Database connection failed');
    
    console.log('Connected to database');
    
    const userRepository = ds.getRepository(User);
    
    // Find the admin user
    const adminUser = await userRepository.findOne({ 
      where: { email: 'admin@company.com' },
      select: ['id', 'email', 'password', 'loginAttempts', 'lockUntil']
    });
    
    if (!adminUser) {
      console.log('Admin user not found!');
      return;
    }
    
    console.log('Admin user found:');
    console.log('Email:', adminUser.email);
    console.log('Password hash:', adminUser.password);
    console.log('Login attempts:', adminUser.loginAttempts);
    console.log('Lock until:', adminUser.lockUntil);
    console.log('Is locked:', adminUser.isLocked());
    
    if (!adminUser.password) {
      console.log('ERROR: Admin user has no password!');
      return;
    }
    
    // Test password comparison
    const testPassword = 'Admin@123';
    const isCorrect = await adminUser.isPasswordCorrect(testPassword);
    console.log(`Password "${testPassword}" is correct:`, isCorrect);
    
    // Test direct bcrypt comparison
    const directCompare = await bcrypt.compare(testPassword, adminUser.password);
    console.log('Direct bcrypt compare result:', directCompare);
    
    // Test if the stored password is already hashed
    console.log('Stored password length:', adminUser.password.length);
    console.log('Stored password starts with hash prefix:', adminUser.password.startsWith('$2b$') || adminUser.password.startsWith('$2a$'));
    
    await dataSource.disconnect();
  } catch (error) {
    console.error('Debug error:', error);
  }
}

debugAuth();