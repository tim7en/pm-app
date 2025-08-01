import { useEffect, useState } from 'react'

interface TranslationFunction {
  (key: string, options?: { [key: string]: string | number }): string
}

interface UseTranslationReturn {
  t: TranslationFunction
  i18n: {
    language: string
    changeLanguage: (lng: string) => void
  }
}

// Enhanced debugging flags
const DEBUG_TRANSLATIONS = true
const DEBUG_MISSING_KEYS = true
const DEBUG_TIMING = true

// Translation cache with preloading status
const translations: { [locale: string]: { [key: string]: any } } = {}
const loadingPromises: { [locale: string]: Promise<any> | null } = {}
const preloadStatus = {
  en: false,
  ru: false,
  uz: false
}

// Performance tracking
const performanceTracker = {
  loadStartTime: 0,
  loadEndTime: 0,
  keyLookupCount: 0,
  fallbackUsageCount: 0,
  missingKeyCount: 0
}

// Preload all translations immediately when module loads
const preloadAllTranslations = async () => {
  const locales = ['en', 'ru', 'uz']
  console.log('🚀 PRELOADING ALL TRANSLATIONS...')
  
  const preloadPromises = locales.map(async (locale) => {
    try {
      await loadTranslations(locale)
      console.log(`✅ Preloaded ${locale}:`, Object.keys(translations[locale]).length, 'keys')
    } catch (error) {
      console.error(`❌ Failed to preload ${locale}:`, error)
    }
  })
  
  await Promise.allSettled(preloadPromises)
  console.log('🎉 PRELOADING COMPLETE')
}

