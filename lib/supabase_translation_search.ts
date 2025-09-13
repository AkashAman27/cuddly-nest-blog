import { supabase } from './supabase'

// Search posts including translated posts for admin
export async function searchPostsWithTranslations(query: string, limit: number = 20) {
  if (!query.trim()) {
    return []
  }

  try {
    // Search original posts
    const { data: originalPosts, error: originalError } = await supabase
      .from('cuddly_nest_modern_post')
      .select(`
        id,
        title,
        slug,
        excerpt,
        published_at,
        reading_time,
        created_at,
        status
      `)
      .or(`title.ilike.%${query}%,excerpt.ilike.%${query}%,slug.ilike.%${query}%`)
      .order('updated_at', { ascending: false })
      .limit(limit)

    if (originalError) {
      console.error('Error searching original posts:', originalError)
    }

    // Search translated posts
    const { data: translatedPosts, error: translationError } = await supabase
      .from('post_translations')
      .select(`
        id,
        translated_title,
        translated_slug,
        translated_excerpt,
        language_code,
        translation_status,
        created_at,
        original_post_id,
        original_post:modern_posts!original_post_id(
          title,
          slug,
          status
        )
      `)
      .or(`translated_title.ilike.%${query}%,translated_excerpt.ilike.%${query}%,translated_slug.ilike.%${query}%`)
      .order('updated_at', { ascending: false })
      .limit(limit)

    if (translationError) {
      console.error('Error searching translated posts:', translationError)
    }

    // Combine and format results
    const results = []

    // Add original posts
    if (originalPosts) {
      results.push(...originalPosts.map(post => ({
        ...post,
        type: 'original',
        displayTitle: post.title,
        displaySlug: post.slug,
        displayExcerpt: post.excerpt,
        language: 'en'
      })))
    }

    // Add translated posts
    if (translatedPosts) {
      results.push(...translatedPosts.map(translation => ({
        id: translation.id,
        title: translation.translated_title,
        slug: translation.translated_slug,
        excerpt: translation.translated_excerpt,
        created_at: translation.created_at,
        type: 'translation',
        displayTitle: `${translation.translated_title} (${translation.language_code.toUpperCase()})`,
        displaySlug: `${translation.original_post?.slug}/${translation.language_code}`,
        displayExcerpt: translation.translated_excerpt,
        language: translation.language_code,
        status: translation.translation_status,
        originalPost: translation.original_post,
        originalPostId: translation.original_post_id
      })))
    }

    // Sort all results by creation date
    results.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    return results.slice(0, limit)
  } catch (error) {
    console.error('Error in searchPostsWithTranslations:', error)
    return []
  }
}