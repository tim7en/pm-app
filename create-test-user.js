const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function createTestUser() {
  try {
    console.log('🚀 Creating a new test user...');
    
    // User data for our test
    const userData = {
      email: 'demo.user@example.com',
      name: 'Demo User',
      password: 'mypassword123'
    };
    
    console.log('📝 Creating user with data:', {
      email: userData.email,
      name: userData.name,
      passwordLength: userData.password.length
    });
    
    // Check if user already exists and clean up if needed
    console.log('🔍 Checking if user already exists...');
    const existingUser = await prisma.user.findUnique({
      where: { email: userData.email.toLowerCase() }
    });
    
    if (existingUser) {
      console.log('⚠️ User already exists, cleaning up first...');
      await prisma.user.delete({
        where: { id: existingUser.id }
      });
      console.log('🧹 Existing user removed');
    }
    
    // Hash the password
    console.log('🔐 Hashing password...');
    const hashedPassword = await bcrypt.hash(userData.password, 12);
    
    // Create the user
    console.log('👤 Creating user in database...');
    const newUser = await prisma.user.create({
      data: {
        email: userData.email.toLowerCase(),
        name: userData.name,
        password: hashedPassword
      }
    });
    
    console.log('✅ User created successfully!');
    console.log('👤 User details:', {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      createdAt: newUser.createdAt
    });
    
    // Create a workspace for the user
    console.log('🏢 Creating workspace for user...');
    const workspace = await prisma.workspace.create({
      data: {
        name: `${userData.name}'s Personal Workspace`,
        description: 'Personal workspace for project management'
      }
    });
    
    console.log('✅ Workspace created:', {
      id: workspace.id,
      name: workspace.name
    });
    
    // Add user as workspace owner
    console.log('👥 Making user the workspace owner...');
    const membership = await prisma.workspaceMember.create({
      data: {
        userId: newUser.id,
        workspaceId: workspace.id,
        role: 'OWNER'
      }
    });
    
    console.log('✅ User is now workspace owner');
    
    // Final verification
    console.log('🔍 Verifying user setup...');
    const verifiedUser = await prisma.user.findUnique({
      where: { id: newUser.id },
      include: {
        workspaceMembers: {
          include: {
            workspace: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });
    
    console.log('🎉 SUCCESS! Complete user setup:');
    console.log(`   👤 User: ${verifiedUser.name} (${verifiedUser.email})`);
    console.log(`   🆔 ID: ${verifiedUser.id}`);
    console.log(`   📅 Created: ${verifiedUser.createdAt}`);
    console.log(`   🏢 Workspace: ${verifiedUser.workspaceMembers[0].workspace.name}`);
    console.log(`   👑 Role: ${verifiedUser.workspaceMembers[0].role}`);
    
    return {
      success: true,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name
      },
      workspace: {
        id: workspace.id,
        name: workspace.name
      }
    };
    
  } catch (error) {
    console.error('❌ Failed to create user:', error);
    return {
      success: false,
      error: error.message
    };
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
createTestUser()
  .then(result => {
    if (result.success) {
      console.log('\n🎯 Test completed successfully!');
      console.log('✅ User creation functionality is working perfectly');
    } else {
      console.log('\n❌ Test failed:', result.error);
    }
  })
  .catch(error => {
    console.error('💥 Unexpected error:', error);
  });
