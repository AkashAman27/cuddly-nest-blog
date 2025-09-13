// Types for structured data
export type StructuredDataType = 
  | 'TouristAttraction'
  | 'LocalBusiness' 
  | 'Product'
  | 'Event'
  | 'Article'
  | 'BlogPosting'
  | 'TravelGuide'
  | 'TouristDestination'
  | 'Organization'
  | 'WebSite'
  | 'BreadcrumbList'
  | 'FAQPage'
  | 'Review'
  | 'Offer'
  | 'Service'

export interface BaseStructuredData {
  '@context': 'https://schema.org'
  '@type': string
  [key: string]: any
}

export interface StructuredDataConfig {
  type: StructuredDataType
  data: Record<string, any>
  override?: string // JSON-LD override from admin
}

// Validation function for JSON-LD
export function validateJSONLD(jsonString: string): { isValid: boolean; error?: string; parsed?: any } {
  try {
    const parsed = JSON.parse(jsonString)
    
    // Basic schema.org validation
    if (typeof parsed !== 'object' || parsed === null) {
      return { isValid: false, error: 'Schema must be a valid JSON object' }
    }
    
    if (!parsed['@context'] || !parsed['@type']) {
      return { isValid: false, error: 'Schema must include @context and @type properties' }
    }
    
    if (parsed['@context'] !== 'https://schema.org') {
      return { isValid: false, error: '@context must be "https://schema.org"' }
    }
    
    return { isValid: true, parsed }
  } catch (error) {
    return { isValid: false, error: 'Invalid JSON format' }
  }
}

// Main function to generate structured data
export function generateStructuredData(config: StructuredDataConfig): BaseStructuredData[] {
  // If admin provided custom JSON-LD, parse and return it
  if (config.override) {
    try {
      const parsed = JSON.parse(config.override)
      // Ensure it's an array for consistency
      return Array.isArray(parsed) ? parsed : [parsed]
    } catch (error) {
      console.error('Invalid JSON-LD override:', error)
      // Fall back to automatic generation if override is invalid
    }
  }

  // Generate automatic structured data based on type
  switch (config.type) {
    case 'TouristAttraction':
      return [generateTouristAttraction(config.data)]
    case 'LocalBusiness':
      return [generateLocalBusiness(config.data)]
    case 'Product':
      return [generateProduct(config.data)]
    case 'Event':
      return [generateEvent(config.data)]
    case 'Article':
      return [generateArticle(config.data)]
    case 'BlogPosting':
      return [generateBlogPosting(config.data)]
    case 'TravelGuide':
      return [generateTravelGuide(config.data)]
    case 'TouristDestination':
      return [generateTouristDestination(config.data)]
    case 'Organization':
      return [generateOrganization(config.data)]
    case 'WebSite':
      return [generateWebSite(config.data)]
    case 'BreadcrumbList':
      return [generateBreadcrumbList(config.data)]
    case 'FAQPage':
      return [generateFAQPage(config.data)]
    case 'Review':
      return [generateReview(config.data)]
    case 'Offer':
      return [generateOffer(config.data)]
    case 'Service':
      return [generateService(config.data)]
    default:
      return []
  }
}

// Travel-specific: Tourist Attraction (for tours/experiences)
function generateTouristAttraction(data: any): BaseStructuredData {
  const base: BaseStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'TouristAttraction',
    name: data.title || data.name,
    description: data.description || data.excerpt,
    url: data.url,
    image: data.image_url || data.featured_image?.file_url || data.backgroundImage,
  }

  // Add location data
  if (data.latitude && data.longitude) {
    base.geo = {
      '@type': 'GeoCoordinates',
      latitude: data.latitude,
      longitude: data.longitude
    }
  }

  // Add address
  if (data.location || data.city) {
    base.address = {
      '@type': 'PostalAddress',
      addressLocality: data.location || data.city,
      addressRegion: data.region || data.state,
      addressCountry: data.country || 'US'
    }
  }

  // Add rating if available
  if (data.rating && data.review_count) {
    base.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: data.rating,
      reviewCount: data.review_count,
      bestRating: 5,
      worstRating: 1
    }
  }

  return base
}

