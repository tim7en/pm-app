// Client-side translation loader as backup
import { useEffect, useState } from 'react'

// Pre-load translation data directly
const enTranslations = {
  projects: {
    members: "members",
    viewTasks: "View Tasks", 
    editProject: "Edit Project",
    addToFavorites: "Add to Favorites",
    removeFromFavorites: "Remove from Favorites",
    deleteProject: "Delete Project"
  },
  common: {
    back: "Back",
    complete: "Complete", 
    next: "Next",
    previous: "Previous",
    finish: "Finish",
    close: "Close"
  }
}

const ruTranslations = {
  projects: {
    members: "участники",
    viewTasks: "Просмотр задач",
    editProject: "Редактировать проект", 
    addToFavorites: "Добавить в избранное",
    removeFromFavorites: "Удалить из избранного",
    deleteProject: "Удалить проект"
  },
  common: {
    back: "Назад",
    complete: "Завершить",
    next: "Далее", 
    previous: "Предыдущий",
    finish: "Закончить",
    close: "Закрыть"
  }
}

const uzTranslations = {
  projects: {
    members: "аъзолар",
    viewTasks: "Вазифаларни кўриш",
    editProject: "Лойиҳани таҳрирлаш",
    addToFavorites: "Севимлиларга қўшиш", 
    removeFromFavorites: "Севимлилардан олиб ташлаш",
    deleteProject: "Лойиҳани ўчириш"
  },
  common: {
    back: "Орқага",
    complete: "Тугатиш",
    next: "Кейинги",
    previous: "Олдинги", 
    finish: "Якунлаш",
    close: "Ёпиш"
  }
}

const fallbackTranslations = {
  en: enTranslations,
  ru: ruTranslations, 
  uz: uzTranslations
}

export const useFallbackTranslation = () => {
  const [currentLanguage, setCurrentLanguage] = useState('ru')
  
  useEffect(() => {
    const storedLanguage = localStorage.getItem('language') || 'ru'
    setCurrentLanguage(storedLanguage)
  }, [])

  const t = (key: string, options = {}) => {
    const translation = key.split('.').reduce((obj, k) => obj && obj[k], fallbackTranslations[currentLanguage] || fallbackTranslations.ru)
    return translation || key
  }

  const changeLanguage = (lng: string) => {
    setCurrentLanguage(lng)
    localStorage.setItem('language', lng)
  }

  return {
    t,
    i18n: {
      language: currentLanguage,
      changeLanguage
    }
  }
}
