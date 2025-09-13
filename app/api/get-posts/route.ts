import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    // Get all posts with basic info
    const { data: posts, error } = await supabase
      .from('cuddly_nest_modern_post')
      .select(`
        id,
        title,
        slug,
        excerpt,
        created_at,
        updated_at
      `)
      .order('updated_at', { ascending: false })
      .limit(20)

    if (error) throw error

    // For each post, check if it has translations
    const postsWithTranslations = await Promise.all(
      (posts || []).map(async (post) => {
        const { data: translations } = await supabase
          .from('post_translations')
          .select('language_code, translation_status')
          .eq('original_post_id', post.id)
          .eq('translation_status', 'completed')

        return {
          ...post,
          translationCount: translations?.length || 0,
          availableLanguages: translations?.map(t => t.language_code) || []
        }
      })
    )

    return NextResponse.json({
      success: true,
      posts: postsWithTranslations,
      totalPosts: postsWithTranslations.length
    })

  } catch (error) {
    console.error('Get posts error:', error)
    return NextResponse.json({ 
      error: 'Failed to get posts', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}