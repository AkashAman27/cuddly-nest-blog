import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const postId = searchParams.get('postId') || '2efc693e-5e94-4aca-9846-49936b65f483'
    
    // Get the original post with content and sections
    const { data: originalPost, error } = await supabaseAdmin
      .from('cuddly_nest_modern_post')
      .select(`
        id, title, slug, excerpt, content, template_enabled, template_type,
        sections:modern_post_sections(
          id, template_id, title, data, position, is_active
        )
      `)
      .eq('id', postId)
      .single()
    
    if (error || !originalPost) {
      return NextResponse.json({
        error: 'Post not found',
        details: error
      })
    }
    
    return NextResponse.json({
      success: true,
      post: {
        ...originalPost,
        contentLength: originalPost.content?.length || 0,
        contentPreview: originalPost.content?.substring(0, 500) + '...',
        hasContent: !!originalPost.content && originalPost.content.length > 0,
        sectionsCount: originalPost.sections?.length || 0,
        isTemplate: originalPost.template_enabled,
        templateType: originalPost.template_type,
        sectionsPreview: originalPost.sections?.slice(0, 3).map(s => ({
          id: s.id,
          template_id: s.template_id,
          title: s.title,
          dataPreview: JSON.stringify(s.data).substring(0, 200) + '...'
        }))
      }
    })
    
  } catch (error) {
    console.error('Error checking post content:', error)
    return NextResponse.json({
      error: 'Failed to check post content',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}