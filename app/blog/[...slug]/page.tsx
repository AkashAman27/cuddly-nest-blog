import { getStarterPackForPost, getCuddlyNestPostBySlug, getCuddlyNestPostBySlugWithPreview, supabase } from "@/lib/supabase"
import { notFound } from "next/navigation"
import Link from "next/link"
import { BlogArticleTemplate } from "@/components/blog-article-template"
import { calculateReadingTime, formatReadingTime } from "@/lib/utils/reading-time"
// Simple converter function for legacy posts
const convertAnyPostToArticle = (post: any) => {
  // Calculate reading time if not already stored
  const readingMinutes = post.reading_time || calculateReadingTime(post.content || '')
  
  return {
    ...post,
    publishedAt: post.published_at || post.created_at,
    featured_image: post.featured_image_url ? { file_url: post.featured_image_url } : null,
    og_image: post.og_image ? { file_url: post.og_image } : null,
    author: post.author || { display_name: 'CuddlyNest Team' },
    read_time: formatReadingTime(readingMinutes),
    sections: [],
    faqs: post.faq_items || [],
    ctas: post.ctas || []
  }
}
import { cookies } from 'next/headers'

interface BlogPostPageProps {
  params: Promise<{
    slug: string[]
  }>
  searchParams: Promise<{
    preview?: string
    draft?: string
  }>
}

