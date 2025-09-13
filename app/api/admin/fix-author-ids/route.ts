import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { createSecureRoute, middlewarePresets } from '@/lib/security/middleware'

export const POST = createSecureRoute(async () => {

    // Get all posts with invalid author IDs
    const { data: allPosts, error: fetchError } = await supabaseAdmin
      .from('cuddly_nest_modern_post')
      .select('id, title, author_id')

    if (fetchError) {
      throw fetchError
    }

    // Get valid author IDs
    const { data: authors, error: authorsError } = await supabaseAdmin
      .from('authors')
      .select('id, name')

    if (authorsError) {
      throw authorsError
    }

    const validAuthorIds = authors.map(a => a.id)
    const defaultAuthorId = 'sarah-johnson' // The primary author
    
    // Find posts with invalid author IDs
    const postsToFix = allPosts.filter(p => 
      p.author_id && !validAuthorIds.includes(p.author_id)
    )

    console.log(`Found ${postsToFix.length} posts with invalid author IDs`)
    console.log(`Will update them to use default author: ${defaultAuthorId}`)

    if (postsToFix.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No posts need fixing',
        totalChecked: allPosts.length
      })
    }

    // Update all posts with invalid author IDs to use the default author
    const { data: updatedPosts, error: updateError } = await supabaseAdmin
      .from('cuddly_nest_modern_post')
      .update({ 
        author_id: defaultAuthorId,
        updated_at: new Date().toISOString()
      })
      .in('id', postsToFix.map(p => p.id))
      .select('id, title, author_id')

    if (updateError) {
      throw updateError
    }

    console.log(`Successfully updated ${updatedPosts.length} posts`)

    return NextResponse.json({
      success: true,
      message: `Fixed author IDs for ${updatedPosts.length} posts`,
      details: {
        totalChecked: allPosts.length,
        postsFixed: updatedPosts.length,
        newAuthorId: defaultAuthorId,
        sampleFixedPosts: updatedPosts.slice(0, 5)
      }
    })
}, {
  ...middlewarePresets.admin
})