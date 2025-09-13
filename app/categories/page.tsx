import { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { getAllCategories } from '@/lib/supabase'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Tag, Search, FileText, Layers } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Travel Categories - Explore by Destination & Topic | CuddlyNest',
  description: 'Browse our travel content by categories including destinations, travel tips, accommodation, food & dining, and more. Find exactly what you\'re looking for.',
  keywords: 'travel categories, destinations, travel tips, accommodation, food, adventure travel, budget travel',
  openGraph: {
    title: 'Travel Categories - Explore by Destination & Topic | CuddlyNest',
    description: 'Browse our travel content by categories including destinations, travel tips, accommodation, food & dining, and more.',
    type: 'website',
    url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.cuddlynest.com'}/categories`,
  },
  alternates: {
    canonical: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.cuddlynest.com'}/categories`,
  },
}

export default async function CategoriesPage() {
  const categories = await getAllCategories(false) // Only show categories with posts

  // Separate featured and regular categories
  const featuredCategories = categories.filter(cat => cat.is_featured)
  const regularCategories = categories.filter(cat => !cat.is_featured)

  // Generate structured data
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Travel Categories',
    description: 'Browse travel content organized by destinations, topics, and interests.',
    url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.cuddlynest.com'}/categories`,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: categories.length,
      itemListElement: categories.slice(0, 20).map((category, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'Thing',
          name: category.name,
          description: category.description,
          url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.cuddlynest.com'}/category/${category.slug}`,
          image: category.featured_image
        }
      }))
    },
    breadcrumb: {
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
        }
      ]
    }
  }

  return (
    <>
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <div className="min-h-screen bg-white">
        {/* Main Layout Container - matching article template */}
        <div className="w-[1600px] mx-auto bg-white min-h-screen relative">
          
          {/* Hero Section */}
          <header style={{ paddingLeft: '160px', paddingRight: '152px', paddingTop: '40px', paddingBottom: '60px' }}>
            <div className="max-w-4xl">
              <div className="flex items-start mb-6">
                <Badge variant="secondary" className="text-[#797882] bg-[#F7F8FA] border-[#DFE2E5] flex items-center gap-2">
                  <Layers className="w-4 h-4" />
                  Browse by Category
                </Badge>
              </div>
              
              <h1 className="text-4xl lg:text-5xl font-bold mb-6 text-[#242526]">
                Travel Categories
              </h1>
              
              <p className="text-xl text-[#797882] mb-8 max-w-3xl leading-relaxed">
                Discover travel content organized by destinations, interests, and topics. 
                From budget tips to luxury experiences, find exactly what you're looking for.
              </p>

              <div className="flex items-center text-[#797882] pb-8">
                <Tag className="w-5 h-5 mr-2" />
                <span>{categories.length} categories available</span>
              </div>

              {/* Separator line like in article template */}
              <div className="w-full h-[1px] bg-[#DFE2E5] mb-8"></div>
            </div>
          </header>

          {/* Main Content */}
          <main style={{ paddingLeft: '160px', paddingRight: '152px' }}>
            <div className="max-w-5xl">
            
              {/* Featured Categories */}
              {featuredCategories.length > 0 && (
                <section className="mb-16">
                  <div className="mb-12">
                    <h2 className="text-3xl font-bold text-[#242526] mb-4">Featured Categories</h2>
                    <p className="text-[#797882] max-w-3xl leading-relaxed">
                      Our most popular travel categories with the richest content and expert guides.
                    </p>
                  </div>

                  <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                    {featuredCategories.map((category) => (
                      <Link key={category.id} href={`/category/${category.slug}`}>
                        <article className="group border border-[#DFE2E5] rounded-lg hover:border-[#242526] transition-all duration-200 hover:shadow-lg p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center">
                              <div 
                                className="w-4 h-4 rounded-full mr-3 flex-shrink-0"
                                style={{ backgroundColor: category.color || '#6B46C1' }}
                              />
                              <h3 className="text-xl font-semibold text-[#242526] group-hover:text-[#797882] transition-colors">
                                {category.name}
                              </h3>
                            </div>
                            <Badge className="bg-[#F7F8FA] text-[#797882] border-[#DFE2E5] text-xs">
                              Featured
                            </Badge>
                          </div>
                          
                          {category.description && (
                            <p className="text-[#797882] line-clamp-2 leading-relaxed mb-4">
                              {category.description}
                            </p>
                          )}

                          <div className="flex items-center text-sm text-[#797882]">
                            <FileText className="w-4 h-4 mr-1" />
                            <span>{category.post_count || 0} article{(category.post_count || 0) !== 1 ? 's' : ''}</span>
                          </div>
                        </article>
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              {/* All Categories */}
              <section>
                <div className="mb-12">
                  <h2 className="text-3xl font-bold text-[#242526] mb-4">All Categories</h2>
                  <p className="text-[#797882] max-w-3xl leading-relaxed">
                    Browse our complete collection of travel categories and find your perfect match.
                  </p>
                </div>

                {/* Categories Grid */}
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {[...featuredCategories, ...regularCategories].map((category) => (
                    <Link key={`all-${category.id}`} href={`/category/${category.slug}`}>
                      <article className="group border border-[#DFE2E5] rounded-lg hover:border-[#242526] transition-all duration-200 hover:shadow-md p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center min-w-0 flex-1">
                            <div 
                              className="w-3 h-3 rounded-full mr-3 flex-shrink-0"
                              style={{ backgroundColor: category.color || '#6B46C1' }}
                            />
                            <h3 className="text-lg font-medium text-[#242526] group-hover:text-[#797882] transition-colors truncate">
                              {category.name}
                            </h3>
                          </div>
                          {category.is_featured && (
                            <Badge className="bg-[#F7F8FA] text-[#797882] border-[#DFE2E5] text-xs ml-2">
                              Featured
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center text-sm text-[#797882] mb-3">
                          <FileText className="w-4 h-4 mr-1" />
                          <span>{category.post_count || 0} article{(category.post_count || 0) !== 1 ? 's' : ''}</span>
                        </div>
                        
                        {category.description && (
                          <p className="text-[#797882] line-clamp-2 text-sm leading-relaxed">
                            {category.description}
                          </p>
                        )}
                      </article>
                    </Link>
                  ))}
                </div>

                {categories.length === 0 && (
                  <div className="text-center py-16">
                    <Tag className="w-16 h-16 mx-auto text-[#797882] mb-4" />
                    <h3 className="text-xl font-semibold text-[#242526] mb-2">No categories available</h3>
                    <p className="text-[#797882]">
                      We're working on organizing our content. Check back soon for travel categories!
                    </p>
                  </div>
                )}
              </section>

              {/* Stats Section */}
              {categories.length > 0 && (
                <section className="mt-16 pt-12 border-t border-[#DFE2E5]">
                  <div className="text-center">
                    <h3 className="text-2xl font-bold text-[#242526] mb-8">Explore Our Content</h3>
                    <div className="grid gap-8 md:grid-cols-3 max-w-2xl mx-auto">
                      <div>
                        <div className="text-3xl font-bold text-[#242526] mb-2">
                          {categories.length}
                        </div>
                        <div className="text-[#797882]">Categories</div>
                      </div>
                      <div>
                        <div className="text-3xl font-bold text-[#242526] mb-2">
                          {categories.reduce((sum, cat) => sum + (cat.post_count || 0), 0)}
                        </div>
                        <div className="text-[#797882]">Articles</div>
                      </div>
                      <div>
                        <div className="text-3xl font-bold text-[#242526] mb-2">
                          {featuredCategories.length}
                        </div>
                        <div className="text-[#797882]">Featured</div>
                      </div>
                    </div>
                  </div>
                </section>
              )}
            </div>
          </main>
        </div>
      </div>
    </>
  )
}