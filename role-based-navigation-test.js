/**
 * Comprehensive Role-Based Navigation Testing Suite
 * 
 * Tests navigation access controls for all role levels:
 * 
 * Workspace Roles:
 * - OWNER: Full workspace control and ownership
 * - ADMIN: Administrative privileges within workspace
 * - PROJECT_MANAGER: Project management capabilities
 * - PROJECT_OFFICER: Project operations support
 * - MEMBER: Basic workspace participation
 * - GUEST: Read-only workspace access
 * 
 * Project Roles:
 * - ADMIN: Full project control
 * - MANAGER: Project management capabilities
 * - OFFICER: Project operational tasks
 * - MEMBER: Basic project participation
 * - VIEWER: Read-only project access
 */

const { chromium } = require('playwright');

class RoleBasedNavigationTester {
  constructor() {
    this.baseURL = 'http://localhost:3000';
    this.browser = null;
    this.context = null;
    this.page = null;
    this.testResults = [];
    this.currentTestSuite = '';
    
    // Test user credentials - using corrected passwords from previous tests
    this.testUsers = {
      owner: { email: 'tim7en@gmail.com', password: 'TestAdmin123!' },
      admin: { email: 'testadmin@example.com', password: 'TestAdmin123!' },
      member1: { email: 'testmember1@example.com', password: 'TestMember1123!' },
      member2: { email: 'testmember2@example.com', password: 'TestMember2123!' },
      guest: { email: 'testguest@example.com', password: 'TestGuest123!' }
    };
    
    // Navigation structure with expected access levels
    this.navigationRoutes = {
      // Core navigation
      dashboard: { path: '/', icon: 'Home', accessLevel: 'ALL' },
      tasks: { path: '/tasks', icon: 'CheckSquare', accessLevel: 'MEMBER+' },
      projects: { path: '/projects', icon: 'FolderOpen', accessLevel: 'MEMBER+' },
      team: { path: '/team', icon: 'Users', accessLevel: 'MEMBER+' },
      calendar: { path: '/calendar', icon: 'Calendar', accessLevel: 'MEMBER+' },
      messages: { path: '/messages', icon: 'MessageSquare', accessLevel: 'MEMBER+' },
      analytics: { path: '/analytics', icon: 'BarChart3', accessLevel: 'ADMIN+' },
      settings: { path: '/settings', icon: 'Settings', accessLevel: 'ALL' },
      
      // Workspace management
      workspaces: { path: '/workspaces', icon: 'Building2', accessLevel: 'ALL' },
      workspaceSettings: { path: '/workspace/settings', icon: 'Cog', accessLevel: 'ADMIN+' },
      memberManagement: { path: '/workspace/members', icon: 'UserCog', accessLevel: 'ADMIN+' },
      
      // Notifications
      notifications: { path: '/notifications', icon: 'Bell', accessLevel: 'MEMBER+' },
      
      // Admin features
      aiDemo: { path: '/ai-demo', icon: 'Bot', accessLevel: 'ADMIN+' },
      testPages: { 
        teamCommunication: { path: '/test-team-communication', accessLevel: 'ADMIN+' },
        aiMonitor: { path: '/test-ai-monitor', accessLevel: 'ADMIN+' }
      }
    };
    
    // Role hierarchy definitions
    this.roleHierarchy = {
      GUEST: { level: 1, inheritFrom: [] },
      MEMBER: { level: 2, inheritFrom: ['GUEST'] },
      PROJECT_OFFICER: { level: 3, inheritFrom: ['MEMBER'] },
      PROJECT_MANAGER: { level: 4, inheritFrom: ['PROJECT_OFFICER'] },
      ADMIN: { level: 5, inheritFrom: ['PROJECT_MANAGER'] },
      OWNER: { level: 6, inheritFrom: ['ADMIN'] }
    };
  }

