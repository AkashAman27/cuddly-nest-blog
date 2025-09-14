import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { createSecureRoute, middlewarePresets } from '@/lib/security/middleware'
import { commonSchemas } from '@/lib/security/validation'

export const GET = createSecureRoute(async ({ query }, { params }: { params: { id: string } }) => {
  const { data: post, error } = await supabaseAdmin
    .from('cuddly_nest_modern_post')
    .select('*')
    .eq('id', params.id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      )
    }
    throw error
  }

  // Transform the data (no sections needed)
  const transformedPost = {
    ...post,
    categories: post.categories || [],
    tags: post.tags || [],
    sections: [] // No longer using sections
  }

  return NextResponse.json(transformedPost)
}, {
  ...middlewarePresets.admin,
  validation: {
    query: {
      id: { field: 'id', type: 'string', pattern: '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' }
    }
  }
})

export const PUT = createSecureRoute(async ({ body }, { params }: { params: { id: string } }) => {
    const {
      title,
      slug,
      excerpt,
      content,
      status,
      featured_image_url,
      author_id,
      seo_title,
      seo_description,
      categories = [],
      tags = [],
      faq_items = [],
      internal_links = [],
      template_enabled = false,
      template_type
    } = body

    // Validate author_id if provided
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

    // Check for duplicate slug (excluding current post)
    const { data: existingPost } = await supabaseAdmin
      .from('cuddly_nest_modern_post')
      .select('id')
      .eq('slug', slug)
      .neq('id', params.id)
      .single()

    if (existingPost) {
      return NextResponse.json(
        { error: 'A post with this slug already exists' },
        { status: 409 }
      )
    }

    const updateData: any = {
      title: title.trim(),
      slug: slug.trim(),
      excerpt: excerpt?.trim() || '',
      content: content || '',
      status,
      // Note: featured_image_url maps to featured_image_id in database
      // featured_image_id: featured_image_url || null,
      seo_title: seo_title || title,
      seo_description: seo_description?.trim() || '',
      faq_items: faq_items || [],
      internal_links: internal_links || [],
      template_enabled,
      template_type: template_type || null,
      updated_at: new Date().toISOString()
    }

    // Include author_id if provided (now using correct modern_authors table)
    if (author_id) {
      updateData.author_id = author_id
    }

    // Set published_at if status is being set to published for the first time
    if (status === 'published') {
      const { data: currentPost } = await supabaseAdmin
        .from('cuddly_nest_modern_post')
        .select('published_at')
        .eq('id', params.id)
        .single()

      if (currentPost && !currentPost.published_at) {
        updateData.published_at = new Date().toISOString()
      }
    }

    const { data: updatedPosts, error } = await supabaseAdmin
      .from('cuddly_nest_modern_post')
      .update(updateData)
      .eq('id', params.id)
      .select('*')
    
    if (error) {
      throw error
    }

    if (!updatedPosts || updatedPosts.length === 0) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      )
    }
    
    const updatedPost = updatedPosts[0]
    
    // Handle categories and tags separately since they're in junction tables
    if (categories && Array.isArray(categories)) {
      // First, remove all existing categories for this post
      await supabaseAdmin
        .from('modern_post_categories')
        .delete()
        .eq('post_id', params.id)
      
      // Then add the new categories
      if (categories.length > 0) {
        const categoryIds = []
        
        for (const categoryName of categories) {
          // Look up category by name or slug
          let { data: existingCategory } = await supabaseAdmin
            .from('modern_categories')
            .select('id')
            .or(`name.eq.${categoryName},slug.eq.${categoryName.toLowerCase().replace(/\s+/g, '-')}`)
            .single()
          
          let categoryId
          if (existingCategory) {
            categoryId = existingCategory.id
          } else {
            // Create new category if it doesn't exist
            const { data: newCategory, error: createError } = await supabaseAdmin
              .from('modern_categories')
              .insert({
                name: categoryName,
                slug: categoryName.toLowerCase().replace(/\s+/g, '-'),
                is_active: true
              })
              .select('id')
              .single()
            
            if (createError) {
              continue // Skip this category if creation fails
            }
            categoryId = newCategory.id
          }
          
          if (categoryId) {
            categoryIds.push({ post_id: params.id, category_id: categoryId })
          }
        }
        
        if (categoryIds.length > 0) {
          await supabaseAdmin
            .from('modern_post_categories')
            .insert(categoryIds)
        }
      }
    }
    
    if (tags && Array.isArray(tags)) {
      // First, remove all existing tags for this post
      await supabaseAdmin
        .from('modern_post_tags')
        .delete()
        .eq('post_id', params.id)
      
      // Then add the new tags
      if (tags.length > 0) {
        const tagIds = []
        
        for (const tagName of tags) {
          // Look up tag by name or slug
          let { data: existingTag } = await supabaseAdmin
            .from('modern_tags')
            .select('id')
            .or(`name.eq.${tagName},slug.eq.${tagName.toLowerCase().replace(/\s+/g, '-')}`)
            .single()
          
          let tagId
          if (existingTag) {
            tagId = existingTag.id
          } else {
            // Create new tag if it doesn't exist
            const { data: newTag, error: createError } = await supabaseAdmin
              .from('modern_tags')
              .insert({
                name: tagName,
                slug: tagName.toLowerCase().replace(/\s+/g, '-')
              })
              .select('id')
              .single()
            
            if (createError) {
              continue // Skip this tag if creation fails
            }
            tagId = newTag.id
          }
          
          if (tagId) {
            tagIds.push({ post_id: params.id, tag_id: tagId })
          }
        }
        
        if (tagIds.length > 0) {
          await supabaseAdmin
            .from('modern_post_tags')
            .insert(tagIds)
        }
      }
    }
    
    return NextResponse.json(updatedPost)
}, {
  ...middlewarePresets.admin,
  validation: {
    body: {
      ...commonSchemas.blogPost,
      categories: { field: 'categories', type: 'array', optional: true },
      tags: { field: 'tags', type: 'array', optional: true },
      faq_items: { field: 'faq_items', type: 'array', optional: true },
      internal_links: { field: 'internal_links', type: 'array', optional: true }
    }
  }
})

export const DELETE = createSecureRoute(async ({ }, { params }: { params: { id: string } }) => {
  const { error } = await supabaseAdmin
    .from('cuddly_nest_modern_post')
    .delete()
    .eq('id', params.id)

  if (error) {
    throw error
  }

  return NextResponse.json({ success: true })
}, {
  ...middlewarePresets.admin
})