// Local Business schema
function generateLocalBusiness(data: any): BaseStructuredData {
  const base: BaseStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: data.name || data.title,
    description: data.description,
    url: data.url,
    telephone: data.telephone || data.phone,
    email: data.email,
  }

  // Add address
  if (data.street_address || data.city) {
    base.address = {
      '@type': 'PostalAddress',
      streetAddress: data.street_address,
      addressLocality: data.city,
      addressRegion: data.region || data.state,
      postalCode: data.postal_code || data.zip,
      addressCountry: data.country || 'US'
    }
  }

  // Add geo coordinates
  if (data.latitude && data.longitude) {
    base.geo = {
      '@type': 'GeoCoordinates',
      latitude: data.latitude,
      longitude: data.longitude
    }
  }

  // Add opening hours
  if (data.opening_hours) {
    base.openingHours = Array.isArray(data.opening_hours) ? data.opening_hours : [data.opening_hours]
  }

  // Add price range
  if (data.price_range) {
    base.priceRange = data.price_range
  }

  return base
}

// Blog posting schema
function generateBlogPosting(data: any): BaseStructuredData {
  const base: BaseStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: data.title || data.name,
    description: data.description || data.excerpt,
    url: data.url,
    datePublished: data.published_at || data.created_at,
    dateModified: data.updated_at || data.published_at || data.created_at,
  }

  // Add author
  if (data.author || data.author_name) {
    base.author = {
      '@type': 'Person',
      name: data.author?.display_name || data.author_name || data.author
    }
  }

  // Add publisher (organization)
  if (data.publisher || data.site_name) {
    base.publisher = {
      '@type': 'Organization',
      name: data.publisher || data.site_name || 'CuddlyNest',
      logo: {
        '@type': 'ImageObject',
        url: data.publisher_logo || data.logo
      }
    }
  }

  // Add featured image
  if (data.image_url || data.featured_image?.file_url || data.backgroundImage) {
    base.image = {
      '@type': 'ImageObject',
      url: data.image_url || data.featured_image?.file_url || data.backgroundImage,
      alt: data.image_alt || data.title
    }
  }

  // Add reading time
  if (data.reading_time) {
    base.timeRequired = `PT${data.reading_time}M`
  }

  return base
}

// Article schema (similar to blog posting but more general)
function generateArticle(data: any): BaseStructuredData {
  const blogPosting = generateBlogPosting(data)
  return {
    ...blogPosting,
    '@type': 'Article'
  }
}

// Organization schema
function generateOrganization(data: any): BaseStructuredData {
  const base: BaseStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: data.name,
    url: data.url,
    description: data.description,
  }

  if (data.logo) {
    base.logo = {
      '@type': 'ImageObject',
      url: data.logo
    }
  }

  if (data.social_links && Array.isArray(data.social_links)) {
    base.sameAs = data.social_links
  }

  if (data.telephone) {
    base.telephone = data.telephone
  }

  if (data.email) {
    base.email = data.email
  }

  return base
}

// Website schema
function generateWebSite(data: any): BaseStructuredData {
  const base: BaseStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: data.name,
    url: data.url,
    description: data.description,
  }

  // Add site search if available
  if (data.search_url) {
    base.potentialAction = {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: data.search_url
      },
      'query-input': 'required name=search'
    }
  }

  return base
}

// Product schema (for tour packages)
function generateProduct(data: any): BaseStructuredData {
  const base: BaseStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: data.title || data.name,
    description: data.description,
    url: data.url,
  }

  // Add image
  if (data.image_url || data.featured_image?.file_url) {
    base.image = data.image_url || data.featured_image?.file_url
  }

  // Add offers (pricing)
  if (data.price) {
    base.offers = {
      '@type': 'Offer',
      price: data.price,
      priceCurrency: data.currency || 'USD',
      availability: 'https://schema.org/InStock',
      url: data.url
    }
  }

  // Add rating
  if (data.rating && data.review_count) {
    base.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: data.rating,
      reviewCount: data.review_count,
      bestRating: 5,
      worstRating: 1
    }
  }

  return base
}

// Event schema
function generateEvent(data: any): BaseStructuredData {
  const base: BaseStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: data.title || data.name,
    description: data.description,
    url: data.url,
  }

  if (data.start_date) {
    base.startDate = data.start_date
  }

  if (data.end_date) {
    base.endDate = data.end_date
  }

  if (data.location) {
    base.location = {
      '@type': 'Place',
      name: data.location,
      address: data.address
    }
  }

  return base
}

