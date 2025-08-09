const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function testUserRegistration() {
  try {
    console.log('🧪 Testing complete user registration process...');
    
    const testUser = {
      email: 'alice.test@example.com',
      name: 'Alice Test',
      password: 'securepassword789'
    };
    
    console.log('📝 Test user data:', { 
      email: testUser.email, 
      name: testUser.name, 
      passwordLength: testUser.password.length 
    });
    
    // Step 1: Check if user exists
    console.log('🔍 Step 1: Checking if user already exists...');
    const existingUser = await prisma.user.findUnique({
      where: { email: testUser.email.toLowerCase() }
    });
    
    if (existingUser) {
      console.log('⚠️ User already exists, deleting for clean test...');
      await prisma.user.delete({
        where: { id: existingUser.id }
      });
      console.log('🧹 Existing user deleted');
    }
    
    // Step 2: Hash password
    console.log('🔐 Step 2: Hashing password...');
    const hashedPassword = await bcrypt.hash(testUser.password, 12);
    console.log('✅ Password hashed successfully');
    
    // Step 3: Create user
    console.log('👤 Step 3: Creating user in database...');
    const user = await prisma.user.create({
      data: {
        email: testUser.email.toLowerCase(),
        name: testUser.name,
        password: hashedPassword
      }
    });
    console.log('✅ User created:', {
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt
    });
    
    // Step 4: Create workspace
    console.log('🏢 Step 4: Creating default workspace...');
    const workspace = await prisma.workspace.create({
      data: {
        name: `${testUser.name}'s Workspace`,
        description: 'Your personal workspace'
      }
    });
    console.log('✅ Workspace created:', {
      id: workspace.id,
      name: workspace.name
    });
    
    // Step 5: Create workspace membership
    console.log('👥 Step 5: Adding user to workspace as owner...');
    const membership = await prisma.workspaceMember.create({
      data: {
        userId: user.id,
        workspaceId: workspace.id,
        role: 'OWNER'
      }
    });
    console.log('✅ Workspace membership created:', {
      id: membership.id,
      role: membership.role
    });
    
    // Step 6: Verify everything was created
    console.log('🔍 Step 6: Verifying complete user setup...');
    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        workspaceMemberships: {
          include: {
            workspace: true
          }
        }
      }
    });
    
    console.log('✅ Full user verification:', {
      id: fullUser.id,
      email: fullUser.email,
      name: fullUser.name,
      workspaces: fullUser.workspaceMemberships.map(m => ({
        id: m.workspace.id,
        name: m.workspace.name,
        role: m.role
      }))
    });
    
    console.log('🎉 Complete user registration test successful!');
    console.log('📊 Summary: User created with ID', user.id, 'and workspace', workspace.id);
    
    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      },
      workspace: {
        id: workspace.id,
        name: workspace.name
      }
    };
    
  } catch (error) {
    console.error('❌ User registration test failed:', error);
    console.error('❌ Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    return {
      success: false,
      error: error.message
    };
  } finally {
    await prisma.$disconnect();
  }
}

testUserRegistration();
