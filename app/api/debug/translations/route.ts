import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    // First, try to check if the table exists by trying to query it
    let tableExists = true
    let allTranslations = null
    let tableError = null

    const { data: translations, error } = await supabaseAdmin
      .from('post_translations')
      .select('*')
      .limit(1)

    if (error) {
      tableExists = false
      tableError = error.message
    } else {
      // Table exists, get all translations
      const { data: allData, error: allError } = await supabaseAdmin
        .from('post_translations')
        .select('*')
        .order('created_at', { ascending: false })

      if (allError) {
        console.error('Error fetching all translations:', allError)
        return NextResponse.json({ error: allError.message }, { status: 500 })
      }
      allTranslations = allData
    }

    // Get all posts to see what post IDs exist
    const { data: allPosts, error: postsError } = await supabaseAdmin
      .from('cuddly_nest_modern_post')
      .select('id, title, slug')
      .order('created_at', { ascending: false })
      .limit(10)

    if (postsError) {
      console.error('Error fetching posts:', postsError)
      return NextResponse.json({ error: postsError.message }, { status: 500 })
    }

    // Get URL params to filter by specific post if provided
    const url = new URL(request.url)
    const postId = url.searchParams.get('postId')

    let specificTranslations = null
    if (postId) {
      const { data, error } = await supabaseAdmin
        .from('post_translations')
        .select('*')
        .eq('original_post_id', postId)

      if (error) {
        console.error(`Error fetching translations for post ${postId}:`, error)
      } else {
        specificTranslations = data
      }
    }

    return NextResponse.json({
      tableExists,
      tableError,
      totalTranslations: allTranslations?.length || 0,
      allTranslations: allTranslations || [],
      recentPosts: allPosts || [],
      ...(postId && {
        postId,
        specificTranslations: specificTranslations || []
      })
    })

  } catch (error) {
    console.error('Debug translations error:', error)
    return NextResponse.json(
      { error: 'Failed to debug translations' },
      { status: 500 }
    )
  }
}