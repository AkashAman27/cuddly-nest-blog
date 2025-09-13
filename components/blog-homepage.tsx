'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Play, ChevronRight, Search, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'

interface BlogPost {
  id: string
  title: string
  excerpt: string
  slug: string
  featured_image_url?: string
  featured_image?: { file_url: string } | null
  author?: string
  published_at: string
  category?: string
  read_time?: number
}

interface BlogHomepageProps {
  recentPosts: BlogPost[]
  featuredPosts: BlogPost[]
  totalPosts: number
  categories: string[]
}

export function BlogHomepage({ recentPosts, featuredPosts, totalPosts, categories }: BlogHomepageProps) {
  const [showVideoModal, setShowVideoModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchSuggestions, setSearchSuggestions] = useState<BlogPost[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)

  const openVideoModal = () => {
    setShowVideoModal(true)
  }

  const closeVideoModal = () => {
    setShowVideoModal(false)
  }

  // Search suggestions with debounce
  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      if (!searchQuery.trim()) {
        setSearchSuggestions([])
        setShowSuggestions(false)
        setIsSearching(false)
        return
      }

      setIsSearching(true)
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}&limit=8`)
        const data = await response.json()
        
        if (data.success) {
          setSearchSuggestions(data.posts)
          setShowSuggestions(data.posts.length > 0)
          setSelectedIndex(-1)
        } else {
          console.error('Search failed:', data.error)
          setSearchSuggestions([])
          setShowSuggestions(false)
        }
      } catch (error) {
        console.error('Search error:', error)
        setSearchSuggestions([])
        setShowSuggestions(false)
      } finally {
        setIsSearching(false)
      }
    }, 200) // 200ms debounce for faster suggestions

    return () => clearTimeout(timeoutId)
  }, [searchQuery])

  const handleSearchInput = (query: string) => {
    setSearchQuery(query)
    setSelectedIndex(-1)
    if (!query.trim()) {
      setShowSuggestions(false)
      setSearchSuggestions([])
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => 
          prev < searchSuggestions.length - 1 ? prev + 1 : prev
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => prev > -1 ? prev - 1 : -1)
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && selectedIndex < searchSuggestions.length) {
          const selectedPost = searchSuggestions[selectedIndex]
          window.location.href = `/blog/${selectedPost.slug}`
        }
        break
      case 'Escape':
        setShowSuggestions(false)
        setSelectedIndex(-1)
        break
    }
  }

  const clearSearch = () => {
    setSearchQuery('')
    setSearchSuggestions([])
    setShowSuggestions(false)
    setSelectedIndex(-1)
    setIsSearching(false)
  }

  const handleSuggestionClick = (post: BlogPost) => {
    window.location.href = `/blog/${post.slug}`
  }

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (!target.closest('[data-search-container]')) {
        setShowSuggestions(false)
        setSelectedIndex(-1)
      }
    }

    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-50 h-[68px] flex items-center justify-between px-6 md:px-[100px]">
        <div className="flex items-center">
          <Link href="/" className="w-[200px] h-[43.61px] flex items-center">
            <div className="cursor-pointer w-full h-full relative">
              {/* Group 243 - Birds and icon elements */}
              <div
                style={{
                  position: 'absolute',
                  left: '-0.52px',
                  top: '-0.01px',
                  width: '64.07px',
                  height: '38.15px'
                }}
              >
                {/* Vector 1 - Pink bird */}
                <img
                  src="/blog-images/bird-vector-1.svg"
                  alt=""
                  style={{
                    position: 'absolute',
                    left: '40.08px',
                    top: '9.17px',
                    width: '23px',
                    height: '9px'
                  }}
                />
                
                {/* Vector 2 - Purple element */}
                <img
                  src="/blog-images/bird-vector-2.svg"
                  alt=""
                  style={{
                    position: 'absolute',
                    left: '19.52px',
                    top: '21.42px',
                    width: '6px',
                    height: '7px'
                  }}
                />
                
                {/* Vector 3 - Purple element */}
                <img
                  src="/blog-images/bird-vector-3.svg"
                  alt=""
                  style={{
                    position: 'absolute',
                    left: '8.43px',
                    top: '9.67px',
                    width: '11px',
                    height: '3px'
                  }}
                />
                
                {/* Vector 4 - Purple element */}
                <img
                  src="/blog-images/bird-vector-4.svg"
                  alt=""
                  style={{
                    position: 'absolute',
                    left: '34.51px',
                    top: '4.79px',
                    width: '14px',
                    height: '7px'
                  }}
                />
                
                {/* Vector 5 - Pink base element */}
                <img
                  src="/blog-images/bird-vector-5.svg"
                  alt=""
                  style={{
                    position: 'absolute',
                    left: '0px',
                    top: '0px',
                    width: '48px',
                    height: '39px'
                  }}
                />
              </div>
              
              {/* CuddlyNest Text - Black color for blog homepage */}
              <div
                style={{
                  position: 'absolute',
                  left: '75px',
                  top: '8px',
                  fontSize: '18px',
                  fontWeight: 700,
                  fontFamily: 'Poppins, sans-serif',
                  color: '#000000',
                  letterSpacing: '-0.02em'
                }}
              >
                CuddlyNest
              </div>
            </div>
          </Link>
        </div>
        
        <nav className="hidden md:flex items-center gap-[26px]">
          <Link href="/categories" className="text-white font-semibold text-sm hover:text-gray-200 transition-colors">
            Categories
          </Link>
          <Link href="/about" className="text-white font-semibold text-sm hover:text-gray-200 transition-colors">
            About Us
          </Link>
        </nav>
        
      </header>

      {/* Hero Section */}
      <section className="relative h-[523px] flex items-center justify-center">
        <div className="absolute inset-0">
          <Image
            src="/blog-images/hero-background-49938a.png"
            alt="Hero background"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-black/20" />
        </div>
        
        <div className="relative z-10 text-center px-4">
          <h1 className="text-[48px] font-bold text-white leading-[52px] tracking-[-0.04em] mb-8 max-w-[1256px]">
            Articles, tips and tricks for travelers & property owners.
          </h1>
          
          {/* Search Box */}
          <div className="max-w-2xl mx-auto mb-8" data-search-container>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => handleSearchInput(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => {
                  if (searchSuggestions.length > 0 && searchQuery.trim()) {
                    setShowSuggestions(true)
                  }
                }}
                className="block w-full pl-12 pr-12 py-4 border border-gray-200 rounded-full bg-white/95 backdrop-blur-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-lg text-lg"
                autoComplete="off"
              />
              
              {/* Loading indicator */}
              {isSearching && (
                <div className="absolute inset-y-0 right-12 flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                </div>
              )}
              
              {/* Clear button */}
              {searchQuery && (
                <button
                  onClick={clearSearch}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center hover:text-gray-600 transition-colors"
                >
                  <X className="h-5 w-5 text-gray-400" />
                </button>
              )}
              
              {/* Search Suggestions Dropdown */}
              {showSuggestions && searchSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 max-h-96 overflow-y-auto">
                  {searchSuggestions.map((post, index) => (
                    <button
                      key={post.id}
                      onClick={() => handleSuggestionClick(post)}
                      className={`w-full text-left p-4 border-b border-gray-50 last:border-b-0 hover:bg-gray-50 transition-colors first:rounded-t-2xl last:rounded-b-2xl ${
                        selectedIndex === index ? 'bg-blue-50 border-blue-100' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                          {post.featured_image?.file_url || post.featured_image_url ? (
                            <Image
                              src={post.featured_image?.file_url || post.featured_image_url || ''}
                              alt={post.title}
                              width={48}
                              height={48}
                              className="w-full h-full object-cover rounded-lg"
                              onError={(e) => {
                                const img = e.target as HTMLImageElement;
                                img.style.display = 'none';
                                const parent = img.parentElement;
                                if (parent) {
                                  parent.innerHTML = '<Search class="h-5 w-5 text-gray-400" />';
                                }
                              }}
                            />
                          ) : (
                            <Search className="h-5 w-5 text-gray-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-semibold text-gray-900 line-clamp-2 mb-1">
                            {post.title}
                          </h4>
                          {post.excerpt && (
                            <p className="text-xs text-gray-600 line-clamp-2">
                              {post.excerpt}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs text-gray-500">
                              {new Date(post.published_at || post.created_at).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </span>
                            {post.reading_time && (
                              <>
                                <span className="text-xs text-gray-300">•</span>
                                <span className="text-xs text-gray-500">{post.reading_time} min read</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                  
                  {/* Show all results link */}
                  <div className="p-3 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
                    <button 
                      onClick={() => {
                        // You can implement a full search results page here
                        console.log('Show all results for:', searchQuery)
                        setShowSuggestions(false)
                      }}
                      className="w-full text-center text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      See all results for "{searchQuery}"
                    </button>
                  </div>
                </div>
              )}
              
              {/* No results found */}
              {showSuggestions && searchSuggestions.length === 0 && !isSearching && searchQuery.trim() && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 p-6 text-center">
                  <Search className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">No articles found for "{searchQuery}"</p>
                  <p className="text-xs text-gray-500 mt-1">Try different keywords or check spelling</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Press Mentions */}
      <section className="py-12 bg-white border-b border-gray-100">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="flex items-center justify-center">
            <div className="grid grid-cols-2 md:grid-cols-6 gap-8 items-center opacity-50">
              <div className="flex justify-center">
                <span className="text-gray-400 font-medium text-sm tracking-wider">EXPRESS</span>
              </div>
              <div className="flex justify-center">
                <span className="text-gray-400 font-medium text-sm tracking-wider">TRAVEL DIGEST</span>
              </div>
              <div className="flex justify-center">
                <span className="text-gray-400 font-medium text-sm tracking-wider">RENTALZ</span>
              </div>
              <div className="flex justify-center">
                <span className="text-gray-400 font-medium text-sm tracking-wider">PHOCUSWIRE</span>
              </div>
              <div className="flex justify-center">
                <span className="text-gray-400 font-medium text-sm tracking-wider">SKIFT</span>
              </div>
              <div className="flex justify-center">
                <span className="text-gray-400 font-medium text-sm tracking-wider">TRAVELPULSE</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Trending This Week */}
            <section className="mb-16">
              <div className="mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-8">Trending this week</h2>
                
                <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
                  <div className="relative">
                    <div className="aspect-[858/375] relative">
                      <Image
                        src="/blog-images/trending-post-image.jpg"
                        alt="Trending post"
                        fill
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                    </div>
                    
                    <div className="p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-5 h-5 bg-gray-300 rounded-full"></div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <span>Author Name</span>
                          <span>•</span>
                          <span>5 min read</span>
                        </div>
                      </div>
                      
                      <h3 className="text-2xl font-semibold text-gray-900 mb-3 leading-tight">
                        The Best Places to Travel According to Your Zodiac Sign
                      </h3>
                      
                      <p className="text-gray-600 leading-relaxed mb-6">
                        You might get surprised, but Astrology and travel have a lot in common. You would get even more surprised knowing that there are top travel destinations...
                      </p>
                    </div>
                    
                    <div className="absolute bottom-6 right-6">
                      <div className="bg-white rounded-full px-6 py-2 border border-gray-200">
                        <span className="text-sm font-medium text-gray-900">Stays You'll Love</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Recent Articles */}
            <section className="mb-16">
              <h2 className="text-2xl font-bold text-gray-900 mb-8">Recent Articles</h2>
              <div className="space-y-6 md:space-y-8 lg:space-y-10">
                {recentPosts.slice(0, 6).map((post) => (
                  <Link key={post.id} href={`/blog/${post.slug}`}>
                    <div className="group flex gap-6 cursor-pointer p-2 md:p-3 rounded-lg hover:bg-gray-50/50 transition-colors">
                      <div className="relative w-48 h-32 flex-shrink-0 rounded-xl overflow-hidden">
                        <Image
                          src={post.featured_image?.file_url || post.featured_image_url || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'}
                          alt={post.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            const img = e.target as HTMLImageElement;
                            img.src = 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';
                          }}
                        />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                          {post.title}
                        </h3>
                        <p className="text-gray-600 text-sm line-clamp-3 mb-3">
                          {post.excerpt}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span>{post.author}</span>
                          <span>•</span>
                          <span>{new Date(post.published_at).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric',
                            timeZone: 'UTC'
                          })}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>

            {/* Featured Article with Large Image */}
            {featuredPosts[0] && (
              <section className="mb-16">
                <div className="relative rounded-3xl overflow-hidden aspect-[16/9]">
                  <Image
                    src="/blog-images/featured-post-background.png"
                    alt="Featured post background"
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute bottom-12 left-12 right-12">
                    <Badge className="mb-4 bg-white/20 text-white backdrop-blur-sm">
                      Hacks & Tips
                    </Badge>
                    <Link href="/blog/digital-nomad-visa" className="block">
                      <h2 className="text-3xl font-semibold text-white mb-4 max-w-lg leading-tight hover:text-gray-200 transition-colors cursor-pointer">
                        The Best 19 Countries With Digital Nomad Visas Around The World
                      </h2>
                    </Link>
                    <p className="text-white/90 text-lg mb-6 max-w-xl leading-relaxed">
                      Working remotely while traveling the world is a tempting idea for many people — especially for the globetrotters who dream about living a life.
                    </p>
                    <Link href="/blog/digital-nomad-visa">
                      <div className="inline-block bg-white/20 text-white backdrop-blur-sm hover:bg-white/30 px-6 py-3 rounded-lg transition-colors cursor-pointer">
                        Read More
                      </div>
                    </Link>
                  </div>
                </div>
              </section>
            )}

            {/* Most Popular */}
            <section className="mb-16">
              <h2 className="text-2xl font-bold text-gray-900 mb-8">Most Popular</h2>
              <div className="space-y-6">
                {featuredPosts.slice(0, 4).map((post, index) => (
                  <Link key={post.id} href={`/blog/${post.slug}`}>
                    <div className="group flex gap-4 cursor-pointer">
                      <div className="relative w-24 h-20 flex-shrink-0 rounded-lg overflow-hidden">
                        <Image
                          src={post.featured_image?.file_url || post.featured_image_url || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80'}
                          alt={post.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            const img = e.target as HTMLImageElement;
                            img.src = 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80';
                          }}
                        />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 mb-1 group-hover:text-blue-600 transition-colors line-clamp-2">
                          {post.title}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <span>#{index + 1}</span>
                          <span>•</span>
                          <span>{new Date(post.published_at).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric',
                            timeZone: 'UTC'
                          })}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>

            {/* Our Favorite Destinations */}
            <section className="mb-16">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-bold text-gray-900">Our favorite destinations</h2>
                <Button variant="ghost" size="sm">
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { name: "DUBLIN", subtitle: "912 Stays", image: "https://images.unsplash.com/photo-1549918864-48ac978761a4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80", url: "https://www.cuddlynest.com/l/dublin-ct1372595407" },
                  { name: "LONDON", subtitle: "8819 Stays", image: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80", url: "https://www.cuddlynest.com/l/london-ct1826645935" },
                  { name: "AMSTERDAM", subtitle: "1128 Stays", image: "https://images.unsplash.com/photo-1534351590666-13e3e96b5017?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80", url: "https://www.cuddlynest.com/l/amsterdam-ct1528355309" },
                  { name: "BARCELONA", subtitle: "2804 Stays", image: "https://images.unsplash.com/photo-1539037116277-4db20889f2d4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80", url: "https://www.cuddlynest.com/l/barcelona-ct1724594040" },
                  { name: "BANGKOK", subtitle: "4035 Stays", image: "https://images.unsplash.com/photo-1508009603885-50cf7c579365?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80", url: "https://www.cuddlynest.com/l/bangkok-ct1764068610" },
                  { name: "BALI", subtitle: "4283 Stays", image: "https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80", url: "https://www.cuddlynest.com/l/bali-ct1360015008" },
                  { name: "LISBON", subtitle: "2812 Stays", image: "https://images.unsplash.com/photo-1555881400-74d7acaacd8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80", url: "https://www.cuddlynest.com/l/lisbon-ct1620619017" },
                  { name: "MADRID", subtitle: "2751 Stays", image: "https://images.unsplash.com/photo-1543785734-4b6e564642f8?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80", url: "https://www.cuddlynest.com/l/madrid-ct1724616994" },
                  { name: "NEW YORK", subtitle: "1626 Stays", image: "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80", url: "https://www.cuddlynest.com/l/new-york-ct1840034016" }
                ].map((destination) => (
                  <Link key={destination.name} href={destination.url} target="_blank" rel="noopener noreferrer">
                    <div className="relative aspect-[4/3] rounded-2xl overflow-hidden group cursor-pointer">
                      <Image
                        src={destination.image}
                        alt={destination.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <div className="absolute bottom-4 left-4">
                        <h3 className="text-white font-bold text-xl">{destination.name}</h3>
                        <p className="text-white/80 text-sm">{destination.subtitle}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>

            {/* Featured Videos */}
            <section className="mb-16">
              <h2 className="text-3xl font-bold text-gray-900 mb-8">Featured videos</h2>
              
              <div className="grid md:grid-cols-2 gap-8">
                <div 
                  className="relative aspect-video rounded-2xl overflow-hidden cursor-pointer group"
                  onClick={openVideoModal}
                >
                  <Image
                    src="https://img.youtube.com/vi/5WkanhGYHZ4/maxresdefault.jpg"
                    alt="Video thumbnail"
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                    <Button size="lg" className="rounded-full w-16 h-16 bg-white/20 backdrop-blur-sm hover:bg-white/30 group-hover:bg-white/40">
                      <Play className="w-6 h-6 text-white" />
                    </Button>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                    Authentic Italian Pesto Recipe
                  </h3>
                  <p className="text-gray-600 mb-6 leading-relaxed">
                    Traditional Pesto Recipe: Originated in Genova, the capital of Liguria, Italy, "Pesto Alla Genovese" is one of the best-known — and most delicious — Italian recipes.
                  </p>
                  <Button variant="outline" onClick={openVideoModal}>
                    Watch Video
                  </Button>
                </div>
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Search with Location Tags */}
            <div className="bg-gray-50 rounded-2xl p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Popular Destinations</h3>
              <div className="space-y-3">
                {/* Row 1 */}
                <div className="flex flex-wrap gap-2">
                  <Link href="https://www.cuddlynest.com/l/las-vegas-ct1840020364" target="_blank" rel="noopener noreferrer">
                    <button className="px-5 py-2 rounded-full border border-gray-300 bg-white text-gray-900 font-semibold text-sm hover:bg-gray-100 transition-colors">
                      Las Vegas
                    </button>
                  </Link>
                  <Link href="https://www.cuddlynest.com/l/madrid-ct1724616994" target="_blank" rel="noopener noreferrer">
                    <button className="px-5 py-2 rounded-full border border-gray-300 bg-white text-gray-900 font-semibold text-sm hover:bg-gray-100 transition-colors">
                      Madrid
                    </button>
                  </Link>
                  <Link href="https://www.cuddlynest.com/l/barcelona-ct1724594040" target="_blank" rel="noopener noreferrer">
                    <button className="px-5 py-2 rounded-full border border-gray-300 bg-white text-gray-900 font-semibold text-sm hover:bg-gray-100 transition-colors">
                      Barcelona
                    </button>
                  </Link>
                </div>
                
                {/* Row 2 */}
                <div className="flex flex-wrap gap-2">
                  <Link href="https://www.cuddlynest.com/l/bangkok-ct1764068610" target="_blank" rel="noopener noreferrer">
                    <button className="px-5 py-2 rounded-full bg-pink-500 text-white font-semibold text-sm hover:bg-pink-600 transition-colors">
                      Bangkok
                    </button>
                  </Link>
                  <Link href="https://www.cuddlynest.com/l/los-angeles-ct1840020491" target="_blank" rel="noopener noreferrer">
                    <button className="px-5 py-2 rounded-full border border-gray-300 bg-white text-gray-900 font-semibold text-sm hover:bg-gray-100 transition-colors">
                      Los Angeles
                    </button>
                  </Link>
                  <Link href="https://www.cuddlynest.com/l/new-york-ct1840034016" target="_blank" rel="noopener noreferrer">
                    <button className="px-5 py-2 rounded-full border border-gray-300 bg-white text-gray-900 font-semibold text-sm hover:bg-gray-100 transition-colors">
                      New York
                    </button>
                  </Link>
                </div>
                
                {/* Row 3 */}
                <div className="flex flex-wrap gap-2">
                  <Link href="https://www.cuddlynest.com/l/london-ct1826645935" target="_blank" rel="noopener noreferrer">
                    <button className="px-5 py-2 rounded-full border border-gray-300 bg-white text-gray-900 font-semibold text-sm hover:bg-gray-100 transition-colors">
                      London
                    </button>
                  </Link>
                  <Link href="https://www.cuddlynest.com/l/miami-ct1840015149" target="_blank" rel="noopener noreferrer">
                    <button className="px-5 py-2 rounded-full border border-gray-300 bg-white text-gray-900 font-semibold text-sm hover:bg-gray-100 transition-colors">
                      Miami
                    </button>
                  </Link>
                  <Link href="https://www.cuddlynest.com/l/bali-ct1360015008" target="_blank" rel="noopener noreferrer">
                    <button className="px-5 py-2 rounded-full border border-gray-300 bg-white text-gray-900 font-semibold text-sm hover:bg-gray-100 transition-colors">
                      Bali
                    </button>
                  </Link>
                </div>
              </div>
            </div>

            {/* Today's Update */}
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Today's Update</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-bold">14</span>
                  </div>
                  <div>
                    <div className="font-medium">450</div>
                    <div className="text-sm text-gray-500">Free Guides</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 font-bold">29</span>
                  </div>
                  <div>
                    <div className="font-medium">138</div>
                    <div className="text-sm text-gray-500">Blog Posts</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Categories */}
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Categories</h3>
              <div className="space-y-3">
                {categories.slice(0, 6).map((category, index) => {
                  // Generate a consistent "post count" based on category name
                  const deterministicCount = category.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 50 + 10
                  return (
                    <div key={category} className="flex items-center justify-between text-sm">
                      <Link href={`/category/${category.toLowerCase()}`} className="text-gray-700 hover:text-blue-600">
                        {category}
                      </Link>
                      <span className="text-gray-400">{deterministicCount}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Instagram Posts */}
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Instagram Posts</h3>
              <div className="grid grid-cols-3 gap-2 md:gap-4">
                {recentPosts.slice(0, 9).map((post, i) => (
                  <div
                    key={post.id}
                    className="aspect-square bg-gray-100 rounded-md overflow-hidden relative"
                  >
                    <Image
                      src={post.featured_image?.file_url || post.featured_image_url || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80'}
                      alt={post.title}
                      fill
                      className="object-cover"
                      onError={(e) => {
                        const img = e.target as HTMLImageElement;
                        img.src = 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80';
                      }}
                    />
                  </div>
                ))}
              </div>
              <div className="mt-4 text-center">
                <a
                  href="https://instagram.com/cuddlynest"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                  Follow @cuddlynest
                </a>
              </div>
            </div>

            {/* App Download CTA */}
            <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl p-6">
              <h3 className="text-2xl font-bold text-gray-700 mb-4 leading-tight">
                Millions of places to stay, one app.
              </h3>
              <p className="text-sm font-semibold text-gray-600 mb-4">Get the app now.</p>
              <div className="flex gap-2">
                <div className="bg-black text-white text-xs px-3 py-2 rounded">App Store</div>
                <div className="bg-black text-white text-xs px-3 py-2 rounded">Google Play</div>
              </div>
              <div className="flex justify-end -mb-6 -mr-6 mt-4">
                <div className="w-24 h-48 bg-gray-300 rounded-t-lg"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <section className="bg-gray-50 py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="bg-white rounded-2xl p-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">
              Frequently asked questions about family vacations
            </h2>
            
            <Accordion type="single" collapsible className="space-y-4">
              <AccordionItem value="item-1">
                <AccordionTrigger className="text-left">
                  What are the best family-friendly destinations?
                </AccordionTrigger>
                <AccordionContent>
                  Family-friendly destinations vary depending on your children's ages and interests. Popular options include Disney World, national parks, beach resorts, and cities with interactive museums and activities.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="item-2">
                <AccordionTrigger className="text-left">
                  What's the cheapest place for a family vacation?
                </AccordionTrigger>
                <AccordionContent>
                  Budget-friendly family destinations often include camping at state parks, visiting free attractions in major cities, or choosing destinations with favorable exchange rates.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="item-3">
                <AccordionTrigger className="text-left">
                  How do you plan a family vacation on a budget?
                </AccordionTrigger>
                <AccordionContent>
                  Planning a budget family vacation involves booking in advance, traveling during off-peak seasons, choosing accommodations with kitchens, and researching free local activities.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="item-4">
                <AccordionTrigger className="text-left">
                  How early does a flight to Disney vacation start?
                </AccordionTrigger>
                <AccordionContent>
                  Flight schedules to Orlando vary by airline and departure city. Most airlines offer early morning flights starting around 6 AM, with the earliest typically departing between 5:30-6:30 AM.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="item-5">
                <AccordionTrigger className="text-left">
                  What are the best destinations for families?
                </AccordionTrigger>
                <AccordionContent>
                  The best family destinations offer activities for all ages, safe environments, and good infrastructure. Consider theme parks, beach destinations, mountain resorts, and cities with family-oriented attractions.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-gray-400 mb-4">
            Travel is for everyone.
          </h2>
          <p className="text-gray-500 text-sm">
            © 2023 CuddlyNest. VRMA member.
          </p>
        </div>
      </footer>

      {/* YouTube Video Modal */}
      {showVideoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-4xl mx-4">
            {/* Close button */}
            <button
              onClick={closeVideoModal}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors z-10"
              aria-label="Close video"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            {/* YouTube iframe */}
            <div className="relative aspect-video rounded-lg overflow-hidden bg-black">
              <iframe
                width="100%"
                height="100%"
                src="https://www.youtube.com/embed/5WkanhGYHZ4?autoplay=1&rel=0&modestbranding=1"
                title="Authentic Italian Pesto Recipe"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="absolute inset-0"
              />
            </div>
          </div>
          
          {/* Click outside to close */}
          <div 
            className="absolute inset-0 -z-10" 
            onClick={closeVideoModal}
            aria-label="Close video modal"
          />
        </div>
      )}
    </div>
  )
}