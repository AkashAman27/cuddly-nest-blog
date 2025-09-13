import { getRecentPosts, getPostsCount, getPopularCategories, getFeaturedPosts, getCombinedRecentPosts, getCuddlyNestPosts, getFeaturedCuddlyNestPosts } from "@/lib/supabase"
import { BlogHomepage } from "@/components/blog-homepage"

// Default categories if database is empty
const defaultCategories = [
  "Nightlife", "Food", "Adventure", "Beaches", "Culture", "Hiking", "City Guides", "Hidden Gems"
]

// Metadata for blog homepage
export const metadata = {
  title: 'Travel Blog | CuddlyNest - Articles, Tips and Tricks',
  description: 'Articles, tips and tricks for travelers & property owners. Discover amazing destinations and travel guides.',
  keywords: 'travel blog, travel guides, destination guides, travel tips, vacation planning, travel inspiration',
  openGraph: {
    title: 'Travel Blog | CuddlyNest - Articles, Tips and Tricks',
    description: 'Articles, tips and tricks for travelers & property owners. Discover amazing destinations and travel guides.',
    type: 'website',
    siteName: 'CuddlyNest',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    site: '@cuddlynest',
    title: 'Travel Blog | CuddlyNest - Articles, Tips and Tricks',
    description: 'Articles, tips and tricks for travelers & property owners.',
  },
  alternates: {
    canonical: 'https://cuddlynest.com/blog',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export default async function BlogPage() {
  // Try simplified posts first, fallback to combined posts
  let recentPosts, featuredPosts
  
  try {
    // Try our new simplified structure first
    const [simplifiedRecent, simplifiedFeatured] = await Promise.all([
      getCuddlyNestPosts(12),
      getFeaturedCuddlyNestPosts(6)
    ])
    
    if (simplifiedRecent && simplifiedRecent.length > 0) {
      console.log(`✅ Using simplified blog structure with ${simplifiedRecent.length} posts`)
      recentPosts = simplifiedRecent.map(post => ({
        ...post,
        reading_time: post.reading_time || 5,
        featured_image: post.featured_image_url ? { file_url: post.featured_image_url } : null,
        // Ensure author is in the expected format
        author: typeof post.author?.display_name === 'string' ? post.author.display_name : 'CuddlyNest Team'
      }))
      featuredPosts = simplifiedFeatured.map(post => ({
        ...post,
        reading_time: post.reading_time || 5,
        featured_image: post.featured_image_url ? { file_url: post.featured_image_url } : null,
        // Ensure author is in the expected format
        author: typeof post.author?.display_name === 'string' ? post.author.display_name : 'CuddlyNest Team'
      }))
    } else {
      throw new Error('No simplified posts found')
    }
  } catch (error) {
    console.log('📦 Falling back to combined posts structure')
    // Fallback to existing combined structure
    const [combinedRecent, combinedFeatured] = await Promise.all([
      getCombinedRecentPosts(12),
      getFeaturedPosts(6)
    ])
    recentPosts = combinedRecent
    featuredPosts = combinedFeatured
  }
  
  // Fetch other data
  const [totalPosts, categories] = await Promise.all([
    getPostsCount(),
    getPopularCategories(8)
  ])

  const displayCategories = categories.length > 0 
    ? categories.map(cat => cat.name) 
    : defaultCategories

  return (
    <BlogHomepage 
      recentPosts={recentPosts}
      featuredPosts={featuredPosts || recentPosts.slice(0, 6)}
      totalPosts={totalPosts}
      categories={displayCategories}
    />
  )
}