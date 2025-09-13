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
  console.log('=== BACKGROUND TRANSLATION API CALLED ===')
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

    // Start background processing (no waiting)
    processTranslationsInBackground(postId, validLanguages, regenerate)

    // Return immediately
    return NextResponse.json({
      success: true,
      message: `Started background translation for ${validLanguages.length} languages`,
      languages: validLanguages,
      status: 'processing'
    })

  } catch (error) {
    console.error('Background translation API error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to start translation',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Process translations in background without blocking HTTP response
async function processTranslationsInBackground(postId: string, validLanguages: string[], regenerate?: boolean) {
  try {
    console.log('🚀 Starting background translation processing...')

    // Get the original post with sections
    const { data: originalPost, error: postError } = await supabaseAdmin
      .from('cuddly_nest_modern_post')
      .select(`
        *,
        sections:modern_post_sections(
          id, template_id, title, data, position, is_active
        )
      `)
      .eq('id', postId)
      .single()

    if (postError || !originalPost) {
      console.error('Post not found:', postError)
      return
    }
    
    console.log('Original post found:', { 
      title: originalPost.title,
      sectionsCount: originalPost.sections?.length || 0,
      hasContent: !!originalPost.content
    })

    // Process each language sequentially
    for (const languageCode of validLanguages) {
      try {
        console.log(`\n🌍 Starting background translation for ${languageCode}...`)

        // Check if translation already exists
        const { data: existingTranslation } = await supabaseAdmin
          .from('post_translations')
          .select('id')
          .eq('original_post_id', postId)
          .eq('language_code', languageCode)
          .maybeSingle()

        if (existingTranslation && !regenerate) {
          console.log(`Translation exists, skipping ${languageCode}`)
          continue
        }

        // Translate the post
        await translatePostContentBackground(originalPost, languageCode, existingTranslation?.id)
        
        console.log(`✅ Background translation completed for ${languageCode}`)

      } catch (error) {
        console.error(`❌ Background translation failed for ${languageCode}:`, error)
      }
    }

    console.log('🎉 All background translations completed!')

  } catch (error) {
    console.error('Background processing error:', error)
  }
}

async function translatePostContentBackground(originalPost: any, languageCode: string, existingTranslationId?: string) {
  console.log(`🔄 Background translating content for ${languageCode}`)
  
  // Extract content from sections for template posts
  let contentToTranslate = originalPost.content || ''
  
  if (originalPost.template_enabled && originalPost.sections) {
    const contentSection = originalPost.sections.find(s => 
      s.template_id === 'e30d9e40-eb3a-41d3-aeac-413cfca52fe0' || 
      s.data?.content
    )
    
    if (contentSection?.data?.content) {
      contentToTranslate = contentSection.data.content
      console.log(`📄 Found main content section: ${contentToTranslate.length} chars`)
    }
  }
  
  if (!contentToTranslate) {
    console.log('⚠️ No content found to translate, using title and excerpt only')
    contentToTranslate = `${originalPost.title}\n\n${originalPost.excerpt || ''}`
  }
  
  // Translate key fields first
  console.log(`📝 Translating title and excerpt for ${languageCode}...`)
  const translatedTitle = await translateTextBackground(originalPost.title, languageCode)
  const translatedExcerpt = await translateTextBackground(originalPost.excerpt || '', languageCode)
  
  // Translate content in optimized chunks with no delays (background processing)
  const translatedContent = await translateContentBackgroundOptimized(contentToTranslate, languageCode)
  
  // Create/update translation record
  const translationData = {
    original_post_id: originalPost.id,
    language_code: languageCode,
    translated_title: translatedTitle,
    translated_excerpt: translatedExcerpt,
    translated_content: translatedContent,
    translated_slug: originalPost.slug,
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
    const { data, error } = await supabaseAdmin
      .from('post_translations')
      .update(translationData)
      .eq('id', existingTranslationId)
      .select('id')
      .single()
    
    if (error) throw error
    translationId = data.id
  } else {
    const { data, error } = await supabaseAdmin
      .from('post_translations')
      .insert(translationData)
      .select('id')
      .single()
    
    if (error) throw error
    translationId = data.id
  }

  console.log(`✅ Background translation stored for ${languageCode}: ${translationId}`)
}

async function translateContentBackgroundOptimized(content: string, languageCode: string): Promise<string> {
  if (!content) return ''
  
  console.log(`🔪 Background chunking content: ${content.length} chars`)
  
  // Smart chunking
  let chunks: string[] = []
  
  if (content.includes('<h2') || content.includes('<h3')) {
    chunks = content.split(/(?=<h[23][^>]*>)/).filter(chunk => chunk.trim())
  } else if (content.includes('<p>')) {
    chunks = content.split(/(?=<p>)/).filter(chunk => chunk.trim() && chunk.length > 100)
  } else {
    chunks = content.split(/\n\s*\n/).filter(chunk => chunk.trim())
  }
  
  // Force split if still too big
  if (chunks.length === 1 && chunks[0].length > 3000) {
    const bigChunk = chunks[0]
    chunks = []
    
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
  
  console.log(`📊 Background processing ${totalChunks} chunks for ${languageCode}`)
  
  // Process all chunks with minimal delays (background can take time)
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i].trim()
    if (chunk) {
      console.log(`📝 Background translating chunk ${i + 1}/${chunks.length} (${chunk.length} chars)`)
      
      const translatedChunk = await translateTextBackground(chunk, languageCode)
      translatedChunks.push(translatedChunk)
      
      // Minimal delay to respect API limits (background processing)
      if (i < chunks.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 200))
      }
    }
  }
  
  console.log(`✅ All ${chunks.length} background chunks translated for ${languageCode}`)
  
  return translatedChunks.join('\n\n')
}

async function translateTextBackground(text: string, languageCode: string): Promise<string> {
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
    translatedText = cleanMistralResponseBackground(translatedText)
    
    return translatedText
    
  } catch (error) {
    console.error('Background translation error:', error)
    return text // Fallback to original
  }
}

function cleanMistralResponseBackground(text: string): string {
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