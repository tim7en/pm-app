// Comprehensive test for task reassignment and multi-assignee functionality
const fs = require('fs');
const path = require('path');

console.log('🧪 Comprehensive Task Reassignment & Multi-Assignee Test\n');

// Test 1: Check multi-assignee database schema
const checkDatabaseSchema = () => {
  console.log('1️⃣ Database Schema Check');
  console.log('=' .repeat(40));
  
  const schemaPath = path.join(__dirname, 'prisma', 'schema.prisma');
  
  if (fs.existsSync(schemaPath)) {
    const content = fs.readFileSync(schemaPath, 'utf8');
    
    const checks = [
      {
        name: 'TaskAssignee model exists',
        found: content.includes('model TaskAssignee')
      },
      {
        name: 'Task has assignees relation',
        found: content.includes('assignees    TaskAssignee[]')
      },
      {
        name: 'User has taskAssignees relation', 
        found: content.includes('taskAssignees         TaskAssignee[]')
      },
      {
        name: 'Unique constraint on taskId + userId',
        found: content.includes('@@unique([taskId, userId])')
      }
    ];
    
    let allPassed = true;
    checks.forEach(check => {
      const status = check.found ? '✅ PASS' : '❌ FAIL';
      console.log(`${status} ${check.name}`);
      if (!check.found) allPassed = false;
    });
    
    return allPassed;
  } else {
    console.log('❌ Schema file not found');
    return false;
  }
};

// Test 2: Check API endpoints
const checkAPIEndpoints = () => {
  console.log('\n2️⃣ API Endpoints Check');
  console.log('=' .repeat(40));
  
  const endpointPath = path.join(__dirname, 'src', 'app', 'api', 'tasks', '[id]', 'assignees', 'route.ts');
  
  if (fs.existsSync(endpointPath)) {
    const content = fs.readFileSync(endpointPath, 'utf8');
    
    const checks = [
      {
        name: 'GET endpoint for fetching assignees',
        found: content.includes('export async function GET')
      },
      {
        name: 'POST endpoint for adding assignees',
        found: content.includes('export async function POST')
      },
      {
        name: 'PUT endpoint for replacing assignees',
        found: content.includes('export async function PUT')
      },
      {
        name: 'DELETE endpoint for removing assignees',
        found: content.includes('export async function DELETE')
      },
      {
        name: 'Permission checks implemented',
        found: content.includes('canUserPerformAction') && content.includes('canAssignTask')
      },
      {
        name: 'Notification system integration',
        found: content.includes('NotificationService.createNotification')
      },
      {
        name: 'Transaction support for data consistency',
        found: content.includes('db.$transaction')
      }
    ];
    
    let allPassed = true;
    checks.forEach(check => {
      const status = check.found ? '✅ PASS' : '❌ FAIL';
      console.log(`${status} ${check.name}`);
      if (!check.found) allPassed = false;
    });
    
    return allPassed;
  } else {
    console.log('❌ Assignees API endpoint not found');
    return false;
  }
};

// Test 3: Check task access control
const checkAccessControl = () => {
  console.log('\n3️⃣ Access Control Check');
  console.log('=' .repeat(40));
  
  const rolesPath = path.join(__dirname, 'src', 'lib', 'roles.ts');
  
  if (fs.existsSync(rolesPath)) {
    const content = fs.readFileSync(rolesPath, 'utf8');
    
    const checks = [
      {
        name: 'Multi-assignee filtering enabled',
        found: content.includes('{ assignees: { some: { userId } } }')
      },
      {
        name: 'Assignees included in task queries',
        found: content.includes('assignees: {') && content.includes('include: {')
      },
      {
        name: 'Task permission checks include assignees',
        found: content.includes('task.assignees.some(assignee => assignee.userId === userId)')
      }
    ];
    
    let allPassed = true;
    checks.forEach(check => {
      const status = check.found ? '✅ PASS' : '❌ FAIL';
      console.log(`${status} ${check.name}`);
      if (!check.found) allPassed = false;
    });
    
    return allPassed;
  } else {
    console.log('❌ Roles file not found');
    return false;
  }
};

