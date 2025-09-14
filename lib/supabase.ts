import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Service role client for server-side operations (bypasses RLS)
// Only create if service key is available (server-side only)
export const supabaseAdmin = supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null

export interface BlogPost {
  id: string
  title: string
  slug: string
  content: string
  excerpt?: string
  meta_description?: string
  featured_image?: string
  published_at: string
  updated_at: string
  status: 'published' | 'draft'
  author_id?: string
  categories?: string[]
  tags?: string[]
}

export interface FAQ {
  id: string
  question: string
  answer: string
  post_id: string
  order_index?: number
}

export interface InternalLink {
  id: string
  title: string
  description: string
  url: string
  post_id: string
  order_index?: number
}

export async function getBlogPost(slug: string): Promise<BlogPost | null> {
  const { data, error } = await supabase
    .from('cuddly_nest_modern_post')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .single()

  if (error) {
    console.error('Error fetching blog post:', error)
    return null
  }

  return data
}

export async function getFAQs(postId: string): Promise<FAQ[]> {
  const { data, error } = await supabase
    .from('modern_faqs')
    .select('*')
    .eq('post_id', postId)
    .order('order_index', { ascending: true })

  if (error) {
    console.error('Error fetching FAQs:', error)
    return []
  }

  return data || []
}

export async function getInternalLinks(postId: string): Promise<InternalLink[]> {
  const { data, error } = await supabase
    .from('modern_internal_links')
    .select('*')
    .eq('post_id', postId)
    .order('order_index', { ascending: true })

  if (error) {
    console.error('Error fetching internal links:', error)
    return []
  }

  return data || []
}

// Modern blog interfaces and functions
export interface ModernPost {
  id: string
  title: string
  slug: string
  excerpt?: string
  featured_image_url?: string
  status: 'draft' | 'published'
  created_at: string
  updated_at: string
  published_at?: string
  author_id: string
  author?: ModernAuthor
  sections?: ModernSection[]
  categories?: ModernCategory[]
  // SEO fields
  meta_title?: string
  meta_description?: string
  canonical_url?: string
  og_title?: string
  og_description?: string
  og_image?: {
    file_url: string
  }
  // Settings
  allow_comments?: boolean
  is_featured?: boolean
  view_count?: number
  reading_time?: number
}

export interface ModernCategory {
  id: string
  name: string
  slug: string
  description?: string
  color?: string
  // SEO fields  
  meta_title?: string
  meta_description?: string
  canonical_url?: string
  og_title?: string
  og_description?: string
  og_image?: string
  // Content fields
  custom_content?: string
  excerpt?: string
  // Visual and organization
  featured_image?: string
  parent_category_id?: string
  // Publishing controls
  is_published: boolean
  is_featured?: boolean
  visibility?: 'public' | 'private' | 'draft'
  // Analytics and engagement
  post_count?: number
  view_count?: number
  sort_order?: number
  // Timestamps
  created_at: string
  updated_at: string
  published_at?: string
  // Relations
  faqs?: CategoryFAQ[]
  parent_category?: ModernCategory | null
  child_categories?: ModernCategory[]
}

