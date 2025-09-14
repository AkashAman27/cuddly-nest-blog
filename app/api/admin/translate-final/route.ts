import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// Language mappings
const languageMap = {
  'fr': 'French',
  'it': 'Italian', 
  'de': 'German',
  'es': 'Spanish'
}

export async function POST(request: NextRequest) {
  console.log('=== FINAL TRANSLATION API CALLED ===')
  try {
    const { postId, languages, regenerate } = await request.json()
    console.log('Request:', { postId, languages, regenerate })

    if (!postId || !languages || languages.length === 0) {
      return NextResponse.json(
        { error: 'Post ID and languages are required' },
        { status: 400 }
      )
    }

    // Validate languages
    const validLanguages = languages.filter(lang => lang in languageMap)
    if (validLanguages.length === 0) {
      return NextResponse.json(
        { error: 'No valid languages provided' },
        { status: 400 }
      )
    }

    // Get the original post (sections table doesn't exist in current schema)
    const { data: originalPost, error: postError } = await supabaseAdmin
      .from('cuddly_nest_modern_post')
      .select('*')
      .eq('id', postId)
      .single()

    if (postError || !originalPost) {
      console.error('Post not found:', postError)
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      )
    }
    
    console.log('Original post found:', { 
      title: originalPost.title,
      hasContent: !!originalPost.content,
      contentLength: originalPost.content?.length || 0
    })

    const translationResults = []

    // Process languages sequentially
    for (const languageCode of validLanguages) {
      try {
        console.log(`\n🌍 Starting translation for ${languageCode}...`)

        // Check if translation already exists
        const { data: existingTranslation } = await supabaseAdmin
          .from('post_translations')
          .select('id')
          .eq('original_post_id', postId)
          .eq('language_code', languageCode)
          .maybeSingle()

        if (existingTranslation && !regenerate) {
          console.log(`Translation exists, skipping ${languageCode}`)
          translationResults.push({
            language: languageCode,
            success: true,
            status: 'exists',
            translationId: existingTranslation.id
          })
          continue
        }

        // Translate the post
        const result = await translatePostContent(originalPost, languageCode, existingTranslation?.id)
        
        if (result.error) {
          throw new Error(result.error)
        }
        
        translationResults.push({
          language: languageCode,
          success: true,
          translationId: result.translationId,
          status: 'completed',
          chunksProcessed: result.chunksProcessed,
          totalChunks: result.totalChunks
        })

        console.log(`✅ ${languageCode} translation completed (${result.chunksProcessed}/${result.totalChunks} chunks)`)

      } catch (error) {
        console.error(`❌ ${languageCode} translation failed:`, error)
        translationResults.push({
          language: languageCode,
          success: false,
          error: error instanceof Error ? error.message : 'Translation failed'
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

async function translatePostContent(originalPost: any, languageCode: string, existingTranslationId?: string) {
  console.log(`🔄 Translating content for ${languageCode}`)
  
  // Use the main content field directly (no sections in current schema)
  let contentToTranslate = originalPost.content || ''
  
  if (!contentToTranslate) {
    console.log('⚠️ No content found to translate, using title and excerpt only')
    contentToTranslate = `${originalPost.title}\n\n${originalPost.excerpt || ''}`
  }
  
  console.log(`📄 Content to translate: ${contentToTranslate.length} chars`)
  
  try {
    // Translate key fields
    const translatedTitle = await translateText(originalPost.title, languageCode)
    const translatedExcerpt = await translateText(originalPost.excerpt || '', languageCode)
    const contentResult = await translateContentChunked(contentToTranslate, languageCode)
    
    // Check if content translation was complete
    if (contentResult.error) {
      return { error: contentResult.error }
    }
    
    // Create/update translation record
    const translationData = {
      original_post_id: originalPost.id,
      language_code: languageCode,
      translated_title: translatedTitle,
      translated_excerpt: translatedExcerpt,
      translated_content: contentResult.translatedContent,
      translated_slug: originalPost.slug, // Keep original slug
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
      // Update existing
      const { data, error } = await supabaseAdmin
        .from('post_translations')
        .update(translationData)
        .eq('id', existingTranslationId)
        .select('id')
        .single()
      
      if (error) throw error
      translationId = data.id
    } else {
      // Create new
      const { data, error } = await supabaseAdmin
        .from('post_translations')
        .insert(translationData)
        .select('id')
        .single()
      
      if (error) throw error
      translationId = data.id
    }

    return { 
      translationId,
      chunksProcessed: contentResult.chunksProcessed,
      totalChunks: contentResult.totalChunks
    }
  } catch (error) {
    return { 
      error: `Translation failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
    }
  }
}

async function translateContentChunked(content: string, languageCode: string): Promise<{translatedContent: string, chunksProcessed: number, totalChunks: number, error?: string}> {
  if (!content) return { translatedContent: '', chunksProcessed: 0, totalChunks: 0 }
  
  console.log(`🔪 Chunking content: ${content.length} chars`)
  
  // Split into smaller chunks with better HTML-aware strategy
  let chunks: string[] = []
  
  if (content.includes('<h2') || content.includes('<h3')) {
    // Split by headings (better for structured content)
    chunks = content.split(/(?=<h[23][^>]*>)/).filter(chunk => chunk.trim())
  } else if (content.includes('<p>')) {
    // Split by paragraphs for HTML content
    chunks = content.split(/(?=<p>)/).filter(chunk => chunk.trim() && chunk.length > 100)
  } else {
    // Fallback: Split by double newlines
    chunks = content.split(/\n\s*\n/).filter(chunk => chunk.trim())
  }
  
  // If still one big chunk, force split by character count
  if (chunks.length === 1 && chunks[0].length > 3000) {
    const bigChunk = chunks[0]
    chunks = []
    
    // Split by sentences, then group into ~2000 char chunks
    const sentences = bigChunk.split(/\.(?=\s+[A-Z<])/).filter(s => s.trim())
    let currentChunk = ''
    
    for (const sentence of sentences) {
      if (currentChunk.length + sentence.length > 2000 && currentChunk.length > 0) {
        chunks.push(currentChunk.trim() + '.')
        currentChunk = sentence
      } else {
        currentChunk += sentence + '.'
      }
    }
    
    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim())
    }
  }
  
  const translatedChunks = []
  const totalChunks = chunks.length
  
  console.log(`📊 Total chunks to process: ${totalChunks}`)
  
  for (let i = 0; i < chunks.length; i++) { // Process all chunks
    const chunk = chunks[i].trim()
    if (chunk) {
      console.log(`📝 Translating chunk ${i + 1}/${chunks.length} (${chunk.length} chars)`)
      
      try {
        const translatedChunk = await translateText(chunk, languageCode)
        translatedChunks.push(translatedChunk)
        
        // Shorter delay to avoid timeouts while respecting API limits
        if (i < chunks.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500))
        }
      } catch (error) {
        console.error(`❌ Failed to translate chunk ${i + 1}:`, error)
        return { 
          translatedContent: translatedChunks.join('\n\n'),
          chunksProcessed: i,
          totalChunks,
          error: `Translation failed at chunk ${i + 1}/${totalChunks}: ${error instanceof Error ? error.message : 'Unknown error'}`
        }
      }
    }
  }
  
  console.log(`✅ All ${chunks.length} chunks translated successfully`)
  
  return { 
    translatedContent: translatedChunks.join('\n\n'),
    chunksProcessed: chunks.length,
    totalChunks: chunks.length
  }
}

async function translateText(text: string, languageCode: string): Promise<string> {
  if (!text || text.length < 3) return text
  
  const mistralApiKey = process.env.MISTRAL_API_KEY
  if (!mistralApiKey) {
    console.error('MISTRAL_API_KEY not configured')
    return text
  }
  
  const targetLanguage = languageMap[languageCode as keyof typeof languageMap]
  
  const prompt = `Translate this text to ${targetLanguage}. Keep all HTML tags and formatting exactly as they are.

IMPORTANT: Respond with ONLY the translated text. Do not include markdown code blocks, HTML wrapper tags, or any other formatting around your response.

Text to translate:
${text}`
  
  try {
    console.log(`📡 Mistral API call for ${languageCode}`)
    
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
      throw new Error(`Mistral API error: ${response.status}`)
    }

    const result = await response.json()
    let translatedText = result.choices[0]?.message?.content?.trim()

    if (!translatedText) {
      throw new Error('No translation received')
    }

    // Clean the response
    translatedText = cleanMistralResponse(translatedText)
    
    console.log(`✅ Translated: "${translatedText.substring(0, 60)}..."`)
    return translatedText
    
  } catch (error) {
    console.error('Translation error:', error)
    return text // Fallback to original
  }
}

function cleanMistralResponse(text: string): string {
  // Remove markdown code blocks
  text = text.replace(/^```[a-zA-Z]*\n?/, '').replace(/\n?```$/, '')
  text = text.replace(/^```html\n?/g, '').replace(/\n?```$/g, '')
  
  // Remove wrapper tags
  text = text.replace(/^<html[^>]*>/i, '').replace(/<\/html>$/i, '')
  text = text.replace(/^<body[^>]*>/i, '').replace(/<\/body>$/i, '')
  
  // Clean whitespace and stray backticks
  text = text.trim()
  text = text.replace(/^`+/, '').replace(/`+$/, '')
  
  return text
}