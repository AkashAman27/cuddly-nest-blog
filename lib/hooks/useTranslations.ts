'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

// Import base UI strings
import * as uiStringsModule from '@/lib/translations/ui-strings.json'
const uiStrings = uiStringsModule as any

interface TranslationHook {
  t: (key: string, fallback?: string) => string
  isLoading: boolean
  currentLanguage: string
}

// Cache for translated UI strings
const translationCache = new Map<string, any>()

export function useTranslations(language: string = 'en'): TranslationHook {
  const [isLoading, setIsLoading] = useState(false)
  const [translations, setTranslations] = useState<any>(uiStrings)

  useEffect(() => {
    if (language === 'en') {
      setTranslations(uiStrings)
      return
    }

    // Check cache first
    const cacheKey = `ui_strings_${language}`
    if (translationCache.has(cacheKey)) {
      setTranslations(translationCache.get(cacheKey))
      return
    }

    // Load translated UI strings from database
    loadTranslatedUIStrings(language)
  }, [language])

  const loadTranslatedUIStrings = async (lang: string) => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('ui_translations')
        .select('translated_strings')
        .eq('language_code', lang)
        .single()

      if (data && !error) {
        // Merge translated strings with base English strings as fallback
        const mergedTranslations = {
          [lang]: data.translated_strings,
          en: uiStrings.en // Keep English as fallback
        }
        setTranslations(mergedTranslations)
        translationCache.set(`ui_strings_${lang}`, mergedTranslations)
      } else {
        // If no translations found, use English as fallback
        console.warn(`No UI translations found for ${lang}, using English fallback`)
        setTranslations(uiStrings)
      }
    } catch (error) {
      console.error('Error loading UI translations:', error)
      setTranslations(uiStrings)
    } finally {
      setIsLoading(false)
    }
  }

  const t = (key: string, fallback?: string): string => {
    try {
      // Split key by dots to navigate nested objects
      const keys = key.split('.')
      let value = translations[language] || translations.en || uiStrings.en

      for (const k of keys) {
        if (value && typeof value === 'object' && k in value) {
          value = value[k]
        } else {
          // Try English fallback
          value = uiStrings.en
          for (const k of keys) {
            if (value && typeof value === 'object' && k in value) {
              value = value[k]
            } else {
              return fallback || key
            }
          }
          break
        }
      }

      return typeof value === 'string' ? value : fallback || key
    } catch (error) {
      console.error('Translation error for key:', key, error)
      return fallback || key
    }
  }

  return {
    t,
    isLoading,
    currentLanguage: language
  }
}

// Export utility function to get destination-specific translations
export function getDestinationKey(postTitle: string): string {
  const title = postTitle.toLowerCase()
  
  if (title.includes('italian') && title.includes('lakes')) return 'italianLakes'
  if (title.includes('rome')) return 'rome'
  if (title.includes('venice')) return 'venice'
  if (title.includes('florence')) return 'florence'
  if (title.includes('naples') || title.includes('amalfi')) return 'naplesAmalfi'
  if (title.includes('rotterdam')) return 'rotterdam'
  if (title.includes('paris')) return 'paris'
  
  return 'default'
}