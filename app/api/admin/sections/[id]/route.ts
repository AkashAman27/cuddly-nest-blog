import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { createSecureRoute, middlewarePresets } from '@/lib/security/middleware'

export const PUT = createSecureRoute(async ({ body }, { params }: { params: { id: string } }) => {
  const { data: existing } = await supabaseAdmin
    .from('modern_post_sections')
    .select('*')
    .eq('id', params.id)
    .single()

  const updateData: any = {}
  if (typeof body.position === 'number') updateData.position = body.position
  if (typeof body.is_active === 'boolean') updateData.is_active = body.is_active
  if (body.data && typeof body.data === 'object') {
    updateData.data = { ...(existing?.data || {}), ...body.data }
  }
  updateData.updated_at = new Date().toISOString()

  const { data, error } = await supabaseAdmin
    .from('modern_post_sections')
    .update(updateData)
    .eq('id', params.id)
    .select('*')
    .single()

  if (error) throw error
  return NextResponse.json(data)
}, {
  ...middlewarePresets.admin,
  validation: {
    body: {
      position: { field: 'position', type: 'number', optional: true },
      is_active: { field: 'is_active', type: 'boolean', optional: true },
      data: { field: 'data', type: 'object', optional: true }
    }
  }
})

export const DELETE = createSecureRoute(async ({}, { params }: { params: { id: string } }) => {
  const { error } = await supabaseAdmin
    .from('modern_post_sections')
    .delete()
    .eq('id', params.id)

  if (error) throw error
  return NextResponse.json({ success: true })
}, {
  ...middlewarePresets.admin
})
