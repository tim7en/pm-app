// Test file for Recent Tasks List functionality
// This file contains both manual tests and automated test scenarios

/**
 * MANUAL TESTING INSTRUCTIONS
 * ===========================
 * 
 * 1. DYNAMIC FADING TESTS:
 *    - Create tasks at different times (use browser dev tools to modify timestamps)
 *    - Verify tasks fade based on age:
 *      * New tasks (< 1 hour): Full opacity with sparkle indicator
 *      * Recent tasks (< 1 day): 95% opacity
 *      * 1-3 days old: 85% opacity
 *      * 3-7 days old: 70% opacity
 *      * Older tasks: 50% opacity
 *      * Completed tasks: 60% opacity regardless of age
 * 
 * 2. SCROLLABLE LIST TESTS:
 *    - Add 20+ tasks to verify scrolling works
 *    - Test scroll performance with many tasks
 *    - Verify scroll area height respects maxHeight prop
 * 
 * 3. FILTER TESTS:
 *    - Test age filters: All time, Last day, Last 3 days, Last week
 *    - Test sorting: Most recent, Priority, Status
 *    - Verify filters work together correctly
 * 
 * 4. INTERACTION TESTS:
 *    - Click task checkboxes to mark complete/incomplete
 *    - Verify task opacity changes when marked complete
 *    - Test hover effects on task items
 */

// Mock data for testing
const mockTasks = [
  // New task (< 1 hour)
  {
    id: 'task-new-1',
    title: 'Just created task',
    description: 'This task was just created',
    status: 'TODO',
    priority: 'HIGH',
    createdAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
    updatedAt: new Date(Date.now() - 30 * 60 * 1000),
    project: { id: 'p1', name: 'Project Alpha', color: '#3b82f6' },
    assignee: { id: 'u1', name: 'John Doe', avatar: '/avatars/01.png' },
    creator: { id: 'u1', name: 'John Doe', avatar: '/avatars/01.png' },
    commentCount: 0,
    attachmentCount: 0,
    subtaskCount: 0,
    completedSubtaskCount: 0,
    tags: []
  },
  
  // Recent task (few hours old)
  {
    id: 'task-recent-1',
    title: 'Recent task',
    description: 'This task is few hours old',
    status: 'IN_PROGRESS',
    priority: 'MEDIUM',
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    project: { id: 'p1', name: 'Project Alpha', color: '#10b981' },
    assignee: { id: 'u2', name: 'Jane Smith', avatar: '/avatars/02.png' },
    creator: { id: 'u1', name: 'John Doe', avatar: '/avatars/01.png' },
    commentCount: 3,
    attachmentCount: 1,
    subtaskCount: 2,
    completedSubtaskCount: 1,
    tags: [{ id: 't1', name: 'urgent', color: '#ef4444' }]
  },
  
  // Older task (3 days)
  {
    id: 'task-old-1',
    title: 'Older task',
    description: 'This task is 3 days old',
    status: 'REVIEW',
    priority: 'LOW',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    project: { id: 'p2', name: 'Project Beta', color: '#f59e0b' },
    assignee: { id: 'u3', name: 'Mike Johnson', avatar: '/avatars/03.png' },
    creator: { id: 'u1', name: 'John Doe', avatar: '/avatars/01.png' },
    commentCount: 5,
    attachmentCount: 2,
    subtaskCount: 4,
    completedSubtaskCount: 4,
    tags: []
  },
  
  // Completed task
  {
    id: 'task-completed-1',
    title: 'Completed task',
    description: 'This task is completed',
    status: 'DONE',
    priority: 'URGENT',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
    project: { id: 'p1', name: 'Project Alpha', color: '#8b5cf6' },
    assignee: { id: 'u1', name: 'John Doe', avatar: '/avatars/01.png' },
    creator: { id: 'u2', name: 'Jane Smith', avatar: '/avatars/02.png' },
    commentCount: 1,
    attachmentCount: 0,
    subtaskCount: 0,
    completedSubtaskCount: 0,
    tags: [{ id: 't2', name: 'feature', color: '#3b82f6' }]
  },

  // Very old task (1 week)
  {
    id: 'task-very-old-1',
    title: 'Very old task',
    description: 'This task is over a week old',
    status: 'TODO',
    priority: 'MEDIUM',
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
    updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    project: { id: 'p3', name: 'Project Gamma', color: '#ec4899' },
    assignee: { id: 'u4', name: 'Sarah Wilson', avatar: '/avatars/04.png' },
    creator: { id: 'u1', name: 'John Doe', avatar: '/avatars/01.png' },
    commentCount: 0,
    attachmentCount: 0,
    subtaskCount: 0,
    completedSubtaskCount: 0,
    tags: []
  }
]

// Test functions
const runRecentTasksTests = () => {
  console.log('🧪 Running Recent Tasks Tests...')
  
  // Test 1: Verify task age calculations
  console.log('Test 1: Task Age Calculations')
  mockTasks.forEach(task => {
    const now = new Date()
    const updatedAt = new Date(task.updatedAt)
    const ageInHours = Math.floor((now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60))
    const ageInDays = Math.floor(ageInHours / 24)
    
    console.log(`Task: ${task.title}`)
    console.log(`  Age: ${ageInHours}h (${ageInDays}d)`)
    console.log(`  Expected opacity: ${getExpectedOpacity(task)}`)
    console.log(`  Is new: ${ageInHours < 1}`)
    console.log('---')
  })
  
  // Test 2: Filter functionality
  console.log('Test 2: Filter Tests')
  testFilters()
  
  // Test 3: Sort functionality  
  console.log('Test 3: Sort Tests')
  testSorting()
  
  console.log('✅ Recent Tasks Tests Complete')
}