// Enhanced load translations function with preloading and better error handling
const loadTranslations = async (locale: string) => {
  const startTime = performance.now()
  
  if (DEBUG_TRANSLATIONS) {
    console.group(`🌐 LOADING TRANSLATIONS: ${locale.toUpperCase()}`)
    console.log('⏰ Start time:', new Date().toISOString())
    console.log('📦 Cache status:', Object.keys(translations).map(key => `${key}: ${Object.keys(translations[key]).length} keys`))
    console.log('🔄 Loading promises active:', Object.keys(loadingPromises))
  }
  
  // Return cached translations immediately if available
  if (translations[locale] && Object.keys(translations[locale]).length > 0) {
    if (DEBUG_TRANSLATIONS) {
      console.log('✅ Returning cached translations:', Object.keys(translations[locale]).length, 'keys')
      console.groupEnd()
    }
    return translations[locale]
  }
  
  // If already loading, wait for the existing promise
  if (loadingPromises[locale]) {
    if (DEBUG_TRANSLATIONS) {
      console.log('⏳ Already loading, waiting for existing promise...')
    }
    try {
      const result = await loadingPromises[locale]
      if (DEBUG_TRANSLATIONS) {
        console.log('✅ Existing promise resolved')
        console.groupEnd()
      }
      return result
    } catch (error) {
      if (DEBUG_TRANSLATIONS) {
        console.error('❌ Existing promise failed:', error)
        console.groupEnd()
      }
      loadingPromises[locale] = null
      return {}
    }
  }
  
  // Create new loading promise
  loadingPromises[locale] = (async () => {
    try {
      if (DEBUG_TRANSLATIONS) {
        console.log('🌍 Fetching from API:', `/api/translations/${locale}`)
      }
      
      const response = await fetch(`/api/translations/${locale}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        cache: 'no-cache' // Ensure fresh data during development
      })
      
      if (DEBUG_TRANSLATIONS) {
        console.log('📡 API Response:', {
          status: response.status,
          statusText: response.statusText,
          contentType: response.headers.get('content-type'),
          ok: response.ok
        })
      }
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      const endTime = performance.now()
      
      if (DEBUG_TIMING) {
        console.log(`⚡ Load time: ${(endTime - startTime).toFixed(2)}ms`)
      }
      
      // Validate response data
      if (Array.isArray(data)) {
        console.error('❌ API returned array instead of object! This is a critical error.')
        console.error('🔍 Array content preview:', data.slice(0, 3))
        translations[locale] = {}
        preloadStatus[locale as keyof typeof preloadStatus] = false
        return {}
      }
      
      if (!data || typeof data !== 'object') {
        console.error('❌ Invalid response data type:', typeof data)
        translations[locale] = {}
        preloadStatus[locale as keyof typeof preloadStatus] = false
        return {}
      }
      
      // Store translations and update status
      translations[locale] = data
      preloadStatus[locale as keyof typeof preloadStatus] = true
      
      if (DEBUG_TRANSLATIONS) {
        console.log('✅ Successfully loaded translations:')
        console.log('📊 Total keys:', Object.keys(data).length)
        console.log('🗂️ Top level sections:', Object.keys(data).join(', '))
        console.log('📝 Sample keys from each section:')
        
        Object.keys(data).forEach(section => {
          if (typeof data[section] === 'object' && data[section] !== null) {
            const sampleKeys = Object.keys(data[section]).slice(0, 3)
            console.log(`   ${section}: ${sampleKeys.join(', ')}${sampleKeys.length < Object.keys(data[section]).length ? '...' : ''}`)
          }
        })
      }
      
      if (DEBUG_TRANSLATIONS) {
        console.groupEnd()
      }
      
      return data
      
    } catch (error) {
      const endTime = performance.now()
      console.error(`❌ TRANSLATION LOAD FAILED for ${locale}:`)
      console.error('🔥 Error:', error)
      console.error('⏱️ Failed after:', (endTime - startTime).toFixed(2), 'ms')
      console.error('🌐 Network status:', navigator.onLine ? 'Online' : 'Offline')
      
      // Set empty object and mark as failed
      translations[locale] = {}
      preloadStatus[locale as keyof typeof preloadStatus] = false
      
      if (DEBUG_TRANSLATIONS) {
        console.groupEnd()
      }
      
      return {}
    } finally {
      // Clean up loading promise
      loadingPromises[locale] = null
    }
  })()
  
  return loadingPromises[locale]
}

// Get nested object value by dot notation
const getNestedValue = (obj: any, path: string): string => {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : path
  }, obj)
}

// Simple interpolation function
const interpolate = (template: string, values: { [key: string]: string | number } = {}): string => {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return values[key] !== undefined ? String(values[key]) : match
  })
}

export const useTranslation = (namespace = 'common'): UseTranslationReturn => {
  const [currentLanguage, setCurrentLanguage] = useState('en') // Default to English to match the errors
  const [translationData, setTranslationData] = useState<any>({})
  const [isHydrated, setIsHydrated] = useState(false)

  // Immediate fallback translations available synchronously
  const getFallbackTranslations = (): { [key: string]: string } => ({
    // Projects - All missing keys from your error logs
    'projects.description': 'Description',
    'projects.category': 'Category', 
    'projects.selectCategory': 'Select a category',
    'projects.members': 'members',
    'projects.viewTasks': 'View Tasks',
    'projects.editProject': 'Edit Project', 
    'projects.addToFavorites': 'Add to Favorites',
    'projects.deleteProject': 'Delete Project',
    'projects.creator': 'Creator',
    'projects.progress': 'Progress',
    'projects.of': 'of',
    'projects.tasks': 'tasks',
    'projects.complete': 'complete',
    'projects.active': 'Active',
    'projects.archived': 'Archived',
    'projects.completed': 'Completed',
    
    // AI Wizard translations
    'ai.wizard.aiAnalysis': 'AI Analysis',
    'ai.wizard.taskGeneration': 'Task Generation',
    'ai.wizard.taskReview': 'Review Tasks',
    'ai.wizard.calendarIntegration': 'Calendar Integration',
    'ai.wizard.finalReview': 'Final Review',
    'ai.wizard.creating': 'Creating Project',
    'ai.wizard.success': 'Success!',
    'ai.wizard.welcome': 'Welcome to AI Project Creation',
    'ai.wizard.welcomeDesc': 'Let AI help you create a comprehensive project with intelligent task generation, timeline optimization, and calendar integration.',
    'ai.wizard.analyzingDesc': 'Our AI is examining your project requirements and creating an optimal execution plan.',
    'ai.wizard.generatingTasksDesc': 'AI is creating optimized tasks based on your project requirements and best practices.',
    'ai.wizard.reviewTasksDesc': 'Review and customize the AI-generated tasks before creating your project.',
    'ai.wizard.calendarIntegrationDesc': 'AI will create calendar events for key milestones and important meetings.',
    'ai.wizard.finalReviewDesc': 'Review all project details before creation.',
    'ai.wizard.creatingDesc': 'AI is setting up your project with all the generated tasks and calendar events.',
    'ai.wizard.successDesc': 'Your AI-powered project has been created with all tasks, assignments, and calendar events.',
    
    // AI Calendar events
    'ai.calendar.kickoff': 'Project Kickoff Meeting',
    'ai.calendar.kickoffDesc': 'Initial project meeting to align team and review project objectives',
    'ai.calendar.milestone': 'Milestone',
    'ai.calendar.finalReview': 'Final Project Review',
    'ai.calendar.finalReviewDesc': 'Review project deliverables and prepare for completion',
    
    // Tasks
    'tasks.createNewTask': 'Create New Task',
    'tasks.fillDetailsToCreateTask': 'Fill out the details to create a new task.',
    'tasks.tags': 'Tags',
    'tasks.addTag': 'Add Tag',
    'tasks.subtasks': 'Subtasks',
    'tasks.addSubtask': 'Add Subtask',
    'tasks.assignTo': 'Assign to',
    'tasks.unassigned': 'Unassigned',
    'tasks.assignedTo': 'Assigned to',
    'tasks.createdBy': 'Created by',
    'tasks.lowPriority': 'Low Priority',
    'tasks.mediumPriority': 'Medium Priority', 
    'tasks.highPriority': 'High Priority',
    'tasks.urgentPriority': 'Urgent Priority',
    'tasks.low': 'Low',
    'tasks.medium': 'Medium', 
    'tasks.high': 'High',
    'tasks.urgent': 'Urgent',
    'tasks.reassignTask': 'Reassign Task',
    'tasks.reassignTaskDesc': 'Choose a new assignee for "{title}"',
    'tasks.currentlyAssignedTo': 'Currently assigned to',
    'tasks.selectNewAssignee': 'Select new assignee',
    'tasks.searchMembers': 'Search members...',
    'tasks.noMembersFound': 'No members found',
    'tasks.removeAssignment': 'Remove assignment',
    'tasks.willBeAssignedTo': 'Will be assigned to',
    'tasks.taskWillBeUnassigned': 'Task will be unassigned',
    'tasks.noAssigneeSelected': 'No assignee selected',
    'tasks.reassigning': 'Reassigning...',
    'tasks.reassign': 'Reassign',
    'tasks.taskReassigned': 'Task Reassigned',
    'tasks.taskAssignedTo': 'Task assigned to {name}',
    'tasks.taskUnassigned': 'Task unassigned',
    'tasks.unknown': 'Unknown',
    'tasks.myTasks': 'My Tasks',
    'tasks.taskManagement': 'Task Management',
    'tasks.listView': 'List View',
    'tasks.boardView': 'Board View',
    'tasks.searchTasks': 'Search tasks...',
    'tasks.status': 'Status',
    'tasks.allStatuses': 'All Statuses',
    'tasks.todo': 'To Do',
    'tasks.inProgress': 'In Progress',
    'tasks.review': 'Review',
    'tasks.done': 'Done',
    'tasks.priority': 'Priority',
    'tasks.allPriorities': 'All Priorities',
    'tasks.editTask': 'Edit Task',
    'tasks.markAsComplete': 'Mark as Complete',
    'tasks.markAsIncomplete': 'Mark as Incomplete',
    'tasks.deleteTask': 'Delete Task',
    'tasks.createTask': 'Create Task',
    'tasks.noTasksFound': 'No tasks found',
    'tasks.tasksAssignedToYou': 'Tasks assigned to you',
    'tasks.tasksNeedToComplete': 'Tasks you need to complete',
    'tasks.tasksCreatedByYou': 'Tasks created by you',
    'tasks.tasksCreatedAndAssigned': 'Tasks you created and assigned to others',
    'error.title': 'Error',
    'error.fetchingMembers': 'Failed to fetch workspace members',
    'error.reassigningTask': 'Failed to reassign task',
    
    // Navigation
    'navigation.dashboard': 'Dashboard',
    'navigation.tasks': 'Tasks',
    'navigation.projects': 'Projects',
    'navigation.team': 'Team',
    'navigation.calendar': 'Calendar',
    'navigation.messages': 'Messages', 
    'navigation.analytics': 'Analytics',
    'navigation.workspaces': 'Workspaces',
    'navigation.workspaceSettings': 'Workspace Settings',
    'navigation.memberManagement': 'Member Management',
    
    // UI
    'ui.notifications': 'Notifications',
    'ui.logout': 'Logout',
    
    // Workspace
    'workspace.members': 'Members',
    'workspace.switchWorkspace': 'Switch Workspace',
    'workspace.createNewWorkspace': 'Create New Workspace',
    'workspace.createNewWorkspaceToOrganize': 'Create a new workspace to organize your projects and collaborate with your team.',
    'workspace.workspaceNameRequired': 'Workspace name is required',
    'workspace.workspaceNamePlaceholder': 'Enter workspace name',
    'workspace.descriptionOptional': 'Description (Optional)',
    'workspace.workspaceDescriptionPlaceholder': 'Enter workspace description',
    'workspace.cancel': 'Cancel',
    'workspace.createWorkspace': 'Create Workspace',
    
    // Common
    'common.back': 'Back',
    'common.complete': 'Complete',
    'common.next': 'Next',
    'common.previous': 'Previous',
    'common.finish': 'Finish',
    'common.cancel': 'Cancel',
    'common.create': 'Create',
    'common.save': 'Save',
    'common.edit': 'Edit',
    'common.delete': 'Delete',
    'common.update': 'Update'
  })

  useEffect(() => {
    // Handle hydration and get language from localStorage
    if (typeof window !== 'undefined') {
      const storedLanguage = localStorage.getItem('language') || 'ru' // Default to Russian to match current behavior
      
      if (DEBUG_TRANSLATIONS) {
        console.group('🔄 TRANSLATION HYDRATION')
        console.log('💾 Stored language:', storedLanguage)
        console.log('🔄 Current language state:', currentLanguage)
        console.log('📦 Cache status before hydration:', Object.keys(translations).map(key => `${key}: ${Object.keys(translations[key] || {}).length} keys`))
        console.log('🚀 Preload status:', preloadStatus)
        console.groupEnd()
      }
      
      if (storedLanguage !== currentLanguage) {
        setCurrentLanguage(storedLanguage)
      }
      setIsHydrated(true)
      
      // Start preloading if not already done
      if (!preloadStatus.en && !preloadStatus.ru && !preloadStatus.uz) {
        preloadAllTranslations().catch(error => {
          console.error('❌ Preloading failed:', error)
        })
      }
    }
  }, [])

  useEffect(() => {
    if (isHydrated) {
      if (DEBUG_TRANSLATIONS) {
        console.group(`🌐 LOADING TRANSLATIONS FOR: ${currentLanguage.toUpperCase()}`)
        console.log('⏰ Load triggered at:', new Date().toISOString())
        console.log('🎯 Target language:', currentLanguage)
        console.log('📊 Current translation data size:', Object.keys(translationData).length)
        console.log('🚀 Preload status:', preloadStatus)
      }
      
      loadTranslations(currentLanguage).then(data => {
        if (DEBUG_TRANSLATIONS) {
          console.log('✅ Translation load completed for', currentLanguage)
          console.log('📊 Loaded data size:', data ? Object.keys(data).length : 0)
          console.log('🏷️ Top-level sections:', data ? Object.keys(data).slice(0, 10) : [])
          
          if (data && data.projects) {
            console.log('📋 Projects section keys:', Object.keys(data.projects).slice(0, 10))
          }
          if (data && data.ai) {
            console.log('🤖 AI section keys:', Object.keys(data.ai).slice(0, 10))
          }
          
          console.groupEnd()
        }
        
        // Force translation data to be an object if it's somehow an array
        if (Array.isArray(data)) {
          console.error('🚨 CRITICAL: Translation data is an array! This will break the app.')
          setTranslationData({})
        } else {
          setTranslationData(data || {})
        }
      }).catch(error => {
        console.error('❌ TRANSLATION LOAD FAILED')
        console.error('🔥 Error details:', error)
        console.error('🌐 Current language:', currentLanguage)
        console.error('📊 Cache status:', Object.keys(translations))
        setTranslationData({})
        
        if (DEBUG_TRANSLATIONS) {
          console.groupEnd()
        }
      })
    }
  }, [currentLanguage, isHydrated])

  const t: TranslationFunction = (key: string, options = {}) => {
    performanceTracker.keyLookupCount++
    
    if (DEBUG_MISSING_KEYS && performanceTracker.keyLookupCount % 100 === 0) {
      console.log(`📊 Translation stats: ${performanceTracker.keyLookupCount} lookups, ${performanceTracker.fallbackUsageCount} fallbacks, ${performanceTracker.missingKeyCount} missing`)
    }
    
    // Get translation using nested key lookup
    const translation = getNestedValue(translationData, key)
    const result = interpolate(translation, options)
    
    // Get fallback translations
    const fallbackTranslations = getFallbackTranslations()
    
    // If translation is missing, try fallback first
    if (result === key && fallbackTranslations[key]) {
      performanceTracker.fallbackUsageCount++
      if (DEBUG_MISSING_KEYS && performanceTracker.fallbackUsageCount <= 10) {
        console.warn(`🔄 Using fallback for key: ${key} (language: ${currentLanguage})`)
      }
      return fallbackTranslations[key]
    }
    
    // Debug logging only for truly missing keys that don't have fallbacks
    if (result === key && !fallbackTranslations[key]) {
      performanceTracker.missingKeyCount++
      
      if (DEBUG_MISSING_KEYS && performanceTracker.missingKeyCount <= 50) {
        console.group(`❌ MISSING TRANSLATION: ${key}`)
        console.log('🌐 Current language:', currentLanguage)
        console.log('📊 Translation data status:', {
          hasData: Object.keys(translationData).length > 0,
          isArray: Array.isArray(translationData),
          type: typeof translationData,
          topLevelKeys: Object.keys(translationData).slice(0, 10)
        })
        console.log('🔍 Key path analysis:', key.split('.'))
        console.log('📦 Preload status:', preloadStatus)
        console.log('⚡ Cache status:', Object.keys(translations).map(lang => `${lang}: ${Object.keys(translations[lang] || {}).length} keys`))
        console.groupEnd()
      } else if (performanceTracker.missingKeyCount === 51) {
        console.warn('🚫 Suppressing further missing key warnings (limit reached)')
      }
    }
    
    // If translation is still the key (not found), return the key itself as last resort
    if (result === key) {
      return key
    }
    
    return result
  }

  const changeLanguage = (lng: string) => {
    setCurrentLanguage(lng)
    if (typeof window !== 'undefined') {
      localStorage.setItem('language', lng)
    }
  }

  return {
    t,
    i18n: {
      language: currentLanguage,
      changeLanguage
    }
  }
}

// Start preloading translations immediately when module loads
if (typeof window !== 'undefined') {
  console.log('🚀 Starting immediate translation preload...')
  preloadAllTranslations().catch(error => {
    console.error('❌ Initial preload failed:', error)
  })
} else {
  console.log('🖥️ Server-side rendering detected, skipping preload')
}
