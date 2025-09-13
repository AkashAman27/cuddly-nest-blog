import { NextResponse } from 'next/server'
import { supabase, supabaseAdmin } from '@/lib/supabase'

export async function POST(request: Request) {
  try {
    const { sectionId, content } = await request.json()
    
    console.log(`Updating section with ID: ${sectionId}`)
    console.log('Content length:', content?.length || 0)
    
    // Use admin client to bypass RLS
    const client = supabaseAdmin || supabase
    
    // First, get the current section to see existing data
    const { data: currentSection, error: fetchError } = await client
      .from('modern_post_sections')
      .select('*')
      .eq('id', sectionId)
      .single()
      
    if (fetchError) {
      console.error('Error fetching current section:', fetchError)
      return NextResponse.json({
        error: 'Section not found',
        details: fetchError
      }, { status: 404 })
    }
    
    console.log('Current section found:', {
      id: currentSection.id,
      title: currentSection.title,
      currentContent: currentSection.data?.content?.substring(0, 100) + '...'
    })
    
    // Update the section with new content
    const updateData = {
      data: {
        ...currentSection.data,
        content: content
      },
      updated_at: new Date().toISOString()
    }
    
    const { data, error } = await client
      .from('modern_post_sections')
      .update(updateData)
      .eq('id', sectionId)
      .select('*')
      .single()
      
    if (error) {
      console.error('Error updating section:', error)
      return NextResponse.json({
        error: 'Failed to update section',
        details: error
      }, { status: 500 })
    }
    
    console.log('✅ Section updated successfully!')
    
    return NextResponse.json({
      success: true,
      message: 'Section updated successfully',
      section: {
        id: data.id,
        title: data.title,
        contentLength: data.data?.content?.length || 0,
        updatedAt: data.updated_at
      }
    })
    
  } catch (error) {
    console.error('Exception:', error)
    return NextResponse.json({
      error: 'Exception occurred',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}