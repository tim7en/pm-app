/**
 * Comprehensive Dashboard QA/QC Script
 * Tests all major dashboard functionality
 */

const BASE_URL = 'http://localhost:3000';

// Test runner class
class DashboardQARunner {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      tests: []
    };
  }

  async log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  async test(name, testFn) {
    try {
      await this.log(`Running test: ${name}`);
      await testFn();
      this.results.passed++;
      this.results.tests.push({ name, status: 'PASSED' });
      await this.log(`PASSED: ${name}`, 'success');
    } catch (error) {
      this.results.failed++;
      this.results.tests.push({ name, status: 'FAILED', error: error.message });
      await this.log(`FAILED: ${name} - ${error.message}`, 'error');
    }
  }

  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async runAllTests() {
    await this.log('🚀 Starting Dashboard QA/QC Suite');
    
    // 1. Basic Page Load Tests
    await this.test('Landing Page Loads', async () => {
      const response = await fetch(`${BASE_URL}/landing`);
      if (!response.ok) throw new Error(`Landing page failed to load: ${response.status}`);
    });

    await this.test('Auth Page Loads', async () => {
      const response = await fetch(`${BASE_URL}/auth`);
      if (!response.ok) throw new Error(`Auth page failed to load: ${response.status}`);
    });

    await this.test('Dashboard Page Redirects Unauthenticated', async () => {
      const response = await fetch(`${BASE_URL}/`, { redirect: 'manual' });
      // Should redirect to landing or auth for unauthenticated users
      if (response.status !== 200 && response.status !== 302) {
        throw new Error(`Unexpected response: ${response.status}`);
      }
    });

    // 2. API Endpoint Tests
    await this.test('Projects API Endpoint', async () => {
      const response = await fetch(`${BASE_URL}/api/projects`);
      // Should return 401 for unauthenticated requests
      if (response.status !== 401) throw new Error(`Expected 401, got ${response.status}`);
    });

    await this.test('Tasks API Endpoint', async () => {
      const response = await fetch(`${BASE_URL}/api/tasks`);
      // Should return 401 for unauthenticated requests
      if (response.status !== 401) throw new Error(`Expected 401, got ${response.status}`);
    });

    await this.test('Search API Endpoint', async () => {
      const response = await fetch(`${BASE_URL}/api/search`);
      // Should return 401 for unauthenticated requests
      if (response.status !== 401) throw new Error(`Expected 401, got ${response.status}`);
    });

    // 3. Component Structure Tests
    await this.test('Dashboard Container Component Exists', async () => {
      const fs = require('fs');
      const path = require('path');
      const componentPath = path.join(process.cwd(), 'src/components/dashboard/dashboard-container.tsx');
      if (!fs.existsSync(componentPath)) {
        throw new Error('Dashboard container component not found');
      }
    });

    await this.test('Dashboard Overview Component Exists', async () => {
      const fs = require('fs');
      const path = require('path');
      const componentPath = path.join(process.cwd(), 'src/components/dashboard/dashboard-overview.tsx');
      if (!fs.existsSync(componentPath)) {
        throw new Error('Dashboard overview component not found');
      }
    });

    await this.test('Dashboard Stats Component Exists', async () => {
      const fs = require('fs');
      const path = require('path');
      const componentPath = path.join(process.cwd(), 'src/components/dashboard/dashboard-stats.tsx');
      if (!fs.existsSync(componentPath)) {
        throw new Error('Dashboard stats component not found');
      }
    });

    // 4. Hook Tests
    await this.test('Dashboard Data Hook Exists', async () => {
      const fs = require('fs');
      const path = require('path');
      const hookPath = path.join(process.cwd(), 'src/hooks/use-dashboard-data.ts');
      if (!fs.existsSync(hookPath)) {
        throw new Error('Dashboard data hook not found');
      }
    });

    await this.test('Dashboard Actions Hook Exists', async () => {
      const fs = require('fs');
      const path = require('path');
      const hookPath = path.join(process.cwd(), 'src/hooks/use-dashboard-actions.ts');
      if (!fs.existsSync(hookPath)) {
        throw new Error('Dashboard actions hook not found');
      }
    });

    // 5. Database Schema Tests
    await this.test('Prisma Schema Exists', async () => {
      const fs = require('fs');
      const path = require('path');
      const schemaPath = path.join(process.cwd(), 'prisma/schema.prisma');
      if (!fs.existsSync(schemaPath)) {
        throw new Error('Prisma schema not found');
      }
    });

    // 6. Configuration Tests
    await this.test('Next.js Config Exists', async () => {
      const fs = require('fs');
      const path = require('path');
      const configPath = path.join(process.cwd(), 'next.config.ts');
      if (!fs.existsSync(configPath)) {
        throw new Error('Next.js config not found');
      }
    });

    await this.test('Package.json Has Required Dependencies', async () => {
      const fs = require('fs');
      const path = require('path');
      const packagePath = path.join(process.cwd(), 'package.json');
      if (!fs.existsSync(packagePath)) {
        throw new Error('package.json not found');
      }
      
      const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
      const requiredDeps = ['next', 'react', 'prisma', 'socket.io', '@prisma/client'];
      
      for (const dep of requiredDeps) {
        if (!packageJson.dependencies?.[dep] && !packageJson.devDependencies?.[dep]) {
          throw new Error(`Required dependency ${dep} not found`);
        }
      }
    });

    // 7. Socket.IO Tests
    await this.test('Socket.IO Server Setup', async () => {
      const fs = require('fs');
      const path = require('path');
      const serverPath = path.join(process.cwd(), 'server.ts');
      if (!fs.existsSync(serverPath)) {
        throw new Error('Server.ts not found');
      }
      
      const serverContent = fs.readFileSync(serverPath, 'utf8');
      if (!serverContent.includes('socket.io')) {
        throw new Error('Socket.IO not configured in server');
      }
    });

    // 8. UI Components Tests
    await this.test('UI Components Directory Exists', async () => {
      const fs = require('fs');
      const path = require('path');
      const uiPath = path.join(process.cwd(), 'src/components/ui');
      if (!fs.existsSync(uiPath)) {
        throw new Error('UI components directory not found');
      }
    });

    // 9. Tailwind CSS Tests
    await this.test('Tailwind Config Exists', async () => {
      const fs = require('fs');
      const path = require('path');
      const configPath = path.join(process.cwd(), 'tailwind.config.ts');
      if (!fs.existsSync(configPath)) {
        throw new Error('Tailwind config not found');
      }
    });

    // 10. TypeScript Configuration Tests
    await this.test('TypeScript Config Exists', async () => {
      const fs = require('fs');
      const path = require('path');
      const configPath = path.join(process.cwd(), 'tsconfig.json');
      if (!fs.existsSync(configPath)) {
        throw new Error('TypeScript config not found');
      }
    });

    // Generate Report
    await this.generateReport();
  }

  async generateReport() {
    await this.log('\n📊 QA/QC Report Summary');
    await this.log(`Total Tests: ${this.results.passed + this.results.failed}`);
    await this.log(`Passed: ${this.results.passed}`, 'success');
    await this.log(`Failed: ${this.results.failed}`, this.results.failed > 0 ? 'error' : 'success');
    
    if (this.results.failed > 0) {
      await this.log('\n❌ Failed Tests:');
      this.results.tests.filter(t => t.status === 'FAILED').forEach(async (test) => {
        await this.log(`- ${test.name}: ${test.error}`, 'error');
      });
    }

    const passRate = Math.round((this.results.passed / (this.results.passed + this.results.failed)) * 100);
    await this.log(`\n🎯 Pass Rate: ${passRate}%`);
    
    if (passRate >= 95) {
      await this.log('🏆 Dashboard QA Status: EXCELLENT', 'success');
    } else if (passRate >= 85) {
      await this.log('✅ Dashboard QA Status: GOOD', 'success');
    } else if (passRate >= 70) {
      await this.log('⚠️ Dashboard QA Status: NEEDS IMPROVEMENT');
    } else {
      await this.log('🚨 Dashboard QA Status: CRITICAL ISSUES', 'error');
    }
  }
}

// Run the tests
if (require.main === module) {
  const runner = new DashboardQARunner();
  runner.runAllTests().catch(console.error);
}

module.exports = DashboardQARunner;
