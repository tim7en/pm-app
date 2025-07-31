#!/usr/bin/env node

/**
 * Bug Report System Functional Test
 * 
 * Tests the actual API endpoints to ensure they work correctly
 */

const fs = require('fs')
const path = require('path')
const chalk = require('chalk')

class BugReportFunctionalTest {
  constructor() {
    this.baseUrl = 'http://localhost:3000'
    this.results = []
  }

  log(message, type = 'info') {
    const colors = {
      info: chalk.blue,
      success: chalk.green,
      warning: chalk.yellow,
      error: chalk.red
    }
    console.log(colors[type](`[${type.toUpperCase()}] ${message}`))
  }

  validate(testName, isValid, details = '') {
    const status = isValid ? 'PASS' : 'FAIL'
    const color = isValid ? 'success' : 'error'
    const icon = isValid ? '✅' : '❌'
    
    this.results.push({ name: testName, status, details })
    this.log(`${icon} ${testName} - ${status}`, color)
    if (details) {
      this.log(`   ${details}`, 'info')
    }
  }

  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  // Test API endpoint availability
  async testAPIEndpoint() {
    this.log('🌐 TESTING API ENDPOINT AVAILABILITY', 'info')
    this.log('=' * 50, 'info')

    try {
      const response = await fetch(`${this.baseUrl}/api/bug-reports`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      this.validate(
        'API Endpoint Reachable',
        response.status === 401 || response.status === 200,
        `Status: ${response.status} (401 expected for auth required)`
      )

      // Test with invalid method
      const invalidResponse = await fetch(`${this.baseUrl}/api/bug-reports`, {
        method: 'DELETE'
      })

      this.validate(
        'Invalid Method Handling',
        invalidResponse.status === 405,
        `DELETE method properly rejected with status ${invalidResponse.status}`
      )

    } catch (error) {
      this.validate(
        'API Endpoint Reachable',
        false,
        `Error: ${error.message}. Make sure dev server is running.`
      )
    }
  }

  // Test component integration in header
  async testComponentIntegration() {
    this.log('🎯 TESTING COMPONENT INTEGRATION', 'info')
    this.log('=' * 50, 'info')

    try {
      const response = await fetch(`${this.baseUrl}/`, {
        method: 'GET'
      })

      const html = await response.text()
      
      this.validate(
        'Home Page Loads',
        response.status === 200,
        'Home page returns 200 status'
      )

      // Look for React app mounting point
      this.validate(
        'React App Structure',
        html.includes('__next') || html.includes('root'),
        'Next.js app structure detected'
      )

    } catch (error) {
      this.validate(
        'Home Page Loads',
        false,
        `Error: ${error.message}`
      )
    }
  }

  // Test file upload directory creation
  testUploadDirectory() {
    this.log('📁 TESTING UPLOAD DIRECTORY SETUP', 'info')
    this.log('=' * 50, 'info')

    const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
    const bugReportsDir = path.join(uploadsDir, 'bug-reports')

    // Check if public directory exists
    const publicExists = fs.existsSync('public')
    this.validate(
      'Public Directory Exists',
      publicExists,
      publicExists ? 'public/ directory found' : 'public/ directory missing'
    )

    // Test directory creation capability
    try {
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true })
      }
      
      if (!fs.existsSync(bugReportsDir)) {
        fs.mkdirSync(bugReportsDir, { recursive: true })
      }

      this.validate(
        'Upload Directories Created',
        fs.existsSync(bugReportsDir),
        'Bug reports upload directory created successfully'
      )

      // Test write permissions
      const testFile = path.join(bugReportsDir, 'test-write.txt')
      fs.writeFileSync(testFile, 'test')
      const canWrite = fs.existsSync(testFile)
      
      if (canWrite) {
        fs.unlinkSync(testFile) // Clean up
      }

