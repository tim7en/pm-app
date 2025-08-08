/**
 * TEST: Task Deletion Permission Bug Fix
 * =====================================
 * 
 * This test verifies the fix for the bug where users couldn't delete tasks
 * they created if they were also assigned to those tasks.
 * 
 * Bug Description:
 * - If a task was assigned to the user AND created by the user
 * - The user couldn't delete the task from the project
 * - This was due to incorrect permission logic priority
 * 
 * Fix:
 * - Creator permissions now have higher priority than assignee permissions
 * - If user created the task, they can delete it regardless of assignment
 */

import { canUserPerformTaskAction } from '../src/lib/roles'

// Mock database for testing
const mockTasks = {
  'task-created-and-assigned': {
    id: 'task-created-and-assigned',
    title: 'Task Created and Assigned to Same User',
    creatorId: 'user-123',
    assigneeId: 'user-123', // Same user is both creator and assignee
    project: {
      id: 'project-1',
      ownerId: 'project-owner',
      workspaceId: 'workspace-1'
    }
  },
  'task-only-assigned': {
    id: 'task-only-assigned',
    title: 'Task Only Assigned to User',
    creatorId: 'other-user',
    assigneeId: 'user-123', // User is only assigned, not creator
    project: {
      id: 'project-1',
      ownerId: 'project-owner',
      workspaceId: 'workspace-1'
    }
  },
  'task-only-created': {
    id: 'task-only-created',
    title: 'Task Only Created by User',
    creatorId: 'user-123',
    assigneeId: 'other-user', // User is creator but not assigned
    project: {
      id: 'project-1',
      ownerId: 'project-owner',
      workspaceId: 'workspace-1'
    }
  }
}

// Test scenarios
const testTaskDeletionPermissions = async () => {
  console.log('🧪 Testing Task Deletion Permission Fix...')
  console.log('==========================================')
  
  try {
    // Test Case 1: User created task AND is assigned to it
    console.log('\n📋 Test Case 1: Creator + Assignee')
    console.log('User created task AND is assigned to it')
    console.log('Expected: Should be able to DELETE ✅')
    
    const canDeleteCreatedAndAssigned = await canUserPerformTaskAction(
      'user-123',
      'task-created-and-assigned',
      'canDeleteTask'
    )
    
    console.log(`Result: ${canDeleteCreatedAndAssigned ? '✅ CAN DELETE' : '❌ CANNOT DELETE'}`)
    
    if (canDeleteCreatedAndAssigned) {
      console.log('✅ PASS: Creator can delete task even when assigned')
    } else {
      console.log('❌ FAIL: Creator should be able to delete task they created')
    }
    
    // Test Case 2: User is only assigned to task (not creator)
    console.log('\n📋 Test Case 2: Only Assignee')
    console.log('User is assigned to task but did not create it')
    console.log('Expected: Should NOT be able to DELETE ❌')
    
    const canDeleteOnlyAssigned = await canUserPerformTaskAction(
      'user-123',
      'task-only-assigned',
      'canDeleteTask'
    )
    
    console.log(`Result: ${canDeleteOnlyAssigned ? '✅ CAN DELETE' : '❌ CANNOT DELETE'}`)
    
    if (!canDeleteOnlyAssigned) {
      console.log('✅ PASS: Assignee cannot delete task they did not create')
    } else {
      console.log('❌ FAIL: Assignee should not be able to delete task they did not create')
    }
    
    // Test Case 3: User created task but is not assigned to it
    console.log('\n📋 Test Case 3: Only Creator')
    console.log('User created task but is not assigned to it')
    console.log('Expected: Should be able to DELETE ✅')
    
    const canDeleteOnlyCreated = await canUserPerformTaskAction(
      'user-123',
      'task-only-created',
      'canDeleteTask'
    )
    
    console.log(`Result: ${canDeleteOnlyCreated ? '✅ CAN DELETE' : '❌ CANNOT DELETE'}`)
    
    if (canDeleteOnlyCreated) {
      console.log('✅ PASS: Creator can delete task even when not assigned')
    } else {
      console.log('❌ FAIL: Creator should be able to delete task they created')
    }
    
    // Test editing permissions as well
    console.log('\n📝 Test Case 4: Edit Permissions')
    console.log('All scenarios above should also allow EDITING')
    
    const canEditCreatedAndAssigned = await canUserPerformTaskAction(
      'user-123',
      'task-created-and-assigned',
      'canEditTask'
    )
    
    const canEditOnlyAssigned = await canUserPerformTaskAction(
      'user-123',
      'task-only-assigned',
      'canEditTask'
    )
    
    const canEditOnlyCreated = await canUserPerformTaskAction(
      'user-123',
      'task-only-created',
      'canEditTask'
    )
    
    console.log(`Creator + Assignee can edit: ${canEditCreatedAndAssigned ? '✅' : '❌'}`)
    console.log(`Only Assignee can edit: ${canEditOnlyAssigned ? '✅' : '❌'}`)
    console.log(`Only Creator can edit: ${canEditOnlyCreated ? '✅' : '❌'}`)
    
    // Summary
    console.log('\n📊 TEST SUMMARY')
    console.log('===============')
    
    const allTests = [
      { name: 'Creator + Assignee can delete', passed: canDeleteCreatedAndAssigned },
      { name: 'Only Assignee cannot delete', passed: !canDeleteOnlyAssigned },
      { name: 'Only Creator can delete', passed: canDeleteOnlyCreated },
      { name: 'All can edit', passed: canEditCreatedAndAssigned && canEditOnlyAssigned && canEditOnlyCreated }
    ]
    
    const passedTests = allTests.filter(test => test.passed).length
    const totalTests = allTests.length
    
    console.log(`Tests Passed: ${passedTests}/${totalTests}`)
    
    if (passedTests === totalTests) {
      console.log('🎉 ALL TESTS PASSED! Bug fix is working correctly.')
    } else {
      console.log('❌ Some tests failed. Please check the permission logic.')
      allTests.forEach(test => {
        console.log(`  ${test.passed ? '✅' : '❌'} ${test.name}`)
      })
    }
    
  } catch (error) {
    console.error('Error running tests:', error)
  }
}