export interface CategoryFAQ {
  id: string
  category_id: string
  question: string
  answer: string
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ModernAuthor {
  id: string
  display_name: string
  email: string
  avatar_url?: string
  bio?: string
  social_links?: any
  created_at: string
  updated_at: string
}

export interface ModernSection {
  id: string
  template_id: string
  title?: string
  position: number
  data: any
  is_active: boolean
  mobile_hidden?: boolean
  tablet_hidden?: boolean
  created_at: string
  updated_at: string
  template?: {
    name: string
    component_name: string
    category: string
  }
}

// Fetch a single modern blog post by slug with sections (published only)
export async function getModernPostBySlug(slug: string): Promise<ModernPost | null> {
  try {
    const { data: postData, error: postError } = await supabase
      .from('cuddly_nest_modern_post')
      .select(`
        *,
        modern_authors(*)
      `)
      .eq('slug', slug)
      .eq('status', 'published')
      .single()

    if (postError) {
      if (postError.code === 'PGRST116') {
        console.log(`Modern post not found for slug: ${slug}`)
        return null
      }
      console.error('Error fetching modern blog post:', postError.message)
      return null
    }

    if (!postData) {
      return null
    }

    // Transform data to match expected structure (no sections needed)
    const transformedPost = {
      ...postData,
      author: postData.modern_authors,
      blog_authors: postData.modern_authors, // Keep for backward compatibility
      categories: [],
      sections: [], // No longer using sections
      featured_image_url: postData.og_image || null,
      og_image: postData.og_image ? { file_url: postData.og_image } : null,
      published_at: postData.published_at || postData.created_at
    }

    return transformedPost
  } catch (err) {
    console.error('Exception fetching modern blog post:', err)
    return null
  }
}

// Fetch a single modern blog post by slug with sections (includes draft for preview)
export async function getModernPostBySlugWithPreview(slug: string, allowDraft: boolean = false): Promise<ModernPost | null> {
  try {
    // Use admin client for preview functionality to bypass RLS policies
    // Fall back to regular client if admin client is not available (client-side)
    const client = (allowDraft && supabaseAdmin) ? supabaseAdmin : supabase
    
    let query = client
      .from('cuddly_nest_modern_post')
      .select(`
        *,
        modern_authors(*)
      `)
      .eq('slug', slug)

    // Only filter by published status if not allowing drafts
    if (!allowDraft) {
      query = query.eq('status', 'published')
    }

    const { data: postData, error: postError } = await query.single()

    if (postError) {
      if (postError.code === 'PGRST116') {
        console.log(`Modern post not found for slug: ${slug}`)
        return null
      }
      console.error('Error fetching modern post:', postError)
      return null
    }

    const transformedPost: ModernPost = {
      ...postData,
      sections: [], // No longer using sections
      author: postData.modern_authors || null,
      og_image: postData.og_image ? { file_url: postData.og_image } : null
    }

    return transformedPost
  } catch (error) {
    console.error('Exception in getModernPostBySlugWithPreview:', error)
    return null
  }
}

// Publish a draft post
export async function publishPost(postId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('cuddly_nest_modern_post')
      .update({ 
        status: 'published',
        published_at: new Date().toISOString()
      })
      .eq('id', postId)
      .select()
      .single()

    if (error) {
      console.error('Error publishing post:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Exception publishing post:', error)
    return { success: false, error: 'Failed to publish post' }
  }
}

// Get recent posts for blog homepage
export async function getRecentPosts(limit: number = 8) {
  const { data: posts, error } = await supabase
    .from('cuddly_nest_modern_post')
    .select(`
      id,
      title,
      slug,
      excerpt,
      published_at,
      reading_time,
      created_at,
      og_image,
      status
    `)
    .eq('status', 'published')
    .not('published_at', 'is', null)
    .order('published_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching recent posts:', error)
    return []
  }

  // Transform posts to use og_image as featured_image, with fallback to hero images
  const postsWithImages = await Promise.all(
    (posts || []).map(async (post) => {
      // If post has og_image, use it
      if (post.og_image) {
        return {
          ...post,
          featured_image: { file_url: post.og_image }
        }
      }
      
      // No fallback needed since we no longer use sections
      return {
        ...post,
        featured_image: null
      }
    })
  )

  console.log('getRecentPosts debug:', {
    totalPosts: postsWithImages.length,
    first3Posts: postsWithImages.slice(0, 3).map(post => ({
      id: post.id,
      title: post.title,
      og_image: post.og_image,
      featured_image: post.featured_image
    }))
  })

  return postsWithImages
}

// Get featured posts for blog homepage
export async function getFeaturedPosts(limit: number = 6) {
  const { data: posts, error } = await supabase
    .from('cuddly_nest_modern_post')
    .select(`
      id,
      title,
      slug,
      excerpt,
      published_at,
      reading_time,
      is_featured,
      created_at,
      og_image
    `)
    .eq('status', 'published')
    .eq('is_featured', true)
    .order('published_at', { ascending: false })
    .limit(limit)
  
  if (error) {
    console.error('Error fetching featured posts:', error)
    return []
  }
  
  // Transform posts to use og_image as featured_image, with fallback to hero images
  const postsWithImages = await Promise.all(
    (posts || []).map(async (post) => {
      // If post has og_image, use it
      if (post.og_image) {
        return {
          ...post,
          featured_image: { file_url: post.og_image }
        }
      }
      
      // No fallback needed since we no longer use sections
      return {
        ...post,
        featured_image: null
      }
    })
  )
  
  return postsWithImages
}

// Search posts by category
export async function searchPostsByCategory(category: string, limit: number = 20) {
  // For now, we'll use a simple approach since we don't have a categories table yet
  // This searches for category terms in title and content
  const { data: posts, error } = await supabase
    .from('cuddly_nest_modern_post')
    .select(`
      id,
      title,
      slug,
      excerpt,
      published_at,
      reading_time,
      created_at,
      og_image,
      status
    `)
    .eq('status', 'published')
    .not('published_at', 'is', null)
    .or(`title.ilike.%${category}%,excerpt.ilike.%${category}%`)
    .order('published_at', { ascending: false })
    .limit(limit)
  
  if (error) {
    console.error('Error searching posts by category:', error)
    return []
  }
  
  // Transform posts to use og_image as featured_image
  const postsWithImages = (posts || []).map((post) => ({
    ...post,
    featured_image: post.og_image ? { file_url: post.og_image } : null
  }))
  
  return postsWithImages
}

// Get posts count
export async function getPostsCount() {
  const { count, error } = await supabase
    .from('cuddly_nest_modern_post')
    .select('*', { count: 'exact' })
    .eq('status', 'published')

  if (error) {
    console.error('Error fetching posts count:', error)
    return 0
  }

  return count || 0
}