const getExpectedOpacity = (task) => {
  const now = new Date()
  const updatedAt = new Date(task.updatedAt)
  const ageInHours = Math.floor((now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60))
  const ageInDays = Math.floor(ageInHours / 24)
  
  if (task.status === 'DONE') return 0.6
  if (ageInHours < 1) return 1.0
  if (ageInHours < 24) return 0.95
  if (ageInDays <= 3) return 0.85
  if (ageInDays <= 7) return 0.7
  return 0.5
}

const testFilters = () => {
  // Test age filters
  const testAgeFilter = (filterAge, expectedCount) => {
    const now = new Date()
    const cutoffDays = filterAge === '1day' ? 1 : filterAge === '3days' ? 3 : 7
    
    const filtered = mockTasks.filter(task => {
      const ageInDays = Math.floor((now.getTime() - new Date(task.updatedAt).getTime()) / (1000 * 60 * 60 * 24))
      return filterAge === 'all' || ageInDays <= cutoffDays
    })
    
    console.log(`Age filter '${filterAge}': ${filtered.length} tasks (expected: ${expectedCount})`)
    return filtered.length === expectedCount
  }
  
  testAgeFilter('all', 5)
  testAgeFilter('1day', 2) // new and completed tasks
  testAgeFilter('3days', 4) // all except very old
  testAgeFilter('7days', 4) // all except very old
}

const testSorting = () => {
  // Test priority sorting
  const priorityOrder = { URGENT: 4, HIGH: 3, MEDIUM: 2, LOW: 1 }
  const sortedByPriority = [...mockTasks].sort((a, b) => 
    (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0)
  )
  
  console.log('Priority sort order:')
  sortedByPriority.forEach((task, index) => {
    console.log(`  ${index + 1}. ${task.title} (${task.priority})`)
  })
  
  // Test status sorting
  const statusOrder = { TODO: 1, IN_PROGRESS: 2, REVIEW: 3, DONE: 4 }
  const sortedByStatus = [...mockTasks].sort((a, b) => 
    (statusOrder[a.status] || 0) - (statusOrder[b.status] || 0)
  )
  
  console.log('Status sort order:')
  sortedByStatus.forEach((task, index) => {
    console.log(`  ${index + 1}. ${task.title} (${task.status})`)
  })
}

// Performance test for scrolling
const testScrollPerformance = () => {
  console.log('🚀 Testing Scroll Performance...')
  
  // Generate many tasks for performance testing
  const manyTasks = Array.from({ length: 100 }, (_, index) => ({
    id: `perf-task-${index}`,
    title: `Performance Test Task ${index + 1}`,
    description: `This is task ${index + 1} for performance testing`,
    status: ['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE'][index % 4],
    priority: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'][index % 4],
    createdAt: new Date(Date.now() - index * 60 * 60 * 1000), // Staggered creation times
    updatedAt: new Date(Date.now() - index * 60 * 60 * 1000),
    project: { id: 'perf-project', name: 'Performance Project', color: '#3b82f6' },
    assignee: { id: 'perf-user', name: 'Perf User', avatar: '/avatars/01.png' },
    creator: { id: 'perf-creator', name: 'Perf Creator', avatar: '/avatars/02.png' },
    commentCount: index % 5,
    attachmentCount: index % 3,
    subtaskCount: index % 4,
    completedSubtaskCount: Math.floor((index % 4) / 2),
    tags: []
  }))
  
  console.log(`Generated ${manyTasks.length} tasks for performance testing`)
  console.log('📊 Use browser dev tools to measure rendering performance')
  
  return manyTasks
}

// Integration test with dashboard
const testDashboardIntegration = () => {
  console.log('🔗 Testing Dashboard Integration...')
  
  // Test props interface
  const requiredProps = [
    'tasks',
    'onTaskStatusChange',
    'onTaskEdit', 
    'onTaskDelete',
    'currentUserId'
  ]
  
  const optionalProps = [
    'maxHeight',
    'showFilter'
  ]
  
  console.log('Required props:', requiredProps)
  console.log('Optional props:', optionalProps)
  
  // Test callback functions
  const mockCallbacks = {
    onTaskStatusChange: async (taskId, status) => {
      console.log(`Status change: ${taskId} -> ${status}`)
      return true
    },
    onTaskEdit: (task) => {
      console.log(`Edit task: ${task.title}`)
    },
    onTaskDelete: async (taskId) => {
      console.log(`Delete task: ${taskId}`)
      return true
    }
  }
  
  console.log('✅ Dashboard integration test complete')
  return mockCallbacks
}

// Export test functions for use in browser console
if (typeof window !== 'undefined') {
  window.recentTasksTests = {
    runRecentTasksTests,
    testScrollPerformance,
    testDashboardIntegration,
    mockTasks
  }
  
  console.log('📝 Recent Tasks Tests loaded! Use window.recentTasksTests to run tests')
}

// Export for Node.js testing if needed
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    runRecentTasksTests,
    testScrollPerformance,
    testDashboardIntegration,
    mockTasks
  }
}
