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

// Simple translation store
const translations: { [locale: string]: { [key: string]: any } } = {}

// Load translations function
const loadTranslations = async (locale: string) => {
  console.log('loadTranslations called for locale:', locale)
  console.log('Existing translations cache:', Object.keys(translations))
  
  if (translations[locale]) {
    console.log('Returning cached translations for', locale)
    return translations[locale]
  }
  
  try {
    console.log('Fetching translations from API for', locale)
    const response = await fetch(`/api/translations/${locale}`)
    console.log('API response status:', response.status, response.statusText)
    
    if (response.ok) {
      const data = await response.json()
      translations[locale] = data
      console.log(`Successfully loaded translations for ${locale}:`, Object.keys(translations[locale]).slice(0, 10))
      return translations[locale]
    } else {
      console.warn(`Failed to load translations for ${locale} - Status: ${response.status}`)
      translations[locale] = {}
      return translations[locale]
    }
  } catch (error) {
    console.error(`Error loading translations for ${locale}:`, error)
    translations[locale] = {}
    return translations[locale]
  }
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
  const [currentLanguage, setCurrentLanguage] = useState('ru') // Default to Russian
  const [translationData, setTranslationData] = useState<any>({})
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    // Handle hydration and get language from localStorage
    const storedLanguage = localStorage.getItem('language') || 'ru' // Default to Russian
    setCurrentLanguage(storedLanguage)
    setIsHydrated(true)
  }, [])

  useEffect(() => {
    if (isHydrated) {
      console.log('Loading translations for language:', currentLanguage)
      loadTranslations(currentLanguage).then(data => {
        console.log('Translations loaded for', currentLanguage, ':', data ? Object.keys(data).slice(0, 10) : 'NO DATA')
        console.log('Full translation data:', data)
        setTranslationData(data || {})
      }).catch(error => {
        console.error('Failed to load translations:', error)
        setTranslationData({})
      })
    }
  }, [currentLanguage, isHydrated])

  const t: TranslationFunction = (key: string, options = {}) => {
    const translation = getNestedValue(translationData, key)
    const result = interpolate(translation, options)
    
    // Fallback translations for missing keys
    const fallbackTranslations: { [key: string]: string } = {
      'projects.description': 'Description',
      'projects.category': 'Category', 
      'projects.members': 'members',
      'projects.viewTasks': 'View Tasks',
      'projects.editProject': 'Edit Project', 
      'projects.addToFavorites': 'Add to Favorites',
      'projects.deleteProject': 'Delete Project',
      'common.back': 'Back',
      'common.complete': 'Complete',
      'common.next': 'Next',
      'common.previous': 'Previous',
      'common.finish': 'Finish',
      'tasks.lowPriority': 'Low Priority',
      'tasks.mediumPriority': 'Medium Priority', 
      'tasks.highPriority': 'High Priority',
      'tasks.urgentPriority': 'Urgent Priority'
    }
    
    // If translation is missing, try fallback
    if (result === key && fallbackTranslations[key]) {
      return fallbackTranslations[key]
    }
    
    // Debug logging only for truly missing keys
    if (result === key && !fallbackTranslations[key]) {
      console.warn(`Translation missing for key: ${key}`, { 
        translationData: Object.keys(translationData), 
        currentLanguage,
        sampleKeys: Object.keys(translationData).slice(0, 5)
      })
    }
    
    // If translation is still the key (not found), return the key itself
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