// COMPREHENSIVE CATEGORY MANAGEMENT FUNCTIONS

// Get all published categories with post counts
export async function getAllCategories(includeEmpty: boolean = false): Promise<ModernCategory[]> {
  try {
    let query = supabase
      .from('modern_categories')
      .select(`
        *
      `)
      .eq('is_active', true)
      .order('name', { ascending: true })

    const { data: categories, error } = await query

    if (error) {
      console.error('Error fetching categories:', error)
      return []
    }

    // Calculate post count for each category
    const categoriesWithCounts = await Promise.all(
      (categories || []).map(async (cat) => {
        const { count } = await supabase
          .from('modern_post_categories')
          .select('*', { count: 'exact', head: true })
          .eq('category_id', cat.id)

        return {
          ...cat,
          is_published: cat.is_active,
          is_featured: false, // No is_featured column in DB
          visibility: 'public' as const,
          post_count: count || 0,
          sort_order: cat.sort_order || 0,
          seo_title: cat.meta_title,
          seo_description: cat.meta_description,
          faqs: [],
          parent_category: null,
          child_categories: []
        }
      })
    )

    // Filter out categories with no posts if includeEmpty is false
    if (!includeEmpty) {
      return categoriesWithCounts.filter(cat => cat.post_count > 0)
    }

    return categoriesWithCounts
  } catch (error) {
    console.error('Exception fetching categories:', error)
    return []
  }
}

// Get category by slug with FAQs and related data
export async function getCategoryBySlug(slug: string): Promise<ModernCategory | null> {
  try {
    const { data: category, error } = await supabase
      .from('modern_categories')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      console.error('Error fetching category:', error)
      return null
    }

    // Transform to match our interface
    return {
      ...category,
      is_published: category.is_active,
      is_featured: false, // No is_featured column in DB
      visibility: 'public' as const,
      post_count: 0, // Will be calculated if needed
      sort_order: category.sort_order || 0,
      seo_title: category.meta_title,
      seo_description: category.meta_description,
      faqs: [], // No FAQs in current structure
      parent_category: null,
      child_categories: []
    }
  } catch (error) {
    console.error('Exception fetching category:', error)
    return null
  }
}

// Get posts by category slug
export async function getPostsByCategory(categorySlug: string, limit: number = 20, offset: number = 0) {
  try {
    // First get the category ID
    const { data: category, error: categoryError } = await supabase
      .from('modern_categories')
      .select('id')
      .eq('slug', categorySlug)
      .eq('is_active', true)
      .single()

    if (categoryError || !category) {
      console.error('Category not found or not active:', categorySlug, categoryError)
      return { posts: [], total: 0 }
    }

    // Get post IDs for this category first
    const { data: postCategories, error: pcError } = await supabase
      .from('modern_post_categories')
      .select('post_id')
      .eq('category_id', category.id)

    if (pcError) {
      console.error('Error fetching post-category relationships:', pcError)
      return { posts: [], total: 0 }
    }

    if (!postCategories || postCategories.length === 0) {
      return { posts: [], total: 0 }
    }

    const postIds = postCategories.map(pc => pc.post_id)

    // Now get the actual posts with all details
    const { data: posts, error: postsError } = await supabase
      .from('cuddly_nest_modern_post')
      .select(`
        id,
        title,
        slug,
        excerpt,
        published_at,
        reading_time,
        created_at,
        og_image,
        status,
        modern_authors(display_name, avatar_url)
      `)
      .in('id', postIds)
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (postsError) {
      console.error('Error fetching posts by category:', postsError)
      return { posts: [], total: 0 }
    }

    // Get total count of published posts for this category
    const { count, error: countError } = await supabase
      .from('cuddly_nest_modern_post')
      .select('*', { count: 'exact', head: true })
      .in('id', postIds)
      .eq('status', 'published')

    if (countError) {
      console.error('Error counting posts by category:', countError)
    }

    // Transform posts data
    const transformedPosts = (posts || []).map(post => ({
      ...post,
      featured_image: post.og_image ? { file_url: post.og_image } : null,
      // Flatten the author structure to avoid nested objects
      author: post.modern_authors ? {
        display_name: post.modern_authors.display_name || 'CuddlyNest Team',
        avatar_url: post.modern_authors.avatar_url
      } : {
        display_name: 'CuddlyNest Team'
      }
    }))

    return { 
      posts: transformedPosts, 
      total: count || 0 
    }
  } catch (error) {
    console.error('Exception fetching posts by category:', error)
    return { posts: [], total: 0 }
  }
}

