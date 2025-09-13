import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { createSecureRoute, middlewarePresets } from '@/lib/security/middleware'

export const POST = createSecureRoute(async ({ body }) => {
  const { post_id, template_id, data, position = 0, is_active = true } = body || {}

  const payload = {
    post_id,
    template_id,
    position,
    is_active,
    data: data || {}
  }

  const { data: created, error } = await supabaseAdmin
    .from('modern_post_sections')
    .insert(payload)
    .select('*')
    .single()

  if (error) throw error
  return NextResponse.json(created, { status: 201 })
}, {
  ...middlewarePresets.admin,
  validation: {
    body: {
      post_id: { field: 'post_id', type: 'string', required: true },
      template_id: { field: 'template_id', type: 'string', required: true },
      data: { field: 'data', type: 'object', optional: true },
      position: { field: 'position', type: 'number', optional: true },
      is_active: { field: 'is_active', type: 'boolean', optional: true }
    }
  }
})
