import { BaseStructuredData } from '@/lib/structuredData'

export interface TravelGuideSchemaData {
  id: string
  title: string
  slug: string
  excerpt?: string
  content: string
  featured_image?: string
  author_name: string
  author_image?: string
  destination?: string
  tags?: string[]
  published_at: string
  updated_at?: string
  read_time_minutes?: number
  structured_data_type?: string
  focus_keyword?: string
  faq_items?: Array<{
    question: string
    answer: string
  }>
  itinerary_days?: Array<{
    day: number
    title: string
    description: string
    activities?: string[]
  }>
  seo_title?: string
  seo_description?: string
}

export function generateTravelGuideSchema(data: TravelGuideSchemaData): BaseStructuredData[] {
  const schemas: BaseStructuredData[] = []
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://cuddlynest.com'
  const currentUrl = `${siteUrl}/blog/${data.slug}`

  // Determine the primary schema type
  const schemaType = data.structured_data_type || 'BlogPosting'

  // Base Article/BlogPosting schema
  const articleSchema: BaseStructuredData = {
    '@context': 'https://schema.org',
    '@type': schemaType,
    '@id': currentUrl,
    name: data.title,
    headline: data.title,
    description: data.excerpt || data.content.substring(0, 160),
    url: currentUrl,
    image: data.featured_image ? {
      '@type': 'ImageObject',
      url: data.featured_image,
      description: `${data.title} - Blog Post Image`
    } : undefined,
    author: {
      '@type': 'Person',
      name: data.author_name,
      image: data.author_image ? {
        '@type': 'ImageObject',
        url: data.author_image
      } : undefined
    },
    publisher: {
      '@type': 'Organization',
      name: 'CuddlyNest',
      url: siteUrl,
      logo: {
        '@type': 'ImageObject',
        url: `${siteUrl}/logo.png`
      }
    },
    datePublished: data.published_at,
    dateModified: data.updated_at || data.published_at,
    articleSection: 'Travel Guide',
    about: data.destination ? {
      '@type': 'Place',
      name: data.destination,
      description: `Travel information about ${data.destination}`
    } : undefined,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': currentUrl
    },
    keywords: data.tags?.join(', ') || data.focus_keyword,
    timeRequired: data.read_time_minutes ? `PT${data.read_time_minutes}M` : undefined,
    inLanguage: 'en-US'
  }

  // Clean up undefined values
  Object.keys(articleSchema).forEach(key => {
    if (articleSchema[key] === undefined) {
      delete articleSchema[key]
    }
  })

  schemas.push(articleSchema)

  // FAQ Schema (if FAQ items exist)
  if (data.faq_items && data.faq_items.length > 0) {
    const faqSchema: BaseStructuredData = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      '@id': `${currentUrl}#faq`,
      mainEntity: data.faq_items.map(faq => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.answer
        }
      }))
    }
    schemas.push(faqSchema)
  }

  // Travel Itinerary Schema (if itinerary exists)
  if (data.itinerary_days && data.itinerary_days.length > 0) {
    const itinerarySchema: BaseStructuredData = {
      '@context': 'https://schema.org',
      '@type': 'TravelGuide',
      '@id': `${currentUrl}#itinerary`,
      name: `${data.title} - Itinerary`,
      description: `Detailed ${data.itinerary_days.length}-day itinerary${data.destination ? ` for ${data.destination}` : ''}`,
      url: currentUrl,
      about: data.destination ? {
        '@type': 'Place',
        name: data.destination
      } : undefined,
      author: {
        '@type': 'Person',
        name: data.author_name
      },
      hasPartOfType: data.itinerary_days.map((day, index) => ({
        '@type': 'TouristTrip',
        name: day.title,
        description: day.description,
        itinerary: {
          '@type': 'ItemList',
          numberOfItems: day.activities?.length || 0,
          itemListElement: day.activities?.map((activity, actIndex) => ({
            '@type': 'ListItem',
            position: actIndex + 1,
            item: {
              '@type': 'TouristAttraction',
              name: activity,
              description: activity
            }
          })) || []
        }
      }))
    }

    // Clean up undefined values
    Object.keys(itinerarySchema).forEach(key => {
      if (itinerarySchema[key] === undefined) {
        delete itinerarySchema[key]
      }
    })

    schemas.push(itinerarySchema)
  }

  // Destination Place Schema (if destination exists)
  if (data.destination) {
    const placeSchema: BaseStructuredData = {
      '@context': 'https://schema.org',
      '@type': 'TouristDestination',
      '@id': `${currentUrl}#destination`,
      name: data.destination,
      description: `Travel guide and information about ${data.destination}`,
      url: currentUrl,
      image: data.featured_image,
      touristType: 'Leisure',
      isAccessibleForFree: false
    }
    schemas.push(placeSchema)
  }

  // Breadcrumb Schema
  const breadcrumbSchema: BaseStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    '@id': `${currentUrl}#breadcrumb`,
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: siteUrl
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Blog',
        item: `${siteUrl}/blog`
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: data.title,
        item: currentUrl
      }
    ]
  }
  schemas.push(breadcrumbSchema)

  return schemas
}

export function generateCustomTravelGuideSchema(customSchema: any): BaseStructuredData[] {
  // If custom schema is provided, validate and return it
  if (!customSchema) return []

  try {
    // If it's a string, parse it
    const parsed = typeof customSchema === 'string' ? JSON.parse(customSchema) : customSchema
    
    // Ensure it's an array
    const schemas = Array.isArray(parsed) ? parsed : [parsed]
    
    // Validate that each schema has required fields
    return schemas.filter(schema => 
      schema && 
      typeof schema === 'object' && 
      schema['@context'] && 
      schema['@type']
    )
  } catch (error) {
    console.error('Invalid custom schema for travel guide:', error)
    return []
  }
}

export function combineSchemas(...schemaArrays: BaseStructuredData[][]): BaseStructuredData[] {
  return schemaArrays.flat().filter(Boolean)
}