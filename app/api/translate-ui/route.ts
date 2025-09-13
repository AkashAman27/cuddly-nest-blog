import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import DirectGeminiTranslationService from '@/lib/services/directGeminiTranslationService'
import * as uiStringsModule from '@/lib/translations/ui-strings.json'
const uiStrings = uiStringsModule as any

export async function POST(request: NextRequest) {
  try {
    const { targetLanguage, apiKey } = await request.json()

    if (!targetLanguage) {
      return NextResponse.json(
        { error: 'Target language is required' },
        { status: 400 }
      )
    }

    // Get Google API key
    let finalApiKey = apiKey
    if (!finalApiKey) {
      const { data: storedApiKey } = await supabase
        .from('api_keys')
        .select('key_value')
        .eq('service', 'google')
        .eq('is_active', true)
        .single()
      
      if (storedApiKey) {
        finalApiKey = storedApiKey.key_value
      } else if (process.env.GOOGLE_API_KEY) {
        finalApiKey = process.env.GOOGLE_API_KEY
      }
    }

    if (!finalApiKey) {
      return NextResponse.json(
        { error: 'Google API key is required' },
        { status: 400 }
      )
    }

    // Initialize translation service
    const translationService = new DirectGeminiTranslationService(finalApiKey)

    // Check if UI translations already exist
    const { data: existingTranslation } = await supabase
      .from('ui_translations')
      .select('id, translation_status')
      .eq('language_code', targetLanguage)
      .single()

    let translationId: string

    if (existingTranslation) {
      // Update existing translation status
      const { error: updateError } = await supabase
        .from('ui_translations')
        .update({
          translation_status: 'translating',
          updated_at: new Date().toISOString()
        })
        .eq('id', existingTranslation.id)

      if (updateError) throw updateError
      translationId = existingTranslation.id
    } else {
      // Create new translation record
      const { data: newTranslation, error: createError } = await supabase
        .from('ui_translations')
        .insert({
          language_code: targetLanguage,
          translation_status: 'translating'
        })
        .select('id')
        .single()

      if (createError) throw createError
      translationId = newTranslation.id
    }

    // Extract all translatable strings from UI strings JSON
    console.log('Extracting translatable strings from UI JSON...')
    const translatableStrings = extractTranslatableStrings(uiStrings.en)
    console.log(`Found ${translatableStrings.length} UI strings to translate`)

    // Translate the strings
    console.log('Translating UI strings...')
    const translationResult = await translationService.translateText({
      text: translatableStrings,
      targetLanguage
    })

    if (!translationResult.success) {
      throw new Error(translationResult.error || 'Translation failed')
    }

    const translatedTexts = Array.isArray(translationResult.translatedText) 
      ? translationResult.translatedText 
      : [translationResult.translatedText]

    // Build translated UI strings structure
    const translatedUIStrings = buildTranslatedUIStrings(
      uiStrings.en,
      translatableStrings,
      translatedTexts
    )

    // Save translated UI strings to database
    const { error: saveError } = await supabase
      .from('ui_translations')
      .update({
        translated_strings: translatedUIStrings,
        translation_status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', translationId)

    if (saveError) throw saveError

    console.log('UI translations completed successfully')

    return NextResponse.json({
      success: true,
      translationId,
      message: 'UI translations completed successfully',
      translatedStringsCount: translatedTexts.length
    })

  } catch (error) {
    console.error('UI translation error:', error)
    return NextResponse.json(
      { 
        error: 'UI translation failed', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Helper function to extract all translatable strings from nested JSON
function extractTranslatableStrings(obj: any, path: string = ''): string[] {
  const strings: string[] = []
  
  function extract(obj: any, currentPath: string = '') {
    if (typeof obj === 'string' && obj.trim().length > 0) {
      strings.push(obj)
    } else if (Array.isArray(obj)) {
      obj.forEach((item, index) => extract(item, `${currentPath}[${index}]`))
    } else if (obj && typeof obj === 'object') {
      Object.keys(obj).forEach(key => {
        const newPath = currentPath ? `${currentPath}.${key}` : key
        extract(obj[key], newPath)
      })
    }
  }
  
  extract(obj, path)
  return [...new Set(strings)] // Remove duplicates
}

// Helper function to rebuild the UI strings structure with translations
function buildTranslatedUIStrings(
  originalStructure: any,
  originalStrings: string[],
  translatedStrings: string[]
): any {
  if (originalStrings.length !== translatedStrings.length) {
    console.warn(`String count mismatch: ${originalStrings.length} original vs ${translatedStrings.length} translated`)
  }

  // Create mapping of original to translated strings
  const translationMap = new Map<string, string>()
  for (let i = 0; i < Math.min(originalStrings.length, translatedStrings.length); i++) {
    if (originalStrings[i] && translatedStrings[i]) {
      translationMap.set(originalStrings[i], translatedStrings[i])
    }
  }

  function replaceStrings(obj: any): any {
    if (typeof obj === 'string') {
      return translationMap.get(obj) || obj
    } else if (Array.isArray(obj)) {
      return obj.map(item => replaceStrings(item))
    } else if (obj && typeof obj === 'object') {
      const result: any = {}
      Object.keys(obj).forEach(key => {
        result[key] = replaceStrings(obj[key])
      })
      return result
    }
    return obj
  }

  return replaceStrings(originalStructure)
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const language = searchParams.get('language')

    if (!language) {
      return NextResponse.json(
        { error: 'Language parameter is required' },
        { status: 400 }
      )
    }

    // Get UI translations from database
    const { data, error } = await supabase
      .from('ui_translations')
      .select('*')
      .eq('language_code', language)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw error
    }

    return NextResponse.json({
      success: true,
      translation: data || null
    })

  } catch (error) {
    console.error('Get UI translation error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch UI translation' },
      { status: 500 }
    )
  }
}