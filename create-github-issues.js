#!/usr/bin/env node

/**
 * GitHub Issues Creation Script for PM-App API Implementation
 * 
 * This script creates GitHub issues for missing API functionality
 * based on the comprehensive API analysis and implementation guide.
 * 
 * Prerequisites:
 * 1. Install GitHub CLI: https://cli.github.com/
 * 2. Authenticate: gh auth login
 * 3. Run: node create-github-issues.js
 */

const { execSync } = require('child_process');

// GitHub repository details
const REPO = 'tim7en/pm-app';

// Issue templates
const issues = [
  {
    title: '🗓️ [PRIORITY] Complete Calendar API Backend Implementation',
    labels: ['enhancement', 'api', 'backend', 'priority-high'],
    milestone: 'Phase 1: Core Features',
    body: `## 🎯 Issue Summary
Complete the Calendar API backend implementation to replace mock data with real database integration.

## 📋 Current Status
- ✅ Database schema exists (CalendarEvent, EventAttendee models)
- ✅ Frontend components implemented
- ❌ Backend API endpoints use mock data
- ❌ No real database operations

## 🔧 Implementation Tasks

### Backend API Routes
- [ ] Complete \`/src/app/api/calendar/events/route.ts\`
  - [ ] GET endpoint with workspace filtering
  - [ ] POST endpoint with validation
  - [ ] Proper authentication checks
  - [ ] Database operations instead of mock data

- [ ] Complete \`/src/app/api/calendar/events/[id]/route.ts\`
  - [ ] GET single event
  - [ ] PUT update event
  - [ ] DELETE event
  - [ ] Permission validation

### Database Integration
- [ ] Remove mock data dependencies
- [ ] Implement real event creation
- [ ] Add attendee management
- [ ] Event workspace/project association

### Frontend Updates
- [ ] Update calendar components to use real API
- [ ] Remove mock data imports
- [ ] Add proper error handling
- [ ] Loading states for API calls

## 🧪 Testing Requirements
- [ ] API endpoint testing
- [ ] Permission validation testing
- [ ] Frontend integration testing
- [ ] Calendar CRUD operations

## 📚 References
- API Implementation Guide: \`API_IMPLEMENTATION_GUIDE.md\` (Phase 1)
- API Reference: \`API_REFERENCE_GUIDE.md\` (Calendar API section)
- Existing schema: \`prisma/schema.prisma\` (CalendarEvent model)

## ⏱️ Estimated Time
**1-2 days**

## 💡 Implementation Notes
- Maintain existing frontend functionality
- Ensure workspace-based access control
- Follow existing API patterns for consistency
- Add proper Zod validation schemas`
  },

  {
    title: '💳 [CORE] Payments & Billing System Implementation',
    labels: ['enhancement', 'payments', 'stripe', 'billing', 'priority-high'],
    milestone: 'Phase 2: Monetization',
    body: `## 🎯 Issue Summary
Implement complete payments and billing system with Stripe integration for subscriptions, invoices, and usage tracking.

## 📋 Current Status
- ❌ No payment system implemented
- ❌ Stripe integration missing
- ❌ Subscription management needed
- ❌ Invoice handling required

## 🔧 Implementation Tasks

### Database Schema
- [ ] Add Subscription model
- [ ] Add Invoice model  
- [ ] Add PaymentMethod model
- [ ] Update User/Workspace models with payment relations
- [ ] Create migration scripts

### Stripe Integration
- [ ] Set up Stripe service (\`/src/lib/stripe.ts\`)
- [ ] Configure webhook handlers
- [ ] Implement subscription management
- [ ] Add payment method handling
- [ ] Invoice processing

### API Endpoints
- [ ] \`/api/billing/subscriptions\` (GET, POST, PUT, DELETE)
- [ ] \`/api/billing/payment-methods\` (GET, POST, DELETE)
- [ ] \`/api/billing/invoices\` (GET, download)
- [ ] \`/api/billing/usage\` (GET usage analytics)
- [ ] \`/api/billing/webhooks\` (Stripe webhook handler)

### Frontend Components
- [ ] Subscription management page
- [ ] Payment method management
- [ ] Billing history
- [ ] Usage analytics dashboard
- [ ] Plan upgrade/downgrade flows

### Business Logic
- [ ] Subscription plan definitions
- [ ] Usage tracking and limits
- [ ] Prorations and upgrades
- [ ] Trial period handling
- [ ] Cancellation management

## 🧪 Testing Requirements
- [ ] Stripe webhook testing
- [ ] Subscription flow testing
- [ ] Payment method validation
- [ ] Usage limit enforcement
- [ ] Error handling scenarios

## 📚 References
- API Implementation Guide: \`API_IMPLEMENTATION_GUIDE.md\` (Phase 2)
- API Reference: \`API_REFERENCE_GUIDE.md\` (Payments & Billing API)
- Stripe Documentation: https://stripe.com/docs

## ⏱️ Estimated Time
**1-2 weeks**

## 💰 Business Impact
- **High**: Core monetization feature
- Enables subscription revenue
- Usage-based billing capabilities
- Customer self-service billing`
  },

  {
    title: '🤖 AI Usage & Credits System Implementation',
    labels: ['enhancement', 'ai', 'credits', 'usage-tracking', 'priority-medium'],
    milestone: 'Phase 3: AI Features',
    body: `## 🎯 Issue Summary
Implement AI credits system to track and bill AI feature usage across the platform.

## 📋 Current Status
- ✅ AI endpoints exist (generate-tasks, assess-project, etc.)
- ❌ No usage tracking
- ❌ No credit system
- ❌ No billing for AI features

## 🔧 Implementation Tasks

### Database Schema
- [ ] Add AiCreditBalance model
- [ ] Add AiUsage tracking model
- [ ] Add AiCreditPurchase model
- [ ] Update User/Workspace models

### AI Credits Service
- [ ] Create \`/src/lib/ai-credits.ts\`
- [ ] Credit consumption logic
- [ ] Balance management
- [ ] Usage history tracking
- [ ] Monthly reset functionality

### API Endpoints
- [ ] \`/api/ai/credits\` (GET balance and usage)
- [ ] \`/api/ai/credits/purchase\` (POST buy credits)
- [ ] \`/api/ai/usage-history\` (GET detailed usage)
- [ ] Update existing AI endpoints to consume credits

### Credit System Logic
- [ ] Define credit costs per AI service
- [ ] Credit package definitions
- [ ] Subscription-based credit allocations
- [ ] Purchase and top-up flows

### Integration Updates
- [ ] Update AI endpoints to check/consume credits
- [ ] Add insufficient credits error handling
- [ ] Credit purchase flow integration
- [ ] Usage analytics dashboard

## 🧪 Testing Requirements
- [ ] Credit consumption testing
- [ ] Balance validation
- [ ] Purchase flow testing
- [ ] Insufficient credits scenarios
- [ ] Monthly reset functionality

## 📚 References
- API Implementation Guide: \`API_IMPLEMENTATION_GUIDE.md\` (Phase 3)
- API Reference: \`API_REFERENCE_GUIDE.md\` (AI Usage & Credits API)
- Existing AI endpoints: \`/src/app/api/ai/\*\`

## ⏱️ Estimated Time
**3-5 days**

## 🎯 Success Criteria
- AI usage tracked and billed
- Credit system prevents overuse
- Clear usage analytics for users
- Seamless credit purchase experience`
  },

  {
    title: '🎁 Referral Program System Implementation',
    labels: ['enhancement', 'referrals', 'growth', 'priority-low'],
    milestone: 'Phase 4: Growth Features',
    body: `## 🎯 Issue Summary
Implement referral program system for user acquisition and growth with tracking, rewards, and payouts.

## 📋 Current Status
- ❌ No referral system
- ❌ Referral tracking needed
- ❌ Reward calculation required
- ❌ Payout system missing

## 🔧 Implementation Tasks

### Database Schema
- [ ] Add ReferralProgram model
- [ ] Add Referral tracking model
- [ ] Add ReferralPayout model
- [ ] Update User model with referral relations

### API Endpoints
- [ ] \`/api/referrals/stats\` (GET user referral statistics)
- [ ] \`/api/referrals/history\` (GET referral history)
- [ ] \`/api/referrals/generate-link\` (POST create custom links)
- [ ] \`/api/referrals/payout\` (POST request payout)

### Referral System Logic
- [ ] Referral code generation
- [ ] Signup tracking via referral codes
- [ ] Reward calculation (referrer bonus, referee discount)
- [ ] Payout threshold management
- [ ] Success criteria validation

### Integration Points
- [ ] Registration flow integration
- [ ] Subscription signup tracking
- [ ] Payment system integration for rewards
- [ ] Email notifications for referrals

### Frontend Components
- [ ] Referral dashboard
- [ ] Referral link sharing
- [ ] Earnings tracking
- [ ] Payout requests

## 🧪 Testing Requirements
- [ ] Referral tracking validation
- [ ] Reward calculation testing
- [ ] Payout processing
- [ ] Fraud prevention testing

## 📚 References
- API Implementation Guide: \`API_IMPLEMENTATION_GUIDE.md\` (Phase 4)
- API Reference: \`API_REFERENCE_GUIDE.md\` (Referral Program API)

## ⏱️ Estimated Time
**2-3 days**

## 📈 Business Impact
- **Medium**: Growth and acquisition feature
- Incentivizes user referrals
- Reduces customer acquisition cost
- Viral growth potential`
  },

  {
    title: '💝 Donations API System Implementation',
    labels: ['enhancement', 'donations', 'crowdfunding', 'priority-low'],
    milestone: 'Phase 4: Growth Features',
    body: `## 🎯 Issue Summary
Implement comprehensive donations/crowdfunding system for project funding and community support.

## 📋 Current Status
- ✅ API specification complete in reference guide
- ❌ No implementation exists
- ❌ Database schema needed
- ❌ Full system implementation required

## 🔧 Implementation Tasks

### Database Schema
- [ ] Add DonationCampaign model
- [ ] Add Donation model
- [ ] Add DonationReward model
- [ ] Add RecurringDonation model
- [ ] Campaign analytics models

### API Endpoints
- [ ] \`/api/donations/campaigns\` (GET, POST campaign management)
- [ ] \`/api/donations/campaigns/[id]\` (GET, PUT, DELETE)
- [ ] \`/api/donations/donate\` (POST process donations)
- [ ] \`/api/donations/history\` (GET donor history)
- [ ] \`/api/donations/leaderboard\` (GET campaign leaderboards)
- [ ] \`/api/donations/badges\` (GET donor achievements)
- [ ] \`/api/donations/recurring\` (GET, PUT, DELETE recurring donations)

### Payment Integration
- [ ] Stripe donation processing
- [ ] Recurring donation handling
- [ ] Tax receipt generation
- [ ] Refund processing

### Campaign Features
- [ ] Campaign creation and management
- [ ] Reward tier system
- [ ] Goal tracking and analytics
- [ ] Campaign updates and communication
- [ ] Media upload (images, videos)

### Donor Features
- [ ] Donation processing
- [ ] Anonymous donation options
- [ ] Recurring donation setup
- [ ] Donor recognition system
- [ ] Badge and achievement system

## 🧪 Testing Requirements
- [ ] Campaign CRUD operations
- [ ] Donation processing flows
- [ ] Recurring donation management
- [ ] Reward fulfillment tracking
- [ ] Analytics and reporting

## 📚 References
- API Reference: \`API_REFERENCE_GUIDE.md\` (Donations API section)
- Implementation details in API Implementation Guide

## ⏱️ Estimated Time
**1-2 weeks**

## 🎯 Success Criteria
- Complete crowdfunding platform
- Donation processing with Stripe
- Campaign management system
- Donor recognition and rewards`
  },

  {
    title: '☁️ Google Drive Integration Implementation',
    labels: ['enhancement', 'integration', 'google-drive', 'storage', 'priority-low'],
    milestone: 'Phase 5: Integrations',
    body: `## 🎯 Issue Summary
Implement Google Drive integration for file storage, sharing, and collaboration within projects and workspaces.

## 📋 Current Status
- ❌ No Google Drive integration
- ❌ File management limited
- ❌ Cloud storage integration needed
- ❌ Collaboration features missing

## 🔧 Implementation Tasks

### Google APIs Setup
- [ ] Configure Google Drive API credentials
- [ ] Set up OAuth 2.0 flow
- [ ] Configure API scopes and permissions

### Google Drive Service
- [ ] Create \`/src/lib/google-drive.ts\`
- [ ] OAuth authentication flow
- [ ] File upload/download operations
- [ ] Folder management
- [ ] Permission and sharing management

### API Endpoints
- [ ] \`/api/integrations/google-drive/auth-url\` (GET OAuth URL)
- [ ] \`/api/integrations/google-drive/callback\` (POST OAuth callback)
- [ ] \`/api/integrations/google-drive/status\` (GET integration status)
- [ ] \`/api/integrations/google-drive/files\` (GET, POST file operations)
- [ ] \`/api/integrations/google-drive/folders\` (POST create workspace folders)

### Database Integration
- [ ] Add GoogleDriveIntegration model
- [ ] User token storage
- [ ] File attachment tracking
- [ ] Integration status management

### Task Integration
- [ ] Attach Google Drive files to tasks
- [ ] File sharing with team members
- [ ] Document collaboration features
- [ ] Version tracking and history

### Workspace Features
- [ ] Automatic workspace folder creation
- [ ] Team member access management
- [ ] Shared workspace storage
- [ ] File organization and structure

## 🧪 Testing Requirements
- [ ] OAuth flow testing
- [ ] File upload/download testing
- [ ] Permission management testing
- [ ] Integration status validation
- [ ] Task attachment functionality

## 📚 References
- API Implementation Guide: \`API_IMPLEMENTATION_GUIDE.md\` (Phase 5)
- API Reference: \`API_REFERENCE_GUIDE.md\` (Google Drive Integration API)
- Google Drive API Documentation

## ⏱️ Estimated Time
**1 week**

## 🔧 Technical Requirements
- Google Cloud Console project
- Drive API credentials
- OAuth 2.0 setup
- File permission management`
  },

  {
    title: '📁 Storage Management System Implementation',
    labels: ['enhancement', 'storage', 'file-management', 'analytics', 'priority-medium'],
    milestone: 'Phase 5: Integrations',
    body: `## 🎯 Issue Summary
Implement comprehensive storage management system for file uploads, storage analytics, and file cleanup operations.

## 📋 Current Status
- ❌ No centralized file management
- ❌ Storage analytics missing
- ❌ File cleanup needed
- ❌ Storage limits not enforced

## 🔧 Implementation Tasks

### Database Schema
- [ ] Add FileStorage model
- [ ] Add StorageUsage tracking
- [ ] File metadata and organization
- [ ] Storage quotas and limits

### API Endpoints
- [ ] \`/api/storage/usage\` (GET storage analytics)
- [ ] \`/api/storage/files\` (GET, POST, DELETE file operations)
- [ ] \`/api/storage/cleanup\` (POST cleanup operations)
- [ ] \`/api/storage/upload\` (POST file upload)

### Storage Service
- [ ] Create \`/src/lib/storage.ts\`
- [ ] File upload handling
- [ ] Storage quota management
- [ ] File cleanup and optimization
- [ ] Usage analytics calculation

### Storage Analytics
- [ ] Usage tracking by type
- [ ] Storage breakdown analytics
- [ ] Growth projections
- [ ] Cleanup recommendations
- [ ] Large file identification

### File Management
- [ ] File type validation
- [ ] Size limit enforcement
- [ ] Automatic cleanup policies
- [ ] Thumbnail generation
- [ ] File organization

### Integration Points
- [ ] Task attachment storage
- [ ] User avatar storage
- [ ] Project asset storage
- [ ] Workspace file management

## 🧪 Testing Requirements
- [ ] File upload/download testing
- [ ] Storage limit enforcement
- [ ] Cleanup operation testing
- [ ] Analytics calculation validation
- [ ] Permission testing

## 📚 References
- API Reference: \`API_REFERENCE_GUIDE.md\` (Storage Management API)
- File handling best practices

## ⏱️ Estimated Time
**3-5 days**

## 📊 Success Criteria
- Centralized file management
- Storage usage analytics
- Automated cleanup policies
- Storage quota enforcement`
  },

  {
    title: '🔧 Bug Reports API Enhancement',
    labels: ['enhancement', 'bug-reports', 'improvement', 'priority-low'],
    milestone: 'Phase 6: Improvements',
    body: `## 🎯 Issue Summary
Enhance the existing Bug Reports API with advanced features and improved functionality.

## 📋 Current Status
- ✅ Basic bug reporting implemented
- ⚠️ Limited features and functionality
- ❌ Advanced filtering missing
- ❌ Enhanced workflow needed

## 🔧 Enhancement Tasks

### API Enhancements
- [ ] Advanced filtering and search
- [ ] Bug assignment workflow
- [ ] Status transition management
- [ ] Bulk operations support
- [ ] Bug duplicate detection

### Feature Additions
- [ ] File attachment support
- [ ] Bug reproduction steps
- [ ] Environment information capture
- [ ] Priority auto-assignment
- [ ] Bug lifecycle tracking

### Reporting & Analytics
- [ ] Bug metrics dashboard
- [ ] Resolution time tracking
- [ ] Bug trend analysis
- [ ] Team performance metrics
- [ ] Custom report generation

### Integration Improvements
- [ ] Email notifications
- [ ] Slack/Teams integration
- [ ] Project association
- [ ] User assignment
- [ ] Custom fields support

### Administrative Features
- [ ] Bug categorization
- [ ] Custom labels and tags
- [ ] SLA management
- [ ] Escalation rules
- [ ] Archive and cleanup

## 🧪 Testing Requirements
- [ ] Enhanced API endpoint testing
- [ ] Workflow validation
- [ ] Performance testing with large datasets
- [ ] Integration testing
- [ ] User permission testing

## 📚 References
- Existing implementation: \`/src/app/api/bug-reports/\`
- API Reference: \`API_REFERENCE_GUIDE.md\` (Bug Reports API)

## ⏱️ Estimated Time
**2-3 days**

## 🎯 Success Criteria
- Enhanced bug tracking workflow
- Improved reporting capabilities
- Better integration with project management
- Advanced filtering and search`
  },

  {
    title: '📊 API Analytics & Monitoring Implementation',
    labels: ['enhancement', 'monitoring', 'analytics', 'devops', 'priority-medium'],
    milestone: 'Phase 6: Improvements',
    body: `## 🎯 Issue Summary
Implement comprehensive API analytics, monitoring, and performance tracking system.

## 📋 Current Status
- ❌ No API analytics
- ❌ Performance monitoring missing
- ❌ Usage tracking needed
- ❌ Error monitoring required

## 🔧 Implementation Tasks

### Analytics Infrastructure
- [ ] API request logging system
- [ ] Performance metrics collection
- [ ] Error tracking and alerting
- [ ] Usage analytics dashboard

### Monitoring Features
- [ ] Real-time API performance
- [ ] Response time tracking
- [ ] Error rate monitoring
- [ ] Usage pattern analysis
- [ ] Rate limiting analytics

### Database Schema
- [ ] Add ApiMetrics model
- [ ] Add ErrorLog model
- [ ] Add UsageStats model
- [ ] Performance tracking tables

### API Endpoints
- [ ] \`/api/analytics/overview\` (GET system overview)
- [ ] \`/api/analytics/performance\` (GET performance metrics)
- [ ] \`/api/analytics/usage\` (GET usage statistics)
- [ ] \`/api/analytics/errors\` (GET error analytics)

### Dashboard Components
- [ ] API performance dashboard
- [ ] Usage analytics charts
- [ ] Error monitoring panel
- [ ] System health indicators

### Alerting System
- [ ] Performance degradation alerts
- [ ] Error rate threshold alerts
- [ ] Usage limit notifications
- [ ] System health monitoring

## 🧪 Testing Requirements
- [ ] Metrics collection validation
- [ ] Dashboard functionality testing
- [ ] Alert system testing
- [ ] Performance impact assessment

## 📚 References
- Monitoring best practices
- API analytics patterns

## ⏱️ Estimated Time
**1 week**

## 📈 Business Impact
- **High**: System reliability and performance
- Proactive issue detection
- Data-driven optimization
- Better user experience`
  }
];

