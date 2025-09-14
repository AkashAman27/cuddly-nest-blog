import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// Get all CTAs for a post
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const postId = searchParams.get('post_id')

    if (!postId) {
      return NextResponse.json(
        { error: 'post_id is required' },
        { status: 400 }
      )
    }

    const { data: ctas, error } = await supabaseAdmin
      .from('cuddly_nest_ctas')
      .select('*')
      .eq('post_id', postId)
      .eq('is_active', true)
      .order('position', { ascending: true })

    if (error) {
      throw error
    }

    return NextResponse.json(ctas || [])

  } catch (error) {
    console.error('Error fetching CTAs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch CTAs' },
      { status: 500 }
    )
  }
}

// Create a new CTA
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      post_id,
      title,
      description,
      button_text,
      button_link,
      position = 1
    } = body

    if (!post_id || !title || !button_text || !button_link) {
      return NextResponse.json(
        { error: 'post_id, title, button_text, and button_link are required' },
        { status: 400 }
      )
    }

    const ctaData = {
      post_id,
      title: title.trim(),
      description: description?.trim() || null,
      button_text: button_text.trim(),
      button_link: button_link.trim(),
      position,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { data: cta, error } = await supabaseAdmin
      .from('cuddly_nest_ctas')
      .insert(ctaData)
      .select('*')
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json(cta, { status: 201 })

  } catch (error) {
    console.error('Error creating CTA:', error)
    return NextResponse.json(
      { error: 'Failed to create CTA' },
      { status: 500 }
    )
  }
}