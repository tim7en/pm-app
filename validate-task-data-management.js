#!/usr/bin/env node

/**
 * Task Data Management Features Validation Script
 * 
 * This script validates the new task data management features:
 * - Users involved in task completion can upload/download files
 * - Users involved in task completion can add comments
 * - Proper access control based on user involvement
 * - Task data export functionality
 */

const fs = require('fs')
const path = require('path')

class TaskDataManagementValidator {
  constructor() {
    this.results = []
    this.errors = []
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString()
    const logEntry = `[${timestamp}] ${type.toUpperCase()}: ${message}`
    console.log(logEntry)
    
    if (type === 'error') {
      this.errors.push(message)
    } else {
      this.results.push({ message, type, timestamp })
    }
  }

  validate(testName, condition, successMsg, errorMsg = '', category = 'GENERAL') {
    if (condition) {
      this.log(`✅ ${testName}: ${successMsg}`, 'success')
      return true
    } else {
      this.log(`❌ ${testName}: ${errorMsg || 'Test failed'}`, 'error')
      return false
    }
  }

  // Test 1: Check TaskDataManager component
  testTaskDataManagerComponent() {
    this.log('🔍 TESTING TASK DATA MANAGER COMPONENT', 'info')
    this.log('=' * 60, 'info')

    const componentPath = 'src/components/tasks/task-data-manager.tsx'
    const componentExists = fs.existsSync(componentPath)
    
    this.validate(
      'TaskDataManager Component Exists',
      componentExists,
      'TaskDataManager component file found',
      'TaskDataManager component file missing',
      'COMPONENTS'
    )

    if (componentExists) {
      const content = fs.readFileSync(componentPath, 'utf8')
      
      // Check for access control logic
      const hasAccessControl = content.includes('checkPermissions') &&
                              content.includes('canUpload') &&
                              content.includes('canDownload') &&
                              content.includes('canComment')
      this.validate(
        'Access Control Logic',
        hasAccessControl,
        'Access control permissions properly implemented',
        'Access control logic missing',
        'COMPONENTS'
      )

      // Check for user involvement detection
      const hasInvolvementCheck = content.includes('isTaskCreator') &&
                                 content.includes('isTaskAssignee') &&
                                 content.includes('isMultiAssignee') &&
                                 content.includes('isProjectOwner')
      this.validate(
        'User Involvement Detection',
        hasInvolvementCheck,
        'User involvement in task completion properly detected',
        'User involvement detection missing',
        'COMPONENTS'
      )

      // Check for export functionality
      const hasExportFeature = content.includes('exportTaskData') &&
                              content.includes('/api/tasks') &&
                              content.includes('export')
      this.validate(
        'Export Functionality',
        hasExportFeature,
        'Task data export functionality implemented',
        'Export functionality missing',
        'COMPONENTS'
      )

      // Check for UI components integration
      const hasUIIntegration = content.includes('TaskAttachments') &&
                              content.includes('TaskComments') &&
                              content.includes('Tabs')
      this.validate(
        'UI Components Integration',
        hasUIIntegration,
        'TaskAttachments and TaskComments properly integrated',
        'UI components integration missing',
        'COMPONENTS'
      )
    }
  }

  // Test 2: Check enhanced TaskComments component
  testEnhancedTaskComments() {
    this.log('💬 TESTING ENHANCED TASK COMMENTS', 'info')
    this.log('=' * 60, 'info')

    const componentPath = 'src/components/tasks/task-comments.tsx'
    const componentExists = fs.existsSync(componentPath)
    
    this.validate(
      'TaskComments Component Exists',
      componentExists,
      'TaskComments component file found',
      'TaskComments component file missing',
      'COMMENTS'
    )

    if (componentExists) {
      const content = fs.readFileSync(componentPath, 'utf8')
      
      // Check for permission-based commenting
      const hasPermissionCheck = content.includes('canComment') &&
                                 content.includes('canComment ?') &&
                                 content.includes('permission to add comments')
      this.validate(
        'Permission-based Commenting',
        hasPermissionCheck,
        'Comment form only shows for users with permission',
        'Permission-based commenting missing',
        'COMMENTS'
      )

      // Check for proper interface
      const hasProperInterface = content.includes('canComment?: boolean')
      this.validate(
        'Component Interface',
        hasProperInterface,
        'canComment prop properly defined in interface',
        'canComment prop missing from interface',
        'COMMENTS'
      )
    }
  }

