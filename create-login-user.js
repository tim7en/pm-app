#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createLoginUser() {
  console.log('🔐 Creating a working login user...');
  
  try {
    const email = 'login@test.com';
    const password = 'test123';
    const name = 'Login Test User';

    // Delete if exists
    await prisma.user.deleteMany({
      where: { email }
    });

    console.log('1. Creating user with known password...');
    const hashedPassword = await bcrypt.hash(password, 12);
    
    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword
      }
    });
    console.log(`✅ User created: ${user.email}`);

    // Create workspace
    console.log('2. Creating workspace...');
    const workspace = await prisma.workspace.create({
      data: {
        name: `${name}'s Workspace`,
        description: 'Personal workspace'
      }
    });

    // Add to workspace
    await prisma.workspaceMember.create({
      data: {
        userId: user.id,
        workspaceId: workspace.id,
        role: 'OWNER'
      }
    });

    console.log('3. Testing password verification...');
    const isValid = await bcrypt.compare(password, user.password);
    console.log(`   Password verification: ${isValid ? '✅ WORKING' : '❌ FAILED'}`);

    console.log('\n🎉 Login user created successfully!');
    console.log('\n🔑 LOGIN CREDENTIALS:');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    console.log('\n📝 Try these steps:');
    console.log('1. Go to http://localhost:3000/auth');
    console.log('2. Use the credentials above');
    console.log('3. Or test API directly with:');
    console.log(`   curl -X POST -H "Content-Type: application/json" -d '{"email":"${email}","password":"${password}"}' http://localhost:3000/api/auth/login`);

  } catch (error) {
    console.error('💥 Failed to create login user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createLoginUser();
