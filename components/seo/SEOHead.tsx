import Head from 'next/head'
import { SEOFormData } from './SEOFormFields'

interface SEOHeadProps {
  data: SEOFormData
  defaultTitle?: string
  defaultDescription?: string
  defaultImage?: string
  url?: string
  siteName?: string
  type?: 'website' | 'article' | 'product'
}

export function SEOHead({
  data,
  defaultTitle = 'CuddlyNest - Your Travel Companion',
  defaultDescription = 'Discover unique accommodations and travel experiences with CuddlyNest',
  defaultImage = 'https://cuddlynest.com/og-image.jpg',
  url = '',
  siteName = 'CuddlyNest',
  type = 'website'
}: SEOHeadProps) {
  
  // Use provided SEO data or fallback to defaults
  const title = data.seo_title || defaultTitle
  const description = data.seo_description || defaultDescription
  const canonical = data.canonical_url || url
  
  // Social media data with intelligent fallbacks
  const ogTitle = data.og_title || title
  const ogDescription = data.og_description || description
  const ogImage = data.og_image || defaultImage
  const ogImageAlt = data.og_image_alt || title
  
  const twitterTitle = data.twitter_title || ogTitle
  const twitterDescription = data.twitter_description || ogDescription
  const twitterImage = data.twitter_image || ogImage
  const twitterImageAlt = data.twitter_image_alt || ogImageAlt
  
  // Robots meta
  const robotsContent = [
    data.robots_index !== false ? 'index' : 'noindex',
    data.robots_follow !== false ? 'follow' : 'nofollow',
    ...(data.robots_nosnippet ? ['nosnippet'] : [])
  ].join(', ')

  return (
    <Head>
      {/* Basic Meta Tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      
      {/* Keywords */}
      {data.seo_keywords && (
        <meta name="keywords" content={data.seo_keywords} />
      )}
      
      {/* Focus Keyword for internal tracking */}
      {data.focus_keyword && (
        <meta name="focus-keyword" content={data.focus_keyword} />
      )}
      
      {/* Robots */}
      <meta name="robots" content={robotsContent} />
      
      {/* Canonical URL */}
      {canonical && <link rel="canonical" href={canonical} />}
      
      {/* Open Graph Tags */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={ogTitle} />
      <meta property="og:description" content={ogDescription} />
      <meta property="og:site_name" content={siteName} />
      {url && <meta property="og:url" content={url} />}
      {ogImage && (
        <>
          <meta property="og:image" content={ogImage} />
          <meta property="og:image:alt" content={ogImageAlt} />
          <meta property="og:image:width" content="1200" />
          <meta property="og:image:height" content="630" />
        </>
      )}
      
      {/* Twitter Card Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={twitterTitle} />
      <meta name="twitter:description" content={twitterDescription} />
      {twitterImage && (
        <>
          <meta name="twitter:image" content={twitterImage} />
          <meta name="twitter:image:alt" content={twitterImageAlt} />
        </>
      )}
      
      {/* Additional meta tags for better SEO */}
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta httpEquiv="Content-Language" content="en" />
      <meta name="author" content={siteName} />
      
      {/* Structured Data Priority Comment */}
      {data.structured_data_type && (
        <meta name="structured-data-type" content={data.structured_data_type} />
      )}
    </Head>
  )
}

// Alternative version using Next.js 13+ Metadata API
export function generateSEOMetadata(data: SEOFormData, defaults: any = {}): any {
  const title = data.seo_title || defaults.title || 'CuddlyNest - Your Travel Companion'
  const description = data.seo_description || defaults.description || 'Discover unique accommodations and travel experiences'
  
  return {
    title,
    description,
    keywords: data.seo_keywords,
    robots: {
      index: data.robots_index !== false,
      follow: data.robots_follow !== false,
      nosnippet: data.robots_nosnippet || false,
    },
    alternates: {
      canonical: data.canonical_url || defaults.url,
    },
    openGraph: {
      type: defaults.type || 'website',
      title: data.og_title || title,
      description: data.og_description || description,
      url: defaults.url,
      siteName: defaults.siteName || 'CuddlyNest',
      images: data.og_image ? [{
        url: data.og_image,
        alt: data.og_image_alt || title,
        width: 1200,
        height: 630,
      }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: data.twitter_title || data.og_title || title,
      description: data.twitter_description || data.og_description || description,
      images: data.twitter_image ? [{
        url: data.twitter_image,
        alt: data.twitter_image_alt || title,
      }] : undefined,
    },
    other: {
      'focus-keyword': data.focus_keyword,
    },
  }
}