'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Globe, ChevronDown, Check, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { getSupportedLanguages } from '@/lib/constants/supportedLanguages'

interface Translation {
  language_code: string
  translated_slug: string
  translation_status: string
}

interface LanguageSwitcherProps {
  currentLanguage: string
  postSlug: string
  availableTranslations: Translation[]
  className?: string
}

export function LanguageSwitcher({ 
  currentLanguage, 
  postSlug, 
  availableTranslations, 
  className = '' 
}: LanguageSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false)
  
  const supportedLanguages = getSupportedLanguages()
  const currentLang = supportedLanguages.find(lang => lang.code === currentLanguage)
  
  // Map available translations to full language info
  const availableLanguageMap = new Map()
  availableTranslations?.forEach(translation => {
    const langInfo = supportedLanguages.find(lang => lang.code === translation.language_code)
    if (langInfo) {
      availableLanguageMap.set(translation.language_code, {
        ...langInfo,
        slug: translation.translated_slug,
        status: translation.translation_status
      })
    }
  })

  // Add English (original) if not already present
  if (!availableLanguageMap.has('en')) {
    const englishLang = supportedLanguages.find(lang => lang.code === 'en')
    if (englishLang) {
      availableLanguageMap.set('en', {
        ...englishLang,
        slug: postSlug,
        status: 'completed'
      })
    }
  }

  const getLanguageUrl = (langCode: string) => {
    if (langCode === 'en') {
      return `/blog/${postSlug}`
    }
    return `/blog/${postSlug}/${langCode}`
  }

  const availableLanguages = Array.from(availableLanguageMap.values())
    .filter(lang => lang.status === 'completed')
    .sort((a, b) => a.name.localeCompare(b.name))

  // Get all supported languages to show unavailable ones
  const allLanguages = supportedLanguages.map(lang => {
    const available = availableLanguageMap.get(lang.code)
    return {
      ...lang,
      isAvailable: !!available,
      status: available?.status || 'not_available',
      slug: available?.slug || null
    }
  }).sort((a, b) => {
    // Sort by availability first, then by name
    if (a.isAvailable && !b.isAvailable) return -1
    if (!a.isAvailable && b.isAvailable) return 1
    return a.name.localeCompare(b.name)
  })

  return (
    <div className={`relative ${className}`}>
      <Button
        onClick={() => setIsOpen(!isOpen)}
        variant="outline"
        className="flex items-center gap-2 bg-white/90 backdrop-blur-sm border-gray-200 hover:bg-white/95"
      >
        <Globe className="w-4 h-4" />
        <span className="hidden sm:inline">{currentLang?.native_name || 'English'}</span>
        <span className="text-lg">{currentLang?.flag_emoji || '🇺🇸'}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </Button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <Card className="absolute top-full right-0 mt-2 z-50 w-64 shadow-xl border-gray-200">
            <CardContent className="p-4">
              <div className="space-y-1">
                <h3 className="font-semibold text-gray-900 text-sm mb-3">
                  Choose Language
                </h3>
                
                {allLanguages.map((language) => {
                  const isCurrentLanguage = language.code === currentLanguage
                  const url = getLanguageUrl(language.code)
                  
                  return (
                    <div key={language.code}>
                      {isCurrentLanguage ? (
                        <div className="flex items-center justify-between p-2 bg-blue-50 rounded-md">
                          <div className="flex items-center gap-3">
                            <span className="text-lg">{language.flag_emoji}</span>
                            <div>
                              <div className="font-medium text-blue-900">{language.native_name}</div>
                              <div className="text-xs text-blue-600">{language.name}</div>
                            </div>
                          </div>
                          <Check className="w-4 h-4 text-blue-600" />
                        </div>
                      ) : language.isAvailable ? (
                        <Link href={url} className="block">
                          <div className="flex items-center justify-between p-2 rounded-md hover:bg-gray-50 transition-colors">
                            <div className="flex items-center gap-3">
                              <span className="text-lg">{language.flag_emoji}</span>
                              <div>
                                <div className="font-medium text-gray-900">{language.native_name}</div>
                                <div className="text-xs text-gray-500">{language.name}</div>
                              </div>
                            </div>
                            <ExternalLink className="w-3 h-3 text-gray-400" />
                          </div>
                        </Link>
                      ) : (
                        <div className="flex items-center justify-between p-2 rounded-md opacity-60">
                          <div className="flex items-center gap-3">
                            <span className="text-lg grayscale">{language.flag_emoji}</span>
                            <div>
                              <div className="font-medium text-gray-500">{language.native_name}</div>
                              <div className="text-xs text-gray-400">{language.name}</div>
                            </div>
                          </div>
                          <Badge variant="outline" className="text-xs px-2 py-0.5 text-gray-400 border-gray-300">
                            Coming Soon
                          </Badge>
                        </div>
                      )}
                    </div>
                  )
                })}
                
                {availableLanguages.length === 1 && (
                  <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
                    <p className="text-sm text-amber-800">
                      <strong>💡 Tip:</strong> More translations are being added regularly
                    </p>
                  </div>
                )}
              </div>
              
              <div className="mt-4 pt-3 border-t border-gray-100">
                <p className="text-xs text-gray-500 text-center">
                  🤖 Powered by AI Translation
                </p>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}