// Breadcrumb list schema
function generateBreadcrumbList(data: any): BaseStructuredData {
  if (!data.breadcrumbs || !Array.isArray(data.breadcrumbs)) {
    return {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: []
    }
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: data.breadcrumbs.map((crumb: any, index: number) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name || crumb.title,
      item: crumb.url
    }))
  }
}

// FAQ Page schema
function generateFAQPage(data: any): BaseStructuredData {
  if (!data.faqs || !Array.isArray(data.faqs)) {
    return {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: []
    }
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: data.faqs.map((faq: any) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer
      }
    }))
  }
}

// Review schema
function generateReview(data: any): BaseStructuredData {
  return {
    '@context': 'https://schema.org',
    '@type': 'Review',
    author: {
      '@type': 'Person',
      name: data.author || data.reviewer_name
    },
    reviewRating: {
      '@type': 'Rating',
      ratingValue: data.rating,
      bestRating: data.max_rating || 5,
      worstRating: data.min_rating || 1
    },
    reviewBody: data.review_text || data.content,
    datePublished: data.date || data.created_at
  }
}

// Offer schema
function generateOffer(data: any): BaseStructuredData {
  return {
    '@context': 'https://schema.org',
    '@type': 'Offer',
    price: data.price,
    priceCurrency: data.currency || 'USD',
    availability: data.availability || 'https://schema.org/InStock',
    validFrom: data.valid_from,
    validThrough: data.valid_through,
    url: data.url
  }
}

// Service schema
function generateService(data: any): BaseStructuredData {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: data.title || data.name,
    description: data.description,
    provider: {
      '@type': 'Organization',
      name: data.provider || 'CuddlyNest'
    },
    areaServed: data.area_served || data.location,
    serviceType: data.service_type
  }
}

// Travel Guide schema
function generateTravelGuide(data: any): BaseStructuredData {
  const base: BaseStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'TravelGuide',
    name: data.title || data.name,
    description: data.description || data.excerpt,
    url: data.url,
  }

  // Add author
  if (data.author || data.author_name) {
    base.author = {
      '@type': 'Person',
      name: data.author?.display_name || data.author_name || data.author
    }
  }

  // Add destination
  if (data.destination) {
    base.about = {
      '@type': 'Place',
      name: data.destination,
      description: `Travel information about ${data.destination}`
    }
  }

  // Add image
  if (data.image_url || data.featured_image?.file_url || data.backgroundImage) {
    base.image = {
      '@type': 'ImageObject',
      url: data.image_url || data.featured_image?.file_url || data.backgroundImage,
      alt: data.image_alt || data.title
    }
  }

  // Add dates
  if (data.published_at || data.created_at) {
    base.datePublished = data.published_at || data.created_at
  }

  if (data.updated_at) {
    base.dateModified = data.updated_at
  }

  return base
}

// Tourist Destination schema
function generateTouristDestination(data: any): BaseStructuredData {
  const base: BaseStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'TouristDestination',
    name: data.destination || data.title || data.name,
    description: data.description || data.excerpt,
    url: data.url,
  }

  // Add location data
  if (data.latitude && data.longitude) {
    base.geo = {
      '@type': 'GeoCoordinates',
      latitude: data.latitude,
      longitude: data.longitude
    }
  }

  // Add address
  if (data.location || data.city || data.destination) {
    base.address = {
      '@type': 'PostalAddress',
      addressLocality: data.location || data.city || data.destination,
      addressRegion: data.region || data.state,
      addressCountry: data.country || 'US'
    }
  }

  // Add image
  if (data.image_url || data.featured_image?.file_url || data.backgroundImage) {
    base.image = data.image_url || data.featured_image?.file_url || data.backgroundImage
  }

  // Add tourist type
  base.touristType = data.tourist_type || 'Leisure'
  base.isAccessibleForFree = data.is_free || false

  return base
}

// Helper function to combine multiple structured data objects
export function combineStructuredData(...schemas: BaseStructuredData[]): BaseStructuredData[] {
  return schemas.filter(schema => schema && typeof schema === 'object')
}