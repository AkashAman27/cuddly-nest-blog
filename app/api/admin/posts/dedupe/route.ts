import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { createSecureRoute, middlewarePresets } from '@/lib/security/middleware'

export const GET = createSecureRoute(async () => {
  const { data: rows, error } = await supabaseAdmin
    .from('cuddly_nest_modern_post')
    .select('id, slug, title, status, created_at, updated_at')
    .order('updated_at', { ascending: false })

  if (error) throw error

  // Group by slug to find duplicates
  const groups = new Map<string, any[]>()
  for (const row of rows || []) {
    if (!row.slug) continue
    const key = row.slug
    const arr = groups.get(key) || []
    arr.push(row)
    groups.set(key, arr)
  }

  const duplicates = Array.from(groups.entries())
    .filter(([_, arr]) => arr.length > 1)
    .map(([slug, arr]) => ({ slug, count: arr.length, items: arr }))
    .sort((a, b) => b.count - a.count)

  return NextResponse.json({ total: rows?.length || 0, duplicateGroups: duplicates })
}, {
  ...middlewarePresets.admin
})

export const POST = createSecureRoute(async ({ body }) => {
  const action: 'archive' | 'delete' = body.action === 'delete' ? 'delete' : 'archive'

  // Fetch all posts to process locally
  const { data: rows, error } = await supabaseAdmin
    .from('cuddly_nest_modern_post')
    .select('id, slug, status, updated_at')

  if (error) throw error

  // Group by slug
  const groups = new Map<string, any[]>()
  for (const row of rows || []) {
    if (!row.slug) continue
    const arr = groups.get(row.slug) || []
    arr.push(row)
    groups.set(row.slug, arr)
  }

  // Determine duplicates to act on (keep newest by updated_at)
  const toArchive: string[] = []
  const toDelete: string[] = []

  groups.forEach((arr) => {
    if (arr.length <= 1) return
    const sorted = arr.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    const rest = sorted.slice(1)
    if (action === 'archive') {
      toArchive.push(...rest.map((r) => r.id))
    } else {
      toDelete.push(...rest.map((r) => r.id))
    }
  })

  let archiveCount = 0
  let deleteCount = 0

  if (toArchive.length > 0) {
    const { error: updErr } = await supabaseAdmin
      .from('cuddly_nest_modern_post')
      .update({ status: 'archived', updated_at: new Date().toISOString() })
      .in('id', toArchive)
    if (updErr) throw updErr
    archiveCount = toArchive.length
  }

  if (toDelete.length > 0) {
    const { error: delErr } = await supabaseAdmin
      .from('cuddly_nest_modern_post')
      .delete()
      .in('id', toDelete)
    if (delErr) throw delErr
    deleteCount = toDelete.length
  }

  return NextResponse.json({
    action,
    archived: archiveCount,
    deleted: deleteCount,
  })
}, {
  ...middlewarePresets.admin,
  validation: {
    body: {
      action: { field: 'action', type: 'string', allowedValues: ['archive', 'delete'], optional: true }
    }
  }
})

