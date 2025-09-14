import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// Update a CTA
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const {
      title,
      description,
      button_text,
      button_link,
      position,
      is_active
    } = body

    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (title !== undefined) updateData.title = title.trim()
    if (description !== undefined) updateData.description = description?.trim() || null
    if (button_text !== undefined) updateData.button_text = button_text.trim()
    if (button_link !== undefined) updateData.button_link = button_link.trim()
    if (position !== undefined) updateData.position = position
    if (is_active !== undefined) updateData.is_active = is_active

    const { data: cta, error } = await supabaseAdmin
      .from('cuddly_nest_ctas')
      .update(updateData)
      .eq('id', params.id)
      .select('*')
      .single()

    if (error) {
      throw error
    }

    if (!cta) {
      return NextResponse.json(
        { error: 'CTA not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(cta)

  } catch (error) {
    console.error('Error updating CTA:', error)
    return NextResponse.json(
      { error: 'Failed to update CTA' },
      { status: 500 }
    )
  }
}

// Delete a CTA
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { error } = await supabaseAdmin
      .from('cuddly_nest_ctas')
      .delete()
      .eq('id', params.id)

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error deleting CTA:', error)
    return NextResponse.json(
      { error: 'Failed to delete CTA' },
      { status: 500 }
    )
  }
}