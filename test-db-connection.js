const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function testDatabaseConnection() {
  try {
    console.log('🔍 Testing database connection...');
    
    // Test basic connection
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    
    // Test if we can query the database
    const userCount = await prisma.user.count();
    console.log(`📊 Current user count: ${userCount}`);
    
    // Test creating a new user
    console.log('👤 Testing user creation...');
    const testUser = await prisma.user.create({
      data: {
        email: 'test@example.com',
        name: 'Test User',
        password: 'hashedpassword123' // In real app this would be hashed
      }
    });
    console.log('✅ User created successfully:', {
      id: testUser.id,
      email: testUser.email,
      name: testUser.name
    });
    
    // Verify the user was created
    const newUserCount = await prisma.user.count();
    console.log(`📊 New user count: ${newUserCount}`);
    
    // Clean up - delete the test user
    await prisma.user.delete({
      where: { id: testUser.id }
    });
    console.log('🧹 Test user cleaned up');
    
    const finalUserCount = await prisma.user.count();
    console.log(`📊 Final user count: ${finalUserCount}`);
    
    console.log('🎉 Database functionality test completed successfully!');
    
  } catch (error) {
    console.error('❌ Database test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDatabaseConnection();
