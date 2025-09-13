'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, Calendar, Clock, ArrowRight, Loader2, MapPin, Star, TrendingUp } from "lucide-react"
import Link from "next/link"
import { debounce } from 'lodash'
import { ClientDate } from '@/components/client-date'

interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt?: string
  published_at: string
  reading_time?: number
  featured_image?: {
    file_url: string
  }
}

interface KlookStyleBlogProps {
  recentPosts: BlogPost[]
  featuredPosts: BlogPost[]
  totalPosts: number
  categories: string[]
  additionalCategories?: string[]
  blogLogo?: {
    url: string
    alt: string
  }
}

export function KlookStyleBlog({ recentPosts, featuredPosts, totalPosts, categories, additionalCategories = [], blogLogo }: KlookStyleBlogProps) {
  const [posts, setPosts] = useState<BlogPost[]>(recentPosts)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<BlogPost[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [showCategoryResults, setShowCategoryResults] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  // Debounced search function for dropdown
  const debouncedSearch = useCallback(
    debounce(async (query: string) => {
      if (query.length < 2) {
        setSearchResults([])
        setShowDropdown(false)
        return
      }

      setIsSearching(true)
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}&limit=8`)
        const data = await response.json()
        
        if (data.success) {
          setSearchResults(data.posts)
          setShowDropdown(true)
        }
      } catch (error) {
        console.error('Search error:', error)
      } finally {
        setIsSearching(false)
      }
    }, 300),
    []
  )

  // Handle search input changes
  useEffect(() => {
    if (searchQuery.length >= 2) {
      debouncedSearch(searchQuery)
    } else {
      setSearchResults([])
      setShowDropdown(false)
    }
  }, [searchQuery, debouncedSearch])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setShowDropdown(false)
    // Optional: could trigger full search here if needed
  }

  const handleCategoryClick = async (category: string) => {
    const newCategory = category === selectedCategory ? '' : category
    setSelectedCategory(newCategory)
    
    if (newCategory) {
      setIsSearching(true)
      try {
        const response = await fetch(`/api/search?category=${encodeURIComponent(newCategory)}&limit=20`)
        const data = await response.json()
        
        if (data.success) {
          setPosts(data.posts)
          setShowCategoryResults(true)
        }
      } catch (error) {
        console.error('Category filter error:', error)
      } finally {
        setIsSearching(false)
      }
    } else {
      // Reset to recent posts when category is deselected
      setPosts(recentPosts)
      setShowCategoryResults(false)
    }
  }

  const handleSearchResultClick = (slug: string) => {
    setShowDropdown(false)
    setSearchQuery('')
    // Navigation will be handled by Link component
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section - Inspired by Klook */}
      <section 
        className="relative min-h-[80vh] flex items-center justify-center bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `linear-gradient(135deg, rgba(0, 0, 0, 0.4) 0%, rgba(0, 0, 0, 0.3) 100%), url('https://images.unsplash.com/photo-1488646953014-85cb44e25828?ixlib=rb-4.0.3&auto=format&fit=crop&w=2835&q=80')`
        }}
      >
        {/* Background overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/40"></div>
        
        {/* CuddlyNest Logo - Top Left */}
        <div className="absolute top-6 left-6 z-20">
          <Link href="/blog" className="inline-block">
            {blogLogo ? (
              <img 
                src={blogLogo.url} 
                alt={blogLogo.alt}
                className="h-12 object-contain"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.style.display = 'none'
                  // Show fallback SVG if image fails
                  const svg = target.nextElementSibling as HTMLElement
                  if (svg) svg.style.display = 'block'
                }}
              />
            ) : null}
            <svg 
              width="160" 
              height="48" 
              viewBox="0 0 160 48" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
              style={{ display: blogLogo ? 'none' : 'block' }}
            >
              {/* Bird shapes */}
              <path d="M8 20c2-3 6-5 10-3 2 1 3 3 2 5-1 2-3 3-5 2-3-1-5-2-7-4z" fill="white"/>
              <path d="M12 16c1-1 3-1 4 0 1 1 1 2 0 3-1 1-2 1-3 0-1-1-1-2-1-3z" fill="white" opacity="0.8"/>
              
              {/* Text */}
              <text x="28" y="32" fontFamily="Arial, sans-serif" fontSize="20" fontWeight="bold" fill="white">
                CuddlyNest
              </text>
              
              {/* Decorative elements */}
              <circle cx="150" cy="12" r="2" fill="white" opacity="0.6"/>
              <circle cx="145" cy="36" r="1.5" fill="white" opacity="0.4"/>
            </svg>
          </Link>
        </div>
        
        {/* Content */}
        <div className="relative z-10 container mx-auto px-4 text-center text-white">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            Your guide to everywhere
          </h1>
          <p className="text-xl md:text-2xl mb-12 text-white/90 max-w-3xl mx-auto font-light">
            Discover amazing destinations, hidden gems, and insider tips from our curated collection of travel experiences.
          </p>
          
          {/* Search Bar with Dropdown */}
          <div ref={searchRef} className="max-w-2xl mx-auto mb-8 relative">
            <form onSubmit={handleSearchSubmit} className="relative">
              <div className="relative bg-white rounded-2xl shadow-2xl p-2">
                <div className="flex items-center">
                  <Search className="absolute left-6 text-gray-400 w-5 h-5 z-10" />
                  <Input
                    placeholder="Search destinations, guides, or experiences..."
                    className="flex-1 pl-14 pr-6 py-6 text-lg border-0 bg-transparent text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-0"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
                  />
                  <Button 
                    type="submit"
                    disabled={isSearching}
                    size="lg"
                    className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-8 py-6 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    {isSearching ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      'Search'
                    )}
                  </Button>
                </div>
              </div>
            </form>

            {/* Search Dropdown */}
            {showDropdown && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 max-h-96 overflow-y-auto">
                <div className="p-4 border-b border-gray-100">
                  <p className="text-sm text-gray-600">
                    Found {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} for "{searchQuery}"
                  </p>
                </div>
                
                <div className="py-2">
                  {searchResults.map((post) => (
                    <Link 
                      key={post.id} 
                      href={`/blog/${post.slug}`}
                      onClick={() => handleSearchResultClick(post.slug)}
                      className="block px-4 py-3 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-gray-200">
                          <img 
                            src={post.featured_image?.file_url || "/api/placeholder/64/64"}
                            alt={post.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 mb-1 line-clamp-2 text-sm">
                            {post.title}
                          </h4>
                          <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                            {post.excerpt}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <Calendar className="w-3 h-3" />
                            <ClientDate dateString={post.published_at} />
                            {post.reading_time && (
                              <>
                                <span>•</span>
                                <Clock className="w-3 h-3" />
                                <span>{post.reading_time} min read</span>
                              </>
                            )}
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" />
                      </div>
                    </Link>
                  ))}
                </div>
                
                {searchResults.length >= 8 && (
                  <div className="p-4 border-t border-gray-100 text-center">
                    <p className="text-sm text-gray-600">
                      Type more to see additional results...
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
          
          <p className="text-sm text-white/70">
            🌍 Explore {totalPosts}+ travel guides and experiences worldwide
          </p>
        </div>
      </section>

      {/* Featured Posts Section - Klook Style Grid */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Featured posts</h2>
            <div className="h-0.5 flex-1 bg-gray-200 ml-8"></div>
          </div>

          {featuredPosts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {featuredPosts.map((post, index) => (
                <Link key={post.id} href={`/blog/${post.slug}`}>
                  <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-white overflow-hidden cursor-pointer">
                    <div className={`aspect-[4/3] overflow-hidden relative ${index === 0 ? 'md:col-span-2 md:row-span-2' : ''}`}>
                      <img 
                        src={post.featured_image?.file_url || "/api/placeholder/400/300"}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      
                      {/* Overlay Badge */}
                      <div className="absolute top-4 left-4">
                        <Badge className="bg-orange-500 text-white border-0 font-medium px-3 py-1">
                          Featured
                        </Badge>
                      </div>
                    </div>
                    
                    <CardContent className="p-6">
                      {/* Title */}
                      <h3 className={`font-bold mb-3 line-clamp-2 group-hover:text-orange-600 transition-colors ${index === 0 ? 'text-xl' : 'text-lg'}`}>
                        {post.title}
                      </h3>

                      {/* Excerpt */}
                      <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                        {post.excerpt}
                      </p>

                      {/* Meta */}
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <ClientDate dateString={post.published_at} />
                        </div>
                        {post.reading_time && (
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{post.reading_time} min</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <p>No featured posts available. Check back soon for curated travel content!</p>
            </div>
          )}
        </div>
      </section>

      {/* Main Content Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          {showCategoryResults ? (
            // Category Results Layout
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-8">
                {selectedCategory} Travel Guides
              </h2>
              <p className="text-gray-600 mb-8">
                Discover {posts.length} {selectedCategory.toLowerCase()} {posts.length === 1 ? 'guide' : 'guides'}
              </p>
              <Button 
                variant="outline" 
                onClick={() => {
                  setSelectedCategory('')
                  setPosts(recentPosts)
                  setShowCategoryResults(false)
                }}
                className="mb-8 text-orange-600 border-orange-300 hover:bg-orange-50"
              >
                ← Show All Posts
              </Button>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {posts.map((post) => (
                  <Link key={post.id} href={`/blog/${post.slug}`}>
                    <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-white overflow-hidden cursor-pointer">
                      <div className="aspect-video overflow-hidden">
                        <img 
                          src={post.featured_image?.file_url || "/api/placeholder/400/200"}
                          alt={post.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      
                      <CardContent className="p-6">
                        <h3 className="font-bold text-lg mb-2 line-clamp-2 group-hover:text-orange-600 transition-colors">
                          {post.title}
                        </h3>

                        <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                          {post.excerpt}
                        </p>

                        <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <ClientDate dateString={post.published_at} />
                          </div>
                          {post.reading_time && (
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>{post.reading_time} min read</span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-sm font-semibold text-orange-600 group-hover:text-orange-700 transition-colors">
                          Read More
                          <ArrowRight className="w-3 h-3" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          ) : (
            // Default Two Column Layout
            <div className="grid lg:grid-cols-2 gap-12">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-8">Fresh ideas for fun</h2>
                <div className="space-y-6">
                  {posts.slice(0, 6).map((post) => (
                    <Link key={post.id} href={`/blog/${post.slug}`}>
                      <div className="flex gap-4 group cursor-pointer">
                        <div className="w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden">
                          <img 
                            src={post.featured_image?.file_url || "/api/placeholder/96/96"}
                            alt={post.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-orange-600 transition-colors">
                            {post.title}
                          </h3>
                          <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                            {post.excerpt}
                          </p>
                          <div className="flex items-center gap-3 text-xs text-gray-500">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              <ClientDate dateString={post.published_at} />
                            </div>
                            {post.reading_time && (
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                <span>{post.reading_time} min read</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-8">Most read right now</h2>
                <div className="space-y-6">
                  {posts.slice(6, 12).map((post, index) => (
                    <Link key={post.id} href={`/blog/${post.slug}`}>
                      <div className="group cursor-pointer">
                        <div className="flex items-start gap-3 mb-3">
                          <div className="flex-shrink-0 w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                            {index + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2 group-hover:text-orange-600 transition-colors">
                              {post.title}
                            </h3>
                            <p className="text-sm text-gray-600 line-clamp-2">
                              {post.excerpt}
                            </p>
                          </div>
                        </div>
                        <div className="ml-11 flex items-center gap-3 text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" />
                            <span>Trending</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <ClientDate dateString={post.published_at} />
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Categories Exploration */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Explore more on CuddlyNest</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Discover travel guides, tips, and experiences organized by your interests
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-4">
            {categories.map((category) => (
              <Button
                key={category}
                variant="outline"
                onClick={() => handleCategoryClick(category)}
                className={`h-14 px-6 border-2 transition-all duration-200 font-medium ${
                  selectedCategory === category
                    ? 'border-brand-purple text-white bg-brand-purple shadow-lg'
                    : 'border-brand-purple text-brand-purple bg-brand-purple/10 hover:bg-brand-purple/20 hover:border-brand-purple shadow-sm hover:shadow-md'
                }`}
              >
                {category}
              </Button>
            ))}
            
            {/* Additional categories as colorful rectangular boxes */}
            {additionalCategories.map((category) => {
              // Define color schemes for each category
              const getColorScheme = (cat: string) => {
                switch (cat.toLowerCase()) {
                  case 'nightlife':
                    return selectedCategory === cat
                      ? 'border-purple-500 text-white bg-purple-500 shadow-lg'
                      : 'border-purple-300 text-purple-700 bg-purple-100 hover:bg-purple-200 hover:border-purple-400 shadow-sm hover:shadow-md'
                  case 'food':
                    return selectedCategory === cat
                      ? 'border-orange-500 text-white bg-orange-500 shadow-lg'
                      : 'border-orange-300 text-orange-700 bg-orange-100 hover:bg-orange-200 hover:border-orange-400 shadow-sm hover:shadow-md'
                  case 'adventure':
                    return selectedCategory === cat
                      ? 'border-green-500 text-white bg-green-500 shadow-lg'
                      : 'border-green-300 text-green-700 bg-green-100 hover:bg-green-200 hover:border-green-400 shadow-sm hover:shadow-md'
                  case 'beaches':
                    return selectedCategory === cat
                      ? 'border-blue-500 text-white bg-blue-500 shadow-lg'
                      : 'border-blue-300 text-blue-700 bg-blue-100 hover:bg-blue-200 hover:border-blue-400 shadow-sm hover:shadow-md'
                  case 'culture':
                    return selectedCategory === cat
                      ? 'border-pink-500 text-white bg-pink-500 shadow-lg'
                      : 'border-pink-300 text-pink-700 bg-pink-100 hover:bg-pink-200 hover:border-pink-400 shadow-sm hover:shadow-md'
                  case 'hiking':
                    return selectedCategory === cat
                      ? 'border-emerald-500 text-white bg-emerald-500 shadow-lg'
                      : 'border-emerald-300 text-emerald-700 bg-emerald-100 hover:bg-emerald-200 hover:border-emerald-400 shadow-sm hover:shadow-md'
                  case 'city guides':
                    return selectedCategory === cat
                      ? 'border-indigo-500 text-white bg-indigo-500 shadow-lg'
                      : 'border-indigo-300 text-indigo-700 bg-indigo-100 hover:bg-indigo-200 hover:border-indigo-400 shadow-sm hover:shadow-md'
                  case 'hidden gems':
                    return selectedCategory === cat
                      ? 'border-rose-500 text-white bg-rose-500 shadow-lg'
                      : 'border-rose-300 text-rose-700 bg-rose-100 hover:bg-rose-200 hover:border-rose-400 shadow-sm hover:shadow-md'
                  default:
                    return selectedCategory === cat
                      ? 'border-gray-500 text-white bg-gray-500 shadow-lg'
                      : 'border-gray-300 text-gray-700 bg-gray-100 hover:bg-gray-200 hover:border-gray-400 shadow-sm hover:shadow-md'
                }
              }

              return (
                <Button
                  key={category}
                  variant="outline"
                  onClick={() => handleCategoryClick(category)}
                  className={`h-14 px-6 border-2 transition-all duration-200 font-medium ${getColorScheme(category)}`}
                >
                  {category}
                </Button>
              )
            })}
          </div>
        </div>
      </section>

    </div>
  )
}