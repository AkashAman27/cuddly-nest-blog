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
  console.log('=== NEW SIMPLIFIED TRANSLATION API CALLED ===')
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

    // Get the original post with all data
    console.log('Fetching original post with ID:', postId)
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
    
    console.log('Original post found:', { 
      id: originalPost.id, 
      title: originalPost.title,
      sectionsCount: originalPost.sections?.length || 0,
      contentLength: originalPost.content?.length || 0
    })

    const translationResults = []

    // Process languages one by one (sequential, not parallel)
    for (const languageCode of validLanguages) {
      try {
        console.log(`\n🌍 Starting translation for ${languageCode}...`)

        // Check if translation already exists
        const { data: existingTranslation } = await supabaseAdmin
          .from('cuddly_nest_modern_post')
          .select('id, title')
          .eq('original_post_id', postId)
          .eq('language_code', languageCode)
          .maybeSingle()

        if (existingTranslation && !regenerate) {
          console.log(`Translation to ${languageCode} already exists, skipping...`)
          translationResults.push({
            language: languageCode,
            success: true,
            status: 'exists',
            postId: existingTranslation.id
          })
          continue
        }

        // Process translation
        const result = await processSimplifiedTranslation(originalPost, languageCode, existingTranslation?.id)
        
        translationResults.push({
          language: languageCode,
          success: true,
          postId: result.translatedPostId,
          status: 'completed'
        })

        console.log(`✅ Translation to ${languageCode} completed successfully`)

      } catch (error) {
        console.error(`❌ Error in translation to ${languageCode}:`, error)
        console.error('Full error details:', {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
          cause: error instanceof Error ? error.cause : undefined
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

// Simplified translation processing
async function processSimplifiedTranslation(originalPost: any, languageCode: string, existingPostId?: string) {
  console.log(`🔄 Starting simplified translation processing for ${languageCode}`)
  
  try {
    // Step 1: Translate main content in chunks
    console.log(`📝 Translating main content to ${languageCode}...`)
    
    const translatedContent = await translateContentInChunks(
      originalPost.content || '', 
      languageCode
    )
    
    const translatedTitle = await translateText(originalPost.title, languageCode)
    const translatedExcerpt = await translateText(originalPost.excerpt || '', languageCode)
    
    // Step 2: Keep original slug structure (user can edit later in CMS)
    const translatedSlug = originalPost.slug // Keep the same slug
    
    // Step 3: Create or update the translated post (duplicate entire post)
    let translatedPostId = existingPostId
    
    const postData = {
      // Copy all original fields
      title: translatedTitle,
      slug: translatedSlug,
      excerpt: translatedExcerpt,
      content: translatedContent,
      language_code: languageCode,
      original_post_id: originalPost.id,
      
      // Copy metadata and settings
      status: originalPost.status,
      featured_image_url: originalPost.featured_image_url,
      og_image: originalPost.og_image,
      og_title: translatedTitle,
      og_description: translatedExcerpt,
      meta_title: translatedTitle,
      meta_description: translatedExcerpt,
      seo_title: translatedTitle,
      seo_description: translatedExcerpt,
      
      // Copy other fields
      author_id: originalPost.author_id,
      category_id: originalPost.category_id,
      tags: originalPost.tags,
      
      // Timestamps
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      published_at: originalPost.status === 'published' ? new Date().toISOString() : null
    }
    
    if (existingPostId) {
      // Update existing translation
      const { data: updatedPost, error: updateError } = await supabaseAdmin
        .from('cuddly_nest_modern_post')
        .update(postData)
        .eq('id', existingPostId)
        .select('id')
        .single()
      
      if (updateError) throw updateError
      translatedPostId = updatedPost.id
    } else {
      // Create new translated post
      const { data: newPost, error: insertError } = await supabaseAdmin
        .from('cuddly_nest_modern_post')
        .insert(postData)
        .select('id')
        .single()
      
      if (insertError) throw insertError
      translatedPostId = newPost.id
    }
    
    // Note: Section-based copying not needed in current schema
    console.log(`✅ Main post translation completed`)

    console.log(`🎉 Simplified translation completed successfully for ${languageCode}`)

    return {
      translatedPostId
    }

  } catch (error) {
    console.error(`❌ Simplified translation failed for ${languageCode}:`, error)
    throw error
  }
}

// Translate content in chunks to avoid timeouts
async function translateContentInChunks(content: string, languageCode: string): Promise<string> {
  if (!content) return ''
  
  console.log(`🔪 Translating content in chunks for ${languageCode}...`)
  
  // Split content into paragraphs (preserving HTML structure)
  const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim())
  const translatedParagraphs = []
  
  for (let i = 0; i < paragraphs.length; i++) {
    const paragraph = paragraphs[i].trim()
    if (paragraph) {
      console.log(`📝 Translating chunk ${i + 1}/${paragraphs.length}...`)
      const translatedParagraph = await translateText(paragraph, languageCode)
      translatedParagraphs.push(translatedParagraph)
    }
  }
  
  return translatedParagraphs.join('\n\n')
}

// Simple text translation function with response cleaning
async function translateText(text: string, languageCode: string): Promise<string> {
  if (!text || text.length < 3) return text
  
  const mistralApiKey = process.env.MISTRAL_API_KEY
  if (!mistralApiKey) throw new Error('MISTRAL_API_KEY not configured')
  
  const targetLanguage = languageMap[languageCode as keyof typeof languageMap]
  
  const prompt = `Translate this text to ${targetLanguage}. Keep all HTML tags and formatting exactly as they are. Preserve links, bold, italic, and all other formatting. Only translate the text content, not the HTML tags or attributes.

IMPORTANT: Respond with ONLY the translated text. Do not include markdown code blocks, HTML wrapper tags, or any other formatting around your response.

Text to translate:
${text}`
  
  try {
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
        max_tokens: Math.min(4000, text.length * 2) // Dynamic token limit
      })
    })

    if (!response.ok) {
      console.error('Mistral API error:', response.statusText)
      throw new Error(`Mistral API error: ${response.statusText}`)
    }

    const result = await response.json()
    let translatedText = result.choices[0]?.message?.content?.trim()

    if (!translatedText) {
      throw new Error('No translation received from Mistral API')
    }

    // Clean the response from common Mistral formatting artifacts
    translatedText = cleanMistralResponse(translatedText)

    return translatedText
    
  } catch (error) {
    console.error('Error translating text:', error)
    // Return original text if translation fails (graceful degradation)
    return text
  }
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

// Simple section data translation
async function translateSectionDataSimple(sectionData: any, languageCode: string): Promise<any> {
  if (!sectionData) return sectionData
  
  try {
    // Convert to string, translate, then parse back
    const dataString = JSON.stringify(sectionData)
    
    // Extract text content using regex (simple approach)
    const textRegex = /"([^"]*[a-zA-Z]{3,}[^"]*)"/g
    const matches = dataString.match(textRegex)
    
    if (!matches || matches.length === 0) return sectionData
    
    let translatedDataString = dataString
    
    // Translate each text match
    for (const match of matches) {
      const originalText = match.slice(1, -1) // Remove quotes
      
      // Skip if it's not translatable text (URLs, short strings, etc.)
      if (originalText.length < 3 || 
          originalText.startsWith('http') || 
          originalText.match(/^[^a-zA-Z]*$/)) {
        continue
      }
      
      let translatedText = await translateText(originalText, languageCode)
      // Additional cleaning for section data
      translatedText = cleanMistralResponse(translatedText)
      translatedDataString = translatedDataString.replace(match, `"${translatedText}"`)
    }
    
    return JSON.parse(translatedDataString)
    
  } catch (error) {
    console.error('Error translating section data:', error)
    return sectionData // Return original if translation fails
  }
}