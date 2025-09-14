import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// Language mappings
const languageMap = {
  'fr': 'French',
  'it': 'Italian', 
  'de': 'German',
  'es': 'Spanish'
}

interface TranslationRequest {
  postId: string
  languages: string[]
  regenerate?: boolean
  background?: boolean
}

export async function POST(request: NextRequest) {
  console.log('=== COMPREHENSIVE TRANSLATION API CALLED ===')
  try {
    const { postId, languages, regenerate, background }: TranslationRequest = await request.json()
    console.log('Translation request received:', { postId, languages, regenerate, background })

    if (!postId || !languages || languages.length === 0) {
      console.log('ERROR: Missing postId or languages')
      return NextResponse.json(
        { error: 'Post ID and languages are required' },
        { status: 400 }
      )
    }

    // Validate languages
    const validLanguages = languages.filter(lang => lang in languageMap)
    console.log('Valid languages:', validLanguages)
    if (validLanguages.length === 0) {
      console.log('ERROR: No valid languages provided')
      return NextResponse.json(
        { error: 'No valid languages provided' },
        { status: 400 }
      )
    }

    // Get the complete original post with metadata (no sections table in current schema)
    console.log('Fetching complete post data with ID:', postId)
    const { data: originalPost, error: postError } = await supabaseAdmin
      .from('cuddly_nest_modern_post')
      .select(`
        *,
        author:modern_authors(display_name, bio, avatar_url, social_links)
      `)
      .eq('id', postId)
      .single()

    if (postError || !originalPost) {
      console.log('ERROR: Post not found:', { postError: postError?.message, originalPost })
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      )
    }
    
    console.log('Complete post data found:', { 
      id: originalPost.id, 
      title: originalPost.title,
      hasContent: !!originalPost.content,
      contentLength: originalPost.content?.length || 0
    })

    // If background processing requested, start comprehensive translation
    if (background) {
      console.log('Starting comprehensive background processing for languages:', validLanguages)
      const backgroundResults = []
      
      for (const languageCode of validLanguages) {
        try {
          console.log(`Processing comprehensive translation for language: ${languageCode}`)
          
          // Check if translation already exists
          const { data: existingTranslation, error: checkError } = await supabaseAdmin
            .from('post_translations')
            .select('id, translation_status')
            .eq('original_post_id', postId)
            .eq('language_code', languageCode)
            .maybeSingle()
            
          if (checkError) {
            console.log('ERROR checking existing translation:', checkError.message)
            throw checkError
          }

          if (existingTranslation && !regenerate) {
            backgroundResults.push({
              language: languageCode,
              success: true,
              status: 'exists',
              translationId: existingTranslation.id
            })
            continue
          }

          // Generate translated slug
          const translatedSlug = existingTranslation 
            ? (await supabaseAdmin.from('post_translations').select('translated_slug').eq('id', existingTranslation.id).single()).data?.translated_slug
            : await generateSlug(originalPost.title, languageCode, originalPost.slug)

          let translation, translationError

          if (existingTranslation && regenerate) {
            // Update existing translation status to in_progress
            const { data, error } = await supabaseAdmin
              .from('post_translations')
              .update({
                translation_status: 'in_progress',
                updated_at: new Date().toISOString()
              })
              .eq('id', existingTranslation.id)
              .select()
              .single()
            
            translation = data
            translationError = error
          } else {
            // Create new translation record with in_progress status
            const { data, error } = await supabaseAdmin
              .from('post_translations')
              .insert({
                original_post_id: postId,
                language_code: languageCode,
                translated_title: originalPost.title, // Temporary, will be updated
                translated_excerpt: originalPost.excerpt || '',
                translated_content: originalPost.content || '',
                translated_slug: translatedSlug,
                translation_status: 'in_progress',
                seo_data: {
                  seo_title: originalPost.seo_title || originalPost.title,
                  seo_description: originalPost.seo_description || originalPost.excerpt || '',
                  meta_title: originalPost.meta_title || originalPost.title,
                  meta_description: originalPost.meta_description || originalPost.excerpt || ''
                }
              })
              .select()
              .single()
            
            translation = data
            translationError = error
          }

          if (translationError) {
            backgroundResults.push({
              language: languageCode,
              success: false,
              error: translationError.message
            })
          } else {
            backgroundResults.push({
              language: languageCode,
              success: true,
              status: 'in_progress',
              translationId: translation?.id
            })
            
            // Trigger comprehensive background translation (fire and forget)
            console.log(`🚀 Triggering comprehensive background translation for ${languageCode}, translation ID: ${translation?.id}`)
            processComprehensiveTranslationBackground(translation?.id, originalPost, languageCode)
              .catch(error => {
                console.error(`❌ Comprehensive background processing failed for ${languageCode}:`, error)
                // Mark as failed and retry
                retryFailedTranslation(translation?.id, originalPost, languageCode)
              })
          }
        } catch (error) {
          backgroundResults.push({
            language: languageCode,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          })
        }
      }

      return NextResponse.json({
        success: true,
        background: true,
        results: backgroundResults,
        message: 'Comprehensive translations started in background. You will be notified when completed.'
      })
    }

    const translationResults = []

    // Comprehensive synchronous translation processing
    for (const languageCode of validLanguages) {
      try {
        console.log(`Starting comprehensive translation for post ${postId} to ${languageCode}...`)

        // Check if translation already exists
        const { data: existingTranslation } = await supabaseAdmin
          .from('post_translations')
          .select('id')
          .eq('original_post_id', postId)
          .eq('language_code', languageCode)
          .maybeSingle()

        if (existingTranslation && !regenerate) {
          console.log(`Translation to ${languageCode} already exists, skipping...`)
          continue
        }

        // Process comprehensive translation
        const result = await processComprehensiveTranslation(originalPost, languageCode, existingTranslation?.id, regenerate)
        
        translationResults.push({
          language: languageCode,
          success: true,
          translationId: result.translationId,
          sectionsTranslated: result.sectionsTranslated,
          metadataTranslated: result.metadataTranslated
        })

      } catch (error) {
        console.error(`Error in comprehensive translation to ${languageCode}:`, error)
        translationResults.push({
          language: languageCode,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
        
        // Attempt retry for failed translation
        console.log(`🔄 Attempting retry for failed translation to ${languageCode}`)
        try {
          const retryResult = await processComprehensiveTranslation(originalPost, languageCode, null, true)
          translationResults[translationResults.length - 1] = {
            language: languageCode,
            success: true,
            translationId: retryResult.translationId,
            sectionsTranslated: retryResult.sectionsTranslated,
            metadataTranslated: retryResult.metadataTranslated,
            retried: true
          }
        } catch (retryError) {
          console.error(`❌ Retry also failed for ${languageCode}:`, retryError)
        }
      }
    }

    return NextResponse.json({
      success: true,
      results: translationResults
    })

  } catch (error) {
    console.error('Translation API error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to translate post',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Comprehensive translation processing function
async function processComprehensiveTranslation(originalPost: any, languageCode: string, existingTranslationId?: string, regenerate = false) {
  console.log(`🔄 Starting comprehensive translation processing for ${languageCode}`)
  
  try {
    // Step 1: Translate main post content with improved quality
    console.log(`📝 Translating main post content...`)
    const mainTranslation = await translateWithMistralImproved({
      title: originalPost.title,
      excerpt: originalPost.excerpt || '',
      content: originalPost.content || '',
      seoTitle: originalPost.seo_title || originalPost.title,
      seoDescription: originalPost.seo_description || originalPost.excerpt || '',
      metaTitle: originalPost.meta_title || originalPost.title,
      metaDescription: originalPost.meta_description || originalPost.excerpt || '',
      targetLanguage: languageMap[languageCode as keyof typeof languageMap]
    })

    // Step 2: Generate translated slug
    const translatedSlug = existingTranslationId 
      ? (await supabaseAdmin.from('post_translations').select('translated_slug').eq('id', existingTranslationId).single()).data?.translated_slug
      : await generateSlug(mainTranslation.title, languageCode, originalPost.slug)

    // Step 3: Create or update main translation record
    let translationId = existingTranslationId
    
    if (existingTranslationId && regenerate) {
      // Update existing translation
      const { error: updateError } = await supabaseAdmin
        .from('post_translations')
        .update({
          translated_title: mainTranslation.title,
          translated_excerpt: mainTranslation.excerpt,
          translated_content: mainTranslation.content,
          translation_status: 'completed',
          seo_data: {
            seo_title: mainTranslation.seoTitle,
            seo_description: mainTranslation.seoDescription,
            meta_title: mainTranslation.metaTitle,
            meta_description: mainTranslation.metaDescription
          },
          updated_at: new Date().toISOString()
        })
        .eq('id', existingTranslationId)
      
      if (updateError) throw updateError
    } else {
      // Create new translation
      const { data: newTranslation, error: insertError } = await supabaseAdmin
        .from('post_translations')
        .insert({
          original_post_id: originalPost.id,
          language_code: languageCode,
          translated_title: mainTranslation.title,
          translated_excerpt: mainTranslation.excerpt,
          translated_content: mainTranslation.content,
          translated_slug: translatedSlug,
          translation_status: 'completed',
          seo_data: {
            seo_title: mainTranslation.seoTitle,
            seo_description: mainTranslation.seoDescription,
            meta_title: mainTranslation.metaTitle,
            meta_description: mainTranslation.metaDescription
          }
        })
        .select('id')
        .single()
      
      if (insertError) throw insertError
      translationId = newTranslation.id
    }

    // Note: Section-based translation not needed in current schema
    console.log(`✅ Main post content translation completed`)
    let sectionsTranslated = 0

    console.log(`🎉 Comprehensive translation completed successfully for ${languageCode}`)
    console.log(`📊 Results: Main post translated, ${sectionsTranslated} sections translated`)

    return {
      translationId,
      sectionsTranslated,
      metadataTranslated: true
    }

  } catch (error) {
    console.error(`❌ Comprehensive translation failed for ${languageCode}:`, error)
    
    // Mark as failed if we have a translation ID
    if (typeof translationId === 'string' && translationId) {
      await supabaseAdmin
        .from('post_translations')
        .update({
          translation_status: 'failed',
          updated_at: new Date().toISOString()
        })
        .eq('id', translationId)
    }
    
    throw error
  }
}

// Improved Mistral translation with better quality control
async function translateWithMistralImproved(content: {
  title: string
  excerpt: string
  content: string
  seoTitle: string
  seoDescription: string
  metaTitle: string
  metaDescription: string
  targetLanguage: string
}) {
  console.log(`🔑 Starting improved Mistral translation to ${content.targetLanguage}...`)
  const mistralApiKey = process.env.MISTRAL_API_KEY
  
  if (!mistralApiKey) {
    console.error('❌ MISTRAL_API_KEY not configured!')
    throw new Error('MISTRAL_API_KEY not configured')
  }

  const prompt = `You are a professional travel content translator specializing in high-quality, SEO-optimized translations. 

IMPORTANT RULES:
1. Translate to ${content.targetLanguage} maintaining natural, fluent language
2. Preserve ALL HTML tags and structure exactly as provided
3. Do NOT use markdown formatting (**, ***, ---, etc.) - only use proper HTML tags
4. Keep travel-specific terms and place names accurate
5. Maintain SEO optimization and readability
6. Remove any asterisks, hyphens, or markdown syntax from your translation
7. Ensure professional, native-level quality

CONTENT TO TRANSLATE:

TITLE: ${content.title}
EXCERPT: ${content.excerpt}
SEO_TITLE: ${content.seoTitle}
SEO_DESCRIPTION: ${content.seoDescription}
META_TITLE: ${content.metaTitle}  
META_DESCRIPTION: ${content.metaDescription}
CONTENT: ${content.content}

Respond with ONLY a JSON object in this exact format:
{
  "title": "professionally translated title without asterisks or markdown",
  "excerpt": "professionally translated excerpt without asterisks or markdown",
  "seoTitle": "SEO-optimized translated title without asterisks or markdown",
  "seoDescription": "SEO-optimized translated description without asterisks or markdown",
  "metaTitle": "Meta title translation without asterisks or markdown",
  "metaDescription": "Meta description translation without asterisks or markdown",
  "content": "professionally translated content with preserved HTML structure and no markdown syntax"
}`

  let retryCount = 0
  const maxRetries = 3

  while (retryCount < maxRetries) {
    try {
      console.log(`📡 Calling Mistral API (attempt ${retryCount + 1}/${maxRetries})...`)
      const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${mistralApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'mistral-large-latest',
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.2, // Lower temperature for more consistent quality
          max_tokens: 6000 // Increased for comprehensive content
        })
      })

      console.log(`📊 Mistral API response status: ${response.status}`)

      if (!response.ok) {
        const error = await response.text()
        console.error('❌ Mistral API error:', error)
        throw new Error(`Mistral API error: ${response.statusText}`)
      }

      const result = await response.json()
      const translatedText = result.choices[0]?.message?.content

      if (!translatedText) {
        throw new Error('No translation received from Mistral API')
      }

      // Parse and clean the response
      let cleanedText = translatedText.replace(/```json\n?|\n?```/g, '').trim()
      console.log('🔍 Raw Mistral response preview:', cleanedText.substring(0, 200))
      
      // Try to parse as JSON first
      try {
        const jsonResult = JSON.parse(cleanedText)
        
        // Clean up any markdown artifacts
        const cleanResult = {
          title: cleanMarkdownFromText(jsonResult.title || ''),
          excerpt: cleanMarkdownFromText(jsonResult.excerpt || ''),
          seoTitle: cleanMarkdownFromText(jsonResult.seoTitle || ''),
          seoDescription: cleanMarkdownFromText(jsonResult.seoDescription || ''),
          metaTitle: cleanMarkdownFromText(jsonResult.metaTitle || ''),
          metaDescription: cleanMarkdownFromText(jsonResult.metaDescription || ''),
          content: cleanMarkdownFromText(jsonResult.content || '')
        }
        
        console.log('✅ Successfully parsed and cleaned translation')
        return cleanResult
        
      } catch (jsonError) {
        // Fallback to regex extraction
        console.log('⚠️  JSON parsing failed, trying regex extraction...')
        
        const titleMatch = cleanedText.match(/"title":\s*"([^"]+)"/);
        const excerptMatch = cleanedText.match(/"excerpt":\s*"([^"]*(?:\\.[^"]*)*)"/);
        const seoTitleMatch = cleanedText.match(/"seoTitle":\s*"([^"]+)"/);
        const seoDescMatch = cleanedText.match(/"seoDescription":\s*"([^"]*(?:\\.[^"]*)*)"/);
        const metaTitleMatch = cleanedText.match(/"metaTitle":\s*"([^"]+)"/);
        const metaDescMatch = cleanedText.match(/"metaDescription":\s*"([^"]*(?:\\.[^"]*)*)"/);
        const contentMatch = cleanedText.match(/"content":\s*"([\s\S]*?)"\s*}/);
        
        if (!titleMatch || !excerptMatch || !contentMatch) {
          throw new Error('Could not extract required fields from response')
        }
        
        const regexResult = {
          title: cleanMarkdownFromText(titleMatch[1]),
          excerpt: cleanMarkdownFromText(excerptMatch[1].replace(/\\"/g, '"')),
          seoTitle: cleanMarkdownFromText(seoTitleMatch?.[1] || titleMatch[1]),
          seoDescription: cleanMarkdownFromText(seoDescMatch?.[1]?.replace(/\\"/g, '"') || excerptMatch[1].replace(/\\"/g, '"')),
          metaTitle: cleanMarkdownFromText(metaTitleMatch?.[1] || titleMatch[1]),
          metaDescription: cleanMarkdownFromText(metaDescMatch?.[1]?.replace(/\\"/g, '"') || excerptMatch[1].replace(/\\"/g, '"')),
          content: cleanMarkdownFromText(contentMatch[1].replace(/\\"/g, '"').trim())
        }
        
        console.log('✅ Successfully extracted and cleaned translation via regex')
        return regexResult
      }

    } catch (error) {
      console.error(`❌ Mistral translation attempt ${retryCount + 1} failed:`, error)
      retryCount++
      
      if (retryCount >= maxRetries) {
        console.error('❌ All Mistral translation attempts failed')
        throw new Error(`Translation failed after ${maxRetries} attempts: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
      
      console.log(`🔄 Retrying in 2 seconds... (attempt ${retryCount + 1}/${maxRetries})`)
      await new Promise(resolve => setTimeout(resolve, 2000))
    }
  }

  throw new Error('Translation failed after all retry attempts')
}

// Function to clean markdown artifacts from text
function cleanMarkdownFromText(text: string): string {
  if (!text) return ''
  
  return text
    // Remove markdown bold syntax
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    // Remove standalone asterisks
    .replace(/\*+/g, '')
    // Remove markdown horizontal rules
    .replace(/^---+$/gm, '')
    .replace(/\n---+\n/g, '\n')
    // Clean up extra spaces and newlines
    .replace(/\s+/g, ' ')
    .trim()
}

// Section-related functions removed as they're not needed in current schema

// Background processing with comprehensive error handling and retry mechanism
async function processComprehensiveTranslationBackground(translationId: string, originalPost: any, languageCode: string) {
  console.log(`🔄 Starting comprehensive background translation for ${translationId} (${languageCode})`)
  
  let retryCount = 0
  const maxRetries = 3
  
  while (retryCount < maxRetries) {
    try {
      await processComprehensiveTranslation(originalPost, languageCode, translationId, true)
      console.log(`🎉 Comprehensive background translation completed successfully for ${translationId} (${languageCode})`)
      return
      
    } catch (error) {
      console.error(`❌ Comprehensive background translation attempt ${retryCount + 1} failed for ${translationId}:`, error)
      retryCount++
      
      if (retryCount >= maxRetries) {
        console.error(`❌ All attempts failed for ${translationId}, marking as failed`)
        await supabaseAdmin
          .from('post_translations')
          .update({
            translation_status: 'failed',
            updated_at: new Date().toISOString()
          })
          .eq('id', translationId)
        return
      }
      
      console.log(`🔄 Retrying in ${retryCount * 3} seconds... (attempt ${retryCount + 1}/${maxRetries})`)
      await new Promise(resolve => setTimeout(resolve, retryCount * 3000))
    }
  }
}

// Retry mechanism for failed translations
async function retryFailedTranslation(translationId: string | undefined, originalPost: any, languageCode: string) {
  if (!translationId) return
  
  console.log(`🔄 Retrying failed translation ${translationId} for ${languageCode}`)
  
  try {
    await processComprehensiveTranslation(originalPost, languageCode, translationId, true)
    console.log(`✅ Retry successful for ${translationId}`)
  } catch (error) {
    console.error(`❌ Retry also failed for ${translationId}:`, error)
  }
}

// Generate translated slug with better handling
async function generateSlug(title: string, languageCode: string, originalSlug: string): Promise<string> {
  // Create a basic slug from the translated title
  const baseSlugFromTitle = title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
    .substring(0, 100)

  // Preserve country structure from original slug
  const originalParts = originalSlug.split('/')
  let finalSlug: string
  
  if (originalParts.length >= 2) {
    // Has country: thailand/3-days-bangkok-itinerary -> thailand/translated-slug
    const country = originalParts[0]
    finalSlug = `${country}/${baseSlugFromTitle}`
  } else {
    // No country: just use the translated slug
    finalSlug = baseSlugFromTitle
  }

  // Check for uniqueness
  let slug = finalSlug
  let counter = 1
  
  while (true) {
    const { data: existing } = await supabaseAdmin
      .from('post_translations')
      .select('id')
      .eq('translated_slug', slug)
      .eq('language_code', languageCode)
      .single()

    if (!existing) {
      break
    }

    // For country/slug format, add counter before the last part
    if (originalParts.length >= 2) {
      const country = originalParts[0]
      slug = `${country}/${baseSlugFromTitle}-${counter}`
    } else {
      slug = `${baseSlugFromTitle}-${counter}`
    }
    counter++
  }

  return slug
}