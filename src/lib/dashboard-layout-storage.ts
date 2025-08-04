/**
 * Dashboard Layout Storage Utility
 * Manages the persistence of dashboard layout preferences and widget configurations
 */

export interface DashboardWidget {
  id: string
  type: 'stats' | 'recentTasks' | 'activeProjects' | 'activityFeed' | 'teamMembers' | 'teamCommunication'
  title: string
  position: { x: number; y: number }
  size: { width: number; height: number }
  visible: boolean
  order: number
}

export interface DashboardLayout {
  widgets: DashboardWidget[]
  gridCols: number
  compact: boolean
  lastModified: string
}

// Storage keys
const STORAGE_KEYS = {
  DASHBOARD_LAYOUT: 'dashboard-layout-preferences',
  DASHBOARD_WIDGETS: 'dashboard-widgets-config'
} as const

// Default dashboard layout
export const DEFAULT_DASHBOARD_LAYOUT: DashboardLayout = {
  widgets: [
    {
      id: 'stats',
      type: 'stats',
      title: 'Quick Stats',
      position: { x: 0, y: 0 },
      size: { width: 4, height: 1 },
      visible: true,
      order: 0
    },
    {
      id: 'recentTasks',
      type: 'recentTasks',
      title: 'Recent Tasks',
      position: { x: 0, y: 1 },
      size: { width: 2, height: 2 },
      visible: true,
      order: 1
    },
    {
      id: 'activeProjects',
      type: 'activeProjects',
      title: 'Active Projects',
      position: { x: 0, y: 3 },
      size: { width: 2, height: 2 },
      visible: true,
      order: 2
    },
    {
      id: 'activityFeed',
      type: 'activityFeed',
      title: 'Activity Feed',
      position: { x: 2, y: 1 },
      size: { width: 1, height: 2 },
      visible: true,
      order: 3
    },
    {
      id: 'teamMembers',
      type: 'teamMembers',
      title: 'Team Members',
      position: { x: 2, y: 3 },
      size: { width: 1, height: 1 },
      visible: true,
      order: 4
    },
    {
      id: 'teamCommunication',
      type: 'teamCommunication',
      title: 'Team Communication',
      position: { x: 2, y: 4 },
      size: { width: 1, height: 1 },
      visible: true,
      order: 5
    }
  ],
  gridCols: 3,
  compact: false,
  lastModified: new Date().toISOString()
}

/**
 * Get dashboard layout from localStorage
 */
export function getDashboardLayout(): DashboardLayout {
  if (typeof window === 'undefined') {
    return DEFAULT_DASHBOARD_LAYOUT
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEYS.DASHBOARD_LAYOUT)
    if (stored) {
      const parsed = JSON.parse(stored) as DashboardLayout
      // Ensure all default widgets exist (for new features)
      const defaultWidgetIds = DEFAULT_DASHBOARD_LAYOUT.widgets.map(w => w.id)
      const existingWidgetIds = parsed.widgets.map(w => w.id)
      const missingWidgets = DEFAULT_DASHBOARD_LAYOUT.widgets.filter(
        w => !existingWidgetIds.includes(w.id)
      )
      
      if (missingWidgets.length > 0) {
        parsed.widgets = [...parsed.widgets, ...missingWidgets]
      }
      
      return parsed
    }
    return DEFAULT_DASHBOARD_LAYOUT
  } catch (error) {
    console.warn('Failed to load dashboard layout from localStorage:', error)
    return DEFAULT_DASHBOARD_LAYOUT
  }
}

/**
 * Save dashboard layout to localStorage
 */
export function saveDashboardLayout(layout: DashboardLayout): void {
  if (typeof window === 'undefined') return

  try {
    layout.lastModified = new Date().toISOString()
    localStorage.setItem(STORAGE_KEYS.DASHBOARD_LAYOUT, JSON.stringify(layout))
  } catch (error) {
    console.warn('Failed to save dashboard layout to localStorage:', error)
  }
}

