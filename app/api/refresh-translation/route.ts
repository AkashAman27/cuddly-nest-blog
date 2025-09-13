import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const slug = searchParams.get('slug')
    const lang = searchParams.get('lang')

    if (!slug || !lang) {
      return NextResponse.json({ error: 'Missing slug or lang parameter' }, { status: 400 })
    }

    // Get original post
    const { data: originalPost, error: originalError } = await supabase
      .from('cuddly_nest_modern_post')
      .select('id, title, slug')
      .eq('slug', slug)
      .single()

    if (originalError || !originalPost) {
      return NextResponse.json({ error: 'Original post not found' }, { status: 404 })
    }

    // Get existing translation
    const { data: translation, error: translationError } = await supabase
      .from('post_translations')
      .select('id')
      .eq('original_post_id', originalPost.id)
      .eq('language_code', lang)
      .single()

    if (translation) {
      // Delete existing translated sections
      const { error: deleteSectionsError } = await supabase
        .from('translated_sections')
        .delete()
        .eq('translation_id', translation.id)

      if (deleteSectionsError) {
        console.error('Error deleting translated sections:', deleteSectionsError)
      }

      // Delete the translation
      const { error: deleteTranslationError } = await supabase
        .from('post_translations')
        .delete()
        .eq('id', translation.id)

      if (deleteTranslationError) {
        console.error('Error deleting translation:', deleteTranslationError)
      }
    }

    // Now create fresh translation
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/translate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        postId: originalPost.id,
        targetLanguage: lang,
        forceCompleteTranslation: true
      })
    })

    const result = await response.json()

    return NextResponse.json({ 
      success: true, 
      message: 'Translation refreshed successfully',
      translationResult: result
    })

  } catch (error) {
    console.error('Refresh translation error:', error)
    return NextResponse.json({ 
      error: 'Failed to refresh translation', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}