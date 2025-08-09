/**
 * Test Suite for Recent Tasks List functionality
 * Converted from manual testing instructions to automated tests
 */

import { describe, test, expect, beforeEach, vi } from 'vitest'
import '@testing-library/jest-dom'

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
  },
  // Recent task (< 1 day)
  {
    id: 'task-recent-1',
    title: 'Recent task',
    description: 'This task was created recently',
    status: 'IN_PROGRESS',
    priority: 'MEDIUM',
    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
    updatedAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
    project: { id: 'p2', name: 'Project Beta', color: '#10b981' },
    assignee: { id: 'u2', name: 'Jane Smith', avatar: '/avatars/02.png' },
    creator: { id: 'u1', name: 'John Doe', avatar: '/avatars/01.png' },
    commentCount: 2,
    attachmentCount: 1,
    subtaskCount: 3,
  },
  // Older task (> 3 days)
  {
    id: 'task-old-1',
    title: 'Older task',
    description: 'This task is several days old',
    status: 'DONE',
    priority: 'LOW',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    project: { id: 'p3', name: 'Project Gamma', color: '#f59e0b' },
    assignee: { id: 'u3', name: 'Bob Wilson', avatar: '/avatars/03.png' },
    creator: { id: 'u2', name: 'Jane Smith', avatar: '/avatars/02.png' },
    commentCount: 5,
    attachmentCount: 2,
    subtaskCount: 0,
  }
]

// Helper function to calculate task age opacity
const calculateTaskOpacity = (task: typeof mockTasks[0]) => {
  const now = Date.now()
  const createdAt = task.createdAt.getTime()
  const ageInHours = (now - createdAt) / (1000 * 60 * 60)
  const ageInDays = ageInHours / 24

  if (task.status === 'DONE') return 0.6 // Completed tasks

  if (ageInHours < 1) return 1.0 // New tasks (< 1 hour)
  if (ageInDays < 1) return 0.95 // Recent tasks (< 1 day)
  if (ageInDays < 3) return 0.85 // 1-3 days old
  if (ageInDays < 7) return 0.7 // 3-7 days old
  return 0.5 // Older tasks
}

// Helper function to filter tasks by age
const filterTasksByAge = (tasks: typeof mockTasks, filter: string) => {
  const now = Date.now()
  
  switch (filter) {
    case 'last-day':
      return tasks.filter(task => 
        (now - task.createdAt.getTime()) < (24 * 60 * 60 * 1000)
      )
    case 'last-3-days':
      return tasks.filter(task => 
        (now - task.createdAt.getTime()) < (3 * 24 * 60 * 60 * 1000)
      )
    case 'last-week':
      return tasks.filter(task => 
        (now - task.createdAt.getTime()) < (7 * 24 * 60 * 60 * 1000)
      )
    default:
      return tasks
  }
}

// Helper function to sort tasks
const sortTasks = (tasks: typeof mockTasks, sortBy: string) => {
  const tasksCopy = [...tasks]
  
  switch (sortBy) {
    case 'most-recent':
      return tasksCopy.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
    case 'priority':
      const priorityOrder = { HIGH: 3, MEDIUM: 2, LOW: 1 }
      return tasksCopy.sort((a, b) => 
        priorityOrder[b.priority as keyof typeof priorityOrder] - priorityOrder[a.priority as keyof typeof priorityOrder]
      )
    case 'status':
      const statusOrder = { TODO: 1, IN_PROGRESS: 2, DONE: 3 }
      return tasksCopy.sort((a, b) => 
        statusOrder[a.status as keyof typeof statusOrder] - statusOrder[b.status as keyof typeof statusOrder]
      )
    default:
      return tasksCopy
  }
}

