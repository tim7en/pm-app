/**
 * 🧪 WORKSPACE MANAGEMENT QA/QC TEST SUITE
 * Comprehensive testing for workspace creation, switching, and error handling
 */

const { chromium } = require('playwright');
const { expect } = require('@playwright/test');

class WorkspaceManagementQA {
  constructor() {
    this.browser = null;
    this.page = null;
    this.baseURL = process.env.BASE_URL || 'http://localhost:3001';
    this.testResults = {
      total: 0,
      passed: 0,
      failed: 0,
      errors: []
    };
  }

  async setup() {
    console.log('🚀 Setting up Workspace Management QA Suite...');
    this.browser = await chromium.launch({ headless: false });
    this.page = await this.browser.newPage();
    
    // Enable console logging
    this.page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('❌ Console Error:', msg.text());
      }
    });
    
    // Listen for network errors
    this.page.on('response', response => {
      if (response.status() >= 400) {
        console.log(`🌐 Network Error: ${response.status()} - ${response.url()}`);
      }
    });
  }

  async teardown() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async login(email = 'tim7en@gmail.com', password = 'password123') {
    console.log('🔐 Logging in...');
    await this.page.goto(`${this.baseURL}/auth/login`);
    await this.page.fill('input[type="email"]', email);
    await this.page.fill('input[type="password"]', password);
    await this.page.click('button[type="submit"]');
    await this.page.waitForURL(/\/(dashboard|workspaces|\/)/, { timeout: 10000 });
  }

  async runTest(testName, testFunction) {
    console.log(`\n🧪 Running: ${testName}`);
    this.testResults.total++;
    
    try {
      await testFunction();
      console.log(`✅ PASSED: ${testName}`);
      this.testResults.passed++;
    } catch (error) {
      console.log(`❌ FAILED: ${testName}`);
      console.log(`   Error: ${error.message}`);
      this.testResults.failed++;
      this.testResults.errors.push({
        test: testName,
        error: error.message,
        stack: error.stack
      });
    }
  }

  // =============================================
  // 🧪 CORE WORKSPACE CREATION TESTS
  // =============================================

  async testWorkspaceCreation() {
    await this.runTest('Create New Workspace', async () => {
      await this.page.goto(`${this.baseURL}/workspaces`);
      
      // Click create workspace button
      await this.page.click('text=Create Workspace');
      
      // Fill in workspace details
      const workspaceName = `Test Workspace ${Date.now()}`;
      await this.page.fill('input[placeholder*="workspace name"]', workspaceName);
      await this.page.fill('textarea[placeholder*="describe"]', 'Test workspace description');
      
      // Submit form
      await this.page.click('button[type="submit"]');
      
      // Check for success and proper redirect
      const currentURL = await this.page.url();
      
      // Should NOT redirect to /dashboard (this is the bug)
      if (currentURL.includes('/dashboard')) {
        throw new Error('❌ BUG CONFIRMED: Redirects to /dashboard which returns 404');
      }
      
      // Should redirect to root (/) or stay on workspaces page
      if (!currentURL.endsWith('/') && !currentURL.includes('/workspaces')) {
        throw new Error(`Unexpected redirect to: ${currentURL}`);
      }
      
      // Check for success message
      const successMessage = await this.page.textContent('.toast', { timeout: 5000 });
      if (!successMessage || !successMessage.includes('successfully')) {
        throw new Error('No success message displayed');
      }
    });
  }

  async testWorkspaceCreationValidation() {
    await this.runTest('Workspace Creation Validation', async () => {
      await this.page.goto(`${this.baseURL}/workspaces`);
      
      // Try to create workspace with empty name
      await this.page.click('text=Create Workspace');
      await this.page.click('button[type="submit"]');
      
      // Should show validation error
      const errorMessage = await this.page.textContent('.text-destructive', { timeout: 3000 });
      if (!errorMessage || !errorMessage.includes('required')) {
        throw new Error('Validation error not shown for empty workspace name');
      }
    });
  }

  async testWorkspaceCreationError() {
    await this.runTest('Workspace Creation Error Handling', async () => {
      // Mock network error
      await this.page.route('**/api/workspaces', route => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal server error' })
        });
      });
      
      await this.page.goto(`${this.baseURL}/workspaces`);
      await this.page.click('text=Create Workspace');
      await this.page.fill('input[placeholder*="workspace name"]', 'Test Workspace');
      await this.page.click('button[type="submit"]');
      
      // Should show error message
      const errorMessage = await this.page.textContent('.toast', { timeout: 5000 });
      if (!errorMessage || !errorMessage.includes('error')) {
        throw new Error('Error message not displayed for failed workspace creation');
      }
    });
  }

  // =============================================
  // 🧪 WORKSPACE SWITCHING TESTS
  // =============================================

  async testWorkspaceSwitching() {
    await this.runTest('Workspace Switching', async () => {
      await this.page.goto(`${this.baseURL}/workspaces`);
      
      // Find existing workspaces
      const workspaceCards = await this.page.$$('.cursor-pointer');
      if (workspaceCards.length === 0) {
        throw new Error('No workspaces found for switching test');
      }
      
      // Click on first workspace
      await workspaceCards[0].click();
      
      // Should redirect to dashboard/home
      await this.page.waitForURL(/\/(dashboard|\/)/, { timeout: 10000 });
      
      // Check if workspace context is loaded
      const workspaceSelector = await this.page.textContent('[data-testid="workspace-selector"]');
      if (!workspaceSelector) {
        console.log('⚠️  Warning: Workspace selector not found - may indicate context issue');
      }
    });
  }

  async testWorkspaceSelectorFunctionality() {
    await this.runTest('Workspace Selector Functionality', async () => {
      await this.page.goto(`${this.baseURL}/`);
      
      // Try to open workspace selector
      const workspaceSelector = await this.page.$('[data-testid="workspace-selector"]');
      if (workspaceSelector) {
        await workspaceSelector.click();
        
        // Should show list of workspaces
        const workspaceList = await this.page.$('.workspace-list');
        if (!workspaceList) {
          throw new Error('Workspace list not displayed when selector clicked');
        }
      } else {
        console.log('⚠️  Warning: Workspace selector not found in header');
      }
    });
  }

  // =============================================
  // 🧪 ERROR HANDLING TESTS
  // =============================================

  async test404ErrorPage() {
    await this.runTest('404 Error Page', async () => {
      await this.page.goto(`${this.baseURL}/nonexistent-page`);
      
      // Check if proper 404 page is shown
      const pageContent = await this.page.textContent('body');
      
      // Should show 404 or not found message
      if (!pageContent.toLowerCase().includes('404') && 
          !pageContent.toLowerCase().includes('not found') &&
          !pageContent.toLowerCase().includes('page not found')) {
        throw new Error('No proper 404 error page displayed');
      }
    });
  }

  async testDashboardRoute404() {
    await this.runTest('Dashboard Route 404 (Known Bug)', async () => {
      const response = await this.page.goto(`${this.baseURL}/dashboard`);
      
      // This should return 404 since /dashboard doesn't exist
      if (response.status() !== 404) {
        console.log(`⚠️  Expected 404 but got ${response.status()} - route may exist when it shouldn't`);
      }
    });
  }

  async testWorkspaceContextValidation() {
    await this.runTest('Workspace Context Validation', async () => {
      await this.page.goto(`${this.baseURL}/`);
      
      // Check if page handles missing workspace gracefully
      const pageErrors = [];
      this.page.on('pageerror', error => {
        pageErrors.push(error.message);
      });
      
      // Wait for page to load
      await this.page.waitForTimeout(3000);
      
      if (pageErrors.length > 0) {
        throw new Error(`Page errors detected: ${pageErrors.join(', ')}`);
      }
      
      // Check if proper fallback UI is shown for no workspace
      const noWorkspaceMessage = await this.page.textContent('body');
      if (noWorkspaceMessage.includes('undefined') || noWorkspaceMessage.includes('null')) {
        throw new Error('Undefined/null values displayed to user - poor error handling');
      }
    });
  }

  // =============================================
  // 🧪 EDGE CASE TESTS
  // =============================================

  async testEmptyWorkspaceState() {
    await this.runTest('Empty Workspace State', async () => {
      // Mock empty workspaces response
      await this.page.route('**/api/workspaces', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([])
        });
      });
      
      await this.page.goto(`${this.baseURL}/workspaces`);
      
      // Should show empty state message
      const emptyStateMessage = await this.page.textContent('body');
      if (!emptyStateMessage.includes('No workspaces') && 
          !emptyStateMessage.includes('Create your first')) {
        throw new Error('No proper empty state message for workspaces');
      }
    });
  }

  async testWorkspacePermissions() {
    await this.runTest('Workspace Permissions', async () => {
      // This would require multiple user accounts to test properly
      console.log('⚠️  Workspace permissions test requires multiple user setup');
      
      await this.page.goto(`${this.baseURL}/workspace/settings`);
      
      // Check if settings page loads (user should have access to their workspace)
      const settingsContent = await this.page.textContent('body');
      if (settingsContent.includes('Access denied') || settingsContent.includes('Unauthorized')) {
        throw new Error('User denied access to own workspace settings');
      }
    });
  }

  async testConcurrentWorkspaceOperations() {
    await this.runTest('Concurrent Workspace Operations', async () => {
      // Test creating multiple workspaces quickly
      const promises = [];
      
      for (let i = 0; i < 3; i++) {
        promises.push(
          this.page.evaluate(async (index) => {
            const response = await fetch('/api/workspaces', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
              },
              body: JSON.stringify({
                name: `Concurrent Workspace ${index}`,
                description: 'Test concurrent creation'
              })
            });
            return response.status;
          }, i)
        );
      }
      
      const results = await Promise.all(promises);
      
      // All should succeed (201) or show proper error handling
      const failedResults = results.filter(status => status !== 201 && status !== 400);
      if (failedResults.length > 0) {
        throw new Error(`Concurrent operations failed with statuses: ${failedResults.join(', ')}`);
      }
    });
  }

  // =============================================
  // 🧪 PERFORMANCE TESTS
  // =============================================

  async testWorkspaceLoadingPerformance() {
    await this.runTest('Workspace Loading Performance', async () => {
      const startTime = Date.now();
      
      await this.page.goto(`${this.baseURL}/workspaces`);
      await this.page.waitForSelector('.workspace-card', { timeout: 10000 });
      
      const loadTime = Date.now() - startTime;
      
      if (loadTime > 5000) {
        throw new Error(`Workspace loading too slow: ${loadTime}ms (should be < 5000ms)`);
      }
      
      console.log(`   ⚡ Load time: ${loadTime}ms`);
    });
  }

  async testWorkspaceSwitchingPerformance() {
    await this.runTest('Workspace Switching Performance', async () => {
      await this.page.goto(`${this.baseURL}/workspaces`);
      
      const workspaceCards = await this.page.$$('.cursor-pointer');
      if (workspaceCards.length === 0) return;
      
      const startTime = Date.now();
      await workspaceCards[0].click();
      await this.page.waitForURL(/\/(dashboard|\/)/, { timeout: 10000 });
      
      const switchTime = Date.now() - startTime;
      
      if (switchTime > 3000) {
        throw new Error(`Workspace switching too slow: ${switchTime}ms (should be < 3000ms)`);
      }
      
      console.log(`   ⚡ Switch time: ${switchTime}ms`);
    });
  }

  // =============================================
  // 🧪 SECURITY TESTS
  // =============================================

  async testWorkspaceApiSecurity() {
    await this.runTest('Workspace API Security', async () => {
      // Test API without authentication
      const response = await this.page.evaluate(async () => {
        // Remove auth token temporarily
        const originalToken = localStorage.getItem('auth-token');
        localStorage.removeItem('auth-token');
        
        const response = await fetch('/api/workspaces', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'Unauthorized Workspace' })
        });
        
        // Restore token
        if (originalToken) {
          localStorage.setItem('auth-token', originalToken);
        }
        
        return response.status;
      });
      
      if (response !== 401) {
        throw new Error(`API should return 401 for unauthenticated requests, got ${response}`);
      }
    });
  }

  async testWorkspaceXSSPrevention() {
    await this.runTest('Workspace XSS Prevention', async () => {
      await this.page.goto(`${this.baseURL}/workspaces`);
      
      // Try to create workspace with XSS payload
      await this.page.click('text=Create Workspace');
      const xssPayload = '<script>alert("xss")</script>';
      await this.page.fill('input[placeholder*="workspace name"]', xssPayload);
      await this.page.fill('textarea[placeholder*="describe"]', xssPayload);
      
      // Submit and check if XSS is executed
      let alertFired = false;
      this.page.on('dialog', async dialog => {
        alertFired = true;
        await dialog.accept();
      });
      
      await this.page.click('button[type="submit"]');
      await this.page.waitForTimeout(2000);
      
      if (alertFired) {
        throw new Error('XSS vulnerability detected - script executed');
      }
    });
  }

  // =============================================
  // 🎯 MAIN TEST RUNNER
  // =============================================

  async runAllTests() {
    console.log('\n🎯 WORKSPACE MANAGEMENT QA/QC TEST SUITE');
    console.log('==========================================\n');
    
    await this.setup();
    await this.login();
    
    // Core Functionality Tests
    console.log('\n📋 CORE FUNCTIONALITY TESTS');
    console.log('----------------------------');
    await this.testWorkspaceCreation();
    await this.testWorkspaceCreationValidation();
    await this.testWorkspaceCreationError();
    await this.testWorkspaceSwitching();
    await this.testWorkspaceSelectorFunctionality();
    
    // Error Handling Tests
    console.log('\n🚨 ERROR HANDLING TESTS');
    console.log('------------------------');
    await this.test404ErrorPage();
    await this.testDashboardRoute404();
    await this.testWorkspaceContextValidation();
    
    // Edge Case Tests
    console.log('\n🔍 EDGE CASE TESTS');
    console.log('-------------------');
    await this.testEmptyWorkspaceState();
    await this.testWorkspacePermissions();
    await this.testConcurrentWorkspaceOperations();
    
    // Performance Tests
    console.log('\n⚡ PERFORMANCE TESTS');
    console.log('--------------------');
    await this.testWorkspaceLoadingPerformance();
    await this.testWorkspaceSwitchingPerformance();
    
    // Security Tests
    console.log('\n🔒 SECURITY TESTS');
    console.log('------------------');
    await this.testWorkspaceApiSecurity();
    await this.testWorkspaceXSSPrevention();
    
    await this.teardown();
    
    // Generate Report
    this.generateReport();
  }

  generateReport() {
    console.log('\n\n📊 TEST RESULTS SUMMARY');
    console.log('========================');
    console.log(`✅ Passed: ${this.testResults.passed}`);
    console.log(`❌ Failed: ${this.testResults.failed}`);
    console.log(`📊 Total:  ${this.testResults.total}`);
    console.log(`📈 Success Rate: ${((this.testResults.passed / this.testResults.total) * 100).toFixed(1)}%`);
    
    if (this.testResults.failed > 0) {
      console.log('\n❌ FAILED TESTS:');
      console.log('=================');
      this.testResults.errors.forEach(error => {
        console.log(`\n🔍 ${error.test}`);
        console.log(`   Error: ${error.error}`);
      });
    }
    
    // Production Readiness Assessment
    const successRate = (this.testResults.passed / this.testResults.total) * 100;
    
    console.log('\n🎯 PRODUCTION READINESS ASSESSMENT');
    console.log('===================================');
    
    if (successRate >= 95) {
      console.log('🟢 STATUS: PRODUCTION READY');
      console.log('   All critical tests passed. Minor issues may exist.');
    } else if (successRate >= 80) {
      console.log('🟡 STATUS: NEEDS ATTENTION');
      console.log('   Some issues found. Review and fix before production.');
    } else {
      console.log('🔴 STATUS: NOT PRODUCTION READY');
      console.log('   Critical issues found. Major fixes required.');
    }
    
    console.log(`\n📋 Next Steps:`);
    console.log(`   1. Fix all failed tests`);
    console.log(`   2. Re-run QA suite`);
    console.log(`   3. Conduct manual testing`);
    console.log(`   4. Deploy to staging environment`);
    console.log(`   5. Final production deployment`);
  }
}

// =============================================
// 🚀 RUN TESTS
// =============================================

if (require.main === module) {
  const qa = new WorkspaceManagementQA();
  qa.runAllTests().catch(console.error);
}

module.exports = WorkspaceManagementQA;
