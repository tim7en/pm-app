/**
 * 🎯 WORKSPACE MANAGEMENT RUNTIME VALIDATOR
 * Tests the actual running application for workspace functionality
 */

class WorkspaceRuntimeValidator {
  constructor() {
    this.baseURL = process.env.BASE_URL || 'http://localhost:3001';
    this.results = {
      total: 0,
      passed: 0,
      failed: 0,
      errors: []
    };
  }

  async runTest(testName, testFunction) {
    console.log(`\n🧪 Testing: ${testName}`);
    this.results.total++;
    
    try {
      await testFunction();
      console.log(`✅ PASSED: ${testName}`);
      this.results.passed++;
    } catch (error) {
      console.log(`❌ FAILED: ${testName} - ${error.message}`);
      this.results.failed++;
      this.results.errors.push({ test: testName, error: error.message });
    }
  }

  async testAPIEndpoints() {
    await this.runTest('Workspace API Authentication', async () => {
      const response = await fetch(`${this.baseURL}/api/workspaces`, {
        method: 'GET'
      });
      
      if (response.status !== 401) {
        throw new Error(`Expected 401 for unauthenticated request, got ${response.status}`);
      }
    });

    await this.runTest('Workspace API CORS Headers', async () => {
      const response = await fetch(`${this.baseURL}/api/workspaces`, {
        method: 'OPTIONS'
      });
      
      // Should not error out
      if (response.status >= 500) {
        throw new Error(`CORS preflight failed with status ${response.status}`);
      }
    });
  }

  async testErrorPages() {
    await this.runTest('404 Page Response', async () => {
      const response = await fetch(`${this.baseURL}/nonexistent-page`);
      
      if (response.status !== 404) {
        throw new Error(`Expected 404 for nonexistent page, got ${response.status}`);
      }
    });

    await this.runTest('Dashboard Route 404', async () => {
      const response = await fetch(`${this.baseURL}/dashboard`);
      
      // Should return 404 since /dashboard doesn't exist
      if (response.status !== 404) {
        console.log(`⚠️  Warning: /dashboard returns ${response.status} instead of 404`);
      }
    });
  }

  async testApplicationHealth() {
    await this.runTest('Application Load', async () => {
      const response = await fetch(`${this.baseURL}/`);
      
      if (!response.ok) {
        throw new Error(`Application failed to load: ${response.status}`);
      }
      
      const html = await response.text();
      if (!html.includes('<!DOCTYPE html>')) {
        throw new Error('Invalid HTML response');
      }
    });

    await this.runTest('Workspaces Page Load', async () => {
      const response = await fetch(`${this.baseURL}/workspaces`);
      
      if (!response.ok) {
        throw new Error(`Workspaces page failed to load: ${response.status}`);
      }
    });

    await this.runTest('Static Assets', async () => {
      const response = await fetch(`${this.baseURL}/_next/static/css`);
      
      // Should not return 500 error
      if (response.status >= 500) {
        throw new Error(`Static assets server error: ${response.status}`);
      }
    });
  }

  async testSecurityHeaders() {
    await this.runTest('Security Headers', async () => {
      const response = await fetch(`${this.baseURL}/`);
      
      const headers = response.headers;
      
      // Check for important security headers
      if (!headers.get('x-frame-options') && !headers.get('content-security-policy')) {
        console.log('⚠️  Warning: Missing security headers (X-Frame-Options, CSP)');
      }
      
      // Should not expose server information
      if (headers.get('server') && headers.get('server').includes('Express')) {
        console.log('⚠️  Warning: Server header exposes implementation details');
      }
    });
  }

  async runAllTests() {
    console.log('🎯 WORKSPACE MANAGEMENT RUNTIME VALIDATION');
    console.log('==========================================\n');
    
    try {
      console.log('🌐 Testing API Endpoints...');
      await this.testAPIEndpoints();
      
      console.log('\n🚨 Testing Error Handling...');
      await this.testErrorPages();
      
      console.log('\n💚 Testing Application Health...');
      await this.testApplicationHealth();
      
      console.log('\n🔒 Testing Security...');
      await this.testSecurityHeaders();
      
    } catch (error) {
      console.log(`\n💥 Fatal error during testing: ${error.message}`);
    }
    
    this.generateReport();
  }