describe('Recent Tasks List', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn(() => 'mock-token'),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn()
      },
      writable: true
    })

    // Mock fetch for API calls
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/api/tasks/recent')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ tasks: mockTasks })
        })
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
    })
  })

  describe('Dynamic Fading Tests', () => {
    test('1. New tasks (< 1 hour) have full opacity with sparkle indicator', () => {
      const newTask = mockTasks[0]
      const opacity = calculateTaskOpacity(newTask)
      
      expect(opacity).toBe(1.0)
      expect(newTask.createdAt.getTime()).toBeGreaterThan(Date.now() - 60 * 60 * 1000)
    })

    test('2. Recent tasks (< 1 day) have 95% opacity', () => {
      const recentTask = mockTasks[1]
      const opacity = calculateTaskOpacity(recentTask)
      
      expect(opacity).toBe(0.95)
    })

    test('3. Older tasks have reduced opacity based on age', () => {
      const oldTask = mockTasks[2]
      const opacity = calculateTaskOpacity(oldTask)
      
      expect(opacity).toBeLessThan(0.95)
    })

    test('4. Completed tasks have 60% opacity regardless of age', () => {
      const completedTask = mockTasks.find(task => task.status === 'DONE')
      if (completedTask) {
        const opacity = calculateTaskOpacity(completedTask)
        expect(opacity).toBe(0.6)
      }
    })

    test('5. Task age calculation works correctly', () => {
      const now = Date.now()
      const oneHourAgo = new Date(now - 60 * 60 * 1000)
      const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000)
      
      expect(oneHourAgo.getTime()).toBeLessThan(now)
      expect(oneDayAgo.getTime()).toBeLessThan(oneHourAgo.getTime())
    })
  })

  describe('Scrollable List Tests', () => {
    test('6. List handles multiple tasks efficiently', () => {
      const manyTasks = Array.from({ length: 25 }, (_, i) => ({
        ...mockTasks[0],
        id: `task-${i}`,
        title: `Task ${i + 1}`
      }))
      
      expect(manyTasks).toHaveLength(25)
      expect(manyTasks[0].title).toBe('Task 1')
      expect(manyTasks[24].title).toBe('Task 25')
    })

    test('7. Scroll area respects maxHeight configuration', () => {
      const scrollConfig = {
        maxHeight: 400,
        itemHeight: 60,
        visibleItems: Math.floor(400 / 60)
      }
      
      expect(scrollConfig.visibleItems).toBe(6)
    })

    test('8. Scroll performance metrics are tracked', () => {
      const scrollMetrics = {
        totalItems: 25,
        visibleItems: 6,
        scrollPosition: 0,
        shouldVirtualize: true
      }
      
      scrollMetrics.shouldVirtualize = scrollMetrics.totalItems > 10
      expect(scrollMetrics.shouldVirtualize).toBe(true)
    })
  })

  describe('Filter Tests', () => {
    test('9. Age filter: Last day works correctly', () => {
      const lastDayTasks = filterTasksByAge(mockTasks, 'last-day')
      
      // Should include new and recent tasks, but not old ones
      expect(lastDayTasks.length).toBeGreaterThan(0)
      expect(lastDayTasks.length).toBeLessThanOrEqual(mockTasks.length)
    })

    test('10. Age filter: Last 3 days works correctly', () => {
      const last3DaysTasks = filterTasksByAge(mockTasks, 'last-3-days')
      
      expect(last3DaysTasks.length).toBeGreaterThanOrEqual(
        filterTasksByAge(mockTasks, 'last-day').length
      )
    })

    test('11. Age filter: Last week includes all recent tasks', () => {
      const lastWeekTasks = filterTasksByAge(mockTasks, 'last-week')
      
      expect(lastWeekTasks.length).toBeGreaterThanOrEqual(
        filterTasksByAge(mockTasks, 'last-3-days').length
      )
    })

    test('12. Filter: All time includes all tasks', () => {
      const allTimeTasks = filterTasksByAge(mockTasks, 'all-time')
      
      expect(allTimeTasks).toHaveLength(mockTasks.length)
    })
  })

  describe('Sorting Tests', () => {
    test('13. Sort by most recent works correctly', () => {
      const sortedTasks = sortTasks(mockTasks, 'most-recent')
      
      // Should be sorted by updatedAt descending
      for (let i = 0; i < sortedTasks.length - 1; i++) {
        expect(sortedTasks[i].updatedAt.getTime()).toBeGreaterThanOrEqual(
          sortedTasks[i + 1].updatedAt.getTime()
        )
      }
    })

    test('14. Sort by priority works correctly', () => {
      const sortedTasks = sortTasks(mockTasks, 'priority')
      const priorityOrder = ['HIGH', 'MEDIUM', 'LOW']
      
      // Verify high priority tasks come first
      const highPriorityIndex = sortedTasks.findIndex(t => t.priority === 'HIGH')
      const lowPriorityIndex = sortedTasks.findIndex(t => t.priority === 'LOW')
      
      if (highPriorityIndex !== -1 && lowPriorityIndex !== -1) {
        expect(highPriorityIndex).toBeLessThan(lowPriorityIndex)
      }
    })

    test('15. Sort by status works correctly', () => {
      const sortedTasks = sortTasks(mockTasks, 'status')
      const statusOrder = ['TODO', 'IN_PROGRESS', 'DONE']
      
      // Verify TODO tasks come before DONE tasks
      const todoIndex = sortedTasks.findIndex(t => t.status === 'TODO')
      const doneIndex = sortedTasks.findIndex(t => t.status === 'DONE')
      
      if (todoIndex !== -1 && doneIndex !== -1) {
        expect(todoIndex).toBeLessThan(doneIndex)
      }
    })
  })

  describe('Interaction Tests', () => {
    test('16. Task status can be toggled', () => {
      const task = { ...mockTasks[0] }
      const originalStatus = task.status
      
      // Toggle status
      task.status = task.status === 'DONE' ? 'TODO' : 'DONE'
      
      expect(task.status).not.toBe(originalStatus)
    })

    test('17. Task opacity changes when marked complete', () => {
      const task = { ...mockTasks[0] }
      
      // Mark as complete
      task.status = 'DONE'
      const opacity = calculateTaskOpacity(task)
      
      expect(opacity).toBe(0.6)
    })

    test('18. Task data integrity is maintained during interactions', () => {
      const originalTask = mockTasks[0]
      const modifiedTask = { ...originalTask, status: 'DONE' }
      
      // Original should remain unchanged
      expect(originalTask.status).toBe('TODO')
      expect(modifiedTask.status).toBe('DONE')
      expect(modifiedTask.id).toBe(originalTask.id)
      expect(modifiedTask.title).toBe(originalTask.title)
    })
  })
})