// Get featured categories for homepage
export async function getFeaturedCategories(limit: number = 6): Promise<ModernCategory[]> {
  try {
    const { data: categories, error } = await supabase
      .from('modern_categories')
      .select(`
        id,
        name,
        slug,
        description,
        color,
        meta_title,
        meta_description,
        is_active,
        sort_order,
        created_at,
        updated_at
      `)
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .limit(limit)

    if (error) {
      console.error('Error fetching featured categories:', error)
      return []
    }

    // Add post count for each category
    const categoriesWithCounts = await Promise.all(
      (categories || []).map(async (category) => {
        const { count } = await supabase
          .from('modern_post_categories')
          .select('*', { count: 'exact', head: true })
          .eq('category_id', category.id)

        return {
          ...category,
          post_count: count || 0,
          is_published: category.is_active,
          is_featured: false, // No is_featured column in DB
          visibility: 'public' as const,
          seo_title: category.meta_title,
          seo_description: category.meta_description
        }
      })
    )

    // Return categories with posts, sorted by post count descending
    return categoriesWithCounts
      .filter(cat => cat.post_count > 0)
      .sort((a, b) => (b.post_count || 0) - (a.post_count || 0))
  } catch (error) {
    console.error('Exception fetching featured categories:', error)
    return []
  }
}

// Search categories
export async function searchCategories(query: string, limit: number = 10): Promise<ModernCategory[]> {
  try {
    if (!query.trim()) {
      return getAllCategories()
    }

    const { data: categories, error } = await supabase
      .from('modern_categories')
      .select(`
        id,
        name,
        slug,
        description,
        color,
        meta_title,
        meta_description,
        is_active,
        created_at,
        updated_at
      `)
      .eq('is_active', true)
      .or(`name.ilike.%${query}%,description.ilike.%${query}%,meta_description.ilike.%${query}%`)
      .order('name', { ascending: true })
      .limit(limit)

    if (error) {
      console.error('Error searching categories:', error)
      return []
    }

    // Add post count for each category
    const categoriesWithCounts = await Promise.all(
      (categories || []).map(async (category) => {
        const { count } = await supabase
          .from('modern_post_categories')
          .select('*', { count: 'exact', head: true })
          .eq('category_id', category.id)

        return {
          ...category,
          post_count: count || 0,
          is_published: category.is_active,
          is_featured: false, // No is_featured column in DB
          visibility: 'public' as const,
          seo_title: category.meta_title,
          seo_description: category.meta_description
        }
      })
    )

    return categoriesWithCounts
  } catch (error) {
    console.error('Exception searching categories:', error)
    return []
  }
}

// ADMIN CATEGORY MANAGEMENT FUNCTIONS (Require authentication)

// Create new category
export async function createCategory(categoryData: Partial<ModernCategory>): Promise<{ success: boolean; data?: ModernCategory; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('categories')
      .insert(categoryData)
      .select()
      .single()

    if (error) {
      console.error('Error creating category:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Exception creating category:', error)
    return { success: false, error: 'Failed to create category' }
  }
}

// Update category
export async function updateCategory(id: string, updates: Partial<ModernCategory>): Promise<{ success: boolean; data?: ModernCategory; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('categories')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating category:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Exception updating category:', error)
    return { success: false, error: 'Failed to update category' }
  }
}

// Delete category
export async function deleteCategory(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting category:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Exception deleting category:', error)
    return { success: false, error: 'Failed to delete category' }
  }
}

// Get all categories for admin (including unpublished)
export async function getAdminCategories(): Promise<ModernCategory[]> {
  try {
    const { data: categories, error } = await supabase
      .from('modern_categories')
      .select('*')
      .order('name', { ascending: true })

    if (error) {
      console.error('Error fetching admin categories:', error)
      return []
    }

    // Transform to match our interface
    const transformedCategories = (categories || []).map(cat => ({
      ...cat,
      is_published: cat.is_active,
      visibility: 'public',
      post_count: 0,
      sort_order: 0,
      faqs: [],
      parent_category: null,
      child_categories: []
    }))

    return transformedCategories
  } catch (error) {
    console.error('Exception fetching admin categories:', error)
    return []
  }
}

// Add/remove post from category
export async function addPostToCategory(postId: string, categoryId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('post_categories')
      .insert({ post_id: postId, category_id: categoryId })

    if (error) {
      console.error('Error adding post to category:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Exception adding post to category:', error)
    return { success: false, error: 'Failed to add post to category' }
  }
}

export async function removePostFromCategory(postId: string, categoryId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('post_categories')
      .delete()
      .eq('post_id', postId)
      .eq('category_id', categoryId)

    if (error) {
      console.error('Error removing post from category:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Exception removing post from category:', error)
    return { success: false, error: 'Failed to remove post from category' }
  }
}

// CATEGORY FAQ MANAGEMENT

// Create FAQ for category
export async function createCategoryFAQ(faqData: Partial<CategoryFAQ>): Promise<{ success: boolean; data?: CategoryFAQ; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('category_faqs')
      .insert(faqData)
      .select()
      .single()

    if (error) {
      console.error('Error creating category FAQ:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Exception creating category FAQ:', error)
    return { success: false, error: 'Failed to create FAQ' }
  }
}

