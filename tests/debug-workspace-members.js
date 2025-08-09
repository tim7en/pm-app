const { PrismaClient } = require('@prisma/client');

const db = new PrismaClient();

async function checkWorkspaceMembers() {
  try {
    console.log('🔍 Checking database for workspace members...\n');
    
    // Check all workspaces
    const workspaces = await db.workspace.findMany({
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            members: true
          }
        }
      }
    });
    
    console.log('📁 Workspaces found:', workspaces.length);
    workspaces.forEach(ws => {
      console.log(`  - ${ws.name} (${ws.id}): ${ws._count.members} members`);
    });
    
    // Check all workspace members with details
    const workspaceMembers = await db.workspaceMember.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        workspace: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });
    
    console.log('\n👥 Workspace Members found:', workspaceMembers.length);
    workspaceMembers.forEach(member => {
      console.log(`  - ${member.user.name || member.user.email} in ${member.workspace.name} (${member.role})`);
    });
    
    // Check users
    const users = await db.user.findMany({
      select: {
        id: true,
        name: true,
        email: true
      }
    });
    
    console.log('\n👤 Users found:', users.length);
    users.forEach(user => {
      console.log(`  - ${user.name || user.email} (${user.id})`);
    });
    
  } catch (error) {
    console.error('❌ Error checking database:', error);
  } finally {
    await db.$disconnect();
  }
}

checkWorkspaceMembers();
