/**
 * Universal Blog Post Converter
 * 
 * This utility converts any post type (modern, legacy, section-based) 
 * into the unified BlogArticleData format for use with BlogArticleTemplate.
 * 
 * Part of the Blog Template Unification project.
 */

// Enhanced BlogArticleData interface with support for all content types
export interface BlogArticleData {
  id: string
  title: string
  excerpt?: string
  slug: string
  author: {
    display_name: string
    bio?: string
    avatar?: string
  }
  published_at: string
  updated_at?: string
  read_time: string
  seo_title?: string
  seo_description?: string
  meta_keywords?: string
  og_image: {
    file_url: string
  }
  featured_image?: {
    file_url: string
  }
  content: string // Rich HTML content with embedded components
  images?: Array<{
    src: string
    alt: string
    caption?: string
  }>
  faqs?: Array<{
    id: string | number
    question: string
    answer: string
  }>
  status: string
  categories?: string[]
  // Enhanced fields for unified template
  embedded_components?: Array<{
    type: string
    position: number
    data: any
  }>
  hotels?: Array<{
    id: string
    name: string
    image: string
    rating: number
    price: string
    location: string
    amenities: string[]
  }>
  itinerary?: Array<{
    day: number
    title: string
    activities: Array<{
      time: string
      activity: string
      location: string
      description?: string
    }>
  }>
  budget_info?: {
    total_range: string
    breakdown: Array<{
      category: string
      amount: string
      description: string
    }>
  }
  travel_tips?: Array<{
    category: string
    tips: string[]
  }>
  starter_pack_data?: any
}

// Section type mapping for conversion
interface ModernSection {
  id: string
  template_id: string
  title?: string
  data: any
  position: number
  is_active: boolean
  template?: {
    name: string
    component_name: string
    category: string
  }
}

/**
 * Universal converter function that handles all post types
 */
export function convertAnyPostToArticle(post: any): BlogArticleData {
  console.log('🔄 Converting post to article:', {
    id: post.id,
    title: post.title,
    hasContent: !!post.content,
    hasSections: !!(post.sections && post.sections.length > 0),
    hasOriginalWpId: !!post.original_wp_id,
    hasWpPostId: !!post.wp_post_id,
    authorType: typeof post.author,
    authorDisplayName: post.author?.display_name
  })
  
  // Determine post type and route to appropriate converter
  if (post.sections && post.sections.length > 0) {
    console.log('📦 Using section-based converter')
    return convertSectionBasedPost(post)
  } else if (post.original_wp_id || post.wp_post_id || isLegacyPost(post)) {
    console.log('📰 Using legacy converter')
    return convertLegacyPost(post)
  } else {
    console.log('🆕 Using modern converter')
    return convertModernPost(post)
  }
}

/**
 * Convert section-based posts to unified article format
 */