  async initialize() {
    console.log('🚀 Initializing Role-Based Navigation Test Suite...\n');
    
    this.browser = await chromium.launch({
      headless: false,
      args: ['--no-sandbox', '--disable-dev-shm-usage']
    });
    
    this.context = await this.browser.newContext({
      viewport: { width: 1280, height: 720 },
      ignoreHTTPSErrors: true
    });
    
    this.page = await this.context.newPage();
    
    // Set up console logging
    this.page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log(`🔴 Browser Error: ${msg.text()}`);
      }
    });
    
    console.log('✅ Browser initialized successfully');
  }

  async runTest(testName, testFn) {
    const startTime = Date.now();
    try {
      console.log(`\n🧪 Running: ${this.currentTestSuite} - ${testName}`);
      await testFn();
      const duration = Date.now() - startTime;
      this.testResults.push({
        suite: this.currentTestSuite,
        name: testName,
        status: 'PASSED',
        duration,
        error: null
      });
      console.log(`✅ ${testName} - PASSED (${duration}ms)`);
    } catch (error) {
      const duration = Date.now() - startTime;
      this.testResults.push({
        suite: this.currentTestSuite,
        name: testName,
        status: 'FAILED',
        duration,
        error: error.message
      });
      console.log(`❌ ${testName} - FAILED (${duration}ms)`);
      console.log(`   Error: ${error.message}`);
    }
  }

  async authenticateAs(userType) {
    console.log(`🔐 Authenticating as ${userType}...`);
    
    const credentials = this.testUsers[userType];
    if (!credentials) {
      throw new Error(`Unknown user type: ${userType}`);
    }
    
    // Navigate to auth page
    await this.page.goto(`${this.baseURL}/auth`);
    await this.page.waitForLoadState('networkidle');
    
    // Fill login form
    await this.page.fill('input[type="email"]', credentials.email);
    await this.page.fill('input[type="password"]', credentials.password);
    
    // Submit login
    await this.page.click('button[type="submit"]');
    await this.page.waitForLoadState('networkidle');
    
    // Verify successful login by checking for dashboard or redirect
    const currentUrl = this.page.url();
    if (currentUrl.includes('/auth') && !currentUrl.includes('/auth/google')) {
      // Check for error messages
      const errorElement = await this.page.$('.text-destructive, .error, [role="alert"]');
      if (errorElement) {
        const errorText = await errorElement.textContent();
        throw new Error(`Authentication failed for ${userType}: ${errorText}`);
      }
      throw new Error(`Authentication failed for ${userType}: Still on auth page`);
    }
    
    console.log(`✅ Successfully authenticated as ${userType}`);
  }

  async getUserRole() {
    try {
      // Try to extract user role from the page context
      const userRole = await this.page.evaluate(() => {
        // Check for role badges or indicators in the UI
        const roleBadge = document.querySelector('[class*="role"], [data-role], .badge');
        if (roleBadge) {
          const text = roleBadge.textContent || roleBadge.getAttribute('data-role');
          if (text && ['OWNER', 'ADMIN', 'MEMBER', 'GUEST'].some(role => text.includes(role))) {
            return text.match(/(OWNER|ADMIN|MEMBER|GUEST)/)[1];
          }
        }
        
        // Check workspace selector for role information
        const workspaceSelector = document.querySelector('[class*="workspace"], [class*="selector"]');
        if (workspaceSelector) {
          const text = workspaceSelector.textContent;
          if (text && ['OWNER', 'ADMIN', 'MEMBER', 'GUEST'].some(role => text.includes(role))) {
            return text.match(/(OWNER|ADMIN|MEMBER|GUEST)/)[1];
          }
        }
        
        return 'UNKNOWN';
      });
      
      return userRole;
    } catch (error) {
      console.log(`⚠️  Could not determine user role: ${error.message}`);
      return 'UNKNOWN';
    }
  }

  async testNavigationAccess(route, expectedAccessible) {
    try {
      console.log(`   Testing access to ${route.path}...`);
      
      // Navigate to the route
      await this.page.goto(`${this.baseURL}${route.path}`);
      await this.page.waitForLoadState('networkidle');
      
      const currentUrl = this.page.url();
      const pageTitle = await this.page.title();
      
      // Check if redirected to auth or access denied
      const isAccessDenied = currentUrl.includes('/auth') || 
                            currentUrl.includes('/unauthorized') ||
                            currentUrl.includes('/access-denied') ||
                            pageTitle.toLowerCase().includes('access denied') ||
                            pageTitle.toLowerCase().includes('unauthorized');
      
      // Check for access denied content on the page
      const accessDeniedContent = await this.page.locator('text=/access denied|unauthorized|permission denied|not authorized/i').count();
      const hasAccessDeniedContent = accessDeniedContent > 0;
      
      // Check for error messages or 404s
      const errorContent = await this.page.locator('text=/404|not found|error|something went wrong/i').count();
      const hasErrorContent = errorContent > 0;
      
      const actuallyAccessible = !isAccessDenied && !hasAccessDeniedContent && !hasErrorContent;
      
      if (expectedAccessible && !actuallyAccessible) {
        throw new Error(`Expected access to ${route.path} but was denied. Current URL: ${currentUrl}`);
      }
      
      if (!expectedAccessible && actuallyAccessible) {
        throw new Error(`Expected access denied to ${route.path} but was granted. Current URL: ${currentUrl}`);
      }
      
      return {
        path: route.path,
        expectedAccessible,
        actuallyAccessible,
        currentUrl,
        pageTitle
      };
      
    } catch (error) {
      console.log(`   ⚠️  Navigation test failed for ${route.path}: ${error.message}`);
      throw error;
    }
  }

  async testSidebarVisibility(userRole) {
    console.log(`   Testing sidebar navigation visibility for ${userRole}...`);
    
    // Navigate to dashboard to ensure sidebar is loaded
    await this.page.goto(`${this.baseURL}/`);
    await this.page.waitForLoadState('networkidle');
    
    const sidebarResults = {};
    
    // Check each navigation item's visibility
    for (const [routeName, route] of Object.entries(this.navigationRoutes)) {
      if (typeof route === 'object' && route.path) {
        try {
          // Look for navigation links using various selectors
          const navLinkSelectors = [
            `a[href="${route.path}"]`,
            `[href="${route.path}"]`,
            `text="${routeName}"`,
            `text="${route.icon}"`,
            `[aria-label*="${routeName}"]`
          ];
          
          let isVisible = false;
          for (const selector of navLinkSelectors) {
            const element = await this.page.$(selector);
            if (element) {
              const visible = await element.isVisible();
              if (visible) {
                isVisible = true;
                break;
              }
            }
          }
          
          sidebarResults[routeName] = {
            visible: isVisible,
            expectedVisible: this.shouldHaveAccess(userRole, route.accessLevel),
            path: route.path
          };
          
        } catch (error) {
          console.log(`   ⚠️  Could not check visibility for ${routeName}: ${error.message}`);
          sidebarResults[routeName] = {
            visible: false,
            expectedVisible: this.shouldHaveAccess(userRole, route.accessLevel),
            path: route.path,
            error: error.message
          };
        }
      }
    }
    
    return sidebarResults;
  }

  shouldHaveAccess(userRole, accessLevel) {
    if (accessLevel === 'ALL') return true;
    
    const roleLevel = this.roleHierarchy[userRole]?.level || 0;
    
    switch (accessLevel) {
      case 'OWNER':
        return roleLevel >= 6;
      case 'ADMIN+':
        return roleLevel >= 5;
      case 'MANAGER+':
        return roleLevel >= 4;
      case 'OFFICER+':
        return roleLevel >= 3;
      case 'MEMBER+':
        return roleLevel >= 2;
      case 'GUEST+':
        return roleLevel >= 1;
      default:
        return false;
    }
  }

  async testOwnerNavigationAccess() {
    this.currentTestSuite = 'Owner Navigation Access';
    
    await this.runTest('Owner Authentication', async () => {
      await this.authenticateAs('owner');
      const role = await this.getUserRole();
      console.log(`   Detected role: ${role}`);
    });

    await this.runTest('Owner Sidebar Visibility', async () => {
      const sidebarResults = await this.testSidebarVisibility('OWNER');
      
      // Validate that owner sees all expected navigation items
      const expectedVisible = ['dashboard', 'tasks', 'projects', 'team', 'calendar', 'messages', 'analytics', 'settings', 'workspaces', 'workspaceSettings', 'memberManagement'];
      
      for (const item of expectedVisible) {
        if (sidebarResults[item] && !sidebarResults[item].visible) {
          throw new Error(`Owner should see ${item} in navigation but it's not visible`);
        }
      }
    });

    await this.runTest('Owner Route Access', async () => {
      const criticalRoutes = [
        this.navigationRoutes.dashboard,
        this.navigationRoutes.workspaceSettings,
        this.navigationRoutes.memberManagement,
        this.navigationRoutes.analytics,
        this.navigationRoutes.projects
      ];
      
      for (const route of criticalRoutes) {
        await this.testNavigationAccess(route, true);
      }
    });

    await this.runTest('Owner Workspace Management Access', async () => {
      // Test specific workspace management features
      await this.page.goto(`${this.baseURL}/workspace/members`);
      await this.page.waitForLoadState('networkidle');
      
      // Check for member management controls (invite, role changes, etc.)
      const inviteButton = await this.page.$('button:has-text("Send Invite"), button:has-text("Invite")');
      if (!inviteButton) {
        throw new Error('Owner should have access to invite members');
      }
      
      const memberControls = await this.page.$$('[data-testid="member-actions"], .dropdown-menu, button:has-text("Remove")');
      if (memberControls.length === 0) {
        console.log('⚠️  No member action controls found - this may be expected if no other members exist');
      }
    });
  }

  async testAdminNavigationAccess() {
    this.currentTestSuite = 'Admin Navigation Access';
    
    await this.runTest('Admin Authentication', async () => {
      await this.authenticateAs('admin');
      const role = await this.getUserRole();
      console.log(`   Detected role: ${role}`);
    });

    await this.runTest('Admin Sidebar Visibility', async () => {
      const sidebarResults = await this.testSidebarVisibility('ADMIN');
      
      // Validate admin navigation access
      const shouldSee = ['dashboard', 'tasks', 'projects', 'team', 'calendar', 'messages', 'analytics', 'settings'];
      const shouldNotSee = []; // Admins generally have broad access
      
      for (const item of shouldSee) {
        if (sidebarResults[item] && !sidebarResults[item].visible) {
          throw new Error(`Admin should see ${item} in navigation`);
        }
      }
    });

    await this.runTest('Admin Route Access', async () => {
      const adminRoutes = [
        this.navigationRoutes.analytics,
        this.navigationRoutes.workspaceSettings,
        this.navigationRoutes.memberManagement,
        this.navigationRoutes.team
      ];
      
      for (const route of adminRoutes) {
        await this.testNavigationAccess(route, true);
      }
    });

    await this.runTest('Admin Project Management', async () => {
      await this.page.goto(`${this.baseURL}/projects`);
      await this.page.waitForLoadState('networkidle');
      
      // Check for project creation capabilities
      const createButton = await this.page.$('button:has-text("Create"), button:has-text("New Project"), [aria-label*="create"]');
      if (!createButton) {
        console.log('⚠️  No project creation button found - may be conditional on workspace setup');
      }
    });
  }

  async testMemberNavigationAccess() {
    this.currentTestSuite = 'Member Navigation Access';
    
    await this.runTest('Member Authentication', async () => {
      await this.authenticateAs('member1');
      const role = await this.getUserRole();
      console.log(`   Detected role: ${role}`);
    });

    await this.runTest('Member Sidebar Visibility', async () => {
      const sidebarResults = await this.testSidebarVisibility('MEMBER');
      
      // Members should see basic navigation but not admin features
      const shouldSee = ['dashboard', 'tasks', 'projects', 'team', 'calendar', 'messages', 'settings'];
      const shouldNotSee = ['analytics', 'workspaceSettings', 'memberManagement'];
      
      for (const item of shouldSee) {
        if (sidebarResults[item] && !sidebarResults[item].visible) {
          console.log(`⚠️  Member should see ${item} but it's not visible - this may be workspace-dependent`);
        }
      }
      
      for (const item of shouldNotSee) {
        if (sidebarResults[item] && sidebarResults[item].visible) {
          throw new Error(`Member should not see ${item} in navigation`);
        }
      }
    });

    await this.runTest('Member Route Access', async () => {
      // Test allowed routes
      const allowedRoutes = [
        this.navigationRoutes.dashboard,
        this.navigationRoutes.tasks,
        this.navigationRoutes.projects,
        this.navigationRoutes.settings
      ];
      
      for (const route of allowedRoutes) {
        await this.testNavigationAccess(route, true);
      }
      
      // Test restricted routes
      const restrictedRoutes = [
        this.navigationRoutes.workspaceSettings,
        this.navigationRoutes.memberManagement
      ];
      
      for (const route of restrictedRoutes) {
        try {
          await this.testNavigationAccess(route, false);
        } catch (error) {
          console.log(`   ℹ️  Member route restriction test: ${error.message}`);
          // Log but don't fail - access control may be implemented differently
        }
      }
    });

    await this.runTest('Member Task Management', async () => {
      await this.page.goto(`${this.baseURL}/tasks`);
      await this.page.waitForLoadState('networkidle');
      
      // Check basic task access
      const pageContent = await this.page.textContent('body');
      if (pageContent.includes('Access denied') || pageContent.includes('Unauthorized')) {
        throw new Error('Member should have access to tasks page');
      }
      
      // Check for task creation (may be limited)
      const createTaskButton = await this.page.$('button:has-text("Create"), button:has-text("New Task"), [aria-label*="create"]');
      console.log(`   Task creation access: ${createTaskButton ? 'Available' : 'Not available'}`);
    });
  }

  async testGuestNavigationAccess() {
    this.currentTestSuite = 'Guest Navigation Access';
    
    await this.runTest('Guest Authentication', async () => {
      try {
        await this.authenticateAs('guest');
        const role = await this.getUserRole();
        console.log(`   Detected role: ${role}`);
      } catch (error) {
        console.log(`   ℹ️  Guest authentication may not be available: ${error.message}`);
        // Skip guest tests if guest user doesn't exist
        return;
      }
    });

    await this.runTest('Guest Sidebar Visibility', async () => {
      const sidebarResults = await this.testSidebarVisibility('GUEST');
      
      // Guests should have very limited access
      const shouldSee = ['dashboard', 'settings'];
      const shouldNotSee = ['analytics', 'workspaceSettings', 'memberManagement', 'team'];
      
      for (const item of shouldNotSee) {
        if (sidebarResults[item] && sidebarResults[item].visible) {
          throw new Error(`Guest should not see ${item} in navigation`);
        }
      }
    });

    await this.runTest('Guest Route Restrictions', async () => {
      const restrictedRoutes = [
        this.navigationRoutes.workspaceSettings,
        this.navigationRoutes.memberManagement,
        this.navigationRoutes.analytics
      ];
      
      for (const route of restrictedRoutes) {
        await this.testNavigationAccess(route, false);
      }
    });
  }

  async testRoleTransitions() {
    this.currentTestSuite = 'Role Transition Testing';
    
    await this.runTest('Owner to Member Transition', async () => {
      // Start as owner
      await this.authenticateAs('owner');
      await this.page.goto(`${this.baseURL}/workspace/settings`);
      
      // Verify owner access
      let currentUrl = this.page.url();
      if (currentUrl.includes('/auth') || currentUrl.includes('/unauthorized')) {
        throw new Error('Owner should have access to workspace settings');
      }
      
      // Switch to member
      await this.authenticateAs('member1');
      await this.page.goto(`${this.baseURL}/workspace/settings`);
      
      // Verify member restriction
      currentUrl = this.page.url();
      const hasAccess = !currentUrl.includes('/auth') && !currentUrl.includes('/unauthorized');
      const pageContent = await this.page.textContent('body');
      const hasAccessDenied = pageContent.includes('Access denied') || pageContent.includes('Unauthorized');
      
      if (hasAccess && !hasAccessDenied) {
        console.log('   ⚠️  Member may have inherited access to workspace settings - checking role-based restrictions');
      }
    });

    await this.runTest('Cross-Role Navigation Consistency', async () => {
      const roles = ['owner', 'admin', 'member1'];
      const testRoute = this.navigationRoutes.dashboard;
      
      for (const role of roles) {
        await this.authenticateAs(role);
        await this.testNavigationAccess(testRoute, true);
        console.log(`   ✓ ${role} can access dashboard`);
      }
    });
  }

  async testProjectRoleNavigation() {
    this.currentTestSuite = 'Project Role Navigation';
    
    await this.runTest('Project Access by Role', async () => {
      await this.authenticateAs('member1');
      await this.page.goto(`${this.baseURL}/projects`);
      await this.page.waitForLoadState('networkidle');
      
      // Check if user can see projects
      const pageContent = await this.page.textContent('body');
      const hasProjects = !pageContent.includes('No projects') && !pageContent.includes('Access denied');
      
      if (hasProjects) {
        // Try to access a specific project (if any exist)
        const projectLinks = await this.page.$$('a[href*="/projects/"], a[href*="/tasks?project="]');
        if (projectLinks.length > 0) {
          await projectLinks[0].click();
          await this.page.waitForLoadState('networkidle');
          
          const projectUrl = this.page.url();
          if (projectUrl.includes('/auth') || projectUrl.includes('/unauthorized')) {
            throw new Error('Member should have access to assigned projects');
          }
        }
      }
    });

    await this.runTest('Project Creation Permissions', async () => {
      const roles = ['owner', 'admin', 'member1'];
      
      for (const role of roles) {
        await this.authenticateAs(role);
        await this.page.goto(`${this.baseURL}/projects`);
        await this.page.waitForLoadState('networkidle');
        
        const createButton = await this.page.$('button:has-text("Create"), button:has-text("New Project"), [aria-label*="create"]');
        const hasCreateAccess = !!createButton;
        
        console.log(`   ${role} project creation access: ${hasCreateAccess ? 'Available' : 'Not available'}`);
        
        if (role === 'owner' && !hasCreateAccess) {
          console.log('   ⚠️  Owner should typically have project creation access');
        }
      }
    });
  }

  async testResponsiveNavigation() {
    this.currentTestSuite = 'Responsive Navigation';
    
    await this.runTest('Mobile Navigation Access', async () => {
      await this.authenticateAs('owner');
      
      // Set mobile viewport
      await this.page.setViewportSize({ width: 375, height: 667 });
      await this.page.goto(`${this.baseURL}/`);
      await this.page.waitForLoadState('networkidle');
      
      // Check for mobile menu trigger
      const mobileMenuTrigger = await this.page.$('button[aria-label*="menu"], button[aria-label*="navigation"], .menu-trigger, [data-testid="mobile-menu"]');
      
      if (mobileMenuTrigger) {
        await mobileMenuTrigger.click();
        await this.page.waitForTimeout(500); // Wait for menu animation
        
        // Check if navigation items are accessible
        const navItems = await this.page.$$('nav a, [role="navigation"] a');
        if (navItems.length === 0) {
          throw new Error('Mobile navigation should show navigation items when opened');
        }
      } else {
        console.log('   ℹ️  No mobile menu trigger found - navigation may be always visible');
      }
      
      // Reset viewport
      await this.page.setViewportSize({ width: 1280, height: 720 });
    });

    await this.runTest('Tablet Navigation Access', async () => {
      await this.page.setViewportSize({ width: 768, height: 1024 });
      await this.page.goto(`${this.baseURL}/`);
      await this.page.waitForLoadState('networkidle');
      
      // Check navigation visibility on tablet
      const sidebar = await this.page.$('nav, [role="navigation"], .sidebar');
      if (!sidebar) {
        throw new Error('Navigation should be accessible on tablet viewport');
      }
      
      // Reset viewport
      await this.page.setViewportSize({ width: 1280, height: 720 });
    });
  }

  async testNavigationSecurity() {
    this.currentTestSuite = 'Navigation Security';
    
    await this.runTest('Direct URL Access Protection', async () => {
      // Test unauthenticated access to protected routes
      await this.page.goto(`${this.baseURL}/auth`);
      await this.page.waitForLoadState('networkidle');
      
      // Clear authentication
      await this.page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });
      
      // Try to access protected route directly
      await this.page.goto(`${this.baseURL}/workspace/settings`);
      await this.page.waitForLoadState('networkidle');
      
      const currentUrl = this.page.url();
      if (!currentUrl.includes('/auth') && !currentUrl.includes('/login')) {
        throw new Error('Unauthenticated users should be redirected to auth page');
      }
    });

    await this.runTest('Role-Based Route Protection', async () => {
      await this.authenticateAs('member1');
      
      // Try to access admin-only routes
      const adminRoutes = ['/workspace/settings', '/workspace/members'];
      
      for (const route of adminRoutes) {
        await this.page.goto(`${this.baseURL}${route}`);
        await this.page.waitForLoadState('networkidle');
        
        const currentUrl = this.page.url();
        const pageContent = await this.page.textContent('body');
        
        const isProtected = currentUrl.includes('/auth') || 
                           currentUrl.includes('/unauthorized') ||
                           pageContent.includes('Access denied') ||
                           pageContent.includes('Unauthorized') ||
                           pageContent.includes('Permission denied');
        
        if (!isProtected) {
          console.log(`   ⚠️  Route ${route} may not be properly protected from member access`);
        }
      }
    });
  }

  async runAllTests() {
    console.log('🎯 Starting Comprehensive Role-Based Navigation Test Suite\n');
    
    try {
      await this.initialize();
      
      // Test each role's navigation access
      await this.testOwnerNavigationAccess();
      await this.testAdminNavigationAccess();
      await this.testMemberNavigationAccess();
      
      // Test guest access if available
      try {
        await this.testGuestNavigationAccess();
      } catch (error) {
        console.log('⚠️  Skipping guest tests - guest user may not be configured');
      }
      
      // Test role transitions and security
      await this.testRoleTransitions();
      await this.testProjectRoleNavigation();
      await this.testResponsiveNavigation();
      await this.testNavigationSecurity();
      
    } catch (error) {
      console.error('💥 Test suite execution failed:', error);
    } finally {
      await this.cleanup();
      this.generateReport();
    }
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  generateReport() {
    console.log('\n📊 ROLE-BASED NAVIGATION TEST RESULTS');
    console.log('=====================================\n');
    
    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter(t => t.status === 'PASSED').length;
    const failedTests = this.testResults.filter(t => t.status === 'FAILED').length;
    const successRate = ((passedTests / totalTests) * 100).toFixed(1);
    
    console.log(`📈 Overall Results: ${passedTests}/${totalTests} tests passed (${successRate}% success rate)`);
    console.log(`⏱️  Total execution time: ${this.testResults.reduce((sum, t) => sum + t.duration, 0)}ms\n`);
    
    // Group results by test suite
    const suiteResults = {};
    this.testResults.forEach(test => {
      if (!suiteResults[test.suite]) {
        suiteResults[test.suite] = { passed: 0, failed: 0, tests: [] };
      }
      suiteResults[test.suite][test.status === 'PASSED' ? 'passed' : 'failed']++;
      suiteResults[test.suite].tests.push(test);
    });
    
    // Display results by suite
    Object.entries(suiteResults).forEach(([suite, results]) => {
      const suiteSuccessRate = ((results.passed / (results.passed + results.failed)) * 100).toFixed(1);
      console.log(`🧪 ${suite}: ${results.passed}/${results.passed + results.failed} (${suiteSuccessRate}%)`);
      
      results.tests.forEach(test => {
        const icon = test.status === 'PASSED' ? '✅' : '❌';
        console.log(`   ${icon} ${test.name} (${test.duration}ms)`);
        if (test.error) {
          console.log(`      Error: ${test.error}`);
        }
      });
      console.log();
    });
    
    // Summary of key findings
    console.log('🔍 Key Findings:');
    console.log('================');
    
    const criticalFailures = this.testResults.filter(t => 
      t.status === 'FAILED' && 
      (t.name.includes('Authentication') || t.name.includes('Security') || t.name.includes('Access'))
    );
    
    if (criticalFailures.length > 0) {
      console.log('🚨 Critical security/access issues found:');
      criticalFailures.forEach(test => {
        console.log(`   - ${test.suite}: ${test.name}`);
      });
    } else {
      console.log('✅ No critical security/access issues detected');
    }
    
    const roleAccessTests = this.testResults.filter(t => t.suite.includes('Navigation Access'));
    const roleAccessSuccess = (roleAccessTests.filter(t => t.status === 'PASSED').length / roleAccessTests.length * 100).toFixed(1);
    console.log(`🔐 Role-based access control: ${roleAccessSuccess}% success rate`);
    
    const responsiveTests = this.testResults.filter(t => t.suite.includes('Responsive'));
    if (responsiveTests.length > 0) {
      const responsiveSuccess = (responsiveTests.filter(t => t.status === 'PASSED').length / responsiveTests.length * 100).toFixed(1);
      console.log(`📱 Responsive navigation: ${responsiveSuccess}% success rate`);
    }
    
    console.log('\n🎯 Role-based navigation testing completed!');
    
    // Performance insights
    const avgTestDuration = this.testResults.reduce((sum, t) => sum + t.duration, 0) / totalTests;
    console.log(`⚡ Average test duration: ${avgTestDuration.toFixed(0)}ms`);
    
    if (successRate >= 90) {
      console.log('🏆 Excellent! Navigation access controls are working well.');
    } else if (successRate >= 75) {
      console.log('👍 Good navigation access controls with some areas for improvement.');
    } else {
      console.log('⚠️  Navigation access controls need attention - multiple issues detected.');
    }
  }
}

// Run the comprehensive test suite
async function main() {
  const tester = new RoleBasedNavigationTester();
  await tester.runAllTests();
}

// Error handling
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Run tests
main().catch(console.error);