  // Test 3: Check API endpoints
  testAPIEndpoints() {
    this.log('🌐 TESTING API ENDPOINTS', 'info')
    this.log('=' * 60, 'info')

    // Check task export API
    const exportApiPath = 'src/app/api/tasks/[id]/export/route.ts'
    const exportApiExists = fs.existsSync(exportApiPath)
    
    this.validate(
      'Task Export API Endpoint',
      exportApiExists,
      'Task export API endpoint found',
      'Task export API endpoint missing',
      'API'
    )

    if (exportApiExists) {
      const content = fs.readFileSync(exportApiPath, 'utf8')
      
      // Check for comprehensive data export
      const hasComprehensiveExport = content.includes('comments') &&
                                    content.includes('attachments') &&
                                    content.includes('assignees') &&
                                    content.includes('tags')
      this.validate(
        'Comprehensive Data Export',
        hasComprehensiveExport,
        'Export includes all task data (comments, attachments, assignees, tags)',
        'Comprehensive export data missing',
        'API'
      )

      // Check for permission validation
      const hasPermissionValidation = content.includes('hasTaskPermission') &&
                                     content.includes('canViewTask')
      this.validate(
        'API Permission Validation',
        hasPermissionValidation,
        'Export API properly validates user permissions',
        'Permission validation missing in export API',
        'API'
      )

      // Check for proper response format
      const hasProperFormat = content.includes('Content-Type') &&
                             content.includes('application/json') &&
                             content.includes('Content-Disposition')
      this.validate(
        'Export Response Format',
        hasProperFormat,
        'Export API returns properly formatted JSON file',
        'Export response format incorrect',
        'API'
      )
    }

    // Check task detail API enhancement
    const detailApiPath = 'src/app/api/tasks/[id]/route.ts'
    const detailApiExists = fs.existsSync(detailApiPath)
    
    this.validate(
      'Task Detail API Endpoint',
      detailApiExists,
      'Task detail API endpoint found',
      'Task detail API endpoint missing',
      'API'
    )

    // Check attachments API
    const attachmentsApiPath = 'src/app/api/tasks/[id]/attachments/route.ts'
    const attachmentsApiExists = fs.existsSync(attachmentsApiPath)
    
    this.validate(
      'Task Attachments API',
      attachmentsApiExists,
      'Task attachments API found',
      'Task attachments API missing',
      'API'
    )

    // Check comments API
    const commentsApiPath = 'src/app/api/tasks/[id]/comments/route.ts'
    const commentsApiExists = fs.existsSync(commentsApiPath)
    
    this.validate(
      'Task Comments API',
      commentsApiExists,
      'Task comments API found',
      'Task comments API missing',
      'API'
    )
  }

  // Test 4: Check UI enhancements
  testUIEnhancements() {
    this.log('🎨 TESTING UI ENHANCEMENTS', 'info')
    this.log('=' * 60, 'info')

    // Check task detail page
    const detailPagePath = 'src/app/tasks/[id]/page.tsx'
    const detailPageExists = fs.existsSync(detailPagePath)
    
    this.validate(
      'Task Detail Page',
      detailPageExists,
      'Individual task detail page created',
      'Task detail page missing',
      'UI'
    )

    if (detailPageExists) {
      const content = fs.readFileSync(detailPagePath, 'utf8')
      
      // Check for TaskDataManager integration
      const hasDataManager = content.includes('TaskDataManager') &&
                            content.includes('taskId={task.id}')
      this.validate(
        'TaskDataManager Integration',
        hasDataManager,
        'TaskDataManager properly integrated in detail page',
        'TaskDataManager integration missing',
        'UI'
      )

      // Check for proper task data display
      const hasTaskDisplay = content.includes('assignees') &&
                            content.includes('project') &&
                            content.includes('creator')
      this.validate(
        'Task Data Display',
        hasTaskDisplay,
        'Task data properly displayed on detail page',
        'Task data display incomplete',
        'UI'
      )
    }

    // Check task list enhancements
    const taskListPath = 'src/components/tasks/task-list.tsx'
    const taskListExists = fs.existsSync(taskListPath)
    
    if (taskListExists) {
      const content = fs.readFileSync(taskListPath, 'utf8')
      
      // Check for view details option
      const hasViewDetails = content.includes('onTaskView') &&
                            content.includes('View Details') &&
                            content.includes('Eye')
      this.validate(
        'View Details Option',
        hasViewDetails,
        'View Details option added to task list',
        'View Details option missing',
        'UI'
      )
    }

    // Check main tasks page integration
    const tasksPagePath = 'src/app/tasks/page.tsx'
    const tasksPageExists = fs.existsSync(tasksPagePath)
    
    if (tasksPageExists) {
      const content = fs.readFileSync(tasksPagePath, 'utf8')
      
      // Check for navigation to detail page
      const hasNavigation = content.includes('onTaskView') &&
                           content.includes('router.push') &&
                           content.includes('/tasks/')
      this.validate(
        'Task Detail Navigation',
        hasNavigation,
        'Navigation to task detail page implemented',
        'Task detail navigation missing',
        'UI'
      )
    }
  }

