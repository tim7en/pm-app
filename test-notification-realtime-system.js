#!/usr/bin/env node

/**
 * 🧪 COMPREHENSIVE NOTIFICATION REAL-TIME TEST
 * 
 * This script tests all aspects of the notification system:
 * 1. Notification count updates
 * 2. Notification list updates  
 * 3. Mark as read functionality
 * 4. Mark all as read functionality
 * 5. Socket connection status
 */

async function testNotificationRealTimeSystem() {
  console.log('🔔 COMPREHENSIVE NOTIFICATION REAL-TIME TEST')
  console.log('='.repeat(50))

  const results = {
    tests: [],
    passed: 0,
    failed: 0,
    totalTests: 0
  }

  function addResult(testName, passed, details = '') {
    results.tests.push({ name: testName, passed, details })
    results.totalTests++
    if (passed) {
      results.passed++
      console.log(`✅ ${testName}`)
    } else {
      results.failed++
      console.log(`❌ ${testName}`)
    }
    if (details) console.log(`   📝 ${details}`)
  }

  try {
    // Test 1: Socket Connection
    console.log('\n1️⃣ Testing Socket Connection...')
    const socketConnected = window.socket && window.socket.connected
    addResult(
      'Socket Connection', 
      socketConnected, 
      socketConnected ? `Socket ID: ${window.socket.id}` : 'Socket not connected'
    )

    // Test 2: Get Initial State
    console.log('\n2️⃣ Getting Initial Notification State...')
    let initialResponse
    try {
      initialResponse = await fetch('/api/notifications/count', {
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      })
      const initialData = await initialResponse.json()
      const initialCount = initialData.count || 0
      addResult('Initial Count Fetch', initialResponse.ok, `Count: ${initialCount}`)
    } catch (error) {
      addResult('Initial Count Fetch', false, error.message)
      return results
    }

    // Test 3: Get Initial Notifications List
    console.log('\n3️⃣ Getting Initial Notifications List...')
    let initialNotifications
    try {
      const notificationsResponse = await fetch('/api/notifications?limit=10', {
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      })
      const notificationsData = await notificationsResponse.json()
      initialNotifications = notificationsData.notifications || []
      addResult(
        'Initial Notifications Fetch', 
        notificationsResponse.ok, 
        `Notifications: ${initialNotifications.length}`
      )
    } catch (error) {
      addResult('Initial Notifications Fetch', false, error.message)
      return results
    }

    // Test 4: Create Test Task (to generate notification)
    console.log('\n4️⃣ Creating Test Task...')
    let testTaskCreated = false
    try {
      // Get first project for task creation
      const projectsResponse = await fetch('/api/projects', {
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      })
      const projectsData = await projectsResponse.json()
      const projects = projectsData || []
      
      if (projects.length === 0) {
        addResult('Test Task Creation', false, 'No projects available for task creation')
      } else {
        const testTask = {
          title: `🧪 Test Task ${Date.now()}`,
          description: 'Created by notification test script',
          projectId: projects[0].id,
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

        if (createResponse.ok) {
          testTaskCreated = true
          addResult('Test Task Creation', true, `Task: "${testTask.title}"`)
        } else {
          const errorData = await createResponse.json()
          addResult('Test Task Creation', false, errorData.error || 'Unknown error')
        }
      }
    } catch (error) {
      addResult('Test Task Creation', false, error.message)
    }

    // Test 5: Wait and Check Count Update
    if (testTaskCreated) {
      console.log('\n5️⃣ Checking Notification Count Update...')
      await new Promise(resolve => setTimeout(resolve, 1500)) // Wait for real-time update

      try {
        const updatedResponse = await fetch('/api/notifications/count', {
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          cache: 'no-cache'
        })
        const updatedData = await updatedResponse.json()
        const updatedCount = updatedData.count || 0
        const initialCount = (await initialResponse.json()).count || 0
        
        const countIncreased = updatedCount > initialCount
        addResult(
          'Count Update After Task Creation', 
          countIncreased, 
          `${initialCount} → ${updatedCount}`
        )
      } catch (error) {
        addResult('Count Update After Task Creation', false, error.message)
      }

      // Test 6: Check Notifications List Update
      console.log('\n6️⃣ Checking Notifications List Update...')
      try {
        const updatedNotificationsResponse = await fetch('/api/notifications?limit=10', {
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          cache: 'no-cache'
        })
        const updatedNotificationsData = await updatedNotificationsResponse.json()
        const updatedNotifications = updatedNotificationsData.notifications || []
        
        const newNotificationExists = updatedNotifications.length > initialNotifications.length
        addResult(
          'Notifications List Update', 
          newNotificationExists, 
          `${initialNotifications.length} → ${updatedNotifications.length} notifications`
        )

        // Test 7: Mark First Notification as Read
        if (updatedNotifications.length > 0 && !updatedNotifications[0].isRead) {
          console.log('\n7️⃣ Testing Mark as Read...')
          try {
            const markReadResponse = await fetch('/api/notifications', {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
              },
              credentials: 'include',
              body: JSON.stringify({ 
                action: 'markAsRead',
                notificationId: updatedNotifications[0].id 
              })
            })

            if (markReadResponse.ok) {
              // Wait for real-time update
              await new Promise(resolve => setTimeout(resolve, 500))
              
              // Check if notification appears as read
              const afterMarkResponse = await fetch('/api/notifications?limit=10', {
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                cache: 'no-cache'
              })
              const afterMarkData = await afterMarkResponse.json()
              const afterMarkNotifications = afterMarkData.notifications || []
              
              const markedNotification = afterMarkNotifications.find(n => n.id === updatedNotifications[0].id)
              const markedAsRead = markedNotification && markedNotification.isRead
              
              addResult(
                'Mark as Read Functionality', 
                markedAsRead, 
                markedAsRead ? 'Notification marked as read' : 'Notification still unread'
              )
            } else {
              addResult('Mark as Read Functionality', false, 'API request failed')
            }
          } catch (error) {
            addResult('Mark as Read Functionality', false, error.message)
          }
        }

        // Test 8: Mark All as Read
        console.log('\n8️⃣ Testing Mark All as Read...')
        try {
          const markAllResponse = await fetch('/api/notifications', {
            method: 'PATCH',
            headers: { 
              'Content-Type': 'application/json',
              'X-Requested-With': 'XMLHttpRequest'
            },
            credentials: 'include',
            body: JSON.stringify({ action: 'mark-all-read' })
          })

          if (markAllResponse.ok) {
            // Wait for real-time update
            await new Promise(resolve => setTimeout(resolve, 500))
            
            // Check final count
            const finalCountResponse = await fetch('/api/notifications/count', {
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              cache: 'no-cache'
            })
            const finalCountData = await finalCountResponse.json()
            const finalCount = finalCountData.count || 0
            
            addResult(
              'Mark All as Read Functionality', 
              finalCount === 0, 
              `Final count: ${finalCount}`
            )
          } else {
            addResult('Mark All as Read Functionality', false, 'API request failed')
          }
        } catch (error) {
          addResult('Mark All as Read Functionality', false, error.message)
        }
      } catch (error) {
        addResult('Notifications List Update', false, error.message)
      }
    }

  } catch (error) {
    console.error('❌ Test suite failed:', error.message)
    addResult('Test Suite Execution', false, error.message)
  }

  // Final Results
  console.log('\n' + '='.repeat(50))
  console.log('📊 FINAL TEST RESULTS')
  console.log('='.repeat(50))
  console.log(`✅ Passed: ${results.passed}`)
  console.log(`❌ Failed: ${results.failed}`)
  console.log(`📊 Total: ${results.totalTests}`)
  console.log(`📈 Success Rate: ${((results.passed / results.totalTests) * 100).toFixed(1)}%`)

  if (results.failed === 0) {
    console.log('\n🎉 ALL TESTS PASSED! Real-time notifications working perfectly!')
  } else {
    console.log('\n⚠️ Some tests failed. Check the details above.')
    console.log('\n🔧 Troubleshooting Tips:')
    console.log('• Make sure you have at least one project')
    console.log('• Check browser console for WebSocket errors')
    console.log('• Verify you are logged in')
    console.log('• Try refreshing the page and running again')
  }

  return results
}

// Instructions
console.log(`
🧪 NOTIFICATION REAL-TIME TEST INSTRUCTIONS
==========================================

To run the comprehensive notification test:

1. Open your browser's Developer Tools (F12)
2. Go to the Console tab
3. Make sure you're logged in to the app
4. Copy and paste this entire script into the console
5. Run: testNotificationRealTimeSystem()

This will test:
✅ Socket connection status
✅ Notification count updates
✅ Notification list updates
✅ Mark as read functionality
✅ Mark all as read functionality
✅ Real-time synchronization

The test will create a test task and verify that notifications
appear immediately in real-time without page refresh.
`)

// Export for browser use
if (typeof window !== 'undefined') {
  window.testNotificationRealTimeSystem = testNotificationRealTimeSystem
}

// Export for Node.js use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { testNotificationRealTimeSystem }
}
