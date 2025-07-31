/**
 * Visual Validation Script for Teams & Analytics Panels
 * 
 * This script performs visual testing and component validation
 * by actually checking the rendered components in the browser
 */

class VisualComponentValidator {
  constructor() {
    this.results = {
      teamsPanel: [],
      analyticsPanel: [],
      summary: { passed: 0, failed: 0, warnings: 0 }
    }
  }

  async validateTeamsPanel() {
    console.log('🔍 Validating Teams Panel Components...')
    
    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      console.log('⚠️ Browser environment not detected - skipping visual validation')
      return
    }

    const tests = [
      {
        name: 'Teams Panel Component Exists',
        test: () => this.checkComponentInDOM('[data-testid="team-members"]', 'TeamMembers component')
      },
      {
        name: 'Team Members Card Rendered',
        test: () => this.checkElementVisible('h3:contains("Team Members")', 'Team Members card header')
      },
      {
        name: 'Online Status Indicators',
        test: () => this.checkElementVisible('.online-indicator', 'Online status indicators')
      },
      {
        name: 'Member Avatars Loaded',
        test: () => this.checkAvatarsLoaded()
      },
      {
        name: 'Invite Button Visibility',
        test: () => this.checkInviteButtonState()
      },
      {
        name: 'Role Badges Display',
        test: () => this.checkRoleBadges()
      },
      {
        name: 'Scroll Area Functionality',
        test: () => this.checkScrollArea()
      }
    ]

