"use client"

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Languages } from 'lucide-react'
import { useTranslation } from '@/hooks/use-translation'

const languages = [
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'uz', name: 'Ўзбекча', flag: '🇺🇿' },
]

interface LanguageSelectorProps {
  className?: string
}

export function LanguageSelector({ className }: LanguageSelectorProps) {
  const { i18n } = useTranslation()
  const [isHydrated, setIsHydrated] = useState(false)

  // Handle hydration mismatch
  useEffect(() => {
    setIsHydrated(true)
  }, [])

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0]

  const handleLanguageChange = (languageCode: string) => {
    i18n.changeLanguage(languageCode)
    // Force a small delay to ensure the change is processed
    setTimeout(() => {
      window.location.reload()
    }, 100)
  }

  // Prevent hydration mismatch by showing fallback during SSR
  if (!isHydrated) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className={className}>
            <Languages className="h-4 w-4 mr-2" />
            <span className="mr-1">🇷🇺</span>
            <span className="hidden sm:inline">Русский</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {languages.map((language) => (
            <DropdownMenuItem
              key={language.code}
              onClick={() => handleLanguageChange(language.code)}
              className={language.code === 'ru' ? 'bg-accent' : ''}
            >
              <span className="mr-2">{language.flag}</span>
              <span>{language.name}</span>
              {language.code === 'ru' && (
                <span className="ml-auto text-xs text-muted-foreground">✓</span>
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className={className}>
          <Languages className="h-4 w-4 mr-2" />
          <span className="mr-1">{currentLanguage.flag}</span>
          <span className="hidden sm:inline">{currentLanguage.name}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {languages.map((language) => (
          <DropdownMenuItem
            key={language.code}
            onClick={() => handleLanguageChange(language.code)}
            className={i18n.language === language.code ? 'bg-accent' : ''}
          >
            <span className="mr-2">{language.flag}</span>
            <span>{language.name}</span>
            {i18n.language === language.code && (
              <span className="ml-auto text-xs text-muted-foreground">✓</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
