import bcrypt from 'bcryptjs';

async function testHashGeneration(): Promise<void> {
  const plainPassword = 'Admin@123';
  
  // Generate hash the same way the entity does
  const salt = await bcrypt.genSalt(12);
  const hashedPassword = await bcrypt.hash(plainPassword, salt);
  
  console.log('Plain password:', plainPassword);
  console.log('Generated hash:', hashedPassword);
  console.log('Hash length:', hashedPassword.length);
  console.log('Hash starts with bcrypt prefix:', hashedPassword.startsWith('$2a$12$'));
  
  // Test comparison
  const isMatch = await bcrypt.compare(plainPassword, hashedPassword);
  console.log('Self-comparison result:', isMatch);
  
  // Test the stored hash from database
  const storedHash = '$2a$12$2X7hdKVfD9Fx9fDyASp.huM0o6VU8Iwz90Bqy2ypSXUFTyjeekI3u';
  const compareWithStored = await bcrypt.compare(plainPassword, storedHash);
  console.log('Comparison with stored hash:', compareWithStored);
  
  // Test different possible passwords
  const testPasswords = ['Admin@123', 'admin@123', 'ADMIN@123', 'Admin123', 'admin123'];
  for (const testPwd of testPasswords) {
    const result = await bcrypt.compare(testPwd, storedHash);
    console.log(`Password "${testPwd}":`, result);
  }
}

testHashGeneration().catch(console.error);