export default async function BlogPostPage({ params, searchParams }: BlogPostPageProps) {
  try {
    const resolvedParams = await params
    const resolvedSearchParams = await searchParams
    const isPreview = resolvedSearchParams.preview === 'true'
    const isDraft = resolvedSearchParams.draft === 'true'
  
    // Parse the slug array to determine country, language, and post slug
    const slugArray = resolvedParams.slug
    console.log('🔍 BlogPostPage accessed with slug array:', slugArray)
    
    let country: string | null = null
    let language: string = 'en' // Default language
    let postSlug: string | null = null
    let fullSlug: string | null = null

    const validLanguageCodes = ['fr', 'it', 'de', 'es']

    if (slugArray.length === 2) {
      // Check if second part is a language code: /blog/post-name/fr
      if (validLanguageCodes.includes(slugArray[1])) {
        // Format: /blog/post-name/lang
        postSlug = slugArray[0]
        language = slugArray[1]
        fullSlug = postSlug
      } else {
        // Format: /blog/country/post-name  
        country = slugArray[0]
        postSlug = slugArray[1]
        fullSlug = `${country}/${postSlug}`
      }
    } else if (slugArray.length === 3) {
      // Check if middle part is a language code: /blog/thailand/fr/post-name
      if (validLanguageCodes.includes(slugArray[1])) {
        // Format: /blog/country/lang/post-name
        country = slugArray[0]
        language = slugArray[1]
        postSlug = slugArray[2]
        fullSlug = `${country}/${postSlug}` // Database stores as country/post-name
      } else {
        // Format: /blog/country/category/post-name (fallback)
        country = slugArray[0]
        postSlug = `${slugArray[1]}/${slugArray[2]}`
        fullSlug = `${country}/${postSlug}`
      }
    } else if (slugArray.length === 1) {
      // Fallback for old format: /blog/post-name
      postSlug = slugArray[0]
      fullSlug = postSlug
    } else {
      // Invalid URL structure
      notFound()
    }

    console.log('URL parsing debug:', {
      originalSlugArray: slugArray,
      country,
      language,
      postSlug,
      fullSlug
    })
    
    console.log('About to query for post with:', { fullSlug, postSlug })
  
  // Check authentication for preview mode
  if (isPreview || isDraft) {
    const cookieStore = await cookies()
    
    // Check for various possible Supabase cookie names
    const possibleCookieNames = [
      'sb-access-token',
      'sb-refresh-token', 
      'supabase-auth-token',
      'supabase.auth.token',
      `sb-${process.env.NEXT_PUBLIC_SUPABASE_URL?.split('//')[1]?.split('.')[0]}-auth-token`,
      `supabase-auth-token-${process.env.NEXT_PUBLIC_SUPABASE_URL?.split('//')[1]?.split('.')[0]}`
    ]
    
    let hasAuthCookie = false
    for (const cookieName of possibleCookieNames) {
      if (cookieName && cookieStore.get(cookieName)) {
        hasAuthCookie = true
        break
      }
    }
    
    // Also check for any cookie that contains 'supabase' or 'sb-'
    const allCookies = cookieStore.getAll()
    if (!hasAuthCookie) {
      hasAuthCookie = allCookies.some(cookie => 
        cookie.name.includes('supabase') || 
        cookie.name.includes('sb-') ||
        cookie.name.includes('auth')
      )
    }
    
    console.log('🔐 Auth check:', { 
      isDraft, 
      hasAuthCookie, 
      cookieCount: allCookies.length,
      cookieNames: allCookies.map(c => c.name)
    })
    
    // For draft mode, we use service role key for access (since this is admin functionality)
    // The security comes from the fact that only admins know about draft preview URLs
    // and service role key is only available server-side
    
    // Skip authentication check for now - service role key provides security
    // TODO: Implement proper cross-tab session sharing for production
    if (isDraft && false) { // Disabled for now
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Draft Preview Access Required</h1>
            <p className="text-gray-600 mb-6">
              You need to be logged in to preview draft posts. Please sign in through the admin panel first, then try the preview again.
            </p>
            <Link href="/admin" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md inline-block">
              Sign In to Admin Panel
            </Link>
            <p className="text-xs text-gray-500 mt-4">
              Debug: Found {allCookies.length} cookies
            </p>
          </div>
        </div>
      )
    }
  }
  
  let post = null
  let translationPost = null
  let simplifiedPost = null

  // FIRST: Try our new simplified cuddly_nest_modern_post table
  if (postSlug) {
    simplifiedPost = (isPreview || isDraft) 
      ? await getCuddlyNestPostBySlugWithPreview(postSlug, true)
      : await getCuddlyNestPostBySlug(postSlug)
    if (simplifiedPost) {
      console.log('✅ Found post in simplified cuddly_nest_modern_post table:', {
        id: simplifiedPost.id,
        title: simplifiedPost.title,
        hasContent: !!simplifiedPost.content
      })
      
      // Set post for translation logic below
      post = simplifiedPost
    }
  }

  // If this is a translation URL (language is not 'en'), first try to find the translation directly
  if (language !== 'en' && postSlug) {
    try {
      // Construct the translated_slug that should be stored in database
      const lookupSlug = country ? `${country}/${postSlug}` : postSlug
      
      const { data: translationData } = await supabase
        .from('post_translations')
        .select(`
          *,
          original_post:cuddly_nest_modern_post!inner(*)
        `)
        .eq('language_code', language)
        .eq('translated_slug', lookupSlug)
        .eq('translation_status', 'completed')
        .single()

      if (translationData) {
        console.log('Found direct translation:', { 
          translationId: translationData.id, 
          language: translationData.language_code,
          slug: translationData.translated_slug,
          lookupSlug
        })
        translationPost = translationData
        post = translationData.original_post
      }
    } catch (error) {
      console.log('No direct translation found, trying original post lookup')
    }
  }

  // If no translation found, try original post lookup
  if (!post) {
    // First try to get modern post with full slug (new format), then fallback to postSlug (original format)
    post = (isPreview || isDraft) 
      ? await getCuddlyNestPostBySlugWithPreview(fullSlug, true)
      : await getCuddlyNestPostBySlug(fullSlug)
    
    console.log('First query result:', { found: !!post, searchedSlug: fullSlug, isPreview, isDraft })
    
    // If not found with full slug, try with just the post slug (original format)
    if (!post && postSlug) {
      post = (isPreview || isDraft) 
        ? await getCuddlyNestPostBySlugWithPreview(postSlug, true)
        : await getCuddlyNestPostBySlug(postSlug)
      
      console.log('Fallback query result:', { found: !!post, searchedSlug: postSlug })
    }
  }
  
  if (!post) {
    notFound()
  }

  let translatedPost = post
  let translations = null
  
  try {
    // Get available translations for this post
    if (post && post.id) {
      const { data: translationData } = await supabase
        .from('post_translations')
        .select('language_code, translated_slug, translation_status')
        .eq('original_post_id', post.id)
        .eq('translation_status', 'completed')
      
      translations = translationData
      
      // If we have a direct translation (from URL), use it
      if (translationPost && post) {
        try {
          console.log('Processing translation data:', {
            translationId: translationPost.id,
            hasTitle: !!translationPost.translated_title,
            hasExcerpt: !!translationPost.translated_excerpt,
            hasContent: !!translationPost.translated_content,
            contentType: typeof translationPost.translated_content,
            contentLength: translationPost.translated_content?.length || 0
          })

          translatedPost = {
            ...post,
            title: translationPost.translated_title || post.title,
            excerpt: translationPost.translated_excerpt || post.excerpt,
            content: translationPost.translated_content || post.content,
            // Apply SEO data from translation if available
            ...(translationPost.seo_data || {})
          }
          
          console.log('Translation processing successful')
        } catch (error) {
          console.error('Error processing translation data:', error)
          console.error('Translation post data:', translationPost)
          // Fallback to original post if translation processing fails
          translatedPost = post
        }
      } 
      // Otherwise, handle translation content for non-English languages (legacy method)
      else if (language !== 'en' && translations && translations.length > 0) {
        const translation = translations.find(t => t.language_code === language)
        if (translation) {
          // Get the translated content
          const { data: translationContent } = await supabase
            .from('post_translations')
            .select('translated_title, translated_excerpt, translated_content, seo_data')
            .eq('original_post_id', post.id)
            .eq('language_code', language)
            .single()

          if (translationContent && post) {
            try {
              // Merge translation data with original post
              translatedPost = {
                ...post,
                title: translationContent.translated_title || post.title,
                excerpt: translationContent.translated_excerpt || post.excerpt,
                content: translationContent.translated_content || post.content,
                // Apply SEO data from translation if available
                ...(translationContent.seo_data || {})
              }
            } catch (error) {
              console.error('Error merging translation content:', error)
              translatedPost = post // Fallback to original post
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('Error fetching translations:', error)
    translations = null
  }

  // Get starter pack data for this post (only for modern posts)  
  let starterPackData = null
  try {
    if (post) {
      starterPackData = await getStarterPackForPost(post.id)
    }
  } catch (error) {
    console.error('Error fetching starter pack data:', error)
  }

  // Note: Starter pack data injection removed since we no longer use sections

  // JSON-LD structured data for SEO
  const jsonLd = translatedPost ? {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: translatedPost.title || 'Untitled Post',
    description: translatedPost.excerpt || '',
    image: translatedPost.og_image?.file_url || '',
    datePublished: translatedPost.published_at || translatedPost.created_at,
    dateModified: translatedPost.updated_at || translatedPost.published_at || translatedPost.created_at,
    author: {
      '@type': 'Person',
      name: translatedPost.author?.display_name || 'CuddlyNest Travel Team',
    },
    publisher: {
      '@type': 'Organization',
      name: 'CuddlyNest',
      logo: {
        '@type': 'ImageObject',
        url: 'https://cuddlynest.com/logo.png',
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://cuddlynest.com/blog/${slugArray.join('/')}`,
    },
    articleSection: 'Travel Guide',
    keywords: translatedPost.meta_keywords || `travel, ${translatedPost.title || 'travel guide'}`,
  } : {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'Post Not Found',
    description: 'The requested post could not be found.',
  }

  // Use universal converter for all modern posts
  if (translatedPost) {
    try {
      const articleData = convertAnyPostToArticle(translatedPost)
      
      return (
        <>
          {/* JSON-LD Structured Data */}
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
          />
          <BlogArticleTemplate 
            article={articleData} 
            availableTranslations={translations || []} 
          />
        </>
      )
    } catch (error) {
      console.error('Error in universal converter:', error)
      // Fall through to section-based rendering
    }
  }

  // Ensure we have a valid post to render
  if (!translatedPost) {
    console.error('No translated post available for rendering')
    notFound()
  }

  // For any remaining section-based or modern posts, use universal converter
  try {
    console.log('🔄 Converting post using universal converter:', {
      id: translatedPost.id,
      title: translatedPost.title,
      type: 'modern'
    })
    
    const articleData = convertAnyPostToArticle(translatedPost)
    
    const fallbackJsonLd = {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: translatedPost.title,
      description: translatedPost.excerpt || '',
      image: translatedPost.featured_image_url || articleData.og_image?.file_url || '',
      datePublished: translatedPost.published_at,
      dateModified: translatedPost.updated_at,
      author: {
        '@type': 'Person',
        name: articleData.author.display_name,
      },
      publisher: {
        '@type': 'Organization',
        name: 'CuddlyNest',
        logo: {
          '@type': 'ImageObject',
          url: 'https://cuddlynest.com/logo.png',
        },
      },
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': `https://cuddlynest.com/blog/${fullSlug}`,
      },
      articleSection: 'Travel Guide',
      keywords: translatedPost.meta_keywords || `travel, ${translatedPost.title}`,
    }

    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(fallbackJsonLd) }}
        />
        <BlogArticleTemplate 
          article={articleData} 
          availableTranslations={translations || []}
        />
      </>
    )
  } catch (error) {
    console.error('❌ Error converting post with universal converter:', error)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Content Error</h1>
          <p className="text-gray-600 mb-6">
            There was an error processing this blog post content.
          </p>
          <Link href="/blog" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md inline-block">
            Back to Blog
          </Link>
        </div>
      </div>
    )
  }
  } catch (error) {
    console.error('Error in BlogPostPage:', error)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Page Error</h1>
          <p className="text-gray-600 mb-6">
            There was an error loading this page. Please try again later.
          </p>
          <p className="text-sm text-gray-500">
            Error: {error instanceof Error ? error.message : 'Unknown error'}
          </p>
        </div>
      </div>
    )
  }
}