// Function to create a GitHub issue
function createIssue(issue) {
  try {
    console.log(`Creating issue: ${issue.title}`);
    
    // Prepare labels argument
    const labelsArg = issue.labels.map(label => `--label "${label}"`).join(' ');
    
    // Prepare body with proper escaping
    const bodyFile = `/tmp/issue-body-${Date.now()}.md`;
    require('fs').writeFileSync(bodyFile, issue.body);
    
    // Create the issue
    const command = `gh issue create --repo ${REPO} --title "${issue.title}" ${labelsArg} --body-file "${bodyFile}"`;
    
    const result = execSync(command, { encoding: 'utf8' });
    console.log(`✅ Created: ${result.trim()}`);
    
    // Clean up temp file
    require('fs').unlinkSync(bodyFile);
    
    return true;
  } catch (error) {
    console.error(`❌ Failed to create issue: ${issue.title}`);
    console.error(error.message);
    return false;
  }
}

// Main function
async function main() {
  console.log('🚀 Creating GitHub Issues for PM-App API Implementation');
  console.log('=' .repeat(60));
  
  // Check if GitHub CLI is available
  try {
    execSync('gh --version', { stdio: 'ignore' });
  } catch (error) {
    console.error('❌ GitHub CLI not found. Please install: https://cli.github.com/');
    process.exit(1);
  }
  
  // Check authentication
  try {
    execSync('gh auth status', { stdio: 'ignore' });
  } catch (error) {
    console.error('❌ GitHub CLI not authenticated. Run: gh auth login');
    process.exit(1);
  }
  
  console.log(`📋 Creating ${issues.length} issues...\\n`);
  
  let created = 0;
  let failed = 0;
  
  for (const issue of issues) {
    if (createIssue(issue)) {
      created++;
    } else {
      failed++;
    }
    
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\\n' + '=' .repeat(60));
  console.log('📊 Summary:');
  console.log(`   ✅ Created: ${created} issues`);
  console.log(`   ❌ Failed: ${failed} issues`);
  console.log(`   📍 Repository: https://github.com/${REPO}/issues`);
  
  if (created > 0) {
    console.log('\\n🎉 GitHub issues created successfully!');
    console.log('\\n📋 Next Steps:');
    console.log('   1. Review and prioritize issues on GitHub');
    console.log('   2. Assign team members to appropriate issues');
    console.log('   3. Create project boards for sprint planning');
    console.log('   4. Start with Phase 1 (Calendar API) implementation');
  }
}

// Run the script
main().catch(console.error);