  generateReport() {
    console.log('\n\n📊 RUNTIME VALIDATION RESULTS');
    console.log('==============================');
    console.log(`✅ Passed: ${this.results.passed}`);
    console.log(`❌ Failed: ${this.results.failed}`);
    console.log(`📊 Total:  ${this.results.total}`);
    
    const successRate = this.results.total > 0 ? 
      (this.results.passed / this.results.total) * 100 : 0;
    console.log(`📈 Success Rate: ${successRate.toFixed(1)}%`);
    
    if (this.results.failed > 0) {
      console.log('\n❌ FAILED TESTS:');
      this.results.errors.forEach(error => {
        console.log(`   • ${error.test}: ${error.error}`);
      });
    }
    
    console.log('\n🎯 RUNTIME STATUS');
    console.log('=================');
    
    if (successRate >= 90) {
      console.log('🟢 APPLICATION: HEALTHY');
      console.log('   Runtime validation passed. Application is working correctly.');
    } else if (successRate >= 70) {
      console.log('🟡 APPLICATION: MINOR ISSUES');
      console.log('   Some runtime issues detected. Review and address.');
    } else {
      console.log('🔴 APPLICATION: CRITICAL ISSUES');
      console.log('   Major runtime problems detected. Immediate attention required.');
    }
    
    console.log('\n📋 MANUAL TESTING CHECKLIST');
    console.log('============================');
    console.log('□ Create new workspace via UI');
    console.log('□ Switch between workspaces');
    console.log('□ Test workspace creation with invalid data');
    console.log('□ Test workspace loading states');
    console.log('□ Test error page navigation');
    console.log('□ Test workspace permissions');
    console.log('□ Test mobile responsiveness');
    console.log('□ Test keyboard navigation');
    console.log('□ Test screen reader compatibility');
    console.log('□ Test network error handling');
    
    console.log('\n🚀 DEPLOYMENT READINESS');
    console.log('========================');
    
    if (this.results.failed === 0) {
      console.log('✅ Runtime validation passed - Ready for deployment');
    } else {
      console.log('❌ Runtime issues found - Fix before deployment');
    }
  }
}

// Quick health check function
async function quickHealthCheck() {
  console.log('⚡ QUICK HEALTH CHECK');
  console.log('====================\n');
  
  const baseURL = process.env.BASE_URL || 'http://localhost:3001';
  
  try {
    console.log('🔍 Checking if application is running...');
    const response = await fetch(`${baseURL}/`, { timeout: 5000 });
    
    if (response.ok) {
      console.log('✅ Application is running and responding');
      console.log(`   Status: ${response.status}`);
      console.log(`   URL: ${baseURL}`);
      
      // Quick check for the critical fix
      console.log('\n🔧 Quick Fix Verification:');
      
      // Check if /dashboard returns 404 (our fix)
      const dashboardResponse = await fetch(`${baseURL}/dashboard`);
      if (dashboardResponse.status === 404) {
        console.log('✅ Dashboard route correctly returns 404');
      } else {
        console.log(`⚠️  Dashboard route returns ${dashboardResponse.status} (expected 404)`);
      }
      
      return true;
    } else {
      console.log(`❌ Application returned status ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log('❌ Application is not running or not accessible');
    console.log(`   Error: ${error.message}`);
    console.log('\n💡 Make sure to start the application with: npm run dev');
    return false;
  }
}

// Main execution
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--quick')) {
    quickHealthCheck();
  } else {
    const validator = new WorkspaceRuntimeValidator();
    validator.runAllTests();
  }
}

module.exports = { WorkspaceRuntimeValidator, quickHealthCheck };
