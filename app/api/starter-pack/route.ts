import { NextRequest, NextResponse } from 'next/server'
import { 
  getStarterPackForPost, 
  createStarterPackSection
} from '@/lib/supabase'
import {
  updateStarterPackSection, 
  deleteStarterPackSection,
  createSampleStarterPackData,
  getAllStarterPackSections
} from '@/lib/supabase-starter-pack'

// GET - Fetch starter pack for a specific post or all sections
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const postId = searchParams.get('postId')
    const action = searchParams.get('action')

    if (action === 'all') {
      // Get all starter pack sections
      const sections = await getAllStarterPackSections()
      return NextResponse.json({
        success: true,
        data: sections,
        total: sections.length
      })
    }

    if (!postId) {
      return NextResponse.json(
        { error: 'Post ID is required' },
        { status: 400 }
      )
    }

    const starterPack = await getStarterPackForPost(postId)
    
    return NextResponse.json({
      success: true,
      data: starterPack
    })

  } catch (error) {
    console.error('GET starter pack error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch starter pack', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}

// POST - Create a new starter pack section
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { postId, badge, title, description, position, highlights, features, sample, destination } = body

    // Validate required fields
    if (!postId) {
      return NextResponse.json(
        { error: 'Post ID is required' },
        { status: 400 }
      )
    }

    let result

    if (sample) {
      // Create sample data
      result = await createSampleStarterPackData(postId, destination)
    } else {
      // Validate required fields for custom creation
      if (!badge || !title || !description) {
        return NextResponse.json(
          { error: 'Badge, title, and description are required' },
          { status: 400 }
        )
      }

      result = await createStarterPackSection(
        postId,
        badge,
        title,
        description,
        position || 0,
        highlights || [],
        features || []
      )
    }

    if (!result) {
      return NextResponse.json(
        { error: 'Failed to create starter pack section' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: { id: result }
    })

  } catch (error) {
    console.error('POST starter pack error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to create starter pack section', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}

// PUT - Update an existing starter pack section
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { starterPackId, badge, title, description, position, highlights, features } = body

    if (!starterPackId) {
      return NextResponse.json(
        { error: 'Starter pack ID is required' },
        { status: 400 }
      )
    }

    const result = await updateStarterPackSection({
      starterPackId,
      badge,
      title,
      description,
      position,
      highlights,
      features
    })

    if (!result) {
      return NextResponse.json(
        { error: 'Failed to update starter pack section' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: { updated: true }
    })

  } catch (error) {
    console.error('PUT starter pack error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to update starter pack section', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}

// DELETE - Remove a starter pack section
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const starterPackId = searchParams.get('starterPackId')

    if (!starterPackId) {
      return NextResponse.json(
        { error: 'Starter pack ID is required' },
        { status: 400 }
      )
    }

    const result = await deleteStarterPackSection(starterPackId)

    if (!result) {
      return NextResponse.json(
        { error: 'Failed to delete starter pack section' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: { deleted: true }
    })

  } catch (error) {
    console.error('DELETE starter pack error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to delete starter pack section', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}