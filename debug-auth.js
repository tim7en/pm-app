#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function debugAuth() {
  console.log('🔍 Debug Authentication System...');
  
  try {
    // Check users in database
    console.log('\n1. Checking users in database...');
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        password: true
      }
    });
    
    console.log(`Found ${users.length} users:`);
    users.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.email} (${user.name})`);
    });

    if (users.length === 0) {
      console.log('❌ No users found! Need to create a user first.');
      return;
    }

    // Test password verification for first user
    const testUser = users[0];
    console.log(`\n2. Testing password verification for: ${testUser.email}`);
    
    const testPassword = 'password123';
    const isValid = await bcrypt.compare(testPassword, testUser.password);
    console.log(`   Password "${testPassword}": ${isValid ? '✅ Valid' : '❌ Invalid'}`);

    // Test different possible passwords
    const possiblePasswords = ['password123', 'testpass123', 'test123'];
    console.log('\n3. Testing different passwords...');
    
    for (const pwd of possiblePasswords) {
      const isValidPwd = await bcrypt.compare(pwd, testUser.password);
      console.log(`   "${pwd}": ${isValidPwd ? '✅ Valid' : '❌ Invalid'}`);
    }

    console.log('\n4. Workspaces for this user...');
    const workspaces = await prisma.workspaceMember.findMany({
      where: { userId: testUser.id },
      include: {
        workspace: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });
    
    console.log(`   Found ${workspaces.length} workspaces:`);
    workspaces.forEach((ws, index) => {
      console.log(`   ${index + 1}. ${ws.workspace.name} (${ws.role})`);
    });

    console.log('\n✅ Authentication debug completed');
    console.log('\n📝 Summary:');
    console.log(`   - Users in database: ${users.length}`);
    console.log(`   - Test user: ${testUser.email}`);
    console.log(`   - Workspaces: ${workspaces.length}`);
    console.log('\n🔐 To login:');
    console.log(`   Email: ${testUser.email}`);
    console.log(`   Password: password123`);

  } catch (error) {
    console.error('💥 Debug failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugAuth();