// Update FAQ
export async function updateCategoryFAQ(id: string, updates: Partial<CategoryFAQ>): Promise<{ success: boolean; data?: CategoryFAQ; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('category_faqs')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating FAQ:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Exception updating FAQ:', error)
    return { success: false, error: 'Failed to update FAQ' }
  }
}

// Delete FAQ
export async function deleteCategoryFAQ(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('category_faqs')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting FAQ:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Exception deleting FAQ:', error)
    return { success: false, error: 'Failed to delete FAQ' }
  }
}

// Get popular categories (legacy compatibility)
export async function getPopularCategories(limit: number = 8) {
  return getFeaturedCategories(limit)
}

// Starter Pack interfaces and functions
export interface StarterPackHighlight {
  id: string
  icon: string
  title: string
  value: string
  description: string
  order_index: number
}

export interface StarterPackFeature {
  id: string
  title: string
  content: string
  order_index: number
}

export interface StarterPackSection {
  section_id: string
  section_badge: string
  section_title: string
  section_description: string
  section_position: number
  highlights: StarterPackHighlight[]
  features: StarterPackFeature[]
}

// Get starter pack data for a specific post
export async function getStarterPackForPost(postId: string): Promise<StarterPackSection | null> {
  try {
    const { data, error } = await supabase
      .rpc('get_starter_pack_for_post', { post_id_param: postId })

    if (error) {
      console.error('Error fetching starter pack:', error)
      return null
    }

    if (!data || data.length === 0) {
      return null
    }

    return data[0] as StarterPackSection
  } catch (err) {
    console.error('Exception fetching starter pack:', err)
    return null
  }
}

// Create or update starter pack for a post
export async function createStarterPackSection(
  postId: string,
  badge: string,
  title: string,
  description: string,
  position: number = 3,
  highlights: Array<{
    icon: string
    title: string
    value: string
    description: string
    order_index: number
  }> = [],
  features: Array<{
    title: string
    content: string
    order_index: number
  }> = []
): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .rpc('insert_starter_pack_section', {
        post_id_param: postId,
        badge_param: badge,
        title_param: title,
        description_param: description,
        position_param: position,
        highlights_param: JSON.stringify(highlights),
        features_param: JSON.stringify(features)
      })

    if (error) {
      console.error('Error creating starter pack:', error)
      return null
    }

    return data as string
  } catch (err) {
    console.error('Exception creating starter pack:', err)
    return null
  }
}

// Search posts by title, excerpt, or content
export async function searchPosts(query: string, limit: number = 20) {
  if (!query.trim()) {
    return getRecentPosts(limit)
  }

  const { data: posts, error } = await supabase
    .from('cuddly_nest_modern_post')
    .select(`
      id,
      title,
      slug,
      excerpt,
      published_at,
      reading_time,
      created_at,
      meta_title,
      meta_description,
      og_image,
      status
    `)
    .eq('status', 'published')
    .not('published_at', 'is', null)
    .or(`title.ilike.%${query}%,excerpt.ilike.%${query}%,meta_title.ilike.%${query}%,meta_description.ilike.%${query}%`)
    .order('published_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error searching posts:', error)
    return []
  }

  // Transform posts to use og_image as featured_image
  const postsWithImages = (posts || []).map((post) => ({
    ...post,
    featured_image: post.og_image ? { file_url: post.og_image } : null
  }))

  return postsWithImages
}

// Legacy blog post interfaces for the blog_posts table
export interface LegacyBlogPost {
  id: number
  wp_post_id?: number
  title: string
  slug: string
  content?: string
  excerpt?: string
  status: string
  post_type?: string
  published_at?: string
  modified_at?: string
  author_id?: number
  featured_image_url?: string
  meta_description?: string
  seo_title?: string
  created_at: string
  updated_at: string
  wordpress_id?: number
  blog_sections?: Array<{
    id: number
    post_id: number
    section_type: string
    title?: string
    content: any
    position?: number
    is_active: boolean
  }>
  modern_wordpress_content?: Array<{
    id: string
    position: number
    data: any
  }>
}

export interface LegacyBlogAuthor {
  id: number
  wp_author_id?: number
  login: string
  email: string
  display_name?: string
  first_name?: string
  last_name?: string
  created_at: string
  updated_at: string
  wordpress_id?: number
}

export interface LegacyBlogCategory {
  id: number
  name: string
  slug: string
  description?: string
  created_at: string
  updated_at: string
  wordpress_id?: number
}

