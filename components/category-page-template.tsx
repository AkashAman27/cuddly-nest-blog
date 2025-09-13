'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { 
  Calendar, 
  Clock, 
  User, 
  ChevronLeft, 
  ChevronRight, 
  ArrowRight,
  ChevronDown,
  Tag,
  Home,
  FileText
} from 'lucide-react'
import { ModernCategory, ModernPost } from '@/lib/supabase'
import { useState } from 'react'
import { SafeCategoryContent } from '@/components/security/SafeHtml'

interface CategoryPageTemplateProps {
  category: ModernCategory
  posts: ModernPost[]
  currentPage: number
  totalPages: number
  totalPosts: number
}

export default function CategoryPageTemplate({ 
  category, 
  posts, 
  currentPage, 
  totalPages, 
  totalPosts 
}: CategoryPageTemplateProps) {
  const [openFAQs, setOpenFAQs] = useState<Set<string>>(new Set())

  const toggleFAQ = (faqId: string) => {
    const newOpenFAQs = new Set(openFAQs)
    if (newOpenFAQs.has(faqId)) {
      newOpenFAQs.delete(faqId)
    } else {
      newOpenFAQs.add(faqId)
    }
    setOpenFAQs(newOpenFAQs)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const generatePaginationNumbers = () => {
    const delta = 2
    const range = []
    const rangeWithDots = []

    for (
      let i = Math.max(2, currentPage - delta);
      i <= Math.min(totalPages - 1, currentPage + delta);
      i++
    ) {
      range.push(i)
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, '...')
    } else {
      rangeWithDots.push(1)
    }

    rangeWithDots.push(...range)

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages)
    } else {
      rangeWithDots.push(totalPages)
    }

    return rangeWithDots
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Main Layout Container - matching article template */}
      <div className="w-[1600px] mx-auto bg-white min-h-screen relative">
        
        {/* Breadcrumb Navigation - matching article template */}
        <nav style={{ paddingLeft: '160px', paddingRight: '152px', paddingTop: '20px' }}>
          <ol className="flex items-center space-x-2 text-sm text-[#797882]">
            <li>
              <Link href="/" className="hover:text-[#242526] flex items-center">
                <Home className="w-4 h-4 mr-1" />
                Home
              </Link>
            </li>
            <li>/</li>
            <li>
              <Link href="/categories" className="hover:text-[#242526]">
                Categories
              </Link>
            </li>
            <li>/</li>
            <li className="text-[#242526] font-medium">{category.name}</li>
          </ol>
        </nav>

        {/* Category Header */}
        <header style={{ paddingLeft: '160px', paddingRight: '152px', paddingTop: '40px', paddingBottom: '40px' }}>
          <div className="max-w-4xl">
            {/* Category Badge */}
            <div className="flex items-start mb-6">
              <Badge 
                variant="secondary" 
                className="text-[#797882] bg-[#F7F8FA] border-[#DFE2E5] flex items-center gap-2"
              >
                <div 
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: category.color || '#6B46C1' }}
                />
                {category.name}
              </Badge>
            </div>

            {/* Category Title */}
            <h1 className="text-4xl lg:text-5xl font-bold mb-6 text-[#242526]">
              {category.name}
            </h1>

            {/* Category Description */}
            {category.description && (
              <p className="text-xl text-[#797882] mb-8 max-w-3xl leading-relaxed">
                {category.description}
              </p>
            )}

            {/* Custom Content */}
            {category.custom_content && (
              <SafeCategoryContent
                html={category.custom_content}
                className="prose max-w-none mb-8 text-[#242526]"
                style={{ color: '#242526' }}
              />
            )}

            {/* Stats */}
            <div className="flex items-center space-x-6 text-[#797882] pb-8">
              <div className="flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                <span>{totalPosts} article{totalPosts !== 1 ? 's' : ''}</span>
              </div>
              {category.parent_category && (
                <div className="flex items-center">
                  <Tag className="w-5 h-5 mr-2" />
                  <Link 
                    href={`/category/${category.parent_category.slug}`}
                    className="hover:text-[#242526] underline"
                  >
                    {category.parent_category.name}
                  </Link>
                </div>
              )}
            </div>

            {/* Separator line like in article template */}
            <div className="w-full h-[1px] bg-[#DFE2E5] mb-8"></div>
          </div>
        </header>

        {/* Main Content Area - matching article template flex layout */}
        <div className="flex" style={{ paddingLeft: '160px', paddingRight: '152px', gap: '77px' }}>
          {/* Main Content Column */}
          <div style={{ width: '851px', flex: 'none' }}>
            
            {/* Articles Header */}
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-[#242526]">
                Latest Articles
              </h2>
              <div className="text-[#797882] text-sm">
                Page {currentPage} of {totalPages} • {totalPosts} articles
              </div>
            </div>

            {/* Articles Grid */}
            {posts.length > 0 ? (
              <div className="grid gap-8 grid-cols-1 md:grid-cols-2">
                {posts.map((post) => (
                  <article key={post.id} className="group">
                    <Link href={`/blog/${post.slug}`} className="block">
                      {/* Article Image */}
                      {post.featured_image?.file_url && (
                        <div className="relative h-48 overflow-hidden rounded-lg mb-4">
                          <Image
                            src={post.featured_image.file_url}
                            alt={post.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-200"
                          />
                        </div>
                      )}
                      
                      {/* Article Content */}
                      <div className="space-y-3">
                        <h3 className="text-xl font-semibold text-[#242526] group-hover:text-[#797882] transition-colors line-clamp-2 leading-tight">
                          {post.title}
                        </h3>
                        
                        {post.excerpt && (
                          <p className="text-[#797882] line-clamp-3 leading-relaxed">
                            {post.excerpt}
                          </p>
                        )}

                        {/* Article Meta */}
                        <div className="flex items-center text-sm text-[#797882] space-x-4">
                          {post.author && (
                            <div className="flex items-center">
                              <User className="w-4 h-4 mr-1" />
                              <span>{post.author.display_name}</span>
                            </div>
                          )}
                          {post.reading_time && (
                            <div className="flex items-center">
                              <Clock className="w-4 h-4 mr-1" />
                              <span>{post.reading_time} min read</span>
                            </div>
                          )}
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            <span>{formatDate(post.published_at || post.created_at)}</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </article>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <FileText className="w-16 h-16 mx-auto text-[#797882] mb-4" />
                <h3 className="text-xl font-semibold text-[#242526] mb-2">No articles yet</h3>
                <p className="text-[#797882]">
                  We're working on adding more content to this category. Check back soon!
                </p>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <nav className="flex justify-center mt-16 pt-8 border-t border-[#DFE2E5]" aria-label="Pagination">
                <div className="flex items-center space-x-2">
                  {/* Previous Page */}
                  {currentPage > 1 ? (
                    <Link href={`/category/${category.slug}?page=${currentPage - 1}`}>
                      <button className="px-4 py-2 text-[#797882] hover:text-[#242526] border border-[#DFE2E5] rounded-lg hover:border-[#242526] transition-colors flex items-center">
                        <ChevronLeft className="w-4 h-4 mr-1" />
                        Previous
                      </button>
                    </Link>
                  ) : (
                    <button className="px-4 py-2 text-[#DFE2E5] border border-[#DFE2E5] rounded-lg cursor-not-allowed flex items-center" disabled>
                      <ChevronLeft className="w-4 h-4 mr-1" />
                      Previous
                    </button>
                  )}

                  {/* Page Numbers */}
                  <div className="flex items-center space-x-1">
                    {generatePaginationNumbers().map((page, index) => (
                      <div key={index}>
                        {page === '...' ? (
                          <span className="px-3 py-2 text-[#797882]">...</span>
                        ) : (
                          <Link href={`/category/${category.slug}?page=${page}`}>
                            <button
                              className={`w-10 h-10 rounded-lg transition-colors ${
                                currentPage === page
                                  ? 'bg-[#242526] text-white'
                                  : 'text-[#797882] hover:text-[#242526] hover:bg-[#F7F8FA]'
                              }`}
                            >
                              {page}
                            </button>
                          </Link>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Next Page */}
                  {currentPage < totalPages ? (
                    <Link href={`/category/${category.slug}?page=${currentPage + 1}`}>
                      <button className="px-4 py-2 text-[#797882] hover:text-[#242526] border border-[#DFE2E5] rounded-lg hover:border-[#242526] transition-colors flex items-center">
                        Next
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </button>
                    </Link>
                  ) : (
                    <button className="px-4 py-2 text-[#DFE2E5] border border-[#DFE2E5] rounded-lg cursor-not-allowed flex items-center" disabled>
                      Next
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </button>
                  )}
                </div>
              </nav>
            )}
          </div>

          {/* Sidebar */}
          <div style={{ width: '312px', flex: 'none' }}>
            {/* Child Categories */}
            {category.child_categories && category.child_categories.length > 0 && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-[#242526] mb-4 flex items-center">
                  <Tag className="w-5 h-5 mr-2" />
                  Subcategories
                </h3>
                <div className="space-y-3">
                  {category.child_categories.map((child) => (
                    <Link 
                      key={child.id} 
                      href={`/category/${child.slug}`}
                      className="flex items-center justify-between p-3 border border-[#DFE2E5] rounded-lg hover:border-[#242526] transition-colors group"
                    >
                      <div className="flex items-center">
                        <div 
                          className="w-3 h-3 rounded-full mr-3"
                          style={{ backgroundColor: child.color || category.color }}
                        />
                        <span className="font-medium text-[#242526] group-hover:text-[#797882]">{child.name}</span>
                      </div>
                      <div className="flex items-center text-sm text-[#797882]">
                        <span>{child.post_count || 0}</span>
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* FAQ Section */}
            {category.faqs && category.faqs.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-[#242526] mb-2">Frequently Asked Questions</h3>
                <p className="text-[#797882] text-sm mb-6">
                  Common questions about {category.name.toLowerCase()}
                </p>
                <div className="space-y-4">
                  {category.faqs.map((faq, index) => (
                    <Collapsible 
                      key={faq.id} 
                      open={openFAQs.has(faq.id)}
                      onOpenChange={() => toggleFAQ(faq.id)}
                    >
                      <CollapsibleTrigger asChild>
                        <button className="w-full text-left p-4 border border-[#DFE2E5] rounded-lg hover:border-[#242526] transition-colors flex justify-between items-center">
                          <span className="font-medium pr-4 text-[#242526]">{faq.question}</span>
                          <ChevronDown 
                            className={`w-5 h-5 flex-shrink-0 transition-transform text-[#797882] ${
                              openFAQs.has(faq.id) ? 'rotate-180' : ''
                            }`} 
                          />
                        </button>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="px-4 pb-4 pt-2 text-[#797882] leading-relaxed">
                          {faq.answer}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}