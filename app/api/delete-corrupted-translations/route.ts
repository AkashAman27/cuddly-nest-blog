import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const postId = searchParams.get('postId') || '2efc693e-5e94-4aca-9846-49936b65f483'
    
    // Delete corrupted post_translations
    const { error: translationsError } = await supabaseAdmin
      .from('post_translations')
      .delete()
      .eq('original_post_id', postId)
    
    if (translationsError) {
      console.error('Error deleting post_translations:', translationsError)
    }
    
    // Delete corrupted translated posts (from modern_posts table)
    const { error: postsError } = await supabaseAdmin
      .from('cuddly_nest_modern_post')
      .delete()
      .eq('original_post_id', postId)
    
    if (postsError) {
      console.error('Error deleting translated posts:', postsError)
    }
    
    return NextResponse.json({
      success: true,
      message: 'Corrupted translations deleted successfully',
      deletedFrom: ['post_translations', 'modern_posts']
    })
    
  } catch (error) {
    console.error('Error deleting corrupted translations:', error)
    return NextResponse.json({
      error: 'Failed to delete corrupted translations',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}