function convertSectionBasedPost(post: any): BlogArticleData {
  const sections: ModernSection[] = post.sections || []
  
  // Extract content from sections and organize by type
  let articleContent = ''
  let embeddedComponents: BlogArticleData['embedded_components'] = []
  let extractedFAQs: BlogArticleData['faqs'] = []
  let extractedHotels: BlogArticleData['hotels'] = []
  let extractedItinerary: BlogArticleData['itinerary'] = []
  let budgetInfo: BlogArticleData['budget_info'] = undefined
  let travelTips: BlogArticleData['travel_tips'] = []
  let starterPackData: any = undefined

  // Process sections in order
  sections
    .filter(section => section.is_active)
    .sort((a, b) => a.position - b.position)
    .forEach((section, index) => {
      const sectionType = getSectionType(section.template_id)
      
      switch (sectionType) {
        case 'hero':
          // Skip hero - handled separately by template
          break
          
        case 'html-content':
          // Extract HTML content
          if (section.data?.content) {
            articleContent += `<div class="content-section">${section.data.content}</div>\n`
          }
          break
          
        case 'faq':
          // Extract FAQs
          if (section.data?.faqs) {
            extractedFAQs.push(...section.data.faqs.map((faq: any) => ({
              id: faq.id || `faq-${index}`,
              question: faq.question,
              answer: faq.answer
            })))
          }
          break
          
        case 'hotels':
          // Extract hotel data
          if (section.data?.hotels) {
            extractedHotels.push(...section.data.hotels)
          }
          break
          
        case 'itinerary':
          // Extract itinerary data
          if (section.data?.days) {
            extractedItinerary.push(...section.data.days)
          }
          break
          
        case 'budget':
          // Extract budget information
          if (section.data) {
            budgetInfo = {
              total_range: section.data.total_range || '',
              breakdown: section.data.breakdown || []
            }
          }
          break
          
        case 'tips':
          // Extract travel tips
          if (section.data?.tips) {
            travelTips.push({
              category: section.title || 'General Tips',
              tips: section.data.tips
            })
          }
          break
          
        case 'starter-pack':
          // Extract starter pack data
          starterPackData = section.data
          break
          
        case 'table-of-contents':
          // Skip - auto-generated by template
          break
          
        case 'why-choose':
          // Convert to article content
          if (section.data?.reasons) {
            articleContent += `<h2>${section.title || 'Why Choose This Destination'}</h2>\n`
            section.data.reasons.forEach((reason: any) => {
              articleContent += `<h3>${reason.title}</h3>\n<p>${reason.description}</p>\n`
            })
          }
          break
          
        case 'comparison-table':
          // Embed as component
          embeddedComponents.push({
            type: 'comparison-table',
            position: index,
            data: section.data
          })
          break
          
        case 'tip-boxes':
          // Convert to article content
          if (section.data?.tips) {
            articleContent += `<h2>${section.title || 'Pro Tips'}</h2>\n`
            section.data.tips.forEach((tip: any) => {
              articleContent += `<div class="tip-box"><h4>${tip.title}</h4><p>${tip.content}</p></div>\n`
            })
          }
          break
          
        default:
          // For unknown sections, try to extract any content
          if (section.data?.content) {
            articleContent += `<div class="section-content">${section.data.content}</div>\n`
          } else if (section.data?.description) {
            articleContent += `<div class="section-description"><p>${section.data.description}</p></div>\n`
          }
          break
      }
    })

  // Build unified article data
  return {
    id: post.id,
    title: post.title,
    excerpt: post.excerpt,
    slug: post.slug,
    author: {
      display_name: post.author?.display_name || 'CuddlyNest Travel Team',
      bio: post.author?.bio,
      avatar: post.author?.avatar
    },
    published_at: post.published_at,
    updated_at: post.updated_at,
    read_time: calculateReadTime(articleContent),
    seo_title: post.seo_title || post.meta_title,
    seo_description: post.seo_description || post.meta_description,
    meta_keywords: post.meta_keywords,
    og_image: {
      file_url: post.og_image?.file_url || post.featured_image_url || ''
    },
    featured_image: post.og_image ? {
      file_url: post.og_image.file_url
    } : undefined,
    content: articleContent,
    faqs: extractedFAQs.length > 0 ? extractedFAQs : undefined,
    status: post.status,
    categories: post.categories,
    embedded_components: embeddedComponents.length > 0 ? embeddedComponents : undefined,
    hotels: extractedHotels.length > 0 ? extractedHotels : undefined,
    itinerary: extractedItinerary.length > 0 ? extractedItinerary : undefined,
    budget_info: budgetInfo,
    travel_tips: travelTips.length > 0 ? travelTips : undefined,
    starter_pack_data: starterPackData
  }
}

/**
 * Convert legacy posts to unified article format
 */
function convertLegacyPost(post: any): BlogArticleData {
  return {
    id: post.id,
    title: post.title,
    excerpt: post.excerpt,
    slug: post.slug,
    author: {
      display_name: post.author?.display_name || 'CuddlyNest Travel Team',
      bio: post.author?.bio,
      avatar: post.author?.avatar
    },
    published_at: post.published_at,
    updated_at: post.updated_at,
    read_time: calculateReadTime(post.content),
    seo_title: post.seo_title,
    seo_description: post.meta_description,
    meta_keywords: post.meta_keywords,
    og_image: {
      file_url: post.featured_image_url || ''
    },
    content: post.content || '',
    status: post.status,
    categories: post.categories
  }
}

