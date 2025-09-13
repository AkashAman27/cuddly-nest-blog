"use client"

import Image from "next/image"
import Link from "next/link"
import { Calendar, Mail, MapPin, User } from "lucide-react"
import { Button } from "@/components/ui/button"

interface AuthorPost {
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

interface AuthorProfileProps {
  author: {
    id: string
    display_name: string
    bio?: string
    avatar?: string
    email: string
    social_links?: {
      twitter?: string
      instagram?: string
      linkedin?: string
    }
    posts: AuthorPost[]
    posts_count: number
    joined_date: string
  }
}

export function AuthorProfileComponent({ author }: AuthorProfileProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatJoinedDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long'
    })
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Sticky Header - Exact Figma Implementation */}
      <header 
        className="sticky top-0 z-50 bg-white"
        style={{ width: '1600px', height: '79px' }}
      >
        {/* Logo - Colored version with birds */}
        <div 
          style={{
            position: 'absolute',
            left: '100px',
            top: '18px',
            width: '154px',
            height: '43px',
            cursor: 'pointer'
          }}
        >
          <Link href="/blog">
            <div style={{ position: 'relative', width: '154px', height: '43px' }}>
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
                {/* Vector 1 - Pink bird (main bird shape) */}
                <img
                  src="/blog-images/bird-vector-1.svg"
                  alt="Bird vector 1"
                  style={{
                    position: 'absolute',
                    left: '40.08px',
                    top: '9.17px',
                    width: '23.98px',
                    height: '12.2px'
                  }}
                />
                
                {/* Vector 2 - Purple bird element */}
                <img
                  src="/blog-images/bird-vector-2.svg"
                  alt="Bird vector 2"
                  style={{
                    position: 'absolute',
                    left: '19.52px',
                    top: '21.42px',
                    width: '5.65px',
                    height: '6.14px'
                  }}
                />
                
                {/* Vector 3 - Purple bird element */}
                <img
                  src="/blog-images/bird-vector-3.svg"
                  alt="Bird vector 3"
                  style={{
                    position: 'absolute',
                    left: '8.43px',
                    top: '9.67px',
                    width: '10.88px',
                    height: '2.67px'
                  }}
                />
                
                {/* Vector 4 - Purple bird element */}
                <img
                  src="/blog-images/bird-vector-4.svg"
                  alt="Bird vector 4"
                  style={{
                    position: 'absolute',
                    left: '34.51px',
                    top: '4.79px',
                    width: '5.28px',
                    height: '1.41px'
                  }}
                />
                
                {/* Vector 5 - Pink base element (main body) */}
                <img
                  src="/blog-images/bird-vector-5.svg"
                  alt="Bird vector 5"
                  style={{
                    position: 'absolute',
                    left: '0px',
                    top: '0px',
                    width: '60.69px',
                    height: '32.91px'
                  }}
                />
              </div>
              
              {/* CuddlyNest Text - Black color for author page */}
              <div style={{ 
                position: 'absolute', 
                left: '75px', 
                top: '8px', 
                fontSize: '18px', 
                fontWeight: 700, 
                fontFamily: 'Poppins, sans-serif', 
                color: '#000000', 
                letterSpacing: '-0.02em' 
              }}>
                CuddlyNest
              </div>
            </div>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 to-indigo-100 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            {/* Author Avatar */}
            <div className="relative w-32 h-32 mx-auto mb-6">
              {author.avatar ? (
                <Image
                  src={author.avatar}
                  alt={author.display_name}
                  fill
                  className="rounded-full object-cover border-4 border-white shadow-lg"
                />
              ) : (
                <div className="w-32 h-32 bg-gray-300 rounded-full flex items-center justify-center border-4 border-white shadow-lg">
                  <User className="w-12 h-12 text-gray-600" />
                </div>
              )}
            </div>

            {/* Author Name & Title */}
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              {author.display_name}
            </h1>
            <p className="text-xl text-gray-600 mb-4">Travel Expert at CuddlyNest</p>

            {/* Author Bio */}
            {author.bio && (
              <p className="text-lg text-gray-700 max-w-3xl mx-auto mb-6 leading-relaxed">
                {author.bio}
              </p>
            )}

            {/* Author Stats */}
            <div className="flex items-center justify-center space-x-8 mb-8">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{author.posts_count}</div>
                <div className="text-sm text-gray-600">Articles</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{formatJoinedDate(author.joined_date)}</div>
                <div className="text-sm text-gray-600">Joined</div>
              </div>
            </div>

            {/* Social Links */}
            {author.social_links && (
              <div className="flex items-center justify-center space-x-4">
                {author.social_links.twitter && (
                  <Button variant="outline" asChild>
                    <a href={author.social_links.twitter} target="_blank" rel="noopener noreferrer">
                      Twitter
                    </a>
                  </Button>
                )}
                {author.social_links.instagram && (
                  <Button variant="outline" asChild>
                    <a href={author.social_links.instagram} target="_blank" rel="noopener noreferrer">
                      Instagram
                    </a>
                  </Button>
                )}
                {author.social_links.linkedin && (
                  <Button variant="outline" asChild>
                    <a href={author.social_links.linkedin} target="_blank" rel="noopener noreferrer">
                      LinkedIn
                    </a>
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Articles Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Latest Articles by {author.display_name}
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Discover travel insights, tips, and destination guides from our expert.
            </p>
          </div>

          {author.posts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {author.posts.map((post) => (
                <article key={post.id} className="group cursor-pointer">
                  <Link href={`/blog/${post.slug}`}>
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200">
                      {/* Article Image */}
                      <div className="aspect-video relative overflow-hidden">
                        {post.featured_image?.file_url ? (
                          <Image
                            src={post.featured_image.file_url}
                            alt={post.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-200"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                            <MapPin className="w-12 h-12 text-gray-400" />
                          </div>
                        )}
                      </div>

                      {/* Article Content */}
                      <div className="p-6">
                        <h3 className="text-xl font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                          {post.title}
                        </h3>
                        {post.excerpt && (
                          <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                            {post.excerpt}
                          </p>
                        )}
                        
                        {/* Article Meta */}
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-3 h-3" />
                            <span>{formatDate(post.published_at)}</span>
                          </div>
                          {post.reading_time && (
                            <span>{post.reading_time} min read</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                </article>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <User className="w-16 h-16 mx-auto" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No articles yet</h3>
              <p className="text-gray-600">This author hasn't published any articles yet.</p>
            </div>
          )}
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Get Travel Tips from Our Experts
          </h2>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Subscribe to our newsletter and get the latest travel insights, destination guides, and exclusive tips directly to your inbox.
          </p>
          
          <form className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
            <Button type="submit" size="lg" className="whitespace-nowrap">
              Subscribe
            </Button>
          </form>
          
          <p className="text-xs text-gray-500 mt-4">
            We respect your privacy. Unsubscribe at any time.
          </p>
        </div>
      </section>
    </div>
  )
}