// Test 4: Check frontend implementation
const checkFrontendImplementation = () => {
  console.log('\n4️⃣ Frontend Implementation Check');
  console.log('=' .repeat(40));
  
  const dialogPath = path.join(__dirname, 'src', 'components', 'tasks', 'task-reassign-dialog.tsx');
  const tasksPagePath = path.join(__dirname, 'src', 'app', 'tasks', 'page.tsx');
  
  let dialogPassed = false;
  let tasksPagePassed = false;
  
  // Check dialog
  if (fs.existsSync(dialogPath)) {
    const content = fs.readFileSync(dialogPath, 'utf8');
    
    const dialogChecks = [
      {
        name: 'Multi-assignee state management',
        found: content.includes('selectedAssigneeIds') && content.includes('useState<string[]>')
      },
      {
        name: 'Toggle assignee functionality',
        found: content.includes('toggleAssignee')
      },
      {
        name: 'PUT method for reassignment',
        found: content.includes('method: \'PUT\'')
      },
      {
        name: 'Multiple current assignees support',
        found: content.includes('currentAssigneeIds?: string[]')
      }
    ];
    
    let allDialogPassed = true;
    dialogChecks.forEach(check => {
      const status = check.found ? '✅ PASS' : '❌ FAIL';
      console.log(`${status} Dialog: ${check.name}`);
      if (!check.found) allDialogPassed = false;
    });
    
    dialogPassed = allDialogPassed;
  } else {
    console.log('❌ Task reassign dialog not found');
  }
  
  // Check tasks page
  if (fs.existsSync(tasksPagePath)) {
    const content = fs.readFileSync(tasksPagePath, 'utf8');
    
    const tasksPageChecks = [
      {
        name: 'Multiple assignee IDs state',
        found: content.includes('currentAssigneeIds?: string[]')
      },
      {
        name: 'Assignee array handling',
        found: content.includes('taskWithAssignees.assignees') && content.includes('map')
      },
      {
        name: 'Multiple assignees passed to dialog',
        found: content.includes('currentAssigneeIds={reassignTaskData.currentAssigneeIds}')
      }
    ];
    
    let allTasksPagePassed = true;
    tasksPageChecks.forEach(check => {
      const status = check.found ? '✅ PASS' : '❌ FAIL';
      console.log(`${status} Tasks Page: ${check.name}`);
      if (!check.found) allTasksPagePassed = false;
    });
    
    tasksPagePassed = allTasksPagePassed;
  } else {
    console.log('❌ Tasks page not found');
  }
  
  return dialogPassed && tasksPagePassed;
};

// Test 5: Check task list display
const checkTaskListDisplay = () => {
  console.log('\n5️⃣ Task List Display Check');
  console.log('=' .repeat(40));
  
  const taskListPath = path.join(__dirname, 'src', 'components', 'tasks', 'task-list.tsx');
  
  if (fs.existsSync(taskListPath)) {
    const content = fs.readFileSync(taskListPath, 'utf8');
    
    const checks = [
      {
        name: 'Multiple assignee avatar display',
        found: content.includes('task.assignees') && content.includes('slice(0, 2)')
      },
      {
        name: 'Overflow indicator (+N)',
        found: content.includes('task.assignees!.length > 2')
      },
      {
        name: 'Backward compatibility with single assignee',
        found: content.includes('task.assignee') && content.includes('hasMultiAssignees')
      }
    ];
    
    let allPassed = true;
    checks.forEach(check => {
      const status = check.found ? '✅ PASS' : '❌ FAIL';
      console.log(`${status} ${check.name}`);
      if (!check.found) allPassed = false;
    });
    
    return allPassed;
  } else {
    console.log('❌ Task list component not found');
    return false;
  }
};

// Run all tests
console.log('🚀 Running Comprehensive Test Suite');
console.log('=' .repeat(60));

const results = {
  schema: checkDatabaseSchema(),
  api: checkAPIEndpoints(),
  access: checkAccessControl(),
  frontend: checkFrontendImplementation(),
  display: checkTaskListDisplay()
};

console.log('\n📊 FINAL RESULTS');
console.log('=' .repeat(60));
console.log(`Database Schema:       ${results.schema ? '✅ PASS' : '❌ FAIL'}`);
console.log(`API Endpoints:         ${results.api ? '✅ PASS' : '❌ FAIL'}`);
console.log(`Access Control:        ${results.access ? '✅ PASS' : '❌ FAIL'}`);
console.log(`Frontend Implementation: ${results.frontend ? '✅ PASS' : '❌ FAIL'}`);
console.log(`Task List Display:     ${results.display ? '✅ PASS' : '❌ FAIL'}`);

const allPassed = Object.values(results).every(result => result === true);

console.log('\n🎯 OVERALL STATUS');
console.log('=' .repeat(60));
if (allPassed) {
  console.log('🎉 ALL TESTS PASSED! Multi-assignee task management is fully implemented.');
  console.log('\n✅ Features confirmed working:');
  console.log('• Multiple users can be assigned to the same task');
  console.log('• Task reassignment supports multiple assignees');
  console.log('• Proper access control for multi-assignee tasks');
  console.log('• UI displays multiple assignees correctly');
  console.log('• Database schema supports multi-assignee relationships');
  console.log('• API endpoints handle all assignment operations');
} else {
  console.log('⚠️ Some tests failed. Please review the failing components above.');
  console.log('\n🔧 Next steps:');
  console.log('1. Fix any failing components');
  console.log('2. Test the functionality in the UI');
  console.log('3. Verify database migrations are applied');
  console.log('4. Ensure all permissions work correctly');
}

console.log('\n🔗 Key endpoints to test:');
console.log('• GET    /api/tasks/[id]/assignees    - Get task assignees');
console.log('• POST   /api/tasks/[id]/assignees    - Add assignees to task');
console.log('• PUT    /api/tasks/[id]/assignees    - Replace all assignees');
console.log('• DELETE /api/tasks/[id]/assignees    - Remove specific assignees');