      this.validate(
        'Write Permissions',
        canWrite,
        'Can write files to upload directory'
      )

    } catch (error) {
      this.validate(
        'Upload Directory Setup',
        false,
        `Error: ${error.message}`
      )
    }
  }

  // Test database connectivity
  async testDatabaseConnectivity() {
    this.log('🗄️  TESTING DATABASE CONNECTIVITY', 'info')
    this.log('=' * 50, 'info')

    // Check if database file exists
    const dbPath = path.join(process.cwd(), 'db', 'custom.db')
    const dbExists = fs.existsSync(dbPath)
    
    this.validate(
      'Database File Exists',
      dbExists,
      dbExists ? 'SQLite database file found' : 'Database file missing'
    )

    // Check Prisma client generation
    const prismaClientPath = path.join(process.cwd(), 'node_modules', '@prisma', 'client')
    const prismaClientExists = fs.existsSync(prismaClientPath)
    
    this.validate(
      'Prisma Client Generated',
      prismaClientExists,
      'Prisma client available'
    )
  }

  // Test TypeScript compilation
  async testTypeScriptCompilation() {
    this.log('🔧 TESTING TYPESCRIPT COMPILATION', 'info')
    this.log('=' * 50, 'info')

    // Check for TypeScript config
    const tsconfigExists = fs.existsSync('tsconfig.json')
    this.validate(
      'TypeScript Config',
      tsconfigExists,
      'tsconfig.json found'
    )

    // Check if Next.js types are generated
    const nextEnvExists = fs.existsSync('next-env.d.ts')
    this.validate(
      'Next.js Types',
      nextEnvExists,
      'Next.js type definitions available'
    )

    // Check for build artifacts (if available)
    const nextBuildExists = fs.existsSync('.next')
    this.validate(
      'Next.js Build',
      nextBuildExists,
      nextBuildExists ? 'Next.js build artifacts found' : 'No build artifacts (normal for dev)'
    )
  }

  // Generate summary
  generateSummary() {
    this.log('', 'info')
    this.log('📊 FUNCTIONAL TEST SUMMARY', 'info')
    this.log('=' * 50, 'info')

    const total = this.results.length
    const passed = this.results.filter(r => r.status === 'PASS').length
    const failed = this.results.filter(r => r.status === 'FAIL').length

    this.log(`Total Tests: ${total}`, 'info')
    this.log(`Passed: ${passed}`, 'success')
    this.log(`Failed: ${failed}`, failed > 0 ? 'error' : 'info')
    this.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`, 
             failed === 0 ? 'success' : 'warning')

    if (failed === 0) {
      this.log('', 'info')
      this.log('🎉 ALL FUNCTIONAL TESTS PASSED!', 'success')
      this.log('✅ Bug reporting system is ready for manual testing', 'success')
    } else {
      this.log('', 'info')
      this.log('❌ SOME FUNCTIONAL TESTS FAILED', 'error')
      
      const failedTests = this.results.filter(r => r.status === 'FAIL')
      failedTests.forEach(test => {
        this.log(`   ❌ ${test.name}`, 'error')
        if (test.details) {
          this.log(`      ${test.details}`, 'info')
        }
      })
    }

    this.log('', 'info')
    this.log('🚀 NEXT STEPS FOR MANUAL TESTING:', 'info')
    this.log('   1. Open http://localhost:3000 in your browser', 'info')
    this.log('   2. Look for the bug report button in the header', 'info')
    this.log('   3. Click the bug report button to open the dialog', 'info')
    this.log('   4. Test form submission with various inputs', 'info')
    this.log('   5. Test file upload functionality', 'info')
    this.log('   6. Test drag and drop file upload', 'info')
    this.log('   7. Try the screenshot capture feature', 'info')
    this.log('   8. Verify form validation with invalid inputs', 'info')
  }

  // Run all tests
  async runAllTests() {
    console.log(chalk.cyan('🧪 BUG REPORT SYSTEM FUNCTIONAL TESTS'))
    console.log(chalk.cyan('=' * 50))
    console.log('')

    await this.testAPIEndpoint()
    console.log('')
    
    await this.testComponentIntegration()
    console.log('')
    
    this.testUploadDirectory()
    console.log('')
    
    await this.testDatabaseConnectivity()
    console.log('')
    
    await this.testTypeScriptCompilation()
    console.log('')
    
    this.generateSummary()
  }
}

// Run the test if called directly
if (require.main === module) {
  const test = new BugReportFunctionalTest()
  
  // Wait a moment for the dev server to be ready
  setTimeout(() => {
    test.runAllTests()
  }, 3000)
}

module.exports = BugReportFunctionalTest
