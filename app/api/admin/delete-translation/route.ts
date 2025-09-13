import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { createSecureRoute, middlewarePresets } from '@/lib/security/middleware'

interface DeleteTranslationRequest {
  translationId?: string
  postId?: string
  languageCode?: string
  deleteAll?: boolean
}

export const DELETE = createSecureRoute(async ({ body }) => {
  const { translationId, postId, languageCode, deleteAll }: DeleteTranslationRequest = body

    // Validate request parameters
    if (!translationId && !postId && !deleteAll) {
      return NextResponse.json(
        { error: 'Either translationId, postId, or deleteAll flag is required' },
        { status: 400 }
      )
    }

    let deletedTranslations: any[] = []

    if (deleteAll) {
      // Delete ALL translations from the system
      console.log('🗑️  Deleting ALL translations from the system...')
      
      // First get all translation IDs for logging
      const { data: allTranslations, error: fetchError } = await supabaseAdmin
        .from('post_translations')
        .select('id, translated_title, language_code')
      
      if (fetchError) {
        console.error('Error fetching translations for deletion:', fetchError)
        throw fetchError
      }

      // Delete all translated sections first (foreign key constraint)
      console.log('🗑️  Deleting all translated sections...')
      const { error: sectionsError } = await supabaseAdmin
        .from('translated_sections')
        .delete()
        .neq('id', 'never-match') // Delete all rows
      
      if (sectionsError) {
        console.error('Error deleting translated sections:', sectionsError)
        throw sectionsError
      }

      // Delete all post translations
      console.log('🗑️  Deleting all post translations...')
      const { error: translationsError } = await supabaseAdmin
        .from('post_translations')
        .delete()
        .neq('id', 'never-match') // Delete all rows
      
      if (translationsError) {
        console.error('Error deleting post translations:', translationsError)
        throw translationsError
      }

      deletedTranslations = allTranslations || []
      console.log(`✅ Successfully deleted ${deletedTranslations.length} translations`)

    } else if (translationId) {
      // Delete specific translation by ID
      console.log(`🗑️  Deleting translation with ID: ${translationId}`)
      
      // Get translation details before deletion
      const { data: translationToDelete, error: fetchError } = await supabaseAdmin
        .from('post_translations')
        .select('id, translated_title, language_code, original_post_id')
        .eq('id', translationId)
        .single()
      
      if (fetchError) {
        console.error('Error fetching translation for deletion:', fetchError)
        throw fetchError
      }

      // Delete associated translated sections first
      console.log('🗑️  Deleting associated translated sections...')
      const { error: sectionsError } = await supabaseAdmin
        .from('translated_sections')
        .delete()
        .eq('translation_id', translationId)
      
      if (sectionsError) {
        console.error('Error deleting translated sections:', sectionsError)
        throw sectionsError
      }

      // Delete the translation
      const { error: deleteError } = await supabaseAdmin
        .from('post_translations')
        .delete()
        .eq('id', translationId)
      
      if (deleteError) {
        console.error('Error deleting translation:', deleteError)
        throw deleteError
      }

      deletedTranslations = [translationToDelete]
      console.log(`✅ Successfully deleted translation: ${translationToDelete.translated_title} (${translationToDelete.language_code})`)

    } else if (postId && languageCode) {
      // Delete specific translation by post ID and language
      console.log(`🗑️  Deleting translation for post ${postId} in language ${languageCode}`)
      
      // Get translation details before deletion
      const { data: translationToDelete, error: fetchError } = await supabaseAdmin
        .from('post_translations')
        .select('id, translated_title, language_code')
        .eq('original_post_id', postId)
        .eq('language_code', languageCode)
        .single()
      
      if (fetchError) {
        console.error('Translation not found:', fetchError)
        return NextResponse.json(
          { error: 'Translation not found' },
          { status: 404 }
        )
      }

      // Delete associated translated sections first
      console.log('🗑️  Deleting associated translated sections...')
      const { error: sectionsError } = await supabaseAdmin
        .from('translated_sections')
        .delete()
        .eq('translation_id', translationToDelete.id)
      
      if (sectionsError) {
        console.error('Error deleting translated sections:', sectionsError)
        throw sectionsError
      }

      // Delete the translation
      const { error: deleteError } = await supabaseAdmin
        .from('post_translations')
        .delete()
        .eq('id', translationToDelete.id)
      
      if (deleteError) {
        console.error('Error deleting translation:', deleteError)
        throw deleteError
      }

      deletedTranslations = [translationToDelete]
      console.log(`✅ Successfully deleted translation: ${translationToDelete.translated_title} (${languageCode})`)

    } else if (postId) {
      // Delete all translations for a specific post
      console.log(`🗑️  Deleting all translations for post: ${postId}`)
      
      // Get all translations for this post
      const { data: translationsToDelete, error: fetchError } = await supabaseAdmin
        .from('post_translations')
        .select('id, translated_title, language_code')
        .eq('original_post_id', postId)
      
      if (fetchError) {
        console.error('Error fetching translations for deletion:', fetchError)
        throw fetchError
      }

      if (!translationsToDelete || translationsToDelete.length === 0) {
        return NextResponse.json(
          { message: 'No translations found for this post', deletedCount: 0 },
          { status: 200 }
        )
      }

      // Delete all associated translated sections first
      console.log('🗑️  Deleting all associated translated sections...')
      for (const translation of translationsToDelete) {
        const { error: sectionsError } = await supabaseAdmin
          .from('translated_sections')
          .delete()
          .eq('translation_id', translation.id)
        
        if (sectionsError) {
          console.error(`Error deleting sections for translation ${translation.id}:`, sectionsError)
          throw sectionsError
        }
      }

      // Delete all translations for this post
      const { error: deleteError } = await supabaseAdmin
        .from('post_translations')
        .delete()
        .eq('original_post_id', postId)
      
      if (deleteError) {
        console.error('Error deleting translations:', deleteError)
        throw deleteError
      }

      deletedTranslations = translationsToDelete
      console.log(`✅ Successfully deleted ${deletedTranslations.length} translations for post ${postId}`)
    }

    return NextResponse.json({
      success: true,
      message: `Successfully deleted ${deletedTranslations.length} translation(s)`,
      deletedTranslations: deletedTranslations.map(t => ({
        id: t.id,
        title: t.translated_title,
        language: t.language_code
      })),
      deletedCount: deletedTranslations.length
    })
}, {
  ...middlewarePresets.translation,
  validation: {
    body: {
      translationId: { field: 'translationId', type: 'string', optional: true },
      postId: { field: 'postId', type: 'string', optional: true },
      languageCode: { field: 'languageCode', type: 'string', optional: true },
      deleteAll: { field: 'deleteAll', type: 'boolean', optional: true }
    }
  }
})

