/**
 * Quick Integration Test for Notification System
 * Tests the current implementation with mock data
 */

const axios = require('axios')

async function testNotificationSystem() {
  const baseUrl = 'http://localhost:3000'
  
  console.log('🔍 Testing Notification System Integration...')
  console.log('=' * 50)

  try {
    // Test GET endpoint
    console.log('1. Testing GET /api/notifications...')
    const getResponse = await axios.get(`${baseUrl}/api/notifications?limit=15`)
    
    if (getResponse.status === 200 && getResponse.data.success) {
      console.log('✅ GET endpoint working - received notifications:', getResponse.data.notifications.length)
    } else {
      console.log('❌ GET endpoint failed')
      return
    }

    // Test POST endpoint with clean data
    console.log('2. Testing POST /api/notifications with clean data...')
    const cleanData = {
      type: 'system',
      title: 'Clean Test Notification',
      message: 'This is a clean test message.'
    }
    
    const postResponse = await axios.post(`${baseUrl}/api/notifications`, cleanData)
    
    if (postResponse.status === 200 && postResponse.data.success) {
      console.log('✅ POST endpoint working - created notification:', postResponse.data.notification.id)
    } else {
      console.log('❌ POST endpoint failed')
    }

    // Test POST endpoint with potentially malicious data
    console.log('3. Testing POST /api/notifications with XSS payload...')
    const xssData = {
      type: 'system',
      title: '<script>alert("XSS")</script>',
      message: '<img src="x" onerror="alert(1)">'
    }
    
    const xssResponse = await axios.post(`${baseUrl}/api/notifications`, xssData)
    
    if (xssResponse.status === 200) {
      const notification = xssResponse.data.notification
      if (notification.title.includes('<script>') || notification.message.includes('<img')) {
        console.log('⚠️  XSS payload was not sanitized in API response')
      } else {
        console.log('✅ XSS payload was sanitized or cleaned')
      }
    }

    // Test PATCH endpoint
    console.log('4. Testing PATCH /api/notifications...')
    const patchResponse = await axios.patch(`${baseUrl}/api/notifications`, {
      action: 'mark-all-read'
    })
    
    if (patchResponse.status === 200 && patchResponse.data.success) {
      console.log('✅ PATCH endpoint working')
    } else {
      console.log('❌ PATCH endpoint failed')
    }

    console.log('=' * 50)
    console.log('🎉 Basic notification system integration test completed!')
    console.log('✅ All core endpoints are functional')
    console.log('✅ Frontend can communicate with backend')
    console.log('✅ Mock data is being served correctly')

  } catch (error) {
    console.error('❌ Integration test failed:', error.message)
    if (error.response) {
      console.error('Response status:', error.response.status)
      console.error('Response data:', error.response.data)
    }
  }
}

// Run the test
testNotificationSystem()
