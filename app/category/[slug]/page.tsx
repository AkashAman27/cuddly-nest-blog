import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getCategoryBySlug, getPostsByCategory, getAllCategories } from '@/lib/supabase'
import CategoryPageTemplate from '@/components/category-page-template'

interface CategoryPageProps {
  params: {
    slug: string
  }
  searchParams: {
    page?: string
  }
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const category = await getCategoryBySlug(params.slug)
  
  if (!category) {
    return {
      title: 'Category Not Found'
    }
  }

  const title = category.seo_title || `${category.name} - Travel Guides & Tips | CuddlyNest`
  const description = category.seo_description || category.description || `Discover the best ${category.name.toLowerCase()} content with expert travel guides, tips, and recommendations.`
  const canonical = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.cuddlynest.com'}/category/${category.slug}`
  
  return {
    title,
    description,
    keywords: category.meta_keywords,
    
    // Open Graph
    openGraph: {
      title: category.og_title || title,
      description: category.og_description || description,
      url: canonical,
      siteName: 'CuddlyNest',
      images: category.og_image ? [
        {
          url: category.og_image,
          width: 1200,
          height: 630,
          alt: `${category.name} category cover image`,
        }
      ] : [],
      type: 'website',
    },
    
    // Twitter Card
    twitter: {
      card: 'summary_large_image',
      title: category.og_title || title,
      description: category.og_description || description,
      images: category.og_image ? [category.og_image] : [],
    },
    
    // Additional SEO
    alternates: {
      canonical,
    },
    
    // Robots
    robots: {
      index: category.is_published && category.visibility === 'public' && (category.post_count || 0) > 0,
      follow: true,
    },
    
    // Schema.org structured data will be added in the component
  }
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const category = await getCategoryBySlug(params.slug)
  
  if (!category) {
    notFound()
  }

  // If category is not published or has no content, return 404
  if (!category.is_published || category.visibility !== 'public') {
    notFound()
  }

  const currentPage = parseInt(searchParams.page || '1')
  const postsPerPage = 12
  const offset = (currentPage - 1) * postsPerPage
  
  const { posts, total } = await getPostsByCategory(category.slug, postsPerPage, offset)
  
  // If category has no published posts, return 404
  if (total === 0) {
    notFound()
  }
  
  const totalPages = Math.ceil(total / postsPerPage)

  // Generate breadcrumb structured data
  const breadcrumbStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: process.env.NEXT_PUBLIC_SITE_URL || 'https://www.cuddlynest.com'
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Categories',
        item: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.cuddlynest.com'}/categories`
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: category.name,
        item: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.cuddlynest.com'}/category/${category.slug}`
      }
    ]
  }

  // Generate CollectionPage structured data
  const collectionPageStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: category.name,
    description: category.description,
    url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.cuddlynest.com'}/category/${category.slug}`,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: total,
      itemListElement: posts.slice(0, 10).map((post, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'Article',
          headline: post.title,
          url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.cuddlynest.com'}/blog/${post.slug}`,
          datePublished: post.published_at || post.created_at,
          author: post.author ? {
            '@type': 'Person',
            name: post.author.display_name
          } : undefined,
          image: post.featured_image?.file_url,
          description: post.excerpt
        }
      }))
    },
    breadcrumb: breadcrumbStructuredData
  }

  // Generate FAQPage structured data if FAQs exist
  const faqStructuredData = category.faqs && category.faqs.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: category.faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer
      }
    }))
  } : null

  return (
    <>
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionPageStructuredData) }}
      />
      {faqStructuredData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqStructuredData) }}
        />
      )}
      
      <CategoryPageTemplate
        category={category}
        posts={posts}
        currentPage={currentPage}
        totalPages={totalPages}
        totalPosts={total}
      />
    </>
  )
}

// Generate static paths for categories that have posts
export async function generateStaticParams() {
  try {
    const categories = await getAllCategories(false) // Only categories with posts
    
    return categories.map((category) => ({
      slug: category.slug,
    }))
  } catch (error) {
    console.error('Error generating category static params:', error)
    return []
  }
}