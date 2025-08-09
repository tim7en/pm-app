const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function showAllUsers() {
  try {
    console.log('📋 Listing all users in the database:');
    console.log('=' * 50);
    
    const users = await prisma.user.findMany({
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
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    console.log(`\n🔢 Total users found: ${users.length}\n`);
    
    users.forEach((user, index) => {
      console.log(`👤 User ${index + 1}:`);
      console.log(`   📧 Email: ${user.email}`);
      console.log(`   👋 Name: ${user.name}`);
      console.log(`   🆔 ID: ${user.id}`);
      console.log(`   📅 Created: ${user.createdAt.toLocaleString()}`);
      console.log(`   🏢 Workspaces: ${user.workspaceMembers.length}`);
      
      if (user.workspaceMembers.length > 0) {
        user.workspaceMembers.forEach(member => {
          console.log(`      → ${member.workspace.name} (${member.role})`);
        });
      }
      console.log('');
    });
    
    console.log('✅ Database query completed successfully!');
    
  } catch (error) {
    console.error('❌ Error listing users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

showAllUsers();
