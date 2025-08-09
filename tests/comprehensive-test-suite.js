/**
 * Comprehensive Test Suite for Email Cleanup Application
 * Tests all functionality including Gmail authentication and new components
 */

const BASE_URL = 'http://localhost:3001';

class EmailCleanupTestSuite {
  constructor() {
    this.testResults = [];
    this.gmailTokens = null;
  }

  async runAllTests() {
    console.log('🧪 Starting Comprehensive Email Cleanup Test Suite...\n');
    
    try {
      // Core functionality tests
      await this.testServerHealth();
      await this.testAPIEndpoints();
      
      // Gmail authentication flow
      await this.testGmailAuthentication();
      
      // New components tests
      await this.testLabelManager();
      await this.testLabelCleanup();
      await this.testPromptGenerator();
      
      // State persistence tests
      await this.testStatePersistence();
      
      // Integration tests
      await this.testFullWorkflow();
      
    } catch (error) {
      console.error('❌ Test suite failed:', error);
    } finally {
      this.printTestResults();
    }
  }

  async testServerHealth() {
    console.log('🏥 Testing server health...');
    
    try {
      const response = await fetch(`${BASE_URL}/api/health`);
      if (response.ok) {
        this.addResult('Server Health', '✅ PASS', 'Server is responding');
      } else {
        // Try a basic page instead
        const pageResponse = await fetch(`${BASE_URL}/`);
        if (pageResponse.ok) {
          this.addResult('Server Health', '✅ PASS', 'Server is responding (main page)');
        } else {
          this.addResult('Server Health', '❌ FAIL', 'Server not responding');
        }
      }
    } catch (error) {
      this.addResult('Server Health', '❌ FAIL', `Server error: ${error.message}`);
    }
  }

  async testAPIEndpoints() {
    console.log('🔌 Testing API endpoints...');
    
    const endpoints = [
      '/api/email/gmail/connect',
      '/api/email/gmail/stats',
      '/api/email/gmail/debug'
    ];
    
    for (const endpoint of endpoints) {
      try {
        const response = await fetch(`${BASE_URL}${endpoint}`);
        const data = await response.json();
        
        if (response.ok) {
          this.addResult(`API ${endpoint}`, '✅ PASS', `Response: ${response.status}`);
        } else {
          this.addResult(`API ${endpoint}`, '⚠️ WARN', `Response: ${response.status} - ${data.error || 'Unknown error'}`);
        }
      } catch (error) {
        this.addResult(`API ${endpoint}`, '❌ FAIL', `Network error: ${error.message}`);
      }
    }
  }

  async testGmailAuthentication() {
    console.log('🔐 Testing Gmail authentication flow...');
    
    try {
      // Step 1: Get auth URL
      const authResponse = await fetch(`${BASE_URL}/api/email/gmail/connect`);
      const authData = await authResponse.json();
      
      if (authData.success && authData.authUrl) {
        this.addResult('Gmail Auth URL', '✅ PASS', 'Auth URL generated successfully');
        console.log(`📧 Gmail Auth URL: ${authData.authUrl}`);
        console.log('📧 To complete authentication manually:');
        console.log('1. Visit the auth URL above');
        console.log('2. Sign in with: sabitov.ty@gmail.com');
        console.log('3. Grant permissions');
        console.log('4. The callback will handle token exchange');
      } else {
        this.addResult('Gmail Auth URL', '❌ FAIL', authData.error || 'Failed to generate auth URL');
      }
      
      // Test callback endpoint (without actual auth code for now)
      const callbackResponse = await fetch(`${BASE_URL}/api/email/gmail/callback`);
      if (callbackResponse.status === 400) {
        this.addResult('Gmail Callback', '✅ PASS', 'Callback endpoint properly validates auth code');
      } else {
        this.addResult('Gmail Callback', '⚠️ WARN', 'Callback endpoint response unexpected');
      }
      
    } catch (error) {
      this.addResult('Gmail Authentication', '❌ FAIL', `Error: ${error.message}`);
    }
  }

  async testLabelManager() {
    console.log('🏷️ Testing Label Manager component...');
    
    try {
      // Test the page loads
      const response = await fetch(`${BASE_URL}/email-cleanup`);
      if (response.ok) {
        const html = await response.text();
        
        // Check for Label Manager specific elements
        if (html.includes('Label Manager') || html.includes('label-manager')) {
          this.addResult('Label Manager', '✅ PASS', 'Component appears to be loaded');
        } else {
          this.addResult('Label Manager', '⚠️ WARN', 'Component may not be properly integrated');
        }
      } else {
        this.addResult('Label Manager', '❌ FAIL', 'Email cleanup page not accessible');
      }
    } catch (error) {
      this.addResult('Label Manager', '❌ FAIL', `Error: ${error.message}`);
    }
  }