/**
 * Update widget position and size
 */
export function updateWidgetLayout(
  widgetId: string, 
  position?: { x: number; y: number }, 
  size?: { width: number; height: number }
): void {
  const layout = getDashboardLayout()
  const widgetIndex = layout.widgets.findIndex(w => w.id === widgetId)
  
  if (widgetIndex !== -1) {
    if (position) {
      layout.widgets[widgetIndex].position = position
    }
    if (size) {
      layout.widgets[widgetIndex].size = size
    }
    saveDashboardLayout(layout)
  }
}

/**
 * Toggle widget visibility
 */
export function toggleWidgetVisibility(widgetId: string): void {
  const layout = getDashboardLayout()
  const widgetIndex = layout.widgets.findIndex(w => w.id === widgetId)
  
  if (widgetIndex !== -1) {
    layout.widgets[widgetIndex].visible = !layout.widgets[widgetIndex].visible
    saveDashboardLayout(layout)
  }
}

/**
 * Reorder widgets
 */
export function reorderWidgets(widgetIds: string[]): void {
  const layout = getDashboardLayout()
  
  // Update order based on new arrangement
  layout.widgets = widgetIds.map((id, index) => {
    const widget = layout.widgets.find(w => w.id === id)
    if (widget) {
      return { ...widget, order: index }
    }
    return widget
  }).filter(Boolean) as DashboardWidget[]
  
  saveDashboardLayout(layout)
}

/**
 * Reset dashboard layout to default
 */
export function resetDashboardLayout(): void {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.removeItem(STORAGE_KEYS.DASHBOARD_LAYOUT)
  } catch (error) {
    console.warn('Failed to reset dashboard layout:', error)
  }
}

/**
 * Update grid configuration
 */
export function updateGridConfig(gridCols: number, compact: boolean): void {
  const layout = getDashboardLayout()
  layout.gridCols = gridCols
  layout.compact = compact
  saveDashboardLayout(layout)
}

/**
 * Export dashboard layout as JSON
 */
export function exportDashboardLayout(): string {
  const layout = getDashboardLayout()
  return JSON.stringify(layout, null, 2)
}

/**
 * Import dashboard layout from JSON
 */
export function importDashboardLayout(layoutJson: string): boolean {
  try {
    const layout = JSON.parse(layoutJson) as DashboardLayout
    
    // Validate the layout structure
    if (!layout.widgets || !Array.isArray(layout.widgets)) {
      throw new Error('Invalid layout structure')
    }
    
    // Ensure required properties exist
    layout.widgets.forEach(widget => {
      if (!widget.id || !widget.type || !widget.position || !widget.size) {
        throw new Error('Invalid widget structure')
      }
    })
    
    saveDashboardLayout(layout)
    return true
  } catch (error) {
    console.warn('Failed to import dashboard layout:', error)
    return false
  }
}

/**
 * Get visible widgets in order
 */
export function getVisibleWidgets(): DashboardWidget[] {
  const layout = getDashboardLayout()
  return layout.widgets
    .filter(widget => widget.visible)
    .sort((a, b) => a.order - b.order)
}

/**
 * Get all available widget types
 */
export function getAvailableWidgetTypes(): Array<{id: string, name: string, description: string}> {
  return [
    { id: 'stats', name: 'Quick Stats', description: 'Overview of key metrics and numbers' },
    { id: 'recentTasks', name: 'Recent Tasks', description: 'List of recently created and updated tasks' },
    { id: 'activeProjects', name: 'Active Projects', description: 'Grid of active projects you\'re involved in' },
    { id: 'activityFeed', name: 'Activity Feed', description: 'Real-time feed of workspace activities' },
    { id: 'teamMembers', name: 'Team Members', description: 'List of workspace team members' },
    { id: 'teamCommunication', name: 'Team Communication', description: 'Quick access to team chat features' }
  ]
}
