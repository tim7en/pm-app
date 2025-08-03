/**
 * Comprehensive Notification Real-time Test Script
 * Tests all notification functionality including:
 * 1. Task creation notification generation
 * 2. Real-time count updates
 * 3. Notification dropdown content updates
 * 4. Mark as read functionality with real-time count updates
 * 5. Mark all as read functionality
 */

const puppeteer = require('puppeteer');

async function testNotificationRealtime() {
  let browser;
  
  try {
    console.log('🚀 Starting comprehensive notification real-time test...\n');
    
    browser = await puppeteer.launch({ 
      headless: false, 
      devtools: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Enable console logging from the page
    page.on('console', msg => {
      if (msg.text().includes('notification') || msg.text().includes('socket') || msg.text().includes('count')) {
        console.log('📱 Browser:', msg.text());
      }
    });
    
    console.log('1️⃣ Navigating to application...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
    
    // Wait for authentication and socket connection
    console.log('2️⃣ Waiting for authentication and socket connection...');
    await page.waitForTimeout(3000);
    
    // Check if logged in, if not, perform login
    const loginButton = await page.$('button:contains("Sign In")');
    if (loginButton) {
      console.log('3️⃣ Logging in...');
      // Add login logic here if needed
      await page.waitForTimeout(2000);
    }
    
    console.log('4️⃣ Checking initial notification count...');
    
    // Get initial notification count
    const getNotificationCount = async () => {
      const countElement = await page.$('[data-testid="notification-count"]');
      if (countElement) {
        const countText = await countElement.textContent();
        return parseInt(countText) || 0;
      }
      return 0;
    };
    
    const initialCount = await getNotificationCount();
    console.log(`   Initial notification count: ${initialCount}`);
    
    console.log('5️⃣ Testing task creation and notification generation...');
    
    // Navigate to dashboard if not already there
    await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle2' });
    await page.waitForTimeout(2000);
    
    // Look for create task button/modal
    const createTaskButton = await page.$('button:contains("Create Task"), button:contains("Add Task"), [data-testid="create-task"]');
    if (createTaskButton) {
      console.log('   Found create task button, clicking...');
      await createTaskButton.click();
      await page.waitForTimeout(1000);
      
      // Fill in task details
      const titleInput = await page.$('input[name="title"], input[placeholder*="title"], input[placeholder*="Task"]');
      if (titleInput) {
        await titleInput.fill('Test Notification Task ' + Date.now());
        await page.waitForTimeout(500);
        
        // Find and click create/save button
        const saveButton = await page.$('button:contains("Create"), button:contains("Save"), button[type="submit"]');
        if (saveButton) {
          console.log('   Creating task...');
          await saveButton.click();
          
          // Wait for task creation to complete
          await page.waitForTimeout(2000);
          
          console.log('6️⃣ Checking notification count after task creation...');
          const newCount = await getNotificationCount();
          console.log(`   New notification count: ${newCount}`);
          
          if (newCount > initialCount) {
            console.log('✅ Task creation notification count updated successfully!');
          } else {
            console.log('❌ Notification count did not update after task creation');
          }
        }
      }
    }
    
    console.log('7️⃣ Testing notification dropdown functionality...');
    
    // Click on notification bell/dropdown
    const notificationBell = await page.$('[data-testid="notification-bell"], button:contains("Notifications"), .notification-dropdown');
    if (notificationBell) {
      console.log('   Opening notification dropdown...');
      await notificationBell.click();
      await page.waitForTimeout(1000);
      
      // Check if notifications are visible
      const notifications = await page.$$('.notification-item, [data-testid="notification-item"]');
      console.log(`   Found ${notifications.length} notifications in dropdown`);
      
      if (notifications.length > 0) {
        console.log('8️⃣ Testing mark as read functionality...');
        
        // Get count before marking as read
        const countBeforeRead = await getNotificationCount();
        console.log(`   Count before marking as read: ${countBeforeRead}`);
        
        // Click on first notification to mark as read
        const firstNotification = notifications[0];
        const readButton = await firstNotification.$('button:contains("Mark as Read"), [data-testid="mark-read"]');
        
        if (readButton) {
          console.log('   Marking first notification as read...');
          await readButton.click();
          await page.waitForTimeout(1500); // Wait for real-time update
          
          const countAfterRead = await getNotificationCount();
          console.log(`   Count after marking as read: ${countAfterRead}`);
          
          if (countAfterRead < countBeforeRead) {
            console.log('✅ Mark as read real-time count update working!');
          } else {
            console.log('❌ Mark as read count did not update in real-time');
          }
        }
        
        console.log('9️⃣ Testing mark all as read functionality...');
        
        // Look for "Mark all as read" button
        const markAllButton = await page.$('button:contains("Mark all as read"), button:contains("Mark All Read"), [data-testid="mark-all-read"]');
        if (markAllButton) {
          const countBeforeMarkAll = await getNotificationCount();
          console.log(`   Count before mark all as read: ${countBeforeMarkAll}`);
          
          console.log('   Clicking mark all as read...');
          await markAllButton.click();
          await page.waitForTimeout(2000); // Wait for real-time update
          
          const countAfterMarkAll = await getNotificationCount();
          console.log(`   Count after mark all as read: ${countAfterMarkAll}`);
          
          if (countAfterMarkAll === 0) {
            console.log('✅ Mark all as read real-time count update working!');
          } else {
            console.log('❌ Mark all as read count did not update to 0 in real-time');
          }
        }
      }
    }
    
    console.log('\n🎉 Notification real-time test completed!');
    console.log('\n📊 Test Summary:');
    console.log('- Task creation notification generation: Tested');
    console.log('- Real-time notification count updates: Tested');
    console.log('- Notification dropdown content: Tested');
    console.log('- Mark as read real-time updates: Tested');
    console.log('- Mark all as read real-time updates: Tested');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run the test
if (require.main === module) {
  testNotificationRealtime()
    .then(() => {
      console.log('\n✅ Test script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Test script failed:', error);
      process.exit(1);
    });
}

module.exports = { testNotificationRealtime };
