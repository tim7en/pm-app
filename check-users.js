const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkUsers() {
  try {
    console.log('🔍 Checking all users in the database...');
    
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        workspaceMembers: {
          select: {
            role: true,
            workspace: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    console.log(`📊 Found ${users.length} users:`);
    users.forEach(user => {
      console.log(`👤 ${user.name} (${user.email})`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Created: ${user.createdAt}`);
      if (user.workspaceMembers.length > 0) {
        console.log(`   Workspaces:`);
        user.workspaceMembers.forEach(member => {
          console.log(`     - ${member.workspace.name} (${member.role})`);
        });
      }
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Error checking users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();
