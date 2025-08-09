// Test script to verify socket notification count updates
async function testNotificationAPI() {
  try {
    console.log('=== TESTING NOTIFICATION API ENDPOINTS ===\n')
    
    // Test getting notification count
    console.log('1. Testing GET /api/notifications/count')
    const countResponse = await fetch('http://localhost:3000/api/notifications/count', {
      headers: {
        'Content-Type': 'application/json',
        'Cookie': document.cookie // Include session cookies
      }
    })
    
    if (countResponse.ok) {
      const countData = await countResponse.json()
      console.log('✅ Count API response:', countData)
    } else {
      console.log('❌ Count API failed:', countResponse.status)
    }
    
    // Test getting notifications list
    console.log('\n2. Testing GET /api/notifications')
    const listResponse = await fetch('http://localhost:3000/api/notifications?limit=5', {
      headers: {
        'Content-Type': 'application/json',
        'Cookie': document.cookie
      }
    })
    
    if (listResponse.ok) {
      const listData = await listResponse.json()
      console.log('✅ List API response:', {
        success: listData.success,
        total: listData.total,
        notificationCount: listData.notifications?.length
      })
      
      if (listData.notifications && listData.notifications.length > 0) {
        const firstNotif = listData.notifications[0]
        console.log('First notification:', {
          id: firstNotif.id,
          title: firstNotif.title,
          isRead: firstNotif.isRead
        })
        
        // Test marking as read
        if (!firstNotif.isRead) {
          console.log('\n3. Testing POST /api/notifications (mark as read)')
          const markReadResponse = await fetch('http://localhost:3000/api/notifications', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Requested-With': 'XMLHttpRequest',
              'Cookie': document.cookie
            },
            body: JSON.stringify({
              action: 'markAsRead',
              notificationId: firstNotif.id
            })
          })
          
          if (markReadResponse.ok) {
            const markReadData = await markReadResponse.json()
            console.log('✅ Mark as read response:', markReadData)
            
            // Check count again
            const newCountResponse = await fetch('http://localhost:3000/api/notifications/count', {
              headers: {
                'Content-Type': 'application/json',
                'Cookie': document.cookie
              }
            })
            
            if (newCountResponse.ok) {
              const newCountData = await newCountResponse.json()
              console.log('✅ New count after marking as read:', newCountData)
            }
            
            // Revert for testing
            console.log('\n4. Testing revert (mark as unread)')
            // Note: We'd need a separate endpoint for this in a real app
            console.log('⚠️ Revert would require additional API endpoint')
            
          } else {
            console.log('❌ Mark as read failed:', markReadResponse.status)
          }
        } else {
          console.log('⚠️ First notification is already read, skipping mark as read test')
        }
      }
    } else {
      console.log('❌ List API failed:', listResponse.status)
    }
    
  } catch (error) {
    console.error('❌ Test error:', error)
  }
}

// Run test
testNotificationAPI()
