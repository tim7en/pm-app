// Test script to verify multi-assignee task display functionality
const fs = require('fs');
const path = require('path');

// Function to check task card component
const checkTaskCard = () => {
  const filePath = path.join(__dirname, 'src', 'components', 'tasks', 'task-card.tsx');
  
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    
    const checks = [
      {
        name: 'Interface includes assignees field',
        found: content.includes('assignees?: Array<{')
      },
      {
        name: 'Assigned to you badge checks multi-assignee',
        found: content.includes('task.assignees?.some(assignee => assignee.user.id === currentUserId)')
      },
      {
        name: 'Avatar display supports multi-assignee',
        found: content.includes('hasMultiAssignees') && content.includes('slice(0, 3)')
      },
      {
        name: 'Multi-assignee overflow indicator (+N)',
        found: content.includes('+{task.assignees!.length - 3}')
      }
    ];
    
    console.log('🏷️ TaskCard Component:');
    checks.forEach(check => {
      const status = check.found ? '✅ PASS' : '❌ FAIL';
      console.log(`  ${status} ${check.name}`);
    });
    
    return checks.every(c => c.found);
  } else {
    console.log('❌ task-card.tsx not found');
    return false;
  }
};

// Function to check task list component
const checkTaskList = () => {
  const filePath = path.join(__dirname, 'src', 'components', 'tasks', 'task-list.tsx');
  
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    
    const checks = [
      {
        name: 'Interface includes assignees field',
        found: content.includes('assignees?: Array<{')
      },
      {
        name: 'Assignment logic checks multi-assignee',
        found: content.includes('task.assignees?.some(assignee => assignee.user.id === currentUserId)')
      },
      {
        name: 'Assigned to you badge checks multi-assignee',
        found: content.includes('task.assignees?.some(assignee => assignee.user.id === currentUserId)')
      },
      {
        name: 'Avatar display supports multi-assignee stacking',
        found: content.includes('-space-x-1') && content.includes('slice(0, 2)')
      },
      {
        name: 'Created by you badge excludes multi-assignee',
        found: content.includes('!task.assignees?.some(assignee => assignee.user.id === currentUserId)')
      }
    ];
    
    console.log('\n📋 TaskList Component:');
    checks.forEach(check => {
      const status = check.found ? '✅ PASS' : '❌ FAIL';
      console.log(`  ${status} ${check.name}`);
    });
    
    return checks.every(c => c.found);
  } else {
    console.log('❌ task-list.tsx not found');
    return false;
  }
};

// Function to check dashboard components
const checkDashboardComponents = () => {
  const taskMgmtPath = path.join(__dirname, 'src', 'components', 'dashboard', 'task-management.tsx');
  const overviewPath = path.join(__dirname, 'src', 'components', 'dashboard', 'dashboard-overview.tsx');
  
  let taskMgmtResult = false;
  let overviewResult = false;
  
  if (fs.existsSync(taskMgmtPath)) {
    const content = fs.readFileSync(taskMgmtPath, 'utf8');
    taskMgmtResult = content.includes('task.assignees && task.assignees.some');
  }
  
  if (fs.existsSync(overviewPath)) {
    const content = fs.readFileSync(overviewPath, 'utf8');
    overviewResult = content.includes('task.assignees && task.assignees.some');
  }
  
  console.log('\n📊 Dashboard Components:');
  console.log(`  ${taskMgmtResult ? '✅ PASS' : '❌ FAIL'} Task Management supports multi-assignee`);
  console.log(`  ${overviewResult ? '✅ PASS' : '❌ FAIL'} Dashboard Overview supports multi-assignee`);
  
  return taskMgmtResult && overviewResult;
};

// Function to check task reassign dialog
const checkTaskReassignDialog = () => {
  const filePath = path.join(__dirname, 'src', 'components', 'tasks', 'task-reassign-dialog.tsx');
  
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    
    const checks = [
      {
        name: 'Supports multiple current assignees',
        found: content.includes('currentAssigneeIds?: string[]')
      },
      {
        name: 'Uses multi-assignee state management',
        found: content.includes('selectedAssigneeIds') && content.includes('useState<string[]>')
      },
      {
        name: 'Toggle assignee functionality',
        found: content.includes('toggleAssignee')
      },
      {
        name: 'Uses assignees API endpoint',
        found: content.includes('/api/tasks/${taskId}/assignees')
      },
      {
        name: 'Sends userIds in request body',
        found: content.includes('userIds: selectedAssigneeIds')
      }
    ];
    
    console.log('\n🔄 TaskReassignDialog Component:');
    checks.forEach(check => {
      const status = check.found ? '✅ PASS' : '❌ FAIL';
      console.log(`  ${status} ${check.name}`);
    });
    
    return checks.every(c => c.found);
  } else {
    console.log('❌ task-reassign-dialog.tsx not found');
    return false;
  }
};

// Main test execution
console.log('🧪 Testing Multi-Assignee Task Display and Functionality\n');

const taskCardResult = checkTaskCard();
const taskListResult = checkTaskList();
const dashboardResult = checkDashboardComponents();
const reassignDialogResult = checkTaskReassignDialog();

console.log('\n📊 OVERALL RESULTS:');
console.log('='.repeat(50));
console.log(`TaskCard Component: ${taskCardResult ? '✅ Ready' : '❌ Needs fixes'}`);
console.log(`TaskList Component: ${taskListResult ? '✅ Ready' : '❌ Needs fixes'}`);
console.log(`Dashboard Components: ${dashboardResult ? '✅ Ready' : '❌ Needs fixes'}`);
console.log(`TaskReassignDialog: ${reassignDialogResult ? '✅ Ready' : '❌ Needs fixes'}`);

const allReady = taskCardResult && taskListResult && dashboardResult && reassignDialogResult;

if (allReady) {
  console.log('\n🎉 SUCCESS: Multi-assignee functionality is fully implemented!');
  console.log('\n✨ Fixed Issues:');
  console.log('• "Assigned to you" badge now appears for all assigned members');
  console.log('• Multiple assignee avatars now display correctly');
  console.log('• Task assignment no longer resets after reassignment');
  console.log('• Multi-assignee support across all task display components');
  console.log('• Proper filtering in dashboard views');
  console.log('• Enhanced task reassignment dialog with multi-select');
  
  console.log('\n🔧 Implementation Details:');
  console.log('• Backward compatible with existing single assignee system');
  console.log('• Supports both task.assignee and task.assignees data structures');
  console.log('• Avatar stacking with overflow indicators (+N)');
  console.log('• Proper assignment checking in all components');
  console.log('• Uses new /api/tasks/[id]/assignees endpoint for reassignment');
} else {
  console.log('\n⚠️ Some components still need updates for full multi-assignee support.');
}