// Generate metadata for SEO with hreflang support
export async function generateMetadata({ params }: BlogPostPageProps) {
  const resolvedParams = await params
  
  // Parse the slug array to determine country, language, and post slug
  const slugArray = resolvedParams.slug
  let country: string | null = null
  let language: string = 'en'
  let postSlug: string | null = null
  let fullSlug: string | null = null

  if (slugArray.length === 2) {
    country = slugArray[0]
    postSlug = slugArray[1]
    fullSlug = `${country}/${postSlug}`
  } else if (slugArray.length === 3) {
    country = slugArray[0]
    language = slugArray[1]
    postSlug = slugArray[2]
    fullSlug = `${country}/${postSlug}`
  } else if (slugArray.length === 1) {
    postSlug = slugArray[0]
    fullSlug = postSlug
  } else {
    return {
      title: 'Page Not Found',
      description: 'The requested page could not be found.'
    }
  }
  
  // First try to get modern post with full slug, then fallback to postSlug
  let post = await getCuddlyNestPostBySlug(fullSlug)
  
  // If not found with full slug, try with just the post slug (original format)
  if (!post && postSlug) {
    post = await getCuddlyNestPostBySlug(postSlug)
  }
  
  if (!post) {
    return {
      title: 'Post Not Found',
      description: 'The requested post could not be found.'
    }
  }

  // Get all translations for hreflang
  const { data: allTranslations } = await supabase
    .from('post_translations')
    .select('language_code, translated_slug')
    .eq('original_post_id', post.id)
    .eq('translation_status', 'completed')

  // Build bi-directional comprehensive hreflang object with English as x-default
  const languages: Record<string, string> = {}
  
  // Always set English as x-default (the canonical original version)
  const originalUrl = country ? `/blog/${country}/${postSlug}` : `/blog/${postSlug}`
  languages['x-default'] = originalUrl
  languages['en'] = originalUrl
  languages['en-US'] = originalUrl // Also target US specifically
  
  // Add all completed translations with proper bi-directional structure
  if (allTranslations && allTranslations.length > 0) {
    allTranslations.forEach(translation => {
      // Get the actual translated slug from the translation
      const translatedSlugParts = translation.translated_slug?.split('/') || []
      
      if (translatedSlugParts.length >= 2) {
        // Has country: thailand/translated-post -> /blog/thailand/fr/translated-post
        const translatedCountry = translatedSlugParts[0]
        const translatedPostSlug = translatedSlugParts.slice(1).join('/')
        const translationUrl = `/blog/${translatedCountry}/${translation.language_code}/${translatedPostSlug}`
        
        languages[translation.language_code] = translationUrl
        
        // Also add country-specific locales for better targeting
        if (translation.language_code === 'fr') {
          languages['fr-FR'] = translationUrl
        } else if (translation.language_code === 'it') {
          languages['it-IT'] = translationUrl
        } else if (translation.language_code === 'de') {
          languages['de-DE'] = translationUrl
        } else if (translation.language_code === 'es') {
          languages['es-ES'] = translationUrl
        }
      } else {
        // No country: translated-post -> /blog/translated-post/fr
        const translationUrl = `/blog/${translation.translated_slug}/${translation.language_code}`
        
        languages[translation.language_code] = translationUrl
        
        // Also add country-specific locales
        if (translation.language_code === 'fr') {
          languages['fr-FR'] = translationUrl
        } else if (translation.language_code === 'it') {
          languages['it-IT'] = translationUrl
        } else if (translation.language_code === 'de') {
          languages['de-DE'] = translationUrl
        } else if (translation.language_code === 'es') {
          languages['es-ES'] = translationUrl
        }
      }
    })
  }

  // Handle translated metadata if this is a non-English page
  let finalTitle = post.seo_title || post.title
  let finalDescription = post.seo_description || post.excerpt
  
  if (language !== 'en' && allTranslations) {
    const translation = allTranslations.find(t => t.language_code === language)
    if (translation) {
      const { data: translationData } = await supabase
        .from('post_translations')
        .select('translated_title, translated_excerpt, seo_data')
        .eq('original_post_id', post.id)
        .eq('language_code', language)
        .single()

      if (translationData) {
        finalTitle = translationData.seo_data?.seo_title || translationData.translated_title || finalTitle
        finalDescription = translationData.seo_data?.seo_description || translationData.translated_excerpt || finalDescription
      }
    }
  }

  return {
    title: finalTitle,
    description: finalDescription,
    keywords: post.meta_keywords || `travel, ${post.title}, travel guide`,
    alternates: {
      canonical: `/blog/${slugArray.join('/')}`,
      languages: languages
    },
    openGraph: {
      title: post.og_title || finalTitle,
      description: post.og_description || finalDescription,
      type: 'article',
      locale: language,
      alternateLocale: allTranslations?.map(t => t.language_code) || [],
      publishedTime: post.published_at,
      modifiedTime: post.updated_at || post.published_at,
      authors: [post.author?.display_name || 'CuddlyNest Travel Team'],
      images: post.og_image?.file_url ? [{
        url: post.og_image.file_url,
        alt: post.og_image_alt || post.title
      }] : []
    },
    twitter: {
      card: 'summary_large_image',
      site: '@cuddlynest',
      title: post.twitter_title || post.og_title || finalTitle,
      description: post.twitter_description || post.og_description || finalDescription,
      images: post.twitter_image || post.og_image?.file_url ? [{
        url: post.twitter_image || post.og_image?.file_url,
        alt: post.twitter_image_alt || post.og_image_alt || post.title
      }] : []
    },
    robots: {
      index: post.robots_index !== false,
      follow: post.robots_follow !== false,
      nosnippet: post.robots_nosnippet === true,
      googleBot: {
        index: post.robots_index !== false,
        follow: post.robots_follow !== false,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  }
}