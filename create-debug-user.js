#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createTestUser() {
  console.log('🔐 Creating test user for debugging...');
  
  try {
    const email = 'debug@test.com';
    const password = 'test123';
    const name = 'Debug User';

    // Delete if exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      console.log('User already exists, deleting...');
      await prisma.workspaceMember.deleteMany({
        where: { userId: existingUser.id }
      });
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
        await prisma.workspace.delete({ where: { id: workspace.id } });
      }
      await prisma.user.delete({ where: { id: existingUser.id } });
    }

    // Create user
    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword
      }
    });

    // Create workspace
    const workspace = await prisma.workspace.create({
      data: {
        name: `${name}'s Workspace`,
        description: 'Debug workspace'
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

    console.log('✅ Test user created successfully!');
    console.log('📧 Email:', email);
    console.log('🔑 Password:', password);
    console.log('🆔 User ID:', user.id);
    console.log('🏢 Workspace:', workspace.name);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();
