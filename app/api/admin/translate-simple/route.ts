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
}

export async function POST(request: NextRequest) {
  console.log('=== ULTRA SIMPLE TRANSLATION API CALLED ===')
  try {
    const { postId, languages, regenerate }: TranslationRequest = await request.json()
    console.log('Translation request received:', { postId, languages, regenerate })

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

    // Get the original post
    console.log('Fetching original post with ID:', postId)
    const { data: originalPost, error: postError } = await supabaseAdmin
      .from('cuddly_nest_modern_post')
      .select('*')
      .eq('id', postId)
      .single()

    if (postError || !originalPost) {
      console.log('ERROR: Post not found:', { postError: postError?.message })
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      )
    }
    
    console.log('Original post found:', { 
      id: originalPost.id, 
      title: originalPost.title,
      contentLength: originalPost.content?.length || 0
    })

    const translationResults = []

    // Process languages one by one (sequential, not parallel)
    for (const languageCode of validLanguages) {
      try {
        console.log(`\n🌍 Starting translation for ${languageCode}...`)

        // Check if translation already exists
        const { data: existingTranslation } = await supabaseAdmin
          .from('post_translations')
          .select('id, translated_title')
          .eq('original_post_id', postId)
          .eq('language_code', languageCode)
          .maybeSingle()

        if (existingTranslation && !regenerate) {
          console.log(`Translation to ${languageCode} already exists, skipping...`)
          translationResults.push({
            language: languageCode,
            success: true,
            status: 'exists',
            translationId: existingTranslation.id
          })
          continue
        }

        // Process translation
        const result = await processUltraSimpleTranslation(originalPost, languageCode, existingTranslation?.id)
        
        translationResults.push({
          language: languageCode,
          success: true,
          translationId: result.translationId,
          status: 'completed'
        })

        console.log(`✅ Translation to ${languageCode} completed successfully`)

      } catch (error) {
        console.error(`❌ Error in translation to ${languageCode}:`, error)
        console.error('Full error details:', {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        })
        translationResults.push({
          language: languageCode,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
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

// Ultra simple translation processing - just store translated content in post_translations
async function processUltraSimpleTranslation(originalPost: any, languageCode: string, existingTranslationId?: string) {
  console.log(`🔄 Starting ultra simple translation processing for ${languageCode}`)
  
  try {
    // Step 1: Translate the main content
    console.log(`📝 Translating content to ${languageCode}...`)
    
    const translatedTitle = await translateTextSimple(originalPost.title, languageCode)
    const translatedExcerpt = await translateTextSimple(originalPost.excerpt || '', languageCode)
    const translatedContent = await translateContentInChunks(originalPost.content || '', languageCode)
    
    // Step 2: Keep original slug (user can edit later)
    const translatedSlug = originalPost.slug
    
    // Step 3: Create or update translation record
    const translationData = {
      original_post_id: originalPost.id,
      language_code: languageCode,
      translated_title: translatedTitle,
      translated_excerpt: translatedExcerpt,
      translated_content: translatedContent,
      translated_slug: translatedSlug,
      translation_status: 'completed',
      seo_data: {
        seo_title: translatedTitle,
        seo_description: translatedExcerpt,
        meta_title: translatedTitle,
        meta_description: translatedExcerpt
      }
    }
    
    let translationId = existingTranslationId
    
    if (existingTranslationId) {
      // Update existing translation
      const { data: updatedTranslation, error: updateError } = await supabaseAdmin
        .from('post_translations')
        .update(translationData)
        .eq('id', existingTranslationId)
        .select('id')
        .single()
      
      if (updateError) throw updateError
      translationId = updatedTranslation.id
    } else {
      // Create new translation
      const { data: newTranslation, error: insertError } = await supabaseAdmin
        .from('post_translations')
        .insert(translationData)
        .select('id')
        .single()
      
      if (insertError) throw insertError
      translationId = newTranslation.id
    }

    console.log(`🎉 Ultra simple translation completed successfully for ${languageCode}`)

    return {
      translationId
    }

  } catch (error) {
    console.error(`❌ Ultra simple translation failed for ${languageCode}:`, error)
    throw error
  }
}

// Translate content in small chunks
async function translateContentInChunks(content: string, languageCode: string): Promise<string> {
  if (!content) return ''
  
  console.log(`🔪 Translating content in chunks for ${languageCode}...`)
  
  // Split content into smaller chunks (by sentences or paragraphs)
  const chunks = content.split(/(?<=\.)\s+/).filter(chunk => chunk.trim())
  const translatedChunks = []
  
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i].trim()
    if (chunk && chunk.length > 5) { // Skip very short chunks
      console.log(`📝 Translating chunk ${i + 1}/${chunks.length} (${chunk.length} chars)...`)
      
      try {
        const translatedChunk = await translateTextSimple(chunk, languageCode)
        translatedChunks.push(translatedChunk)
        
        // Small delay to avoid overwhelming the API
        await new Promise(resolve => setTimeout(resolve, 500))
      } catch (error) {
        console.error(`Error translating chunk ${i + 1}:`, error)
        translatedChunks.push(chunk) // Keep original if translation fails
      }
    } else {
      translatedChunks.push(chunk) // Keep very short chunks as-is
    }
  }
  
  return translatedChunks.join(' ')
}

// Simple text translation function with retry and response cleaning
async function translateTextSimple(text: string, languageCode: string): Promise<string> {
  if (!text || text.length < 3) return text
  
  const mistralApiKey = process.env.MISTRAL_API_KEY
  if (!mistralApiKey) {
    console.error('MISTRAL_API_KEY not configured')
    return text
  }
  
  const targetLanguage = languageMap[languageCode as keyof typeof languageMap]
  
  const prompt = `Translate this text to ${targetLanguage}. Keep all HTML tags and formatting exactly as they are. Preserve bold, italic, links, and all other HTML formatting. Only translate the text content, not the HTML tags or attributes.

IMPORTANT: Respond with ONLY the translated text. Do not include markdown code blocks, HTML wrapper tags, or any other formatting around your response.

Text to translate:
${text}`
  
  const maxRetries = 2
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`📡 Mistral API call attempt ${attempt}/${maxRetries} for ${languageCode}...`)
      
      const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${mistralApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'mistral-large-latest',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.2,
          max_tokens: Math.min(2000, Math.max(500, text.length * 2))
        })
      })

      if (!response.ok) {
        throw new Error(`Mistral API error: ${response.status} ${response.statusText}`)
      }

      const result = await response.json()
      let translatedText = result.choices[0]?.message?.content?.trim()

      if (!translatedText) {
        throw new Error('No translation received from Mistral API')
      }

      // Clean the response from common Mistral formatting artifacts
      translatedText = cleanMistralResponse(translatedText)

      console.log(`✅ Translation successful for ${languageCode} (${translatedText.length} chars)`)
      console.log(`📝 Clean translation preview: "${translatedText.substring(0, 100)}..."`)
      
      return translatedText
      
    } catch (error) {
      console.error(`❌ Translation attempt ${attempt} failed:`, error)
      
      if (attempt === maxRetries) {
        console.error(`All translation attempts failed for text: "${text.substring(0, 100)}..."`)
        return text // Return original text if all attempts fail
      }
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
    }
  }
  
  return text // Fallback
}

// Clean Mistral API response from common formatting artifacts
function cleanMistralResponse(text: string): string {
  // Remove markdown code blocks
  text = text.replace(/^```[a-zA-Z]*\n?/, '').replace(/\n?```$/, '')
  text = text.replace(/^```html\n?/g, '').replace(/\n?```$/g, '')
  
  // Remove any HTML document wrapper tags that might be added
  text = text.replace(/^<html[^>]*>/i, '').replace(/<\/html>$/i, '')
  text = text.replace(/^<body[^>]*>/i, '').replace(/<\/body>$/i, '')
  text = text.replace(/^<div[^>]*>/i, '').replace(/<\/div>$/i, '')
  
  // Remove leading/trailing whitespace and newlines
  text = text.trim()
  
  // Remove any stray backticks at start/end
  text = text.replace(/^`+/, '').replace(/`+$/, '')
  
  return text
}