// Get legacy blog post by slug with author and categories
export async function getLegacyBlogPostBySlug(slug: string): Promise<LegacyBlogPost | null> {
  try {
    // Use admin client to bypass RLS policies for legacy posts
    const client = supabaseAdmin || supabase
    const { data: postData, error: postError } = await client
      .from('blog_posts')
      .select(`
        *,
        blog_authors(*),
        blog_post_categories(
          blog_categories(*)
        )
      `)
      .eq('slug', slug)
      .or('status.eq.publish,status.eq.published,status.eq.migrated')
      .single()

    if (postError) {
      if (postError.code === 'PGRST116') {
        console.log(`Legacy blog post not found for slug: ${slug}`)
        return null
      }
      console.error('Error fetching legacy blog post:', postError.message)
      return null
    }

    if (!postData) {
      return null
    }

    // No longer fetching WordPress content from sections
    let modernWordPressContent: any[] = []

    // Also fetch legacy blog sections as fallback
    const { data: sectionsData, error: sectionsError } = await client
      .from('blog_sections')
      .select('*')
      .eq('post_id', postData.id)
      .eq('is_active', true)
      .order('position', { ascending: true })

    if (sectionsError) {
      console.warn('Warning: Could not fetch sections for legacy post:', sectionsError.message)
    }

    // Add both sections to the post data
    const postWithSections = {
      ...postData,
      blog_sections: sectionsData || [],
      modern_wordpress_content: modernWordPressContent
    }

    return postWithSections
  } catch (error) {
    console.error('Exception fetching legacy blog post:', error)
    return null
  }
}

// Get all published legacy blog posts for migration or listing
export async function getLegacyBlogPosts(limit: number = 50, offset: number = 0): Promise<LegacyBlogPost[]> {
  try {
    // Use admin client to bypass RLS policies for legacy posts
    const client = supabaseAdmin || supabase
    const { data: posts, error } = await client
      .from('blog_posts')
      .select(`
        *,
        blog_authors(*),
        blog_post_categories(
          blog_categories(*)
        )
      `)
      .or('status.eq.publish,status.eq.published,status.eq.migrated')
      .not('published_at', 'is', null)
      .order('published_at', { ascending: false })
      .range(offset, offset + (limit * 2) - 1) // Get more to filter out nulls

    if (error) {
      console.error('Error fetching legacy blog posts:', error)
      return []
    }

    // Filter out posts with null status and limit results
    const filteredPosts = (posts || [])
      .filter(post => post.status && ['publish', 'published', 'migrated'].includes(post.status))
      .slice(0, limit)

    return filteredPosts
  } catch (error) {
    console.error('Exception fetching legacy blog posts:', error)
    return []
  }
}

// Search legacy blog posts
export async function searchLegacyBlogPosts(query: string, limit: number = 20): Promise<LegacyBlogPost[]> {
  try {
    if (!query.trim()) {
      return getLegacyBlogPosts(limit)
    }

    // Use admin client to bypass RLS policies for legacy posts
    const client = supabaseAdmin || supabase
    const { data: posts, error } = await client
      .from('blog_posts')
      .select(`
        *,
        blog_authors(*),
        blog_post_categories(
          blog_categories(*)
        )
      `)
      .or('status.eq.publish,status.eq.published,status.eq.migrated')
      .not('published_at', 'is', null)
      .or(`title.ilike.%${query}%,content.ilike.%${query}%,excerpt.ilike.%${query}%`)
      .order('published_at', { ascending: false })
      .limit(limit * 2) // Get more to filter out nulls

    if (error) {
      console.error('Error searching legacy blog posts:', error)
      return []
    }

    // Filter out posts with null status and limit results
    const filteredPosts = (posts || [])
      .filter(post => {
        const hasValidStatus = post.status && ['publish', 'published', 'migrated'].includes(post.status)
        if (!hasValidStatus) {
          console.log('Filtering out legacy post with invalid status:', post.id, post.title, post.status)
        }
        return hasValidStatus
      })
      .slice(0, limit)

    console.log(`searchLegacyBlogPosts: Found ${posts?.length} posts, filtered to ${filteredPosts.length}`)
    return filteredPosts
  } catch (error) {
    console.error('Exception searching legacy blog posts:', error)
    return []
  }
}

// Get recent legacy blog posts for homepage
export async function getRecentLegacyPosts(limit: number = 8) {
  try {
    // Use admin client to bypass RLS policies for legacy posts
    const client = supabaseAdmin || supabase
    const { data: posts, error } = await client
      .from('blog_posts')
      .select(`
        id,
        title,
        slug,
        excerpt,
        published_at,
        created_at,
        featured_image_url,
        blog_authors(display_name)
      `)
      .or('status.eq.publish,status.eq.published,status.eq.migrated')
      .order('published_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching recent legacy posts:', error)
      return []
    }

    // Transform posts to match the expected format
    const postsWithImages = (posts || []).map((post) => ({
      id: post.id.toString(),
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      published_at: post.published_at,
      created_at: post.created_at,
      reading_time: 5, // Default reading time
      featured_image: post.featured_image_url ? { file_url: post.featured_image_url } : null
    }))

    return postsWithImages
  } catch (error) {
    console.error('Exception fetching recent legacy posts:', error)
    return []
  }
}

