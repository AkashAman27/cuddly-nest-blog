import { generateStructuredData, combineStructuredData, StructuredDataType, BaseStructuredData } from '@/lib/structuredData'

interface StructuredDataProps {
  type: StructuredDataType
  data: Record<string, any>
  customJsonLd?: string | null
  customSchema?: string | object | null // Support both string and object formats
  globalSchemas?: BaseStructuredData[]
  priority?: number
  schemaMode?: 'default' | 'custom' // Control whether to use default or custom schema
}

export function StructuredData({ 
  type, 
  data, 
  customJsonLd, 
  customSchema,
  globalSchemas = [],
  priority = 0,
  schemaMode = 'default'
}: StructuredDataProps) {
  // If schema mode is custom, only use custom schema; if default, use automatic schema
  let finalSchemas: BaseStructuredData[] = []
  
  if (schemaMode === 'custom') {
    // Custom mode: only use custom schema if provided
    let customSchemaToUse = customSchema || customJsonLd
    
    // If customSchema is a string, try to parse it
    if (typeof customSchemaToUse === 'string' && customSchemaToUse.trim()) {
      try {
        customSchemaToUse = JSON.parse(customSchemaToUse)
      } catch (error) {
        console.warn('Invalid custom schema JSON:', error)
        customSchemaToUse = null
      }
    }
    
    // Only add custom schema if it exists and is valid
    if (customSchemaToUse && typeof customSchemaToUse === 'object') {
      finalSchemas = [customSchemaToUse as BaseStructuredData]
    }
  } else {
    // Default mode: use automatic schema generation
    finalSchemas = generateStructuredData({
      type,
      data
    })
  }

  // Combine with global schemas if provided
  const allSchemas = combineStructuredData(...globalSchemas, ...finalSchemas)

  // Don't render if no schemas
  if (allSchemas.length === 0) {
    return null
  }

  return (
    <>
      {allSchemas.map((schema, index) => (
        <script
          key={`structured-data-${type}-${index}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(schema, null, 0)
          }}
        />
      ))}
    </>
  )
}

// Component for global website schemas
export function GlobalStructuredData({ siteData }: { siteData: Record<string, any> }) {
  const websiteSchema = generateStructuredData({
    type: 'WebSite',
    data: {
      name: siteData.name || 'CuddlyNest',
      url: siteData.url || 'https://cuddlynest.com',
      description: siteData.description || 'Your trusted travel companion for unique accommodations and experiences',
      search_url: siteData.search_url || 'https://cuddlynest.com/search?q={search_term_string}',
      ...siteData
    }
  })

  const organizationSchema = generateStructuredData({
    type: 'Organization',
    data: {
      name: siteData.organizationName || 'CuddlyNest',
      url: siteData.url || 'https://cuddlynest.com',
      logo: siteData.logo || 'https://cuddlynest.com/logo.png',
      description: siteData.organizationDescription || 'Leading platform for unique travel accommodations',
      telephone: siteData.telephone,
      email: siteData.email || 'hello@cuddlynest.com',
      social_links: siteData.socialLinks || [],
      ...siteData
    }
  })

  const localBusinessSchema = generateStructuredData({
    type: 'LocalBusiness',
    data: {
      name: siteData.businessName || 'CuddlyNest',
      url: siteData.url || 'https://cuddlynest.com',
      description: siteData.businessDescription || 'Travel accommodation platform',
      telephone: siteData.telephone,
      email: siteData.email || 'hello@cuddlynest.com',
      street_address: siteData.streetAddress,
      city: siteData.city,
      region: siteData.region,
      postal_code: siteData.postalCode,
      country: siteData.country || 'US',
      latitude: siteData.latitude,
      longitude: siteData.longitude,
      opening_hours: siteData.openingHours || ['Mo-Su 00:00-23:59'],
      price_range: siteData.priceRange || '$$',
      social_links: siteData.socialLinks || [],
      ...siteData
    }
  })

  const allSchemas = combineStructuredData(...websiteSchema, ...organizationSchema, ...localBusinessSchema)

  return (
    <>
      {allSchemas.map((schema, index) => (
        <script
          key={`global-structured-data-${index}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(schema, null, 0)
          }}
        />
      ))}
    </>
  )
}

// Breadcrumb structured data component
export function BreadcrumbStructuredData({ breadcrumbs }: { breadcrumbs: Array<{ name: string; url: string }> }) {
  const schema = generateStructuredData({
    type: 'BreadcrumbList',
    data: { breadcrumbs }
  })

  if (schema.length === 0) {
    return null
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(schema[0], null, 0)
      }}
    />
  )
}

// FAQ structured data component
export function FAQStructuredData({ faqs }: { faqs: Array<{ question: string; answer: string }> }) {
  const schema = generateStructuredData({
    type: 'FAQPage',
    data: { faqs }
  })

  if (schema.length === 0) {
    return null
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(schema[0], null, 0)
      }}
    />
  )
}

// Travel Guide specific structured data
export function TravelGuideStructuredData({ post }: { post: any }) {
  const schema = generateStructuredData({
    type: 'BlogPosting',
    data: {
      title: post.title,
      description: post.excerpt,
      url: `https://cuddlynest.com/blog/${post.slug}`,
      published_at: post.published_at,
      updated_at: post.updated_at,
      author: post.author?.display_name || 'CuddlyNest Team',
      author_name: post.author?.display_name || 'CuddlyNest Team',
      site_name: 'CuddlyNest',
      publisher: 'CuddlyNest',
      publisher_logo: 'https://cuddlynest.com/logo.png',
      image_url: post.featured_image?.file_url || post.backgroundImage,
      image_alt: post.title,
      reading_time: post.reading_time,
      ...post
    }
  })

  if (schema.length === 0) {
    return null
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(schema[0], null, 0)
      }}
    />
  )
}