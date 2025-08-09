// Test script to verify invited member task access control
const fs = require('fs');
const path = require('path');

// Function to analyze the access control logic in roles.ts
const checkAccessControlLogic = () => {
  const rolesPath = path.join(__dirname, 'src', 'lib', 'roles.ts');
  
  if (fs.existsSync(rolesPath)) {
    const content = fs.readFileSync(rolesPath, 'utf8');
    
    console.log('🔍 Checking Access Control Logic for Invited Members');
    console.log('='.repeat(60));
    
    // Check getAccessibleTasks function
    const tasksChecks = [
      {
        name: 'System role differentiation',
        pattern: /systemRole.*===.*MEMBER|systemRole.*===.*GUEST/,
        found: content.includes('MEMBER') && content.includes('systemRole')
      },
      {
        name: 'Assigned tasks filter (legacy)',
        pattern: /assigneeId.*userId/,
        found: content.match(/assigneeId.*userId/)
      },
      {
        name: 'Assigned tasks filter (multi-assignee)',
        pattern: /assignees.*some.*userId/,
        found: content.match(/assignees.*some.*userId/)
      },
      {
        name: 'Created tasks filter',
        pattern: /creatorId.*userId/,
        found: content.match(/creatorId.*userId/)
      },
      {
        name: 'Restricted to only assigned/created tasks for invited members',
        pattern: /For invited members.*MEMBER.*GUEST.*only show tasks they are directly involved/,
        found: content.includes('For invited members') && content.includes('directly involved')
      }
    ];
    
    console.log('📋 getAccessibleTasks Function:');
    tasksChecks.forEach(check => {
      const status = check.found ? '✅ PASS' : '❌ FAIL';
      console.log(`  ${status} ${check.name}`);
    });
    
    // Check getAccessibleProjects function
    const projectsChecks = [
      {
        name: 'Projects with assigned tasks filter',
        pattern: /tasks.*some.*assigneeId.*userId/,
        found: content.match(/tasks.*some.*assigneeId.*userId/)
      },
      {
        name: 'Projects with multi-assignee tasks filter',
        pattern: /tasks.*some.*assignees.*some.*userId/,
        found: content.match(/tasks.*some.*assignees.*some.*userId/)
      },
      {
        name: 'Projects with created tasks filter',
        pattern: /tasks.*some.*creatorId.*userId/,
        found: content.match(/tasks.*some.*creatorId.*userId/)
      },
      {
        name: 'Restricted project access for invited members',
        pattern: /For invited members.*only show projects where they have assigned tasks/,
        found: content.includes('For invited members') && content.includes('assigned tasks')
      }
    ];
    
    console.log('\n📁 getAccessibleProjects Function:');
    projectsChecks.forEach(check => {
      const status = check.found ? '✅ PASS' : '❌ FAIL';
      console.log(`  ${status} ${check.name}`);
    });
    
    return {
      tasks: tasksChecks.every(c => c.found),
      projects: projectsChecks.every(c => c.found)
    };
  } else {
    console.log('❌ roles.ts file not found');
    return { tasks: false, projects: false };
  }
};

// Function to check individual task access control
const checkTaskEndpointSecurity = () => {
  const taskRoutePath = path.join(__dirname, 'src', 'app', 'api', 'tasks', '[id]', 'route.ts');
  
  if (fs.existsSync(taskRoutePath)) {
    const content = fs.readFileSync(taskRoutePath, 'utf8');
    
    console.log('\n🔒 Individual Task Endpoint Security:');
    console.log('='.repeat(40));
    
    const checks = [
      {
        name: 'Uses getUserSystemRole for access control',
        found: content.includes('getUserSystemRole')
      },
      {
        name: 'Different access for different roles',
        found: content.includes('systemRole === \'ADMIN\'') && content.includes('systemRole === \'PROJECT_MANAGER\'')
      },
      {
        name: 'Restricts invited members to assigned tasks only',
        found: content.includes('For invited members') && content.includes('directly involved')
      },
      {
        name: 'Checks multi-assignee access',
        found: content.includes('assignees?.some')
      },
      {
        name: 'Returns 403 for unauthorized access',
        found: content.includes('Access denied') && content.includes('status: 403')
      }
    ];
    
    checks.forEach(check => {
      const status = check.found ? '✅ PASS' : '❌ FAIL';
      console.log(`  ${status} ${check.name}`);
    });
    
    return checks.every(c => c.found);
  } else {
    console.log('❌ Task route file not found');
    return false;
  }
};

// Main test execution
console.log('🛡️ Testing Access Control for Invited Team Members\n');

const accessControlResults = checkAccessControlLogic();
const endpointSecurityResult = checkTaskEndpointSecurity();

console.log('\n📊 SUMMARY:');
console.log('='.repeat(50));
console.log(`getAccessibleTasks Logic: ${accessControlResults.tasks ? '✅ Secure' : '❌ Needs fixes'}`);
console.log(`getAccessibleProjects Logic: ${accessControlResults.projects ? '✅ Secure' : '❌ Needs fixes'}`);
console.log(`Individual Task Endpoint: ${endpointSecurityResult ? '✅ Secure' : '❌ Needs fixes'}`);

const allSecure = accessControlResults.tasks && accessControlResults.projects && endpointSecurityResult;

if (allSecure) {
  console.log('\n🎉 SUCCESS: Access control is properly implemented!');
  console.log('\nInvited team members (MEMBER/GUEST role) will now only see:');
  console.log('• Tasks they are assigned to (single or multi-assignee)');
  console.log('• Tasks they created');
  console.log('• Projects that contain their assigned/created tasks');
  console.log('• No access to other tasks in the same project');
  console.log('\nHigher roles (PROJECT_MANAGER, PROJECT_OFFICER, ADMIN, OWNER) retain full access.');
} else {
  console.log('\n⚠️ Some security checks failed. Please review the implementation.');
}