/**
 * Convert modern posts to unified article format
 */
function convertModernPost(post: any): BlogArticleData {
  return {
    id: post.id,
    title: post.title,
    excerpt: post.excerpt,
    slug: post.slug,
    author: {
      display_name: post.author?.display_name || 'CuddlyNest Travel Team',
      bio: post.author?.bio,
      avatar: post.author?.avatar
    },
    published_at: post.published_at,
    updated_at: post.updated_at,
    read_time: calculateReadTime(post.content),
    seo_title: post.seo_title || post.meta_title,
    seo_description: post.seo_description || post.meta_description,
    meta_keywords: post.meta_keywords,
    og_image: {
      file_url: post.og_image?.file_url || post.featured_image_url || ''
    },
    featured_image: post.og_image ? {
      file_url: post.og_image.file_url
    } : undefined,
    content: post.content || '',
    status: post.status,
    categories: post.categories
  }
}

/**
 * Helper function to determine section type from template_id
 */
function getSectionType(template_id: string): string {
  const sectionTypeMap: Record<string, string> = {
    // Hero sections
    '12345678-1234-4321-8765-123456789abc': 'hero',
    'b87245be-1b68-47d4-83a6-fac582a0847f': 'starter-pack',
    
    // Content sections
    '23456789-2345-4321-8765-123456789bcd': 'table-of-contents',
    '34567890-3456-4321-8765-123456789cde': 'why-choose',
    '45678901-4567-4321-8765-123456789def': 'tip-boxes',
    '56789012-5678-4321-8765-123456789ef0': 'comparison-table',
    '67890123-6789-4321-8765-123456789f01': 'budget',
    
    // HTML content
    '78901234-7890-4321-8765-123456789012': 'html-content',
    
    // Interactive components
    'faq-section-template': 'faq',
    'hotel-carousel-template': 'hotels',
    'itinerary-template': 'itinerary',
    'tips-template': 'tips'
  }
  
  return sectionTypeMap[template_id] || 'content'
}

/**
 * Helper function to detect legacy posts
 */
function isLegacyPost(post: any): boolean {
  return !!(
    post.original_wp_id ||
    post.wp_id ||
    (post.created_at && new Date(post.created_at) < new Date('2024-01-01')) ||
    (!post.sections && post.content && post.content.length > 100)
  )
}

/**
 * Calculate estimated read time based on content
 */
function calculateReadTime(content: string): string {
  if (!content) return '1 min read'
  
  // Remove HTML tags for word count
  const textContent = content.replace(/<[^>]*>/g, '')
  const wordCount = textContent.split(/\s+/).filter(word => word.length > 0).length
  
  // Average reading speed: 200 words per minute
  const readTimeMinutes = Math.max(1, Math.ceil(wordCount / 200))
  
  return `${readTimeMinutes} min read`
}

/**
 * Helper function to sanitize HTML content
 */
export function sanitizeContent(content: string): string {
  // Basic HTML sanitization - in production, use a proper sanitization library
  return content
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
    .replace(/on\w+="[^"]*"/gi, '') // Remove event handlers
}

/**
 * Extract structured data from content for enhanced features
 */
export function extractStructuredData(content: string) {
  const data: any = {}
  
  // Extract headings for TOC
  const headingRegex = /<(h[2-6])[^>]*(?:id="([^"]*)")?[^>]*>([^<]+)<\/h[2-6]>/gi
  const headings: Array<{ level: number; id: string; title: string }> = []
  let match
  
  while ((match = headingRegex.exec(content)) !== null) {
    const [, tag, id, title] = match
    const level = parseInt(tag.charAt(1))
    const headingId = id || title.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    
    headings.push({
      level,
      id: headingId,
      title: title.trim()
    })
  }
  
  data.tableOfContents = headings
  
  return data
}