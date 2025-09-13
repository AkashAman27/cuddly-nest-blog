'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, Calendar, Clock, ArrowRight, Loader2 } from "lucide-react"
import Link from "next/link"
import { debounce } from 'lodash'
import { ClientDate } from '@/components/client-date'

interface SearchPost {
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

interface SearchPostsProps {
  initialPosts: SearchPost[]
  totalPosts: number
}

export function SearchPosts({ initialPosts, totalPosts }: SearchPostsProps) {
  const [posts, setPosts] = useState<SearchPost[]>(initialPosts)
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (query: string) => {
      setIsSearching(true)
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}&limit=20`)
        const data = await response.json()
        
        if (data.success) {
          setPosts(data.posts)
          setHasSearched(query.length > 0)
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
    debouncedSearch(searchQuery)
  }, [searchQuery, debouncedSearch])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    debouncedSearch(searchQuery)
  }

  return (
    <div>
      {/* Search Section */}
      <section className="bg-brand-gradient text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Travel Stories & Guides
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-white/90 max-w-3xl mx-auto">
            Discover amazing destinations, hidden gems, and insider tips from our curated collection of travel experiences.
          </p>
          
          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} className="max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Search destinations, guides, or experiences..."
                className="pl-12 pr-24 py-4 text-lg rounded-full border-0 bg-white text-gray-900 placeholder:text-gray-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Button 
                type="submit"
                disabled={isSearching}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-brand-purple hover:bg-brand-deep-purple text-white px-6 py-2 rounded-full"
              >
                {isSearching ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Search'
                )}
              </Button>
            </div>
          </form>
          
          <p className="text-sm text-white/70 mt-4">
            🔍 Search through {totalPosts}+ travel guides and stories
          </p>
        </div>
      </section>

      {/* Results Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              {hasSearched ? `Search Results for "${searchQuery}"` : 'Latest Travel Stories'}
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {hasSearched 
                ? `Found ${posts.length} matching ${posts.length === 1 ? 'guide' : 'guides'}`
                : 'Fresh perspectives and updated guides from our travel experts around the world.'
              }
            </p>
          </div>

          {isSearching ? (
            <div className="text-center py-12">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-brand-purple" />
              <p className="text-gray-600">Searching travel guides...</p>
            </div>
          ) : posts.length === 0 && hasSearched ? (
            <div className="text-center py-12">
              <p className="text-gray-600 mb-4">No travel guides found matching "{searchQuery}"</p>
              <p className="text-sm text-gray-500">Try different keywords or browse our latest guides below</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {posts.map((post) => (
                <Card key={post.id} className="group hover:shadow-xl transition-all duration-300 border-0 bg-white overflow-hidden">
                  <div className="aspect-video overflow-hidden">
                    <img 
                      src={post.featured_image?.file_url || "/placeholder.svg?height=200&width=400"}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  
                  <CardContent className="p-6">
                    {/* Categories - using generic categories for now */}
                    <div className="flex flex-wrap gap-2 mb-3">
                      <Badge 
                        variant="outline" 
                        className="text-xs border-brand-purple text-brand-purple"
                      >
                        Travel Guide
                      </Badge>
                    </div>

                    {/* Title */}
                    <h3 className="font-bold text-lg mb-2 line-clamp-2 group-hover:text-brand-purple transition-colors">
                      {post.title}
                    </h3>

                    {/* Excerpt */}
                    <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                      {post.excerpt}
                    </p>

                    {/* Meta */}
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

                    {/* Read More Link */}
                    <Link 
                      href={`/blog/${post.slug}`}
                      className="inline-flex items-center gap-2 text-sm font-semibold text-brand-purple hover:text-brand-deep-purple transition-colors"
                    >
                      Read More
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Load More - for future implementation */}
          {!hasSearched && posts.length >= 8 && (
            <div className="text-center mt-12">
              <Button 
                size="lg"
                variant="outline"
                className="border-2 border-brand-purple text-brand-purple hover:bg-brand-purple hover:text-white px-8 py-4 rounded-full"
              >
                Load More Stories
              </Button>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}