// Manual test instructions
const printManualTestInstructions = () => {
  console.log('\n📋 MANUAL TESTING INSTRUCTIONS')
  console.log('==============================')
  console.log('')
  console.log('To manually test the bug fix:')
  console.log('')
  console.log('1. 📝 CREATE A TASK:')
  console.log('   - Go to Tasks page or Dashboard')
  console.log('   - Create a new task')
  console.log('   - Assign it to yourself')
  console.log('   - Make sure you are both creator and assignee')
  console.log('')
  console.log('2. 🗑️ TRY TO DELETE THE TASK:')
  console.log('   - Find the task in your task list')
  console.log('   - Look for the delete button/option')
  console.log('   - Click to delete the task')
  console.log('   - It should work without permission errors')
  console.log('')
  console.log('3. ✅ EXPECTED BEHAVIOR:')
  console.log('   - Task deletion should succeed')
  console.log('   - No "Insufficient permissions" error')
  console.log('   - Task should be removed from the list')
  console.log('')
  console.log('4. 🔄 ADDITIONAL TESTS:')
  console.log('   - Try editing the task (should work)')
  console.log('   - Try creating a task assigned to someone else (should work)')
  console.log('   - Try deleting a task created by someone else but assigned to you (should fail)')
  console.log('')
  console.log('🐛 BEFORE THE FIX:')
  console.log('   - Users would get permission errors when trying to delete')
  console.log('   - Tasks created and assigned to the same user could not be deleted')
  console.log('   - This was due to assignee permission check overriding creator permissions')
  console.log('')
  console.log('✅ AFTER THE FIX:')
  console.log('   - Creator permissions have higher priority')
  console.log('   - Users can delete any task they created, regardless of assignment')
  console.log('   - Assignee-only users still cannot delete tasks they did not create')
}

// Browser console integration
if (typeof window !== 'undefined') {
  window.taskDeletionTests = {
    runTests: testTaskDeletionPermissions,
    printInstructions: printManualTestInstructions
  }
  
  console.log('🧪 Task Deletion Permission Tests Loaded!')
  console.log('=========================================')
  console.log('Available commands:')
  console.log('• window.taskDeletionTests.runTests() - Run automated tests')
  console.log('• window.taskDeletionTests.printInstructions() - Show manual testing guide')
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    testTaskDeletionPermissions,
    printManualTestInstructions
  }
}

export { testTaskDeletionPermissions, printManualTestInstructions }
