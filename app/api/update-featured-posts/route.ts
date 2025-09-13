import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    // The 5 posts to feature (based on translation completeness)
    const featuredPostIds = [
      '846dde14-88e2-48ed-9a11-1a48bab67386', // Rotterdam Nightlife (4 translations)
      '07a922e3-b38c-4f32-ac76-2c4d80def4e3', // Italian Lakes Region (1 translation)
      'd962b0f0-b912-44ba-b8bb-4b3cdac355dc', // Naples & Amalfi Coast (1 translation)
      '482e6b70-4ce3-4716-9e20-e220b1f1e3f7', // Florence Travel Guide (1 translation)
      '4dcf7612-79c1-42ed-a58d-3703b5e68b63'  // Venice Travel Guide (1 translation)
    ]

    // First, unfeature all current featured posts
    const { error: unfeaturedError } = await supabase
      .from('cuddly_nest_modern_post')
      .update({ is_featured: false })
      .eq('is_featured', true)

    if (unfeaturedError) {
      console.error('Error unfeaturing posts:', unfeaturedError)
    }

    // Then feature the selected posts
    const { error: featureError } = await supabase
      .from('cuddly_nest_modern_post')
      .update({ 
        is_featured: true,
        updated_at: new Date().toISOString()
      })
      .in('id', featuredPostIds)

    if (featureError) {
      throw featureError
    }

    // Get the updated posts to return
    const { data: updatedPosts, error: fetchError } = await supabase
      .from('cuddly_nest_modern_post')
      .select('id, title, slug, is_featured')
      .in('id', featuredPostIds)

    if (fetchError) {
      console.error('Error fetching updated posts:', fetchError)
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Featured posts updated successfully',
      featuredPosts: updatedPosts || [],
      totalFeatured: featuredPostIds.length
    })

  } catch (error) {
    console.error('Update featured posts error:', error)
    return NextResponse.json({ 
      error: 'Failed to update featured posts', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}