    for (const test of tests) {
      try {
        const result = await test.test()
        this.logResult(test.name, result, 'teams')
      } catch (error) {
        this.logResult(test.name, { success: false, message: error.message }, 'teams')
      }
    }
  }

  async validateAnalyticsPanel() {
    console.log('📊 Validating Analytics Panel Components...')
    
    if (typeof window === 'undefined') {
      console.log('⚠️ Browser environment not detected - skipping visual validation')
      return
    }

    const tests = [
      {
        name: 'Analytics Page Accessibility',
        test: () => this.checkPageExists('/analytics')
      },
      {
        name: 'Analytics Tabs Navigation',
        test: () => this.checkTabsNavigation()
      },
      {
        name: 'Metric Cards Display',
        test: () => this.checkMetricCards()
      },
      {
        name: 'Time Range Selector',
        test: () => this.checkTimeRangeSelector()
      },
      {
        name: 'Charts Rendering',
        test: () => this.checkChartsRendering()
      },
      {
        name: 'Filter Controls',
        test: () => this.checkFilterControls()
      },
      {
        name: 'Data Tables Display',
        test: () => this.checkDataTables()
      }
    ]

    for (const test of tests) {
      try {
        const result = await test.test()
        this.logResult(test.name, result, 'analytics')
      } catch (error) {
        this.logResult(test.name, { success: false, message: error.message }, 'analytics')
      }
    }
  }

  // Helper Methods
  checkComponentInDOM(selector, componentName) {
    const element = document.querySelector(selector)
    if (element) {
      return { success: true, message: `${componentName} found in DOM` }
    }
    
    // Fallback - check for class names or other indicators
    const alternateSelectors = [
      '.team-members',
      '[class*="team"]',
      '[class*="member"]'
    ]
    
    for (const altSelector of alternateSelectors) {
      if (document.querySelector(altSelector)) {
        return { success: true, message: `${componentName} found with alternate selector` }
      }
    }
    
    return { success: false, message: `${componentName} not found in DOM` }
  }

  checkElementVisible(selector, elementName) {
    const elements = document.querySelectorAll(selector)
    if (elements.length > 0) {
      const visibleElements = Array.from(elements).filter(el => {
        const style = window.getComputedStyle(el)
        return style.display !== 'none' && style.visibility !== 'hidden'
      })
      
      if (visibleElements.length > 0) {
        return { success: true, message: `${elementName} visible (${visibleElements.length} found)` }
      }
    }
    
    return { success: false, message: `${elementName} not visible or not found` }
  }

  checkAvatarsLoaded() {
    const avatars = document.querySelectorAll('img[alt*="avatar"], .avatar img, [class*="avatar"] img')
    const loadedAvatars = Array.from(avatars).filter(img => img.complete && img.naturalHeight !== 0)
    
    if (avatars.length === 0) {
      // Check for avatar placeholders or initials
      const avatarPlaceholders = document.querySelectorAll('[class*="avatar"]')
      if (avatarPlaceholders.length > 0) {
        return { success: true, message: `Avatar placeholders found (${avatarPlaceholders.length})` }
      }
      return { success: false, message: 'No avatars or placeholders found' }
    }
    
    const successRate = (loadedAvatars.length / avatars.length) * 100
    if (successRate >= 80) {
      return { success: true, message: `${successRate.toFixed(1)}% of avatars loaded successfully` }
    }
    
    return { success: false, message: `Only ${successRate.toFixed(1)}% of avatars loaded` }
  }

  checkInviteButtonState() {
    const inviteButtons = document.querySelectorAll('button:contains("Invite"), button[class*="invite"], [class*="invite"] button')
    
    if (inviteButtons.length > 0) {
      const enabledButtons = Array.from(inviteButtons).filter(btn => !btn.disabled)
      return { 
        success: true, 
        message: `Invite button found (${enabledButtons.length} enabled, ${inviteButtons.length - enabledButtons.length} disabled)` 
      }
    }
    
    return { success: false, message: 'Invite button not found' }
  }

  checkRoleBadges() {
    const badges = document.querySelectorAll('.badge, [class*="badge"], [class*="role"]')
    const roleBadges = Array.from(badges).filter(badge => {
      const text = badge.textContent?.toLowerCase() || ''
      return text.includes('owner') || text.includes('admin') || text.includes('member')
    })
    
    if (roleBadges.length > 0) {
      return { success: true, message: `Role badges found (${roleBadges.length})` }
    }
    
    return { success: false, message: 'Role badges not found' }
  }

  checkScrollArea() {
    const scrollAreas = document.querySelectorAll('[class*="scroll"], .overflow-auto, .overflow-y-auto')
    
    if (scrollAreas.length > 0) {
      // Check if scroll areas have content that might overflow
      const scrollableAreas = Array.from(scrollAreas).filter(area => {
        return area.scrollHeight > area.clientHeight
      })
      
      return { 
        success: true, 
        message: `Scroll areas found (${scrollAreas.length} total, ${scrollableAreas.length} scrollable)` 
      }
    }
    
    return { success: false, message: 'Scroll areas not found' }
  }

  checkPageExists(path) {
    if (window.location.pathname.includes(path) || window.location.hash.includes(path)) {
      return { success: true, message: `Currently on ${path} page` }
    }
    
    // Check if analytics-related elements exist
    const analyticsElements = document.querySelectorAll('[class*="analytics"], [class*="chart"], [class*="metric"]')
    if (analyticsElements.length > 0) {
      return { success: true, message: `Analytics elements found (${analyticsElements.length})` }
    }
    
    return { success: false, message: `${path} page not detected` }
  }

  checkTabsNavigation() {
    const tabs = document.querySelectorAll('[role="tab"], .tab, [class*="tab"]')
    const analyticsTabNames = ['overview', 'insights', 'productivity']
    
    const relevantTabs = Array.from(tabs).filter(tab => {
      const text = tab.textContent?.toLowerCase() || ''
      return analyticsTabNames.some(name => text.includes(name))
    })
    
    if (relevantTabs.length > 0) {
      return { success: true, message: `Analytics tabs found (${relevantTabs.length})` }
    }
    
    return { success: false, message: 'Analytics tabs not found' }
  }

  checkMetricCards() {
    const cards = document.querySelectorAll('.card, [class*="card"], [class*="metric"]')
    const metricCards = Array.from(cards).filter(card => {
      const text = card.textContent?.toLowerCase() || ''
      return text.includes('completion') || text.includes('project') || text.includes('task') || text.includes('member')
    })
    
    if (metricCards.length > 0) {
      return { success: true, message: `Metric cards found (${metricCards.length})` }
    }
    
    return { success: false, message: 'Metric cards not found' }
  }

  checkTimeRangeSelector() {
    const selectors = document.querySelectorAll('select, [role="combobox"], [class*="select"]')
    const timeSelectors = Array.from(selectors).filter(sel => {
      const text = sel.textContent?.toLowerCase() || ''
      const ariaLabel = sel.getAttribute('aria-label')?.toLowerCase() || ''
      return text.includes('day') || text.includes('week') || text.includes('month') || 
             ariaLabel.includes('time') || ariaLabel.includes('range')
    })
    
    if (timeSelectors.length > 0) {
      return { success: true, message: `Time range selectors found (${timeSelectors.length})` }
    }
    
    return { success: false, message: 'Time range selector not found' }
  }

  checkChartsRendering() {
    const chartElements = document.querySelectorAll('canvas, svg, [class*="chart"], [class*="graph"]')
    
    if (chartElements.length > 0) {
      // Check if charts have content
      const chartsWithContent = Array.from(chartElements).filter(chart => {
        if (chart.tagName === 'CANVAS') {
          return chart.width > 0 && chart.height > 0
        }
        if (chart.tagName === 'SVG') {
          return chart.children.length > 0
        }
        return chart.children.length > 0 || chart.textContent?.trim().length > 0
      })
      
      return { 
        success: true, 
        message: `Charts found (${chartElements.length} elements, ${chartsWithContent.length} with content)` 
      }
    }
    
    return { success: false, message: 'Charts not found' }
  }

  checkFilterControls() {
    const filterElements = document.querySelectorAll('input[type="search"], select, button[class*="filter"], [class*="filter"]')
    
    if (filterElements.length > 0) {
      return { success: true, message: `Filter controls found (${filterElements.length})` }
    }
    
    return { success: false, message: 'Filter controls not found' }
  }

  checkDataTables() {
    const tables = document.querySelectorAll('table, [role="table"], [class*="table"]')
    
    if (tables.length > 0) {
      const tablesWithData = Array.from(tables).filter(table => {
        const rows = table.querySelectorAll('tr, [role="row"]')
        return rows.length > 1 // Header + at least one data row
      })
      
      return { 
        success: true, 
        message: `Data tables found (${tables.length} total, ${tablesWithData.length} with data)` 
      }
    }
    
    return { success: false, message: 'Data tables not found' }
  }

  logResult(testName, result, category) {
    const icon = result.success ? '✅' : '❌'
    console.log(`${icon} ${testName}: ${result.message}`)
    
    this.results[category === 'teams' ? 'teamsPanel' : 'analyticsPanel'].push({
      name: testName,
      success: result.success,
      message: result.message
    })
    
    if (result.success) {
      this.results.summary.passed++
    } else {
      this.results.summary.failed++
    }
  }

  async runVisualValidation() {
    console.log('🎯 Starting Visual Component Validation...')
    
    await this.validateTeamsPanel()
    await this.validateAnalyticsPanel()
    
    this.generateSummary()
    
    return this.results
  }

  generateSummary() {
    const total = this.results.summary.passed + this.results.summary.failed
    const passRate = total > 0 ? ((this.results.summary.passed / total) * 100).toFixed(1) : 0
    
    console.log('\n📊 Visual Validation Summary:')
    console.log(`Total Tests: ${total}`)
    console.log(`Passed: ${this.results.summary.passed}`)
    console.log(`Failed: ${this.results.summary.failed}`)
    console.log(`Pass Rate: ${passRate}%`)
    
    if (this.results.summary.failed > 0) {
      console.log('\n⚠️ Failed Tests:')
      this.results.teamsPanel.concat(this.results.analyticsPanel)
        .filter(test => !test.success)
        .forEach(test => console.log(`  • ${test.name}: ${test.message}`))
    }
  }
}

// Browser execution
if (typeof window !== 'undefined') {
  // Add to global scope for browser console usage
  window.VisualComponentValidator = VisualComponentValidator
  
  // Auto-run when loaded in browser
  window.runVisualValidation = async function() {
    const validator = new VisualComponentValidator()
    return await validator.runVisualValidation()
  }
  
  console.log('🎯 Visual Component Validator loaded!')
  console.log('Run: runVisualValidation() in the browser console')
} else {
  // Node.js environment
  console.log('📋 Visual Component Validator (Browser-only)')
  console.log('This script should be run in the browser console or loaded as a script tag')
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { VisualComponentValidator }
}