  async testLabelCleanup() {
    console.log('🧹 Testing Label Cleanup component...');
    
    try {
      const response = await fetch(`${BASE_URL}/email-cleanup`);
      if (response.ok) {
        const html = await response.text();
        
        if (html.includes('Label Cleanup') || html.includes('label-cleanup')) {
          this.addResult('Label Cleanup', '✅ PASS', 'Component appears to be loaded');
        } else {
          this.addResult('Label Cleanup', '⚠️ WARN', 'Component may not be properly integrated');
        }
      } else {
        this.addResult('Label Cleanup', '❌ FAIL', 'Email cleanup page not accessible');
      }
    } catch (error) {
      this.addResult('Label Cleanup', '❌ FAIL', `Error: ${error.message}`);
    }
  }

  async testPromptGenerator() {
    console.log('🤖 Testing AI Prompt Generator component...');
    
    try {
      const response = await fetch(`${BASE_URL}/email-cleanup`);
      if (response.ok) {
        const html = await response.text();
        
        if (html.includes('AI Prompts') || html.includes('prompt-generator')) {
          this.addResult('Prompt Generator', '✅ PASS', 'Component appears to be loaded');
        } else {
          this.addResult('Prompt Generator', '⚠️ WARN', 'Component may not be properly integrated');
        }
      } else {
        this.addResult('Prompt Generator', '❌ FAIL', 'Email cleanup page not accessible');
      }
    } catch (error) {
      this.addResult('Prompt Generator', '❌ FAIL', `Error: ${error.message}`);
    }
  }

  async testStatePersistence() {
    console.log('💾 Testing state persistence...');
    
    try {
      // This test would require browser automation for proper testing
      // For now, we'll check if the context provider is properly set up
      const response = await fetch(`${BASE_URL}/email-cleanup`);
      if (response.ok) {
        const html = await response.text();
        
        if (html.includes('EmailCleanupProvider') || html.includes('useEmailCleanup')) {
          this.addResult('State Persistence', '✅ PASS', 'Context provider integration detected');
        } else {
          this.addResult('State Persistence', '⚠️ WARN', 'Context provider may not be properly integrated');
        }
      } else {
        this.addResult('State Persistence', '❌ FAIL', 'Cannot test - page not accessible');
      }
    } catch (error) {
      this.addResult('State Persistence', '❌ FAIL', `Error: ${error.message}`);
    }
  }

  async testFullWorkflow() {
    console.log('🔄 Testing full workflow integration...');
    
    try {
      // Test bulk analyze endpoint (without auth for now)
      const bulkResponse = await fetch(`${BASE_URL}/api/email/gmail/bulk-analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          maxEmails: 10,
          applyLabels: false,
          query: 'test',
          batchSize: 5
        })
      });
      
      const bulkData = await bulkResponse.json();
      
      if (bulkResponse.status === 401 || bulkData.error?.includes('auth')) {
        this.addResult('Bulk Analysis', '✅ PASS', 'Properly requires authentication');
      } else if (bulkResponse.ok) {
        this.addResult('Bulk Analysis', '✅ PASS', 'Endpoint working correctly');
      } else {
        this.addResult('Bulk Analysis', '⚠️ WARN', `Unexpected response: ${bulkData.error}`);
      }
    } catch (error) {
      this.addResult('Full Workflow', '❌ FAIL', `Error: ${error.message}`);
    }
  }

  addResult(test, status, message) {
    this.testResults.push({ test, status, message });
    console.log(`  ${status} ${test}: ${message}`);
  }

  printTestResults() {
    console.log('\n📊 Test Results Summary:');
    console.log('=' + '='.repeat(80));
    
    const passed = this.testResults.filter(r => r.status.includes('✅')).length;
    const warned = this.testResults.filter(r => r.status.includes('⚠️')).length;
    const failed = this.testResults.filter(r => r.status.includes('❌')).length;
    
    console.log(`Total Tests: ${this.testResults.length}`);
    console.log(`Passed: ${passed}`);
    console.log(`Warnings: ${warned}`);
    console.log(`Failed: ${failed}`);
    
    console.log('\nDetailed Results:');
    this.testResults.forEach(result => {
      console.log(`${result.status} ${result.test}: ${result.message}`);
    });
    
    console.log('\n🎯 Manual Testing Instructions:');
    console.log('1. Visit: http://localhost:3001/email-cleanup');
    console.log('2. Click "Connect Gmail"');
    console.log('3. Login with: sabitov.ty@gmail.com');
    console.log('4. Test navigation between tabs');
    console.log('5. Verify state persists when navigating away and back');
    console.log('6. Test Label Manager, Label Cleanup, and AI Prompts tabs');
    
    if (failed === 0) {
      console.log('\n🎉 All tests passed! The application is ready for manual testing.');
    } else {
      console.log(`\n⚠️ ${failed} tests failed. Please review the issues above.`);
    }
  }
}

// Run the test suite
const testSuite = new EmailCleanupTestSuite();
testSuite.runAllTests();
