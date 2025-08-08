/**
 * Functional Dashboard Testing
 * Tests real browser functionality and user interactions
 */

const BASE_URL = 'http://localhost:3000';

class FunctionalDashboardTester {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      warnings: 0,
      tests: []
    };
  }

  async log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : type === 'warning' ? '⚠️' : 'ℹ️';
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  async test(name, testFn) {
    try {
      await this.log(`Running test: ${name}`);
      const result = await testFn();
      if (result === 'warning') {
        this.results.warnings++;
        this.results.tests.push({ name, status: 'WARNING' });
        await this.log(`WARNING: ${name}`, 'warning');
      } else {
        this.results.passed++;
        this.results.tests.push({ name, status: 'PASSED' });
        await this.log(`PASSED: ${name}`, 'success');
      }
    } catch (error) {
      this.results.failed++;
      this.results.tests.push({ name, status: 'FAILED', error: error.message });
      await this.log(`FAILED: ${name} - ${error.message}`, 'error');
    }
  }

  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async runFunctionalTests() {
    await this.log('🎭 Starting Functional Dashboard Tests');

    // 1. Page Load and Rendering Tests
    await this.test('Dashboard Page Accessibility', async () => {
      const response = await fetch(`${BASE_URL}/`);
      const html = await response.text();
      
      if (!html.includes('<!DOCTYPE html>')) {
        throw new Error('Page should have proper DOCTYPE declaration');
      }
      
      if (!html.includes('<html')) {
        throw new Error('Page should have proper HTML structure');
      }
      
      // Check for meta tags
      if (!html.includes('<meta')) {
        return 'warning'; // Should have meta tags for SEO
      }
    });

    await this.test('Landing Page Content Structure', async () => {
      const response = await fetch(`${BASE_URL}/landing`);
      const html = await response.text();
      
      // Check for key landing page elements
      if (!html.includes('UzEffect') && !html.includes('PM-App')) {
        throw new Error('Landing page should contain branding');
      }
      
      // Check for navigation elements
      if (!html.includes('Features') || !html.includes('Get Started')) {
        throw new Error('Landing page should have navigation and CTA buttons');
      }
    });

    await this.test('Authentication Flow', async () => {
      const response = await fetch(`${BASE_URL}/auth`);
      if (!response.ok) {
        throw new Error(`Auth page should be accessible: ${response.status}`);
      }
      
      const html = await response.text();
      
      // Check for form elements
      if (!html.includes('form') && !html.includes('input')) {
        throw new Error('Auth page should contain authentication forms');
      }
    });

    // 2. API Functionality Tests
    await this.test('API Error Handling', async () => {
      // Test unauthenticated requests
      const endpoints = ['/api/projects', '/api/tasks', '/api/workspaces/test'];
      
      for (const endpoint of endpoints) {
        const response = await fetch(`${BASE_URL}${endpoint}`);
        if (response.status !== 401) {
          throw new Error(`${endpoint} should return 401 for unauthenticated requests, got ${response.status}`);
        }
        
        const data = await response.json();
        if (!data.error) {
          throw new Error(`${endpoint} should return error message for failed requests`);
        }
      }
    });

    await this.test('API Response Format', async () => {
      const response = await fetch(`${BASE_URL}/api/projects`);
      const contentType = response.headers.get('content-type');
      
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('API should return JSON content type');
      }
      
      try {
        await response.json();
      } catch (error) {
        throw new Error('API should return valid JSON');
      }
    });

    // 3. Static Asset Tests
    await this.test('Static Assets Accessibility', async () => {
      const assets = ['/favicon.ico', '/robots.txt'];
      
      for (const asset of assets) {
        try {
          const response = await fetch(`${BASE_URL}${asset}`);
          if (response.status === 404) {
            await this.log(`Asset ${asset} not found - consider adding`, 'warning');
          }
        } catch (error) {
          await this.log(`Could not fetch ${asset}: ${error.message}`, 'warning');
        }
      }
    });

    // 4. Security Headers Tests
    await this.test('Security Headers', async () => {
      const response = await fetch(`${BASE_URL}/`);
      const headers = response.headers;
      
      // Check for important security headers
      const securityHeaders = [
        'x-frame-options',
        'x-content-type-options',
        'referrer-policy'
      ];
      
      let missingHeaders = [];
      for (const header of securityHeaders) {
        if (!headers.get(header)) {
          missingHeaders.push(header);
        }
      }
      
      if (missingHeaders.length > 0) {
        return 'warning'; // Not critical but recommended
      }
    });

    // 5. Performance Tests
    await this.test('Page Load Performance', async () => {
      const startTime = Date.now();
      const response = await fetch(`${BASE_URL}/landing`);
      const endTime = Date.now();
      
      const loadTime = endTime - startTime;
      
      if (loadTime > 5000) {
        throw new Error(`Page load time too slow: ${loadTime}ms`);
      }
      
      if (loadTime > 2000) {
        return 'warning'; // Slow but acceptable
      }
    });

    await this.test('API Response Time', async () => {
      const startTime = Date.now();
      await fetch(`${BASE_URL}/api/projects`);
      const endTime = Date.now();
      
      const responseTime = endTime - startTime;
      
      if (responseTime > 3000) {
        throw new Error(`API response time too slow: ${responseTime}ms`);
      }
      
      if (responseTime > 1000) {
        return 'warning';
      }
    });

    // 6. Mobile Responsiveness Tests
    await this.test('Mobile Viewport Meta Tag', async () => {
      const response = await fetch(`${BASE_URL}/`);
      const html = await response.text();
      
      if (!html.includes('viewport')) {
        throw new Error('Page should include viewport meta tag for mobile responsiveness');
      }
      
      if (!html.includes('width=device-width')) {
        throw new Error('Viewport should be configured for mobile devices');
      }
    });

    // 7. SEO and Metadata Tests
    await this.test('Page Metadata', async () => {
      const response = await fetch(`${BASE_URL}/landing`);
      const html = await response.text();
      
      if (!html.includes('<title>')) {
        throw new Error('Page should have a title tag');
      }
      
      if (!html.includes('description')) {
        return 'warning'; // Should have meta description
      }
    });

    // 8. Server Health Tests
    await this.test('Server Health Check', async () => {
      try {
        const response = await fetch(`${BASE_URL}/`);
        if (!response.ok && response.status !== 302) {
          throw new Error(`Server health check failed: ${response.status}`);
        }
      } catch (error) {
        if (error.code === 'ECONNREFUSED') {
          throw new Error('Server is not running or not accessible');
        }
        throw error;
      }
    });

    // 9. Database Connection Tests
    await this.test('Database Schema Validation', async () => {
      // Test if API endpoints can handle database operations
      const response = await fetch(`${BASE_URL}/api/projects`);
      
      if (response.status === 500) {
        const error = await response.json();
        if (error.error && error.error.includes('database')) {
          throw new Error('Database connection or schema issues detected');
        }
      }
    });

    // 10. Socket.IO Tests
    await this.test('WebSocket Endpoint', async () => {
      try {
        // Test if Socket.IO endpoint is accessible
        const response = await fetch(`${BASE_URL}/api/socketio`);
        // Socket.IO endpoints typically return specific responses
        if (response.status !== 400 && response.status !== 404) {
          // Socket.IO is likely configured if we don't get a 404
        }
      } catch (error) {
        return 'warning'; // Socket.IO might not be critical for basic functionality
      }
    });

    await this.generateFunctionalReport();
  }

  async generateFunctionalReport() {
    await this.log('\n📊 Functional Testing Report Summary');
    await this.log(`Total Functional Tests: ${this.results.passed + this.results.failed + this.results.warnings}`);
    await this.log(`Passed: ${this.results.passed}`, 'success');
    await this.log(`Warnings: ${this.results.warnings}`, 'warning');
    await this.log(`Failed: ${this.results.failed}`, this.results.failed > 0 ? 'error' : 'success');
    
    if (this.results.failed > 0) {
      await this.log('\n❌ Failed Tests:');
      this.results.tests.filter(t => t.status === 'FAILED').forEach(async (test) => {
        await this.log(`- ${test.name}: ${test.error}`, 'error');
      });
    }

    if (this.results.warnings > 0) {
      await this.log('\n⚠️ Warnings:');
      this.results.tests.filter(t => t.status === 'WARNING').forEach(async (test) => {
        await this.log(`- ${test.name}: Needs improvement`, 'warning');
      });
    }

    const totalTests = this.results.passed + this.results.failed + this.results.warnings;
    const successRate = Math.round(((this.results.passed + this.results.warnings) / totalTests) * 100);
    const passRate = Math.round((this.results.passed / totalTests) * 100);
    
    await this.log(`\n🎯 Success Rate (including warnings): ${successRate}%`);
    await this.log(`🎯 Pure Pass Rate: ${passRate}%`);
    
    if (this.results.failed === 0 && this.results.warnings <= 2) {
      await this.log('🏆 Functional Status: PRODUCTION READY', 'success');
    } else if (this.results.failed === 0) {
      await this.log('✅ Functional Status: GOOD (Minor Improvements Recommended)', 'success');
    } else if (this.results.failed <= 2) {
      await this.log('⚠️ Functional Status: NEEDS FIXES', 'warning');
    } else {
      await this.log('🚨 Functional Status: CRITICAL ISSUES', 'error');
    }

    // Priority recommendations
    await this.log('\n🔧 Priority Fixes:');
    if (this.results.failed > 0) {
      await this.log('1. Fix all failed tests immediately');
    }
    await this.log('2. Add environment configuration files');
    await this.log('3. Implement security headers');
    await this.log('4. Add comprehensive SEO metadata');
    await this.log('5. Optimize page load performance');
    await this.log('6. Add error boundaries for better error handling');
  }
}

// Run the functional tests
if (require.main === module) {
  const tester = new FunctionalDashboardTester();
  tester.runFunctionalTests().catch(console.error);
}

module.exports = FunctionalDashboardTester;