// Get combined recent posts (modern + legacy)
export async function getCombinedRecentPosts(limit: number = 8) {
  try {
    // Get modern posts
    const modernPosts = await getRecentPosts(Math.ceil(limit / 2))
    
    // Get legacy posts
    const legacyPosts = await getRecentLegacyPosts(limit - modernPosts.length)
    
    // Combine and sort by published_at
    const combinedPosts = [...modernPosts, ...legacyPosts].sort((a, b) => {
      const dateA = new Date(a.published_at || a.created_at)
      const dateB = new Date(b.published_at || b.created_at)
      return dateB.getTime() - dateA.getTime()
    })

    return combinedPosts.slice(0, limit)
  } catch (error) {
    console.error('Exception getting combined recent posts:', error)
    return []
  }
}

// Combined search for both modern and legacy posts
export async function searchCombinedPosts(query: string, limit: number = 20) {
  try {
    if (!query.trim()) {
      return getCombinedRecentPosts(limit)
    }

    // Search both modern and legacy posts
    const [modernPosts, legacyPosts] = await Promise.all([
      searchPosts(query, Math.ceil(limit / 2)),
      searchLegacyBlogPosts(query, Math.ceil(limit / 2))
    ])

    // Transform legacy posts to match modern post format
    const transformedLegacyPosts = legacyPosts.map((post) => ({
      id: post.id.toString(),
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      published_at: post.published_at,
      created_at: post.created_at,
      reading_time: 5, // Default reading time
      featured_image: post.featured_image_url ? { file_url: post.featured_image_url } : null
    }))

    // Combine and sort by relevance/date
    const combinedPosts = [...modernPosts, ...transformedLegacyPosts].sort((a, b) => {
      const dateA = new Date(a.published_at || a.created_at)
      const dateB = new Date(b.published_at || b.created_at)
      return dateB.getTime() - dateA.getTime()
    })

    return combinedPosts.slice(0, limit)
  } catch (error) {
    console.error('Exception searching combined posts:', error)
    return []
  }
}

// =============================================
// SIMPLIFIED CUDDLY NEST MODERN POST FUNCTIONS
// =============================================

export interface CuddlyNestCTA {
  id: string
  post_id: string
  title: string
  description?: string
  button_text: string
  button_link: string
  position: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CuddlyNestPost {
  id: string
  title: string
  slug: string
  content?: string
  excerpt?: string
  featured_image_url?: string
  featured_image_alt?: string
  author_id: string
  status: 'draft' | 'published' | 'archived'
  published_at?: string
  scheduled_at?: string
  
  // SEO fields
  meta_title?: string
  meta_description?: string
  seo_title?: string
  seo_description?: string
  seo_keywords?: string
  canonical_url?: string
  
  // Open Graph
  og_title?: string
  og_description?: string
  og_image?: string
  og_image_alt?: string
  
  // Twitter
  twitter_title?: string
  twitter_description?: string
  twitter_image?: string
  twitter_image_alt?: string
  
  // SEO robots
  robots_index?: boolean
  robots_follow?: boolean
  robots_nosnippet?: boolean
  
  // Post features
  allow_comments?: boolean
  is_featured?: boolean
  view_count?: number
  reading_time?: number
  
  // Legacy compatibility
  original_wp_id?: number
  wp_post_id?: number
  
  // Timestamps
  created_at: string
  updated_at: string
  
  // Relations (joined data)
  author?: {
    id: string
    display_name: string
    avatar_url?: string
    bio?: string
  }
  categories?: {
    id: string
    name: string
    slug: string
  }[]
  ctas?: CuddlyNestCTA[]
}

// Get simplified post by slug
export async function getCuddlyNestPostBySlug(slug: string): Promise<CuddlyNestPost | null> {
  try {
    const { data: post, error } = await supabase
      .from('cuddly_nest_modern_post')
      .select(`
        *,
        author:modern_authors(id, display_name, avatar_url, bio),
        categories:cuddly_nest_post_categories(
          category:modern_categories(id, name, slug)
        ),
        ctas:cuddly_nest_ctas(id, title, description, button_text, button_link, position, is_active)
      `)
      .eq('slug', slug)
      .eq('status', 'published')
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      console.error('Error fetching cuddly nest post:', error)
      return null
    }

    return {
      ...post,
      // Flatten the author structure to avoid nested objects
      author: post.author ? {
        id: post.author.id,
        display_name: post.author.display_name,
        avatar_url: post.author.avatar_url,
        bio: post.author.bio
      } : undefined,
      categories: post.categories?.map((pc: any) => pc.category).filter(Boolean) || [],
      ctas: post.ctas?.filter((cta: any) => cta.is_active) || []
    }
  } catch (error) {
    console.error('Exception fetching cuddly nest post:', error)
    return null
  }
}

