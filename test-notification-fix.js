#!/usr/bin/env node

/**
 * Test script to verify notification count updates when tasks are created
 * Run this in the browser console to test the fix
 */

async function testNotificationFix() {
  console.log('🧪 Testing Notification Count Fix')
  console.log('==================================')

  try {
    // Get initial notification count
    console.log('1. Getting initial notification count...')
    const initialResponse = await fetch('/api/notifications/count', {
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include'
    })
    
    if (!initialResponse.ok) {
      throw new Error(`Failed to get initial count: ${initialResponse.status}`)
    }
    
    const initialData = await initialResponse.json()
    const initialCount = initialData.count || 0
    console.log(`   Initial count: ${initialCount}`)

    // Create a test task
    console.log('\n2. Creating a test task...')
    const testTask = {
      title: `Test Task ${Date.now()}`,
      description: 'Test task created to verify notification system',
      projectId: 'first-available-project', // Will need to be replaced with actual project ID
      priority: 'MEDIUM'
    }

    const createResponse = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        credentials: 'include'
      },
      body: JSON.stringify(testTask)
    })

    if (!createResponse.ok) {
      const errorData = await createResponse.json()
      throw new Error(`Failed to create task: ${createResponse.status} - ${errorData.error}`)
    }

    const createdTask = await createResponse.json()
    console.log(`   Created task: "${createdTask.title}" (ID: ${createdTask.id})`)

    // Wait a moment for notification processing
    console.log('\n3. Waiting for notification processing...')
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Check updated notification count
    console.log('\n4. Checking updated notification count...')
    const updatedResponse = await fetch('/api/notifications/count', {
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      cache: 'no-cache'
    })

    if (!updatedResponse.ok) {
      throw new Error(`Failed to get updated count: ${updatedResponse.status}`)
    }

    const updatedData = await updatedResponse.json()
    const updatedCount = updatedData.count || 0
    console.log(`   Updated count: ${updatedCount}`)

    // Verify the count increased
    console.log('\n5. Results:')
    const countIncreased = updatedCount > initialCount
    console.log(`   Count increased: ${countIncreased} (${initialCount} → ${updatedCount})`)
    
    if (countIncreased) {
      console.log('✅ SUCCESS: Notification count updated correctly!')
    } else {
      console.log('❌ ISSUE: Notification count did not increase')
      console.log('   This might indicate:')
      console.log('   - Socket connection issues')
      console.log('   - Notification creation problems')
      console.log('   - Database sync issues')
    }

    // Test socket connection status
    console.log('\n6. Socket connection status:')
    if (window.socket) {
      console.log(`   Socket connected: ${window.socket.connected}`)
      console.log(`   Socket ID: ${window.socket.id}`)
    } else {
      console.log('   ⚠️  No socket instance found')
    }

    return {
      success: countIncreased,
      initialCount,
      updatedCount,
      taskCreated: createdTask.id
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message)
    return {
      success: false,
      error: error.message
    }
  }
}

// Instructions for running the test
console.log(`
🧪 NOTIFICATION FIX TEST INSTRUCTIONS
====================================

To test the notification count fix:

1. Open your browser's Developer Tools (F12)
2. Go to the Console tab
3. Make sure you're logged in to the app
4. Copy and paste this entire script into the console
5. Run: testNotificationFix()

This will:
- Get your current notification count
- Create a test task (which should trigger a notification)
- Check if the notification count increased
- Report whether the fix is working

Note: You need to have at least one project to create a task.
Check /projects page to see your available projects first.
`)

// Export for browser use
if (typeof window !== 'undefined') {
  window.testNotificationFix = testNotificationFix
}

// Export for Node.js use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { testNotificationFix }
}
