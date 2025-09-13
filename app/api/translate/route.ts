import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { createClient } from '@supabase/supabase-js'
import { TranslationService } from '@/lib/services/translationService'
import { MistralTranslationService } from '@/lib/services/mistralTranslationService'

// Create admin client for accessing API keys table
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function POST(request: NextRequest) {
  try {
    const { postId, targetLanguage, apiKey, testMode, forceCompleteTranslation, includeUITranslation, translationService = 'google' } = await request.json()

    console.log('Translation request received:', {
      postId,
      targetLanguage,
      translationService,
      testMode: !!testMode
    })

    if (!postId || !targetLanguage) {
      return NextResponse.json(
        { error: 'Post ID and target language are required' },
        { status: 400 }
      )
    }

    // Test mode - test the API key without full translation
    if (testMode) {
      if (translationService === 'mistral') {
        // Test Mistral API
        let testApiKey = apiKey
        
        if (!testApiKey) {
          // Try to get Mistral API key from database
          const { data: storedApiKey, error: keyError } = await supabaseAdmin
            .from('api_keys')
            .select('key_value')
            .eq('service', 'mistral')
            .eq('is_active', true)
            .single()
          
          if (storedApiKey) {
            testApiKey = storedApiKey.key_value
          } else if (process.env.MISTRAL_API_KEY) {
            testApiKey = process.env.MISTRAL_API_KEY
          }
        }
        
        if (!testApiKey) {
          return NextResponse.json({
            success: false,
            error: 'No Mistral API key available - please set MISTRAL_API_KEY environment variable or configure in database',
            apiKeyProvided: false
          })
        }
        
        try {
          const testService = new MistralTranslationService(testApiKey)
          const testResult = await testService.testConnection()
          
          if (testResult.success) {
            return NextResponse.json({
              success: true,
              message: 'Mistral AI connection successful',
              service: 'mistral',
              postId,
              targetLanguage,
              apiKeyProvided: true
            })
          } else {
            return NextResponse.json({
              success: false,
              error: testResult.error || 'Mistral API test failed',
              apiKeyProvided: true
            })
          }
        } catch (error) {
          return NextResponse.json({
            success: false,
            error: 'Mistral API key test failed - invalid key or service unavailable',
            apiKeyProvided: true
          })
        }
      } else {
        // Test Google Translate API (default)
        let testApiKey = apiKey
        
        if (!testApiKey) {
          // Try to get Google Translate API key from database
          const { data: storedApiKey, error: keyError } = await supabaseAdmin
            .from('api_keys')
            .select('key_value')
            .eq('service', 'google_translate')
            .eq('is_active', true)
            .single()
          
          if (storedApiKey) {
            testApiKey = storedApiKey.key_value
          } else if (process.env.GOOGLE_TRANSLATE_API_KEY) {
            testApiKey = process.env.GOOGLE_TRANSLATE_API_KEY
          }
        }
        
        if (!testApiKey) {
          return NextResponse.json({
            success: false,
            error: 'No Google Translate API key available - please set GOOGLE_TRANSLATE_API_KEY environment variable or configure in database',
            apiKeyProvided: false
          })
        }
        
        try {
          // Use Google Translate service for testing
          const testService = new TranslationService(testApiKey)
          const testResult = await testService.translateText({
            text: 'Hello, world!',
            targetLanguage: 'es'
          })
          
          if (testResult.success) {
            return NextResponse.json({
              success: true,
              message: 'Google Translate API connection successful',
              service: 'google',
              postId,
              targetLanguage,
              apiKeyProvided: true
            })
          } else {
            return NextResponse.json({
              success: false,
              error: testResult.error || 'Google Translate API test failed',
              apiKeyProvided: true
            })
          }
        } catch (error) {
          return NextResponse.json({
            success: false,
            error: 'Google Translate API key test failed - invalid key or service unavailable',
            apiKeyProvided: true
          })
        }
      }
    }

    // Get API key from database or environment if not provided
    let finalApiKey = apiKey
    
    if (!finalApiKey) {
      // Try to get API key from database based on service
      const serviceType = translationService === 'mistral' ? 'mistral' : 'google_translate'
      const { data: storedApiKey, error: keyError } = await supabaseAdmin
        .from('api_keys')
        .select('key_value')
        .eq('service', serviceType)
        .eq('is_active', true)
        .single()
      
      if (storedApiKey) {
        finalApiKey = storedApiKey.key_value
      } else if (translationService === 'mistral' && process.env.MISTRAL_API_KEY) {
        finalApiKey = process.env.MISTRAL_API_KEY
      } else if (translationService === 'google' && process.env.GOOGLE_TRANSLATE_API_KEY) {
        finalApiKey = process.env.GOOGLE_TRANSLATE_API_KEY
      }
    }

    // Initialize the appropriate translation service
    if (!finalApiKey) {
      const serviceName = translationService === 'mistral' ? 'Mistral' : 'Google Translate'
      const envVar = translationService === 'mistral' ? 'MISTRAL_API_KEY' : 'GOOGLE_TRANSLATE_API_KEY'
      return NextResponse.json(
        { error: `${serviceName} API key is required. Please set ${envVar} environment variable or configure in database.` },
        { status: 400 }
      )
    }

    // Use the selected translation service
    const translationServiceInstance = translationService === 'mistral' 
      ? new MistralTranslationService(finalApiKey)
      : new TranslationService(finalApiKey)

    // Fetch the original post first
    const { data: posts, error: postError } = await supabase
      .from('cuddly_nest_modern_post')
      .select('*')
      .eq('id', postId)
      .limit(1)

    const post = posts && posts.length > 0 ? posts[0] : null

    if (!post) {
      console.error('Post lookup failed:', {
        postId,
        postError: postError?.message,
        postsFound: posts?.length || 0
      })
      return NextResponse.json(
        { error: `Post not found with ID: ${postId}. Error: ${postError?.message || 'No post data'}` },
        { status: 404 }
      )
    }

    // Fetch sections separately to avoid duplicate row issues
    const { data: sections, error: sectionsError } = await supabase
      .from('modern_post_sections')
      .select('*')
      .eq('post_id', postId)
      .order('position', { ascending: true })

    // Add sections to the post object
    post.sections = sections || []

    console.log('Post found successfully:', {
      postId: post.id,
      title: post.title,
      sectionsCount: post.sections.length
    })

    // Check if translation already exists
    const { data: existingTranslation } = await supabase
      .from('post_translations')
      .select('id, translation_status')
      .eq('original_post_id', postId)
      .eq('language_code', targetLanguage)
      .single()

    // For now, always re-translate to ensure sections are included
    // if (existingTranslation && existingTranslation.translation_status === 'completed') {
    //   return NextResponse.json({
    //     message: 'Translation already exists',
    //     translationId: existingTranslation.id,
    //     status: 'completed'
    //   })
    // }

    // Prepare post data for translation
    const postData = {
      title: post.title,
      excerpt: post.excerpt,
      content: post.content,
      seo_title: post.seo_title,
      seo_description: post.seo_description,
      seo_keywords: post.seo_keywords,
      faq_items: post.faq_items,
      itinerary_days: post.itinerary_days,
      sections: post.sections
    }

    // Create or update translation record with 'translating' status
    const translatedSlug = translationServiceInstance.generateSlug(post.slug, targetLanguage)
    
    let translationId: string

    if (existingTranslation) {
      // Update existing translation
      const { error: updateError } = await supabase
        .from('post_translations')
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
        .from('post_translations')
        .insert({
          original_post_id: postId,
          language_code: targetLanguage,
          translated_title: 'Translating...',
          translated_slug: translatedSlug,
          translation_status: 'translating',
          translation_service: translationService === 'mistral' ? 'mistral' : 'google_translate'
        })
        .select('id')
        .single()

      if (createError) throw createError
      translationId = newTranslation.id
    }

    // Perform translation
    try {
      console.log('Starting translation for post:', postId, 'to language:', targetLanguage)
      console.log('Post data keys:', Object.keys(postData))
      console.log('API key present:', !!finalApiKey)
      console.log('Force complete translation:', !!forceCompleteTranslation)
      
      // For now, only Google Translate service supports translatePost method
      let translatedData
      if (translationService === 'mistral') {
        // For Mistral, we'll handle translation field by field
        const fieldsToTranslate: string[] = []
        const fieldMap: { [key: string]: string } = {}
        
        if (postData.title) {
          fieldMap.title = fieldsToTranslate.length.toString()
          fieldsToTranslate.push(postData.title)
        }
        if (postData.excerpt) {
          fieldMap.excerpt = fieldsToTranslate.length.toString()
          fieldsToTranslate.push(postData.excerpt)
        }
        if (postData.seo_title) {
          fieldMap.seo_title = fieldsToTranslate.length.toString()
          fieldsToTranslate.push(postData.seo_title)
        }
        if (postData.seo_description) {
          fieldMap.seo_description = fieldsToTranslate.length.toString()
          fieldsToTranslate.push(postData.seo_description)
        }
        
        const mistralTranslation = await translationServiceInstance.translateText({
          text: fieldsToTranslate,
          targetLanguage
        })
        
        if (mistralTranslation.success) {
          const translations = Array.isArray(mistralTranslation.translatedText) 
            ? mistralTranslation.translatedText 
            : [mistralTranslation.translatedText]
          
          translatedData = {
            translated_title: fieldMap.title !== undefined ? translations[parseInt(fieldMap.title)] : postData.title,
            translated_excerpt: fieldMap.excerpt !== undefined ? translations[parseInt(fieldMap.excerpt)] : postData.excerpt,
            translated_seo_title: fieldMap.seo_title !== undefined ? translations[parseInt(fieldMap.seo_title)] : postData.seo_title,
            translated_seo_description: fieldMap.seo_description !== undefined ? translations[parseInt(fieldMap.seo_description)] : postData.seo_description,
          }
        } else {
          throw new Error(mistralTranslation.error || 'Mistral translation failed')
        }
      } else {
        // Use Google Translate's comprehensive translatePost method
        translatedData = await (translationServiceInstance as TranslationService).translatePost(postData, targetLanguage)
      }
      console.log('Translation completed successfully')
      
      // Update the translation record with translated content
      const { error: updateError } = await supabase
        .from('post_translations')
        .update({
          translated_title: translatedData.translated_title,
          translated_slug: translationServiceInstance.generateSlug(post.slug, targetLanguage),
          translated_excerpt: translatedData.translated_excerpt,
          translated_content: translatedData.translated_content,
          translated_seo_title: translatedData.translated_seo_title,
          translated_seo_description: translatedData.translated_seo_description,
          translated_seo_keywords: translatedData.translated_seo_keywords,
          translated_faq_items: translatedData.translated_faq_items,
          translated_itinerary_days: translatedData.translated_itinerary_days,
          translation_status: 'completed',
          translated_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', translationId)

      if (updateError) throw updateError

      // Translate sections if they exist
      if (post.sections && post.sections.length > 0) {
        console.log(`Translating ${post.sections.length} sections`)
        console.log(`Force complete translation mode: ${!!forceCompleteTranslation}`)
        
        for (const section of post.sections) {
          console.log(`Processing section ${section.id} with template ${section.template_id}`)
          
          // Debug section data structure
          console.log(`Section ${section.id} data structure:`, Object.keys(section.data || {}))
          console.log(`Section ${section.id} content check:`, {
            hasContent: !!section.data?.content,
            contentType: typeof section.data?.content,
            contentLength: section.data?.content?.length || 0,
            hasHTML: section.data?.content?.includes?.('<') || false
          })
          
          // Enhanced section processing for complete translation
          if (forceCompleteTranslation) {
            console.log(`🔄 FORCE COMPLETE TRANSLATION MODE: Processing section ${section.id} thoroughly`)
          }
          
          // Special handling for large HTML content sections or the problematic WordPress section
          if ((section.data?.content && typeof section.data.content === 'string' && 
              section.data.content.length > 5000 && section.data.content.includes('<')) ||
              section.id === '7ff9be16-1d38-459f-839c-015d3d67512f') {
            console.log(`Processing large HTML section ${section.id} with special chunking`)
            
            try {
              console.log(`Processing WordPress content section: ${section.data.content.length} chars`)
              console.log(`First 200 chars of original content: ${section.data.content.substring(0, 200)}`)
              
              // Extract all text content from HTML for translation
              const textToTranslate = extractAllTextFromHTML(section.data.content)
              console.log(`Extracted ${textToTranslate.length} text chunks for translation`)
              console.log(`First few extracted texts:`, textToTranslate.slice(0, 5))
              
              if (textToTranslate.length > 0) {
                // Translate the extracted text
                console.log(`Sending ${textToTranslate.length} texts to translation service...`)
                const textTranslation = await translationServiceInstance.translateText({
                  text: textToTranslate,
                  targetLanguage
                })
                
                console.log(`Translation service response:`, {
                  success: textTranslation.success,
                  error: textTranslation.error,
                  translatedTextCount: Array.isArray(textTranslation.translatedText) ? textTranslation.translatedText.length : 1
                })
                
                if (textTranslation.success && textTranslation.translatedText) {
                  const translatedTexts = Array.isArray(textTranslation.translatedText) 
                    ? textTranslation.translatedText 
                    : [textTranslation.translatedText]
                  
                  console.log(`First few translated texts:`, translatedTexts.slice(0, 5))
                  
                  // Replace the original text with translations in the HTML
                  const translatedContent = replaceAllTextInHTML(section.data.content, textToTranslate, translatedTexts)
                  
                  console.log(`Original content length: ${section.data.content.length}`)
                  console.log(`Translated content length: ${translatedContent.length}`)
                  console.log(`First 200 chars of translated content: ${translatedContent.substring(0, 200)}`)
                  console.log(`Translated content still contains English test phrase: ${translatedContent.includes('Is Rotterdam Nightlife even a thing')}`)
                  
                  const translatedSectionData = {
                    ...section.data,
                    content: translatedContent
                  }
                  
                  console.log(`Saving translated section to database...`)
                  
                  // Validate and sanitize translated data before saving
                  let safeTranslatedData
                  try {
                    // Ensure the data is a valid object
                    if (typeof translatedSectionData === 'object' && translatedSectionData !== null) {
                      // Create a deep copy and validate structure
                      safeTranslatedData = JSON.parse(JSON.stringify(translatedSectionData))
                      console.log(`✅ Validated translated section data structure`)
                    } else {
                      console.warn(`⚠️ Invalid translated data structure, using original data`)
                      safeTranslatedData = section.data
                    }
                  } catch (error) {
                    console.error(`❌ Error validating translated data:`, error)
                    safeTranslatedData = section.data
                  }
                  
                  // Save the translated section
                  const { error: sectionError } = await supabase
                    .from('translated_sections')
                    .upsert({
                      translation_id: translationId,
                      original_section_id: section.id,
                      translated_data: safeTranslatedData,
                      position: section.position,
                      updated_at: new Date().toISOString()
                    })

                  if (sectionError) {
                    console.error(`Error saving WordPress translation:`, sectionError)
                  } else {
                    console.log(`WordPress section ${section.id} saved successfully`)
                  }
                } else {
                  console.error(`Text translation failed:`, textTranslation.error)
                }
              } else {
                console.error(`No text found to translate in WordPress content`)
              }
            } catch (error) {
              console.error(`Error processing WordPress content:`, error)
            }
          } else {
            // Regular section processing - enhanced for complete translation
            let sectionTexts = extractTranslatableTexts(section.data)
            console.log(`Found ${sectionTexts.length} translatable texts in section ${section.id}`)
            
            // Enhanced text extraction for force complete translation mode
            if (forceCompleteTranslation && sectionTexts.length === 0) {
              console.log(`🔍 FORCE MODE: Re-examining section ${section.id} for any missed translatable content`)
              sectionTexts = extractTranslatableTextsEnhanced(section.data)
              console.log(`Enhanced extraction found ${sectionTexts.length} additional texts`)
            }
            
            if (sectionTexts.length > 0) {
              try {
                console.log(`🌐 Translating ${sectionTexts.length} texts for section ${section.id}`)
                if (forceCompleteTranslation) {
                  console.log(`Sample texts to translate:`, sectionTexts.slice(0, 3))
                }
                
                const sectionTranslation = await translationServiceInstance.translateText({
                  text: sectionTexts,
                  targetLanguage
                })

                if (sectionTranslation.success) {
                  const translatedTexts = Array.isArray(sectionTranslation.translatedText) 
                    ? sectionTranslation.translatedText 
                    : [sectionTranslation.translatedText]
                  
                  console.log(`✅ Translation successful for section ${section.id}`)
                  if (forceCompleteTranslation) {
                    console.log(`Sample translations:`, translatedTexts.slice(0, 3))
                  }
                  
                  const translatedSectionData = forceCompleteTranslation 
                    ? replaceSectionTextsEnhanced(section.data, sectionTexts, translatedTexts)
                    : replaceSectionTexts(section.data, translatedTexts)

                  console.log(`Successfully translated section ${section.id}`)

                  // Insert translated section with preserved position
                  const { error: sectionError } = await supabase
                    .from('translated_sections')
                    .upsert({
                      translation_id: translationId,
                      original_section_id: section.id,
                      translated_data: translatedSectionData,
                      position: section.position, // Preserve original section position
                      updated_at: new Date().toISOString()
                    })

                  if (sectionError) {
                    console.error(`Error saving translated section ${section.id}:`, sectionError)
                  } else {
                    console.log(`💾 Section ${section.id} saved successfully with ${translatedTexts.length} translations`)
                  }
                } else {
                  console.error(`Translation failed for section ${section.id}:`, sectionTranslation.error)
                  
                  // Save with original data but log the failure
                  await supabase
                    .from('translated_sections')
                    .upsert({
                      translation_id: translationId,
                      original_section_id: section.id,
                      translated_data: section.data,
                      position: section.position,
                      updated_at: new Date().toISOString()
                    })
                }
              } catch (sectionError) {
                console.error(`Error translating section ${section.id}:`, sectionError)
                
                // Save with original data in case of error
                await supabase
                  .from('translated_sections')
                  .upsert({
                    translation_id: translationId,
                    original_section_id: section.id,
                    translated_data: section.data,
                    position: section.position,
                    updated_at: new Date().toISOString()
                  })
              }
            } else {
              console.log(`No translatable content found in section ${section.id}`)
              
              // Still save the section with original data for structure
              await supabase
                .from('translated_sections')
                .upsert({
                  translation_id: translationId,
                  original_section_id: section.id,
                  translated_data: section.data,
                  position: section.position, // Preserve original section position
                  updated_at: new Date().toISOString()
                })
            }
          }
        }
        
        console.log('Finished translating all sections')
      }

      // Also translate UI strings if requested
      if (includeUITranslation) {
        console.log('Starting UI translation...')
        try {
          // Import UI strings
          const uiStrings = await import('@/lib/translations/ui-strings.json')
          
          // Extract translatable strings
          const translatableStrings = extractTranslatableStringsFromUI(uiStrings.default.en)
          console.log(`Found ${translatableStrings.length} UI strings to translate`)
          
          if (translatableStrings.length > 0) {
            // Translate UI strings
            const uiTranslationResult = await translationServiceInstance.translateText({
              text: translatableStrings,
              targetLanguage
            })
            
            if (uiTranslationResult.success) {
              const translatedUITexts = Array.isArray(uiTranslationResult.translatedText) 
                ? uiTranslationResult.translatedText 
                : [uiTranslationResult.translatedText]
              
              // Build translated UI structure
              const translatedUIStrings = buildTranslatedUIStructure(
                uiStrings.default.en,
                translatableStrings,
                translatedUITexts
              )
              
              // Save or update UI translations
              await supabase
                .from('ui_translations')
                .upsert({
                  language_code: targetLanguage,
                  translated_strings: translatedUIStrings,
                  translation_status: 'completed',
                  updated_at: new Date().toISOString()
                })
              
              console.log('UI translation completed successfully')
            } else {
              console.error('UI translation failed:', uiTranslationResult.error)
            }
          }
        } catch (uiError) {
          console.error('Error during UI translation:', uiError)
          // Don't fail the entire translation if UI translation fails
        }
      }

      return NextResponse.json({
        success: true,
        translationId,
        message: 'Translation completed successfully',
        translatedSlug: translationServiceInstance.generateSlug(post.slug, targetLanguage)
      })
    } catch (translationError) {
      // Update translation status to failed
      await supabase
        .from('post_translations')
        .update({
          translation_status: 'failed',
          updated_at: new Date().toISOString()
        })
        .eq('id', translationId)

      throw translationError
    }
  } catch (error) {
    console.error('Translation API error:', error)
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    return NextResponse.json(
      { 
        error: 'Translation failed', 
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace'
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const postId = searchParams.get('postId')

    if (!postId) {
      return NextResponse.json(
        { error: 'Post ID is required' },
        { status: 400 }
      )
    }

    // Get all translations for this post
    const { data: translations, error } = await supabase
      .from('post_translations')
      .select(`
        *,
        language:languages!post_translations_language_code_fkey(*)
      `)
      .eq('original_post_id', postId)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({
      success: true,
      translations
    })
  } catch (error) {
    console.error('Get translations error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch translations' },
      { status: 500 }
    )
  }
}

// Helper function to extract translatable texts from section data
function extractTranslatableTexts(sectionData: any): string[] {
  const texts: string[] = []
  
  function extractFromObject(obj: any, parentKey?: string) {
    if (typeof obj === 'string' && obj.trim()) {
      const trimmed = obj.trim()
      
      // Special handling for HTML content
      if (trimmed.includes('<') && trimmed.includes('>')) {
        // This is HTML content - extract text from HTML tags
        const htmlTexts = extractTextFromHTML(trimmed)
        texts.push(...htmlTexts)
      } else if (trimmed.length > 0 && 
          !trimmed.includes('http://') && 
          !trimmed.includes('https://') &&
          !trimmed.includes('Section type') &&
          trimmed !== 'Content coming soon...' &&
          !trimmed.startsWith('#') && // Skip CSS colors
          !trimmed.includes('px') && // Skip CSS measurements
          !trimmed.includes('%') && // Skip percentages in CSS
          trimmed.length > 2) {
        texts.push(trimmed)
      }
    } else if (Array.isArray(obj)) {
      obj.forEach((item, index) => extractFromObject(item, `${parentKey}[${index}]`))
    } else if (obj && typeof obj === 'object') {
      // Skip certain keys that shouldn't be translated
      const skipKeys = [
        'url', 'image', 'src', 'href', 'id', 'className', 'style', 
        'width', 'height', 'alt', 'type', 'template_id', 'sort_order',
        'is_active', 'created_at', 'updated_at', 'file_url', 'public_url'
      ]
      
      Object.keys(obj).forEach(key => {
        if (!skipKeys.some(skipKey => key.toLowerCase().includes(skipKey.toLowerCase()))) {
          extractFromObject(obj[key], key)
        }
      })
    }
  }
  
  extractFromObject(sectionData)
  
  // Remove duplicates and very short texts
  const uniqueTexts = [...new Set(texts)].filter(text => text.length > 2)
  console.log('Extracted texts for translation:', uniqueTexts.length, 'items')
  
  return uniqueTexts
}

// Helper function to extract text content from HTML
function extractTextFromHTML(html: string): string[] {
  const texts: string[] = []
  
  // Extract text from common HTML elements, preserving structure
  const patterns = [
    /<h[1-6][^>]*>(.*?)<\/h[1-6]>/gi,      // Headers
    /<p[^>]*>(.*?)<\/p>/gi,                 // Paragraphs
    /<li[^>]*>(.*?)<\/li>/gi,               // List items
    /<td[^>]*>(.*?)<\/td>/gi,               // Table cells
    /<th[^>]*>(.*?)<\/th>/gi,               // Table headers
    /<span[^>]*>(.*?)<\/span>/gi,           // Spans
    /<strong[^>]*>(.*?)<\/strong>/gi,       // Strong text
    /<em[^>]*>(.*?)<\/em>/gi,               // Emphasized text
  ]
  
  patterns.forEach(pattern => {
    let match
    while ((match = pattern.exec(html)) !== null) {
      const text = match[1]
        .replace(/<[^>]*>/g, '') // Remove any nested HTML tags
        .replace(/&nbsp;/g, ' ') // Replace HTML entities
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .trim()
      
      if (text.length > 3 && !text.includes('http') && !text.includes('€') && text !== 'Strong') {
        texts.push(text)
      }
    }
  })
  
  return texts
}

// Helper function to replace texts in section data with translations
function replaceSectionTexts(sectionData: any, translations: string[]): any {
  let translationIndex = 0
  
  function replaceInObject(obj: any, parentKey?: string): any {
    if (typeof obj === 'string' && obj.trim()) {
      const trimmed = obj.trim()
      
      // Handle HTML content
      if (trimmed.includes('<') && trimmed.includes('>')) {
        // This is HTML content - replace text within HTML tags
        return replaceTextInHTML(trimmed)
      } else if (trimmed.length > 0 && 
          !trimmed.includes('http://') && 
          !trimmed.includes('https://') &&
          !trimmed.includes('Section type') &&
          trimmed !== 'Content coming soon...' &&
          !trimmed.startsWith('#') && // Skip CSS colors
          !trimmed.includes('px') && // Skip CSS measurements
          !trimmed.includes('%') && // Skip percentages in CSS
          trimmed.length > 2) {
        
        const translation = translationIndex < translations.length ? translations[translationIndex++] : obj
        console.log(`Replacing "${trimmed}" with "${translation}"`)
        return translation
      }
      return obj
    } else if (Array.isArray(obj)) {
      return obj.map((item, index) => replaceInObject(item, `${parentKey}[${index}]`))
    } else if (obj && typeof obj === 'object') {
      const skipKeys = [
        'url', 'image', 'src', 'href', 'id', 'className', 'style', 
        'width', 'height', 'alt', 'type', 'template_id', 'sort_order',
        'is_active', 'created_at', 'updated_at', 'file_url', 'public_url'
      ]
      const result: any = {}
      
      Object.keys(obj).forEach(key => {
        if (skipKeys.some(skipKey => key.toLowerCase().includes(skipKey.toLowerCase()))) {
          result[key] = obj[key] // Keep original value
        } else {
          result[key] = replaceInObject(obj[key], key)
        }
      })
      
      return result
    }
    
    return obj
  }
  
  return replaceInObject(sectionData)
  
  // Helper function to replace text within HTML while preserving structure
  function replaceTextInHTML(html: string): string {
    let result = html
    
    // Replace text in common HTML elements, preserving structure
    const patterns = [
      /<h[1-6]([^>]*)>(.*?)<\/h[1-6]>/gi,      // Headers
      /<p([^>]*)>(.*?)<\/p>/gi,                 // Paragraphs
      /<li([^>]*)>(.*?)<\/li>/gi,               // List items
      /<td([^>]*)>(.*?)<\/td>/gi,               // Table cells
      /<th([^>]*)>(.*?)<\/th>/gi,               // Table headers
      /<span([^>]*)>(.*?)<\/span>/gi,           // Spans
      /<strong([^>]*)>(.*?)<\/strong>/gi,       // Strong text
      /<em([^>]*)>(.*?)<\/em>/gi,               // Emphasized text
    ]
    
    patterns.forEach(pattern => {
      result = result.replace(pattern, (match, attributes, content) => {
        const tagName = match.match(/<(\w+)/)?.[1] || ''
        const cleanContent = content
          .replace(/<[^>]*>/g, '') // Remove nested HTML
          .replace(/&nbsp;/g, ' ') // Replace entities
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .trim()
        
        if (cleanContent.length > 3 && !cleanContent.includes('http') && !cleanContent.includes('€') && cleanContent !== 'Strong') {
          const translation = translationIndex < translations.length ? translations[translationIndex++] : cleanContent
          return `<${tagName}${attributes}>${translation}</${tagName}>`
        }
        return match
      })
    })
    
    return result
  }
}

// Helper function to translate large HTML content by chunking
async function translateLargeHTML(html: string, translationService: any, targetLanguage: string): Promise<string | null> {
  try {
    console.log(`Translating large HTML content (${html.length} chars)`)
    
    // Split HTML into smaller chunks while preserving structure
    const chunks = splitHTMLIntoChunks(html, 3000) // 3KB chunks
    console.log(`Split into ${chunks.length} chunks`)
    
    const translatedChunks: string[] = []
    
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i]
      console.log(`Translating chunk ${i + 1}/${chunks.length} (${chunk.length} chars)`)
      
      // Extract text from this chunk
      const texts = extractTextFromHTML(chunk)
      
      if (texts.length > 0) {
        try {
          const translation = await translationServiceInstance.translateText({
            text: texts,
            targetLanguage
          })
          
          if (translation.success) {
            const translatedTexts = Array.isArray(translation.translatedText) 
              ? translation.translatedText 
              : [translation.translatedText]
            
            // Replace text in the chunk
            const translatedChunk = replaceTextInHTMLChunk(chunk, texts, translatedTexts)
            translatedChunks.push(translatedChunk)
          } else {
            console.error(`Translation failed for chunk ${i + 1}:`, translation.error)
            translatedChunks.push(chunk) // Use original if translation fails
          }
        } catch (error) {
          console.error(`Error translating chunk ${i + 1}:`, error)
          translatedChunks.push(chunk) // Use original if translation fails
        }
      } else {
        // No translatable text in this chunk
        translatedChunks.push(chunk)
      }
      
      // Add small delay between chunks to avoid rate limiting
      if (i < chunks.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }
    
    const result = translatedChunks.join('')
    console.log(`Large HTML translation completed: ${result.length} chars`)
    return result
    
  } catch (error) {
    console.error('Error in translateLargeHTML:', error)
    return null
  }
}

// Helper function to split HTML into chunks while preserving structure
function splitHTMLIntoChunks(html: string, maxChunkSize: number): string[] {
  const chunks: string[] = []
  let currentChunk = ''
  
  // Split by paragraphs and headers to maintain structure
  const parts = html.split(/(<\/[ph][1-6]?>)/gi)
  
  for (const part of parts) {
    if (currentChunk.length + part.length > maxChunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk)
      currentChunk = part
    } else {
      currentChunk += part
    }
  }
  
  if (currentChunk.length > 0) {
    chunks.push(currentChunk)
  }
  
  return chunks.filter(chunk => chunk.trim().length > 0)
}

// Helper function to replace text in HTML chunk
function replaceTextInHTMLChunk(html: string, originalTexts: string[], translatedTexts: string[]): string {
  let result = html
  
  for (let i = 0; i < Math.min(originalTexts.length, translatedTexts.length); i++) {
    const original = originalTexts[i]
    const translated = translatedTexts[i]
    
    if (original && translated && original !== translated) {
      // Escape special regex characters
      const escapedOriginal = original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const regex = new RegExp(`>${escapedOriginal}<`, 'gi')
      result = result.replace(regex, `>${translated}<`)
    }
  }
  
  return result
}

// Helper function to extract ALL text content from HTML for WordPress content
function extractAllTextFromHTML(html: string): string[] {
  const texts: string[] = []
  
  // Remove script and style tags completely
  const cleanHtml = html
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<style[^>]*>.*?<\/style>/gi, '')
  
  // Extract text from all HTML elements using a comprehensive approach
  const patterns = [
    /<h[1-6][^>]*>(.*?)<\/h[1-6]>/gi,     // Headers
    /<p[^>]*>(.*?)<\/p>/gi,               // Paragraphs
    /<li[^>]*>(.*?)<\/li>/gi,             // List items
    /<td[^>]*>(.*?)<\/td>/gi,             // Table cells
    /<th[^>]*>(.*?)<\/th>/gi,             // Table headers
    /<div[^>]*>(.*?)<\/div>/gi,           // Divs
    /<span[^>]*>(.*?)<\/span>/gi,         // Spans
    /<strong[^>]*>(.*?)<\/strong>/gi,     // Strong text
    /<b[^>]*>(.*?)<\/b>/gi,               // Bold text
    /<em[^>]*>(.*?)<\/em>/gi,             // Emphasized text
    /<i[^>]*>(.*?)<\/i>/gi,               // Italic text
    /<a[^>]*>(.*?)<\/a>/gi,               // Links
    /<blockquote[^>]*>(.*?)<\/blockquote>/gi, // Blockquotes
    /<figcaption[^>]*>(.*?)<\/figcaption>/gi, // Figure captions
    /<caption[^>]*>(.*?)<\/caption>/gi,   // Table captions
  ]
  
  patterns.forEach(pattern => {
    let match
    while ((match = pattern.exec(cleanHtml)) !== null) {
      const text = match[1]
        .replace(/<[^>]*>/g, '') // Remove any nested HTML tags
        .replace(/&nbsp;/g, ' ') // Replace HTML entities
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#8217;/g, "'")
        .replace(/&#8216;/g, "'")
        .replace(/&#8220;/g, '"')
        .replace(/&#8221;/g, '"')
        .replace(/&#8211;/g, '–')
        .replace(/&#8212;/g, '—')
        .trim()
      
      if (text.length > 3 && 
          !text.includes('http') && 
          !text.includes('www.') &&
          !text.includes('€') && 
          !text.includes('$') &&
          !text.match(/^\d+$/) && // Skip pure numbers
          !text.match(/^[^\w\s]+$/) && // Skip pure punctuation
          text !== 'Strong' &&
          text !== 'Read more' &&
          text !== 'Continue reading') {
        texts.push(text)
      }
    }
  })
  
  // Reset lastIndex for all patterns
  patterns.forEach(pattern => pattern.lastIndex = 0)
  
  return [...new Set(texts)] // Remove duplicates
}

// Helper function to replace all text in HTML with translations
function replaceAllTextInHTML(html: string, originalTexts: string[], translatedTexts: string[]): string {
  if (originalTexts.length !== translatedTexts.length) {
    console.warn(`Mismatch: ${originalTexts.length} original texts vs ${translatedTexts.length} translations`)
    return html
  }
  
  let result = html
  
  for (let i = 0; i < originalTexts.length; i++) {
    const original = originalTexts[i]
    const translated = translatedTexts[i]
    
    if (original && translated && original !== translated && original.trim().length > 0) {
      // Escape special regex characters in the original text
      const escapedOriginal = original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      
      // Create regex patterns to match text within HTML tags
      const patterns = [
        new RegExp(`(>[^<]*?)${escapedOriginal}([^<]*?<)`, 'gi'),  // Text between tags
        new RegExp(`(>\\s*)${escapedOriginal}(\\s*<)`, 'gi'),     // Text with whitespace
      ]
      
      patterns.forEach(pattern => {
        result = result.replace(pattern, (match, before, after) => {
          return before + translated + after
        })
      })
      
      // Also try direct replacement in case the above patterns miss anything
      result = result.replace(
        new RegExp(`>${escapedOriginal}<`, 'gi'),
        `>${translated}<`
      )
    }
  }
  
  return result
}

// Enhanced text extraction function for force complete translation mode
function extractTranslatableTextsEnhanced(sectionData: any): string[] {
  const texts: string[] = []
  
  function extractFromObjectEnhanced(obj: any, path: string = ''): void {
    if (typeof obj === 'string' && obj.trim()) {
      const trimmed = obj.trim()
      
      // More aggressive text extraction - capture more content
      if (trimmed.length > 1 && 
          !trimmed.match(/^https?:\/\//) && // Skip URLs
          !trimmed.match(/^#[0-9a-fA-F]+$/) && // Skip hex colors
          !trimmed.match(/^\d+px$/) && // Skip pixel values
          !trimmed.match(/^\d+%$/) && // Skip percentages
          !trimmed.match(/^[0-9.]+$/) && // Skip pure numbers
          !trimmed.includes('data:image') && // Skip data URLs
          !trimmed.includes('base64') && // Skip base64
          !trimmed.includes('.jpg') && // Skip image paths
          !trimmed.includes('.png') &&
          !trimmed.includes('.webp') &&
          !trimmed.includes('.svg')) {
        
        // Even capture single word translations for completeness
        texts.push(trimmed)
        console.log(`Enhanced extraction captured: "${trimmed}" from path: ${path}`)
      }
    } else if (Array.isArray(obj)) {
      obj.forEach((item, index) => extractFromObjectEnhanced(item, `${path}[${index}]`))
    } else if (obj && typeof obj === 'object') {
      // Include more field types in enhanced mode
      const enhancedSkipKeys = [
        'id', 'className', 'style', 'template_id', 'sort_order',
        'is_active', 'created_at', 'updated_at'
      ]
      
      Object.keys(obj).forEach(key => {
        if (!enhancedSkipKeys.some(skipKey => key.toLowerCase().includes(skipKey.toLowerCase()))) {
          extractFromObjectEnhanced(obj[key], path ? `${path}.${key}` : key)
        }
      })
    }
  }
  
  extractFromObjectEnhanced(sectionData)
  
  // Remove duplicates but keep all valid texts
  const uniqueTexts = [...new Set(texts)]
  console.log(`Enhanced extraction found ${uniqueTexts.length} unique translatable texts`)
  
  return uniqueTexts
}

// Enhanced section text replacement for more thorough translation
function replaceSectionTextsEnhanced(sectionData: any, originalTexts: string[], translations: string[]): any {
  console.log(`Enhanced replacement: ${originalTexts.length} originals, ${translations.length} translations`)
  
  if (originalTexts.length !== translations.length) {
    console.warn(`Text count mismatch: ${originalTexts.length} originals vs ${translations.length} translations`)
    // Use the regular replacement function as fallback
    return replaceSectionTexts(sectionData, translations)
  }
  
  // Create a mapping of original texts to translations
  const textMap = new Map()
  for (let i = 0; i < originalTexts.length; i++) {
    if (originalTexts[i] && translations[i]) {
      textMap.set(originalTexts[i].trim(), translations[i])
    }
  }
  
  function replaceInObjectEnhanced(obj: any): any {
    if (typeof obj === 'string' && obj.trim()) {
      const trimmed = obj.trim()
      const translation = textMap.get(trimmed)
      
      if (translation) {
        console.log(`Enhanced replacement: "${trimmed}" → "${translation}"`)
        return translation
      }
      return obj
    } else if (Array.isArray(obj)) {
      return obj.map(item => replaceInObjectEnhanced(item))
    } else if (obj && typeof obj === 'object') {
      const result: any = {}
      Object.keys(obj).forEach(key => {
        result[key] = replaceInObjectEnhanced(obj[key])
      })
      return result
    }
    
    return obj
  }
  
  const result = replaceInObjectEnhanced(sectionData)
  console.log(`Enhanced replacement completed`)
  return result
}

// Helper function to extract all translatable strings from UI structure
function extractTranslatableStringsFromUI(obj: any, path: string = ''): string[] {
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
function buildTranslatedUIStructure(
  originalStructure: any,
  originalStrings: string[],
  translatedStrings: string[]
): any {
  if (originalStrings.length !== translatedStrings.length) {
    console.warn(`UI String count mismatch: ${originalStrings.length} original vs ${translatedStrings.length} translated`)
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