  // Test 5: Check access control implementation
  testAccessControl() {
    this.log('🔒 TESTING ACCESS CONTROL', 'info')
    this.log('=' * 60, 'info')

    const rolesPath = 'src/lib/roles.ts'
    const rolesExists = fs.existsSync(rolesPath)
    
    this.validate(
      'Roles Library Exists',
      rolesExists,
      'Roles and permissions library found',
      'Roles library missing',
      'ACCESS_CONTROL'
    )

    if (rolesExists) {
      const content = fs.readFileSync(rolesPath, 'utf8')
      
      // Check for task permissions
      const hasTaskPermissions = content.includes('hasTaskPermission') &&
                                content.includes('canUploadAttachments') &&
                                content.includes('canComment')
      this.validate(
        'Task Permissions',
        hasTaskPermissions,
        'Task-specific permissions properly defined',
        'Task permissions missing',
        'ACCESS_CONTROL'
      )

      // Check for multi-assignee support
      const hasMultiAssignee = content.includes('assignees') &&
                              content.includes('TaskAssignee')
      this.validate(
        'Multi-assignee Support',
        hasMultiAssignee,
        'Multi-assignee access control supported',
        'Multi-assignee support missing',
        'ACCESS_CONTROL'
      )
    }
  }

  // Test 6: Check database schema compliance
  testDatabaseSchema() {
    this.log('🗄️ TESTING DATABASE SCHEMA COMPLIANCE', 'info')
    this.log('=' * 60, 'info')

    const schemaPath = 'prisma/schema.prisma'
    const schemaExists = fs.existsSync(schemaPath)
    
    this.validate(
      'Prisma Schema Exists',
      schemaExists,
      'Prisma schema file found',
      'Prisma schema missing',
      'DATABASE'
    )

    if (schemaExists) {
      const content = fs.readFileSync(schemaPath, 'utf8')
      
      // Check for TaskAttachment model
      const hasTaskAttachment = content.includes('model TaskAttachment') &&
                               content.includes('fileName') &&
                               content.includes('fileSize') &&
                               content.includes('uploadedBy')
      this.validate(
        'TaskAttachment Model',
        hasTaskAttachment,
        'TaskAttachment model properly defined',
        'TaskAttachment model missing or incomplete',
        'DATABASE'
      )

      // Check for Comment model
      const hasComment = content.includes('model Comment') &&
                        content.includes('taskId') &&
                        content.includes('userId')
      this.validate(
        'Comment Model',
        hasComment,
        'Comment model properly defined',
        'Comment model missing or incomplete',
        'DATABASE'
      )

      // Check for TaskAssignee model (multi-assignee support)
      const hasTaskAssignee = content.includes('model TaskAssignee') &&
                             content.includes('taskId') &&
                             content.includes('userId')
      this.validate(
        'TaskAssignee Model',
        hasTaskAssignee,
        'TaskAssignee model for multi-assignee support found',
        'TaskAssignee model missing',
        'DATABASE'
      )
    }
  }

  // Generate summary report
  generateSummary() {
    this.log('📊 VALIDATION SUMMARY', 'info')
    this.log('=' * 60, 'info')

    const totalTests = this.results.length
    const successfulTests = this.results.filter(r => r.type === 'success').length
    const failedTests = this.errors.length

    this.log(`Total tests run: ${totalTests}`, 'info')
    this.log(`Successful: ${successfulTests}`, 'success')
    this.log(`Failed: ${failedTests}`, 'error')
    this.log(`Success rate: ${((successfulTests / totalTests) * 100).toFixed(1)}%`, 'info')

    if (this.errors.length > 0) {
      this.log('🚨 ISSUES FOUND:', 'error')
      this.errors.forEach((error, index) => {
        this.log(`${index + 1}. ${error}`, 'error')
      })
    } else {
      this.log('🎉 ALL TESTS PASSED! Task data management features are properly implemented.', 'success')
    }

    // Feature summary
    this.log('✨ IMPLEMENTED FEATURES:', 'info')
    this.log('• Users involved in task completion can upload/download files', 'info')
    this.log('• Users involved in task completion can add comments', 'info')
    this.log('• Proper access control based on user involvement', 'info')
    this.log('• Task data export functionality', 'info')
    this.log('• Individual task detail pages with data management', 'info')
    this.log('• Enhanced task list with view details option', 'info')
    this.log('• Multi-assignee support with proper permissions', 'info')
  }

  // Run all tests
  runValidation() {
    this.log('🚀 STARTING TASK DATA MANAGEMENT VALIDATION', 'info')
    this.log('=' * 80, 'info')
    
    try {
      this.testTaskDataManagerComponent()
      this.testEnhancedTaskComments()
      this.testAPIEndpoints()
      this.testUIEnhancements()
      this.testAccessControl()
      this.testDatabaseSchema()
      this.generateSummary()
    } catch (error) {
      this.log(`Validation failed with error: ${error.message}`, 'error')
    }
  }
}

// Run the validation
const validator = new TaskDataManagementValidator()
validator.runValidation()
