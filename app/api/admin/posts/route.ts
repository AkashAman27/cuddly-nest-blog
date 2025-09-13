import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { createSecureRoute, middlewarePresets } from '@/lib/security/middleware'
import { commonSchemas } from '@/lib/security/validation'

export const GET = createSecureRoute(async ({ query }) => {
  const status = query.status
  const search = query.search
  const page = parseInt(query.page || '1')
  const limit = parseInt(query.limit || '20')
  const offset = (page - 1) * limit

  // Use admin client only
  let dbQuery = supabaseAdmin
    .from('cuddly_nest_modern_post')
    .select('*')

  // Apply status filter
  if (status && status !== 'all') {
    dbQuery = dbQuery.eq('status', status)
  }

  // Apply search filter (safer parameterized search)
  if (search && search.trim()) {
    const searchTerm = `%${search.trim()}%`
    dbQuery = dbQuery.or(
      `title.ilike.${searchTerm},slug.ilike.${searchTerm},excerpt.ilike.${searchTerm}`
    )
  }

  // Get total count first
  const { count: totalCount } = await supabaseAdmin
    .from('cuddly_nest_modern_post')
    .select('*', { count: 'exact', head: true })

  // Add pagination and ordering
  dbQuery = dbQuery
    .range(offset, offset + limit - 1)
    .order('updated_at', { ascending: false })

  const { data: posts, error } = await dbQuery

  if (error) {
    throw error
  }

  // Transform posts data
  const transformedPosts = posts?.map(post => ({
    ...post,
    sections_count: 0,
    categories: post.categories || [],
    tags: post.tags || [],
    author: { display_name: 'Admin', email: 'admin@cuddlynest.com' }
  })) || []

  return NextResponse.json({
    posts: transformedPosts,
    pagination: {
      page,
      limit,
      total: totalCount || 0,
      totalPages: Math.ceil((totalCount || 0) / limit)
    }
  })
}, {
  ...middlewarePresets.admin,
  validation: {
    query: {
      status: { field: 'status', type: 'string', allowedValues: ['draft', 'published', 'archived', 'all'] },
      search: { field: 'search', type: 'string', maxLength: 100 },
      page: { field: 'page', type: 'number', min: 1, max: 1000 },
      limit: { field: 'limit', type: 'number', min: 1, max: 100 }
    }
  }
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const {
      title,
      slug,
      excerpt,
      content,
      status = 'draft',
      featured_image_url,
      author_id,
      seo_title,
      seo_description,
      categories = [],
      tags = [],
      faq_items = [],
      template_enabled = false,
      template_type
    } = body

    // Validate required fields
    if (!title || !slug) {
      return NextResponse.json(
        { error: 'Title and slug are required' },
        { status: 400 }
      )
    }
    
    // Validate author_id if provided (use modern_authors table)
    if (author_id) {
      const { data: authorExists } = await supabaseAdmin
        .from('modern_authors')
        .select('id')
        .eq('id', author_id)
        .single()
        
      if (!authorExists) {
        return NextResponse.json(
          { error: 'Invalid author ID provided' },
          { status: 400 }
        )
      }
    }

    // Check for duplicate slug
    const { data: existingPost } = await supabaseAdmin
      .from('cuddly_nest_modern_post')
      .select('id')
      .eq('slug', slug)
      .single()

    if (existingPost) {
      return NextResponse.json(
        { error: 'A post with this slug already exists' },
        { status: 409 }
      )
    }

    const now = new Date().toISOString()

    const insertData: any = {
      title: title.trim(),
      slug: slug.trim(),
      excerpt: excerpt?.trim() || '',
      content: content || '',
      status,
      seo_title: seo_title || title,
      seo_description: seo_description?.trim() || '',
      faq_items: faq_items || [],
      template_enabled,
      template_type: template_type || null,
      created_at: now,
      updated_at: now,
      published_at: status === 'published' ? now : null
    }
    
    // Include author_id if provided
    if (author_id) {
      insertData.author_id = author_id
    }
    
    const { data: newPost, error } = await supabaseAdmin
      .from('cuddly_nest_modern_post')
      .insert(insertData)
      .select(`
        *,
        author:modern_authors(id, display_name, email)
      `)
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json(newPost, { status: 201 })

  } catch (error) {
    console.error('Error creating post:', error)
    return NextResponse.json(
      { error: 'Failed to create post' },
      { status: 500 }
    )
  }
}