// Get simplified post by slug with preview support (can return drafts)
export async function getCuddlyNestPostBySlugWithPreview(slug: string, allowDraft: boolean = false): Promise<CuddlyNestPost | null> {
  try {
    // Use admin client for preview functionality to bypass RLS policies
    const client = (allowDraft && supabaseAdmin) ? supabaseAdmin : supabase
    
    let query = client
      .from('cuddly_nest_modern_post')
      .select(`
        *,
        author:modern_authors(id, display_name, avatar_url, bio),
        categories:cuddly_nest_post_categories(
          category:modern_categories(id, name, slug)
        ),
        ctas:cuddly_nest_ctas(id, title, description, button_text, button_link, position, is_active)
      `)
      .eq('slug', slug)

    // Only filter by published status if not allowing drafts
    if (!allowDraft) {
      query = query.eq('status', 'published')
    }

    const { data: post, error } = await query.single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      console.error('Error fetching cuddly nest post with preview:', error)
      return null
    }

    return {
      ...post,
      // Flatten the author structure to avoid nested objects
      author: post.author ? {
        id: post.author.id,
        display_name: post.author.display_name,
        avatar_url: post.author.avatar_url,
        bio: post.author.bio
      } : undefined,
      categories: post.categories?.map((pc: any) => pc.category).filter(Boolean) || [],
      ctas: post.ctas?.filter((cta: any) => cta.is_active) || []
    }
  } catch (error) {
    console.error('Exception fetching cuddly nest post with preview:', error)
    return null
  }
}

// Get simplified posts for homepage/listing
export async function getCuddlyNestPosts(limit: number = 20, offset: number = 0) {
  try {
    const { data: posts, error } = await supabase
      .from('cuddly_nest_modern_post')
      .select(`
        id,
        title,
        slug,
        excerpt,
        featured_image_url,
        featured_image_alt,
        published_at,
        reading_time,
        view_count,
        is_featured,
        author:modern_authors(id, display_name, avatar_url),
        categories:cuddly_nest_post_categories(
          category:modern_categories(id, name, slug)
        )
      `)
      .eq('status', 'published')
      .not('published_at', 'is', null)
      .order('published_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Error fetching cuddly nest posts:', error)
      return []
    }

    return posts?.map(post => ({
      ...post,
      // Flatten the author structure to avoid nested objects
      author: post.author ? {
        id: post.author.id,
        display_name: post.author.display_name,
        avatar_url: post.author.avatar_url,
        bio: post.author.bio
      } : undefined,
      categories: post.categories?.map((pc: any) => pc.category).filter(Boolean) || []
    })) || []
  } catch (error) {
    console.error('Exception fetching cuddly nest posts:', error)
    return []
  }
}

// Get featured posts for homepage
export async function getFeaturedCuddlyNestPosts(limit: number = 5) {
  try {
    const { data: posts, error } = await supabase
      .from('cuddly_nest_modern_post')
      .select(`
        id,
        title,
        slug,
        excerpt,
        featured_image_url,
        featured_image_alt,
        published_at,
        reading_time,
        view_count,
        author:modern_authors(id, display_name, avatar_url),
        categories:cuddly_nest_post_categories(
          category:modern_categories(id, name, slug)
        )
      `)
      .eq('status', 'published')
      .eq('is_featured', true)
      .not('published_at', 'is', null)
      .order('published_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching featured cuddly nest posts:', error)
      return []
    }

    return posts?.map(post => ({
      ...post,
      // Flatten the author structure to avoid nested objects
      author: post.author ? {
        id: post.author.id,
        display_name: post.author.display_name,
        avatar_url: post.author.avatar_url,
        bio: post.author.bio
      } : undefined,
      categories: post.categories?.map((pc: any) => pc.category).filter(Boolean) || []
    })) || []
  } catch (error) {
    console.error('Exception fetching featured cuddly nest posts:', error)
    return []
  }
}

// Search simplified posts
export async function searchCuddlyNestPosts(query: string, limit: number = 10) {
  try {
    const { data: posts, error } = await supabase
      .from('cuddly_nest_modern_post')
      .select(`
        id,
        title,
        slug,
        excerpt,
        featured_image_url,
        featured_image_alt,
        published_at,
        reading_time,
        author:modern_authors(id, display_name, avatar_url)
      `)
      .eq('status', 'published')
      .or(`title.ilike.%${query}%,excerpt.ilike.%${query}%,content.ilike.%${query}%`)
      .not('published_at', 'is', null)
      .order('published_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error searching cuddly nest posts:', error)
      return []
    }

    return posts?.map(post => ({
      ...post,
      // Flatten the author structure to avoid nested objects
      author: post.author ? {
        id: post.author.id,
        display_name: post.author.display_name,
        avatar_url: post.author.avatar_url
      } : undefined
    })) || []
  } catch (error) {
    console.error('Exception searching cuddly nest posts:', error)
    return []
  }
}