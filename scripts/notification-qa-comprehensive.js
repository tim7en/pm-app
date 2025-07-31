#!/usr/bin/env node

/**
 * Comprehensive QA/QC Test Suite for Notification System
 * Tests all aspects of real-time notifications, database operations, and UI components
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧪 STARTING COMPREHENSIVE NOTIFICATION QA/QC TEST SUITE');
console.log('=' .repeat(70));

const testResults = {
  passed: 0,
  failed: 0,
  warnings: 0,
  details: []
};

function logTest(category, test, status, details = '') {
  const statusIcon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
  const message = `${statusIcon} [${category}] ${test}`;
  console.log(message + (details ? ` - ${details}` : ''));
  
  testResults.details.push({ category, test, status, details });
  if (status === 'PASS') testResults.passed++;
  else if (status === 'FAIL') testResults.failed++;
  else testResults.warnings++;
}

// Test 1: File Structure & Dependencies
console.log('\n📁 Testing File Structure & Dependencies...');

const criticalFiles = [
  'src/lib/notification-service.ts',
  'src/lib/socket.ts',
  'src/hooks/use-socket.ts',
  'src/contexts/SocketContext.tsx',
  'src/components/layout/notifications-dropdown.tsx',
  'src/app/api/notifications/route.ts',
  'src/app/api/notifications/test/route.ts'
];

criticalFiles.forEach(file => {
  const exists = fs.existsSync(path.join(process.cwd(), file));
  logTest('FILE_STRUCTURE', `${file} exists`, exists ? 'PASS' : 'FAIL');
});

// Test 2: Database Schema Validation
console.log('\n🗄️ Testing Database Schema...');

try {
  const schemaContent = fs.readFileSync('prisma/schema.prisma', 'utf8');
  
  const notificationModelExists = schemaContent.includes('model Notification');
  logTest('DATABASE', 'Notification model exists', notificationModelExists ? 'PASS' : 'FAIL');
  
  const notificationTypeEnum = schemaContent.includes('enum NotificationType');
  logTest('DATABASE', 'NotificationType enum exists', notificationTypeEnum ? 'PASS' : 'FAIL');
  
  const requiredFields = ['id', 'title', 'message', 'type', 'userId', 'isRead', 'createdAt'];
  requiredFields.forEach(field => {
    const fieldExists = schemaContent.includes(field);
    logTest('DATABASE', `Notification.${field} field exists`, fieldExists ? 'PASS' : 'FAIL');
  });
} catch (error) {
  logTest('DATABASE', 'Schema file readable', 'FAIL', error.message);
}

// Test 3: TypeScript Compilation
console.log('\n🔧 Testing TypeScript Compilation...');

try {
  execSync('npx tsc --noEmit --skipLibCheck', { stdio: 'pipe' });
  logTest('TYPESCRIPT', 'No compilation errors', 'PASS');
} catch (error) {
  logTest('TYPESCRIPT', 'Compilation check', 'FAIL', 'Has TypeScript errors');
}

// Test 4: Code Quality & Best Practices
console.log('\n📋 Testing Code Quality...');

const notificationServiceContent = fs.readFileSync('src/lib/notification-service.ts', 'utf8');

// Check for proper error handling
const hasErrorHandling = notificationServiceContent.includes('try {') && notificationServiceContent.includes('catch');
logTest('CODE_QUALITY', 'Error handling implemented', hasErrorHandling ? 'PASS' : 'FAIL');

// Check for input validation
const hasInputValidation = notificationServiceContent.includes('!notificationId') || notificationServiceContent.includes('!userId');
logTest('CODE_QUALITY', 'Input validation present', hasInputValidation ? 'PASS' : 'FAIL');

// Check for proper async/await usage
const hasAsyncAwait = notificationServiceContent.includes('async') && notificationServiceContent.includes('await');
logTest('CODE_QUALITY', 'Proper async/await usage', hasAsyncAwait ? 'PASS' : 'FAIL');

// Test 5: Socket.IO Integration
console.log('\n🔌 Testing Socket.IO Integration...');

const socketContent = fs.readFileSync('src/lib/socket.ts', 'utf8');

const hasSocketSetup = socketContent.includes('setupSocket');
logTest('SOCKET', 'Socket setup function exists', hasSocketSetup ? 'PASS' : 'FAIL');

const hasUserManagement = socketContent.includes('join-user') && socketContent.includes('leave-user');
logTest('SOCKET', 'User room management', hasUserManagement ? 'PASS' : 'FAIL');

const hasNotificationEvents = socketContent.includes('notification') && socketContent.includes('notification-count');
logTest('SOCKET', 'Notification events defined', hasNotificationEvents ? 'PASS' : 'FAIL');

// Test 6: API Endpoints
console.log('\n🚀 Testing API Endpoints...');

const apiContent = fs.readFileSync('src/app/api/notifications/route.ts', 'utf8');

const hasGETMethod = apiContent.includes('export async function GET');
logTest('API', 'GET endpoint exists', hasGETMethod ? 'PASS' : 'FAIL');

const hasPOSTMethod = apiContent.includes('export async function POST');
logTest('API', 'POST endpoint exists', hasPOSTMethod ? 'PASS' : 'FAIL');

const hasRateLimit = apiContent.includes('notificationRateLimit');
logTest('API', 'Rate limiting implemented', hasRateLimit ? 'PASS' : 'FAIL');

const hasAuthentication = apiContent.includes('getAuthSession');
logTest('API', 'Authentication check', hasAuthentication ? 'PASS' : 'FAIL');

// Test 7: Frontend Integration
console.log('\n🎨 Testing Frontend Components...');

const dropdownContent = fs.readFileSync('src/components/layout/notifications-dropdown.tsx', 'utf8');

const hasSocketHook = dropdownContent.includes('useSocket');
logTest('FRONTEND', 'Socket hook integration', hasSocketHook ? 'PASS' : 'FAIL');

const hasRealTimeUpdates = dropdownContent.includes('newNotification') && dropdownContent.includes('addEventListener');
logTest('FRONTEND', 'Real-time update listeners', hasRealTimeUpdates ? 'PASS' : 'FAIL');

const hasRateControl = dropdownContent.includes('RATE_LIMIT_MS') && dropdownContent.includes('debounced');
logTest('FRONTEND', 'Client-side rate limiting', hasRateControl ? 'PASS' : 'FAIL');

const hasErrorHandlingUI = dropdownContent.includes('toast') && dropdownContent.includes('error');
logTest('FRONTEND', 'UI error handling', hasErrorHandlingUI ? 'PASS' : 'FAIL');

// Test 8: Security Checks
console.log('\n🔒 Testing Security Implementation...');

const hasNotificationSecurity = apiContent.includes('notificationSecurity');
logTest('SECURITY', 'Notification sanitization', hasNotificationSecurity ? 'PASS' : 'FAIL');

const hasCSRFProtection = dropdownContent.includes('X-Requested-With');
logTest('SECURITY', 'CSRF protection headers', hasCSRFProtection ? 'PASS' : 'FAIL');

const hasUserValidation = apiContent.includes('session.user.id');
logTest('SECURITY', 'User session validation', hasUserValidation ? 'PASS' : 'FAIL');

// Test 9: Performance Optimizations
console.log('\n⚡ Testing Performance Optimizations...');

const hasDebouncing = dropdownContent.includes('setTimeout') && dropdownContent.includes('clearTimeout');
logTest('PERFORMANCE', 'Request debouncing', hasDebouncing ? 'PASS' : 'FAIL');

const hasCaching = dropdownContent.includes('useMemo') || dropdownContent.includes('useCallback');
logTest('PERFORMANCE', 'React optimizations', hasCaching ? 'PASS' : 'FAIL');

const hasConnectionManagement = fs.readFileSync('src/hooks/use-socket.ts', 'utf8').includes('reconnectAttempts');
logTest('PERFORMANCE', 'Socket reconnection logic', hasConnectionManagement ? 'PASS' : 'FAIL');

// Test 10: Test Data & Development Tools
console.log('\n🧪 Testing Development Tools...');

const hasTestEndpoint = fs.existsSync('src/app/api/notifications/test/route.ts');
logTest('DEV_TOOLS', 'Test notification endpoint', hasTestEndpoint ? 'PASS' : 'FAIL');

const hasTestButton = dropdownContent.includes('Test') && dropdownContent.includes('NODE_ENV');
logTest('DEV_TOOLS', 'Development test button', hasTestButton ? 'PASS' : 'FAIL');

const hasSeedScript = fs.existsSync('scripts/seed-notifications.ts');
logTest('DEV_TOOLS', 'Notification seed script', hasSeedScript ? 'PASS' : 'FAIL');

// Test 11: Runtime Environment Check
console.log('\n🏃 Testing Runtime Environment...');

try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  
  const hasSocketIOClient = packageJson.dependencies && packageJson.dependencies['socket.io-client'];
  logTest('RUNTIME', 'socket.io-client dependency', hasSocketIOClient ? 'PASS' : 'FAIL');
  
  const hasSocketIOServer = packageJson.dependencies && packageJson.dependencies['socket.io'];
  logTest('RUNTIME', 'socket.io server dependency', hasSocketIOServer ? 'PASS' : 'FAIL');
  
  const hasPrisma = packageJson.dependencies && (packageJson.dependencies['prisma'] || packageJson.dependencies['@prisma/client']);
  logTest('RUNTIME', 'Prisma ORM dependency', hasPrisma ? 'PASS' : 'FAIL');
} catch (error) {
  logTest('RUNTIME', 'Package.json validation', 'FAIL', error.message);
}

// Test 12: Integration Points
console.log('\n🔗 Testing Integration Points...');

const serverContent = fs.readFileSync('server.ts', 'utf8');
const hasSocketIntegration = serverContent.includes('setupSocket') && serverContent.includes('setSocketInstance');
logTest('INTEGRATION', 'Server Socket.IO integration', hasSocketIntegration ? 'PASS' : 'FAIL');

const layoutContent = fs.readFileSync('src/app/layout.tsx', 'utf8');
const hasSocketProvider = layoutContent.includes('SocketProvider');
logTest('INTEGRATION', 'Socket provider in layout', hasSocketProvider ? 'PASS' : 'FAIL');

const hasAuthIntegration = dropdownContent.includes('useAuth');
logTest('INTEGRATION', 'Authentication integration', hasAuthIntegration ? 'PASS' : 'FAIL');

// Test 13: Data Flow Validation
console.log('\n🌊 Testing Data Flow...');

const serviceContent = fs.readFileSync('src/lib/notification-service.ts', 'utf8');
const hasSocketEmission = serviceContent.includes('emitNotificationToUser') && serviceContent.includes('emitNotificationCountToUser');
logTest('DATA_FLOW', 'Service to Socket emission', hasSocketEmission ? 'PASS' : 'FAIL');

const hasTaskIntegration = fs.existsSync('src/app/api/tasks/route.ts') && 
  fs.readFileSync('src/app/api/tasks/route.ts', 'utf8').includes('NotificationService');
logTest('DATA_FLOW', 'Task creation notifications', hasTaskIntegration ? 'PASS' : 'FAIL');

const hasCommentIntegration = fs.existsSync('src/app/api/tasks/[id]/comments/route.ts') && 
  fs.readFileSync('src/app/api/tasks/[id]/comments/route.ts', 'utf8').includes('NotificationService');
logTest('DATA_FLOW', 'Comment notifications', hasCommentIntegration ? 'PASS' : 'FAIL');

// Final Report
console.log('\n' + '='.repeat(70));
console.log('📊 QA/QC TEST RESULTS SUMMARY');
console.log('='.repeat(70));

console.log(`✅ PASSED: ${testResults.passed}`);
console.log(`❌ FAILED: ${testResults.failed}`);
console.log(`⚠️  WARNINGS: ${testResults.warnings}`);
console.log(`📝 TOTAL TESTS: ${testResults.passed + testResults.failed + testResults.warnings}`);

const successRate = (testResults.passed / (testResults.passed + testResults.failed + testResults.warnings) * 100).toFixed(1);
console.log(`🎯 SUCCESS RATE: ${successRate}%`);

if (testResults.failed > 0) {
  console.log('\n❌ FAILED TESTS:');
  testResults.details
    .filter(t => t.status === 'FAIL')
    .forEach(t => console.log(`  • [${t.category}] ${t.test}${t.details ? ` - ${t.details}` : ''}`));
}

if (testResults.warnings > 0) {
  console.log('\n⚠️  WARNINGS:');
  testResults.details
    .filter(t => t.status === 'WARN')
    .forEach(t => console.log(`  • [${t.category}] ${t.test}${t.details ? ` - ${t.details}` : ''}`));
}

console.log('\n🏆 QUALITY ASSESSMENT:');
if (successRate >= 95) {
  console.log('🟢 EXCELLENT - Production ready with minor optimizations needed');
} else if (successRate >= 85) {
  console.log('🟡 GOOD - Some issues need addressing before production');
} else if (successRate >= 70) {
  console.log('🟠 FAIR - Significant improvements required');
} else {
  console.log('🔴 POOR - Major issues must be resolved');
}

console.log('\n📋 RECOMMENDED NEXT STEPS:');
console.log('1. Address any failed tests above');
console.log('2. Run functional tests with actual user interactions');
console.log('3. Perform load testing for Socket.IO connections');
console.log('4. Test notification delivery under high concurrency');
console.log('5. Validate browser notification permissions');
console.log('6. Test real-time updates across multiple browser tabs');

process.exit(testResults.failed > 0 ? 1 : 0);
