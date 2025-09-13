import { Button } from "@/components/ui/button"
import { getRecentPosts, getPostsCount, getPopularCategories, getFeaturedPosts } from "@/lib/supabase"
import { KlookStyleBlog } from "@/components/klook-style-blog"
import { Footer } from "@/components/footer"
import { getLogoSettings } from "@/lib/logo-settings"

// Default categories if database is empty
const defaultCategories = [
  "Nightlife", "Food", "Adventure", "Beaches", "Culture", "Hiking", "City Guides", "Hidden Gems"
]

// Metadata for homepage
export const metadata = {
  title: 'Travel Blog | CuddlyNest - Discover Amazing Destinations',
  description: 'Explore our comprehensive travel guides, destination tips, and insider recommendations. Find inspiration for your next adventure with CuddlyNest.',
  keywords: 'travel blog, travel guides, destination guides, travel tips, vacation planning, travel inspiration',
  openGraph: {
    title: 'Travel Blog | CuddlyNest - Discover Amazing Destinations',
    description: 'Explore our comprehensive travel guides, destination tips, and insider recommendations. Find inspiration for your next adventure with CuddlyNest.',
    type: 'website',
    siteName: 'CuddlyNest',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    site: '@cuddlynest',
    title: 'Travel Blog | CuddlyNest - Discover Amazing Destinations',
    description: 'Explore our comprehensive travel guides, destination tips, and insider recommendations.',
  },
  alternates: {
    canonical: 'https://cuddlynest.com/',
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

export default async function HomePage() {
  // Fetch real data from database
  const [recentPosts, featuredPosts, totalPosts, categories, logoSettings] = await Promise.all([
    getRecentPosts(12),
    getFeaturedPosts(6),
    getPostsCount(),
    getPopularCategories(8),
    getLogoSettings()
  ])

  const displayCategories = categories.length > 0 
    ? categories.map(cat => cat.name) 
    : defaultCategories

  return (
    <div className="min-h-screen">
      <KlookStyleBlog 
        recentPosts={recentPosts}
        featuredPosts={featuredPosts || recentPosts.slice(0, 6)}
        totalPosts={totalPosts}
        categories={displayCategories}
        additionalCategories={defaultCategories}
        blogLogo={logoSettings.blog_logo}
      />
      <Footer />
    </div>
  )
}
