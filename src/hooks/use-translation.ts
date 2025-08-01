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
  if (translations[locale]) return translations[locale]
  
  try {
    const response = await fetch(`/locales/${locale}/common.json`)
    if (response.ok) {
      translations[locale] = await response.json()
    } else {
      console.warn(`Failed to load translations for ${locale}`)
      translations[locale] = {}
    }
  } catch (error) {
    console.error(`Error loading translations for ${locale}:`, error)
    translations[locale] = {}
  }
  
  return translations[locale]
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
  const [currentLanguage, setCurrentLanguage] = useState('ru') // Always start with default
  const [translationData, setTranslationData] = useState<any>({})
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    // Handle hydration and get language from localStorage
    const storedLanguage = localStorage.getItem('language') || 'ru'
    setCurrentLanguage(storedLanguage)
    setIsHydrated(true)
  }, [])

  useEffect(() => {
    if (isHydrated) {
      console.log('Loading translations for language:', currentLanguage)
      loadTranslations(currentLanguage).then(data => {
        console.log('Translations loaded:', data)
        setTranslationData(data)
      })
    }
  }, [currentLanguage, isHydrated])

  const t: TranslationFunction = (key: string, options = {}) => {
    const translation = getNestedValue(translationData, key)
    const result = interpolate(translation, options)
    
    // If translation is still the key (not found), return the key itself
    if (result === key) {
      console.warn(`Translation missing for key: ${key}`)
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
