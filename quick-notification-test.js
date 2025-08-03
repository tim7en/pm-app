/**
 * 🚀 QUICK NOTIFICATION TEST - BROWSER CONSOLE
 * 
 * Paste this into your browser console to quickly test real-time notifications
 */

// Quick Test Function
async function quickNotificationTest() {
  console.log('🔔 Quick Notification Test Starting...')
  
  // Check socket connection
  if (window.socket && window.socket.connected) {
    console.log('✅ Socket connected:', window.socket.id)
  } else {
    console.log('❌ Socket not connected')
    return
  }

  try {
    // Get initial count
    const initialResponse = await fetch('/api/notifications/count')
    const initialData = await initialResponse.json()
    const initialCount = initialData.count
    console.log('📊 Initial notification count:', initialCount)

    // Get projects to create a test task
    const projectsResponse = await fetch('/api/projects')
    const projects = await projectsResponse.json()
    
    if (projects.length === 0) {
      console.log('❌ No projects found. Create a project first.')
      return
    }

    console.log('📋 Creating test task...')
    
    // Create test task
    const testTask = {
      title: `🧪 Quick Test ${Date.now()}`,
      description: 'Testing real-time notifications',
      projectId: projects[0].id,
      priority: 'MEDIUM'
    }

    const taskResponse = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testTask)
    })

    if (taskResponse.ok) {
      console.log('✅ Test task created successfully!')
      
      // Wait a moment for real-time update
      setTimeout(async () => {
        const updatedResponse = await fetch('/api/notifications/count')
        const updatedData = await updatedResponse.json()
        const updatedCount = updatedData.count
        
        console.log('📊 Updated notification count:', updatedCount)
        
        if (updatedCount > initialCount) {
          console.log('🎉 SUCCESS! Notification count updated in real-time!')
        } else {
          console.log('⚠️ Count did not increase. Check implementation.')
        }
      }, 1000)
      
    } else {
      console.log('❌ Failed to create test task')
    }

  } catch (error) {
    console.log('❌ Test failed:', error.message)
  }
}

// Socket event listeners test
function listenToSocketEvents() {
  if (!window.socket) {
    console.log('❌ Socket not available')
    return
  }

  console.log('👂 Setting up socket event listeners...')
  
  // Listen for notification events
  window.socket.on('notification-count-updated', (data) => {
    console.log('🔔 Received notification-count-updated:', data)
  })

  window.socket.on('notification-read', (data) => {
    console.log('📖 Received notification-read:', data)
  })

  window.socket.on('notifications-mark-all-read', (data) => {
    console.log('📚 Received notifications-mark-all-read:', data)
  })

  console.log('✅ Socket event listeners active')
}

// Instructions
console.log(`
🧪 QUICK NOTIFICATION TEST
=========================

Run these commands in your browser console:

1. Test real-time notifications:
   quickNotificationTest()

2. Listen to socket events:
   listenToSocketEvents()

3. Manual socket check:
   console.log('Socket status:', window.socket?.connected)

`)

// Make functions available globally
window.quickNotificationTest = quickNotificationTest
window.listenToSocketEvents = listenToSocketEvents
