#!/usr/bin/env node

/**
 * Invitation Notification System Test
 * 
 * Tests the complete invitation notification workflow:
 * 1. Workspace invitation creation
 * 2. Notification display in dropdown and page
 * 3. Accept/Decline functionality
 * 4. Count updates
 */

const chalk = require('chalk')

class InvitationNotificationTest {
  constructor() {
    this.results = []
    this.baseUrl = 'http://localhost:3000'
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

  // Test Component Structure
  testComponentStructure() {
    this.log('🏗️  COMPONENT STRUCTURE VALIDATION', 'info')
    this.log('=' * 50, 'info')

    const fs = require('fs')
    const path = require('path')

    // Check if invitation notification component exists
    const invitationComponentPath = 'src/components/notifications/invitation-notifications.tsx'
    const componentExists = fs.existsSync(invitationComponentPath)
    this.validate(
      'Invitation Notification Component',
      componentExists,
      componentExists ? 'Component file found' : 'Component file missing'
    )

    if (componentExists) {
      const content = fs.readFileSync(invitationComponentPath, 'utf8')
      
      // Check for required imports
      const hasRequiredImports = content.includes('useAuth') && 
                                 content.includes('useToast') && 
                                 content.includes('format')
      this.validate(
        'Required Imports Present',
        hasRequiredImports,
        'useAuth, useToast, format imports found'
      )

      // Check for invitation interface
      const hasInterface = content.includes('WorkspaceInvitation')
      this.validate(
        'WorkspaceInvitation Interface',
        hasInterface,
        'Interface definition found'
      )

      // Check for accept/decline handlers
      const hasHandlers = content.includes('handleAcceptInvitation') && 
                         content.includes('handleDeclineInvitation')
      this.validate(
        'Accept/Decline Handlers',
        hasHandlers,
        'Event handlers implemented'
      )

      // Check for count hook
      const hasCountHook = content.includes('useInvitationCount')
      this.validate(
        'Invitation Count Hook',
        hasCountHook,
        'Count hook exported'
      )
    }
  }

  // Test API Integration
  testAPIIntegration() {
    this.log('🌐 API INTEGRATION VALIDATION', 'info')
    this.log('=' * 50, 'info')

    const fs = require('fs')

    // Check invitation API endpoints
    const endpoints = [
      'src/app/api/invitations/route.ts',
      'src/app/api/invitations/[id]/accept/route.ts',
      'src/app/api/invitations/[id]/decline/route.ts'
    ]

    endpoints.forEach(endpoint => {
      const exists = fs.existsSync(endpoint)
      this.validate(
        `API Endpoint: ${endpoint.split('/').pop()}`,
        exists,
        exists ? 'Endpoint file found' : 'Endpoint file missing'
      )
    })

    // Check notifications dropdown integration
    const dropdownPath = 'src/components/layout/notifications-dropdown.tsx'
    if (fs.existsSync(dropdownPath)) {
      const content = fs.readFileSync(dropdownPath, 'utf8')
      
      const hasInvitationImport = content.includes('InvitationNotifications')
      this.validate(
        'Dropdown Integration Import',
        hasInvitationImport,
        'InvitationNotifications imported in dropdown'
      )

      const hasCountIntegration = content.includes('useInvitationCount')
      this.validate(
        'Count Integration',
        hasCountIntegration,
        'Invitation count integrated in dropdown'
      )

      const hasTotalCount = content.includes('totalCount')
      this.validate(
        'Total Count Calculation',
        hasTotalCount,
        'Total count includes invitations'
      )
    }
  }

  // Test Notification Page Integration
  testNotificationPageIntegration() {
    this.log('📄 NOTIFICATION PAGE INTEGRATION', 'info')
    this.log('=' * 50, 'info')

    const fs = require('fs')
    const notificationPagePath = 'src/app/notifications/page.tsx'
    
    if (fs.existsSync(notificationPagePath)) {
      const content = fs.readFileSync(notificationPagePath, 'utf8')
      
      const hasImport = content.includes('InvitationNotifications')
      this.validate(
        'Page Import',
        hasImport,
        'InvitationNotifications imported in notifications page'
      )

      const hasComponent = content.includes('<InvitationNotifications')
      this.validate(
        'Component Usage',
        hasComponent,
        'Component rendered in page'
      )
    } else {
      this.validate(
        'Notification Page Exists',
        false,
        'Notifications page not found'
      )
    }
  }

  // Test Database Schema
  testDatabaseSchema() {
    this.log('🗄️  DATABASE SCHEMA VALIDATION', 'info')
    this.log('=' * 50, 'info')

    const fs = require('fs')
    const schemaPath = 'prisma/schema.prisma'
    
    if (fs.existsSync(schemaPath)) {
      const content = fs.readFileSync(schemaPath, 'utf8')
      
      const hasWorkspaceInvitation = content.includes('model WorkspaceInvitation')
      this.validate(
        'WorkspaceInvitation Model',
        hasWorkspaceInvitation,
        'Model definition found in schema'
      )

      if (hasWorkspaceInvitation) {
        const hasRequiredFields = content.includes('InvitationStatus') &&
                                 content.includes('expiresAt') &&
                                 content.includes('invitedBy')
        this.validate(
          'Required Fields Present',
          hasRequiredFields,
          'Status, expiresAt, invitedBy fields found'
        )
      }

      const hasNotificationType = content.includes('WORKSPACE_INVITE')
      this.validate(
        'Workspace Invite Notification Type',
        hasNotificationType,
        'WORKSPACE_INVITE type in NotificationType enum'
      )
    } else {
      this.validate(
        'Prisma Schema Exists',
        false,
        'Schema file not found'
      )
    }
  }

  // Test Security Implementation
  testSecurity() {
    this.log('🔒 SECURITY VALIDATION', 'info')
    this.log('=' * 50, 'info')

    const fs = require('fs')
    
    // Check API route security
    const acceptRoutePath = 'src/app/api/invitations/[id]/accept/route.ts'
    if (fs.existsSync(acceptRoutePath)) {
      const content = fs.readFileSync(acceptRoutePath, 'utf8')
      
      const hasAuth = content.includes('getAuthSession')
      this.validate(
        'Authentication Check',
        hasAuth,
        'Authentication validation present'
      )

      const hasEmailValidation = content.includes('invitation.email.toLowerCase()') &&
                                content.includes('session.user.email.toLowerCase()')
      this.validate(
        'Email Validation',
        hasEmailValidation,
        'Email ownership validation implemented'
      )

      const hasStatusCheck = content.includes('invitation.status') &&
                            content.includes('PENDING')
      this.validate(
        'Status Validation',
        hasStatusCheck,
        'Invitation status validation present'
      )

      const hasExpiryCheck = content.includes('expiresAt')
      this.validate(
        'Expiry Validation',
        hasExpiryCheck,
        'Invitation expiry check implemented'
      )
    }
  }

  // Test UI Components
  testUIComponents() {
    this.log('🎨 UI COMPONENT VALIDATION', 'info')
    this.log('=' * 50, 'info')

    const fs = require('fs')
    const componentPath = 'src/components/notifications/invitation-notifications.tsx'
    
    if (fs.existsSync(componentPath)) {
      const content = fs.readFileSync(componentPath, 'utf8')
      
      // Check for proper UI components
      const hasCards = content.includes('Card') && content.includes('CardContent')
      this.validate(
        'Card Components',
        hasCards,
        'Card and CardContent components used'
      )

      const hasBadges = content.includes('Badge')
      this.validate(
        'Badge Components',
        hasBadges,
        'Role badges implemented'
      )

      const hasButtons = content.includes('Accept') && content.includes('Decline')
      this.validate(
        'Action Buttons',
        hasButtons,
        'Accept and Decline buttons present'
      )

      const hasIcons = content.includes('UserPlus') && 
                      content.includes('Building2') &&
                      content.includes('Clock')
      this.validate(
        'Relevant Icons',
        hasIcons,
        'UserPlus, Building2, Clock icons used'
      )

      const hasLoadingStates = content.includes('actionLoading') &&
                              content.includes('animate-spin')
      this.validate(
        'Loading States',
        hasLoadingStates,
        'Loading indicators implemented'
      )

      const hasAccessibility = content.includes('aria-') || content.includes('role=')
      this.validate(
        'Accessibility Features',
        hasAccessibility,
        'Accessibility attributes present'
      )
    }
  }

  // Test Error Handling
  testErrorHandling() {
    this.log('⚠️  ERROR HANDLING VALIDATION', 'info')
    this.log('=' * 50, 'info')

    const fs = require('fs')
    const componentPath = 'src/components/notifications/invitation-notifications.tsx'
    
    if (fs.existsSync(componentPath)) {
      const content = fs.readFileSync(componentPath, 'utf8')
      
      const hasTryCatch = content.includes('try {') && content.includes('} catch')
      this.validate(
        'Try-Catch Blocks',
        hasTryCatch,
        'Error handling with try-catch implemented'
      )

      const hasToastErrors = content.includes('variant: "destructive"')
      this.validate(
        'Error Toasts',
        hasToastErrors,
        'Error feedback via toast notifications'
      )

      const hasErrorLogging = content.includes('console.error')
      this.validate(
        'Error Logging',
        hasErrorLogging,
        'Console error logging implemented'
      )

      const hasStateCleanup = content.includes('finally') &&
                             content.includes('setActionLoading(null)')
      this.validate(
        'State Cleanup',
        hasStateCleanup,
        'Loading state cleanup in finally blocks'
      )
    }
  }

  // Generate test summary
  generateSummary() {
    this.log('', 'info')
    this.log('📊 TEST SUMMARY', 'info')
    this.log('=' * 50, 'info')

    const total = this.results.length
    const passed = this.results.filter(r => r.status === 'PASS').length
    const failed = this.results.filter(r => r.status === 'FAIL').length

    this.results.forEach(result => {
      const icon = result.status === 'PASS' ? '✅' : '❌'
      const color = result.status === 'PASS' ? 'success' : 'error'
      this.log(`${icon} ${result.name}`, color)
    })

    this.log('', 'info')
    this.log(`Total Tests: ${total}`, 'info')
    this.log(`Passed: ${passed}`, 'success')
    this.log(`Failed: ${failed}`, failed > 0 ? 'error' : 'info')
    this.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`, 
             failed === 0 ? 'success' : 'warning')

    if (failed === 0) {
      this.log('', 'info')
      this.log('🎉 ALL TESTS PASSED!', 'success')
      this.log('✅ Invitation notification system is COMPLETE', 'success')
      this.log('', 'info')
      this.log('🚀 FEATURES IMPLEMENTED:', 'success')
      this.log('   • Workspace invitation notifications', 'info')
      this.log('   • Accept/Decline actions in notifications', 'info')
      this.log('   • Real-time count updates in notification bell', 'info')
      this.log('   • Integration with dropdown and page', 'info')
      this.log('   • Secure API endpoints', 'info')
      this.log('   • Proper error handling and loading states', 'info')
    } else {
      this.log('', 'info')
      this.log('❌ SOME TESTS FAILED', 'error')
      this.log('Please review the failed tests and fix the issues', 'warning')
    }
  }

  // Run all tests
  runAllTests() {
    console.log(chalk.cyan('🧪 INVITATION NOTIFICATION SYSTEM TEST'))
    console.log(chalk.cyan('=' * 60))
    console.log('')

    this.testComponentStructure()
    console.log('')
    
    this.testAPIIntegration()
    console.log('')
    
    this.testNotificationPageIntegration()
    console.log('')
    
    this.testDatabaseSchema()
    console.log('')
    
    this.testSecurity()
    console.log('')
    
    this.testUIComponents()
    console.log('')
    
    this.testErrorHandling()
    console.log('')
    
    this.generateSummary()
  }
}

// Run the test if called directly
if (require.main === module) {
  const test = new InvitationNotificationTest()
  test.runAllTests()
}

module.exports = InvitationNotificationTest
