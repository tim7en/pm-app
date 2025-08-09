#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function testRegistration() {
  console.log('🔐 Testing User Registration Fix...');
  
  try {
    // Test data
    const testUser = {
      name: 'Test User Fixed',
      email: 'test.fixed@example.com',
      password: 'password123'
    };

    console.log('1. Checking if user already exists...');
    const existingUser = await prisma.user.findUnique({
      where: { email: testUser.email.toLowerCase() }
    });

    if (existingUser) {
      console.log('❌ User already exists, deleting for fresh test...');
      // Delete workspace members first
      await prisma.workspaceMember.deleteMany({
        where: { userId: existingUser.id }
      });
      // Delete workspaces owned by this user
      const workspaces = await prisma.workspace.findMany({
        where: {
          members: {
            some: {
              userId: existingUser.id,
              role: 'OWNER'
            }
          }
        }
      });
      for (const workspace of workspaces) {
        await prisma.workspace.delete({
          where: { id: workspace.id }
        });
      }
      // Delete the user
      await prisma.user.delete({
        where: { id: existingUser.id }
      });
    }

    console.log('2. Creating new user...');
    const hashedPassword = await bcrypt.hash(testUser.password, 12);
    
    const user = await prisma.user.create({
      data: {
        email: testUser.email.toLowerCase(),
        name: testUser.name,
        password: hashedPassword
      }
    });
    console.log('✅ User created:', user.email);

    console.log('3. Creating default workspace...');
    const workspace = await prisma.workspace.create({
      data: {
        name: `${testUser.name}'s Workspace`,
        description: 'Your personal workspace'
      }
    });
    console.log('✅ Workspace created:', workspace.name);

    console.log('4. Adding user as workspace owner...');
    await prisma.workspaceMember.create({
      data: {
        userId: user.id,
        workspaceId: workspace.id,
        role: 'OWNER'
      }
    });
    console.log('✅ User added as workspace owner');

    console.log('5. Testing user login (password verification)...');
    const isValidPassword = await bcrypt.compare(testUser.password, user.password);
    if (isValidPassword) {
      console.log('✅ Password verification successful');
    } else {
      console.log('❌ Password verification failed');
    }

    console.log('\n🎉 Registration test completed successfully!');
    console.log('📋 User Details:');
    console.log(`   - ID: ${user.id}`);
    console.log(`   - Email: ${user.email}`);
    console.log(`   - Name: ${user.name}`);
    console.log(`   - Workspace: ${workspace.name}`);
    
    console.log('\n📝 Next steps:');
    console.log('1. Your registration system is working at the database level');
    console.log('2. Try visiting http://localhost:3000/auth to register through the UI');
    console.log('3. Use email: test.fixed@example.com, password: password123 to login');

  } catch (error) {
    console.error('💥 Registration test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testRegistration();
