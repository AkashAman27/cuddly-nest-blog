import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    // Featured posts with destination-appropriate images
    const postsWithImages = [
      {
        id: '846dde14-88e2-48ed-9a11-1a48bab67386', // Rotterdam Nightlife
        title: 'Hidden Gems of Rotterdam Nightlife',
        image: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80' // Rotterdam skyline at night
      },
      {
        id: '07a922e3-b38c-4f32-ac76-2c4d80def4e3', // Italian Lakes Region
        title: 'Italian Lakes Region: Como, Garda & Maggiore Complete Guide',
        image: 'https://images.unsplash.com/photo-1527004013197-933c4bb611b3?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80' // Lake Como
      },
      {
        id: 'd962b0f0-b912-44ba-b8bb-4b3cdac355dc', // Naples & Amalfi Coast
        title: 'Naples & Amalfi Coast: Ultimate Southern Italy Guide',
        image: 'https://images.unsplash.com/photo-1544737151-6e4b3999de56?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80' // Amalfi Coast
      },
      {
        id: '482e6b70-4ce3-4716-9e20-e220b1f1e3f7', // Florence Travel Guide
        title: 'Florence Travel Guide: Renaissance Art & Tuscan Delights',
        image: 'https://images.unsplash.com/photo-1552332386-f8dd00dc2f85?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80' // Florence Duomo
      },
      {
        id: '4dcf7612-79c1-42ed-a58d-3703b5e68b63', // Venice Travel Guide
        title: 'Venice Travel Guide: Ultimate 5-Day Italian Adventure',
        image: 'https://images.unsplash.com/photo-1514890547357-a9ee288728e0?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80' // Venice canals
      }
    ]

    const results = []

    for (const post of postsWithImages) {
      try {
        // Check if this post has a hero section
        const { data: heroSection, error: heroError } = await supabase
          .from('modern_post_sections')
          .select('id, data')
          .eq('post_id', post.id)
          .eq('template_id', '6f579a71-463c-43b4-b203-c2cb46c80d47') // Hero section template ID
          .eq('position', 0)
          .maybeSingle()

        if (heroError && heroError.code !== 'PGRST116') {
          console.error(`Error fetching hero section for ${post.title}:`, heroError)
          continue
        }

        if (heroSection) {
          // Update existing hero section with new image
          const updatedData = {
            ...heroSection.data,
            backgroundImage: post.image
          }

          const { error: updateError } = await supabase
            .from('modern_post_sections')
            .update({
              data: updatedData,
              updated_at: new Date().toISOString()
            })
            .eq('id', heroSection.id)

          if (updateError) {
            console.error(`Error updating hero section for ${post.title}:`, updateError)
            results.push({
              postId: post.id,
              title: post.title,
              status: 'error',
              message: 'Failed to update hero section'
            })
          } else {
            results.push({
              postId: post.id,
              title: post.title,
              status: 'updated',
              message: 'Hero image updated successfully',
              image: post.image
            })
          }
        } else {
          // Create new hero section if it doesn't exist
          const heroData = {
            title: post.title,
            subtitle: `Discover amazing experiences and hidden gems`,
            backgroundImage: post.image,
            textAlign: 'left',
            overlay: true
          }

          const { error: createError } = await supabase
            .from('modern_post_sections')
            .insert({
              post_id: post.id,
              template_id: '6f579a71-463c-43b4-b203-c2cb46c80d47', // Hero section template ID
              position: 0,
              data: heroData,
              is_active: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })

          if (createError) {
            console.error(`Error creating hero section for ${post.title}:`, createError)
            results.push({
              postId: post.id,
              title: post.title,
              status: 'error',
              message: 'Failed to create hero section'
            })
          } else {
            results.push({
              postId: post.id,
              title: post.title,
              status: 'created',
              message: 'Hero section created successfully',
              image: post.image
            })
          }
        }
      } catch (error) {
        console.error(`Exception processing ${post.title}:`, error)
        results.push({
          postId: post.id,
          title: post.title,
          status: 'error',
          message: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    const successCount = results.filter(r => r.status === 'updated' || r.status === 'created').length
    const errorCount = results.filter(r => r.status === 'error').length

    return NextResponse.json({ 
      success: true, 
      message: `Updated hero images for ${successCount} posts`,
      results,
      summary: {
        total: results.length,
        successful: successCount,
        errors: errorCount
      }
    })

  } catch (error) {
    console.error('Update featured images error:', error)
    return NextResponse.json({ 
      error: 'Failed to update featured images', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}