// Also support GET requests for checking what would be deleted
export const GET = createSecureRoute(async ({ query }) => {
  const { translationId, postId, languageCode, previewAll } = query

    let translationsToPreview: any[] = []

    if (previewAll === 'true') {
      // Preview all translations
      const { data: allTranslations, error } = await supabaseAdmin
        .from('post_translations')
        .select(`
          id, 
          translated_title, 
          language_code, 
          translation_status,
          created_at,
          original_post:modern_posts(title, slug)
        `)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      translationsToPreview = allTranslations || []

    } else if (translationId) {
      // Preview specific translation
      const { data: translation, error } = await supabaseAdmin
        .from('post_translations')
        .select(`
          id, 
          translated_title, 
          language_code, 
          translation_status,
          created_at,
          original_post:modern_posts(title, slug)
        `)
        .eq('id', translationId)
        .single()
      
      if (error) throw error
      translationsToPreview = translation ? [translation] : []

    } else if (postId) {
      // Preview translations for specific post
      const { data: translations, error } = await supabaseAdmin
        .from('post_translations')
        .select(`
          id, 
          translated_title, 
          language_code, 
          translation_status,
          created_at,
          original_post:modern_posts(title, slug)
        `)
        .eq('original_post_id', postId)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      translationsToPreview = translations || []
      
      // Filter by language if specified
      if (languageCode) {
        translationsToPreview = translationsToPreview.filter(t => t.language_code === languageCode)
      }
    }

    return NextResponse.json({
      success: true,
      translationsToDelete: translationsToPreview,
      count: translationsToPreview.length
    })
}, {
  ...middlewarePresets.translation,
  validation: {
    query: {
      translationId: { field: 'translationId', type: 'string', optional: true },
      postId: { field: 'postId', type: 'string', optional: true },
      languageCode: { field: 'languageCode', type: 'string', optional: true },
      previewAll: { field: 'previewAll', type: 'string', optional: true }
    }
  }
})