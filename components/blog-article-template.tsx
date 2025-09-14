'use client'

import { Footer } from "@/components/footer"
import { LanguageSwitcher } from "@/components/LanguageSwitcher"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Calendar, Clock, Share2, User, MapPin, Star, Wifi, Car, Coffee, Utensils } from "lucide-react"
import { useEffect, useState } from 'react'
import { SafeBlogContent } from "@/components/security/SafeHtml"
import { CtaDisplay } from "@/components/cta-display"

// Enhanced Types for Universal Template
interface Author {
  display_name: string
  bio?: string
  avatar?: string
}

interface FAQ {
  id: string | number
  question: string
  answer: string
}

interface ArticleImage {
  src: string
  alt: string
  caption?: string
}

interface TOCItem {
  id: string
  title: string
  level: number // 1 for H1, 2 for H2, etc.
}

interface Hotel {
  id: string
  name: string
  image: string
  rating: number
  price: string
  location: string
  amenities: string[]
}

interface ItineraryDay {
  day: number
  title: string
  activities: Array<{
    time: string
    activity: string
    location: string
    description?: string
  }>
}

interface BudgetInfo {
  total_range: string
  breakdown: Array<{
    category: string
    amount: string
    description: string
  }>
}

interface CTA {
  id: string
  title: string
  description?: string
  button_text: string
  button_link: string
  position: number
}

interface TravelTips {
  category: string
  tips: string[]
}

interface EmbeddedComponent {
  type: string
  position: number
  data: any
}

interface BlogArticleData {
  id: string
  title: string
  excerpt?: string
  slug: string
  author: Author
  published_at: string
  updated_at?: string
  read_time: string
  seo_title?: string
  seo_description?: string
  meta_keywords?: string
  og_image: {
    file_url: string
  }
  featured_image?: {
    file_url: string
  }
  content: string // Rich HTML content with embedded components
  images?: ArticleImage[]
  faqs?: FAQ[]
  status: string
  categories?: string[]
  // Enhanced fields for unified template
  embedded_components?: EmbeddedComponent[]
  hotels?: Hotel[]
  itinerary?: ItineraryDay[]
  budget_info?: BudgetInfo
  travel_tips?: TravelTips[]
  starter_pack_data?: any
  ctas?: CTA[]
}

interface BlogArticleTemplateProps {
  article: BlogArticleData
  availableTranslations?: any[]
}

// Hotel Card Component
function HotelCard({ hotel }: { hotel: Hotel }) {
  return (
    <div className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
      <img
        src={hotel.image}
        alt={hotel.name}
        className="w-full h-48 object-cover"
      />
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-lg">{hotel.name}</h3>
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <span className="text-sm font-medium">{hotel.rating}</span>
          </div>
        </div>
        <div className="flex items-center gap-1 text-gray-600 mb-2">
          <MapPin className="w-4 h-4" />
          <span className="text-sm">{hotel.location}</span>
        </div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-lg font-bold text-green-600">{hotel.price}</span>
        </div>
        {hotel.amenities && hotel.amenities.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {hotel.amenities.slice(0, 3).map((amenity, index) => (
              <span key={index} className="text-xs bg-gray-100 px-2 py-1 rounded">
                {amenity}
              </span>
            ))}
            {hotel.amenities.length > 3 && (
              <span className="text-xs text-gray-500">+{hotel.amenities.length - 3} more</span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// Itinerary Component
function ItinerarySection({ itinerary }: { itinerary: ItineraryDay[] }) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-[#242526] mb-6">Itinerary</h2>
      {itinerary.map((day) => (
        <div key={day.day} className="border-l-4 border-blue-500 pl-6 pb-6">
          <h3 className="text-xl font-semibold text-[#242526] mb-3">
            Day {day.day}: {day.title}
          </h3>
          <div className="space-y-3">
            {day.activities.map((activity, index) => (
              <div key={index} className="flex gap-4 p-3 bg-gray-50 rounded-lg">
                <div className="font-medium text-blue-600 min-w-[80px]">
                  {activity.time}
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-[#242526]">{activity.activity}</h4>
                  <p className="text-sm text-gray-600 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {activity.location}
                  </p>
                  {activity.description && (
                    <p className="text-sm text-gray-700 mt-1">{activity.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// Budget Info Component
function BudgetSection({ budgetInfo }: { budgetInfo: BudgetInfo }) {
  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-6">
      <h2 className="text-2xl font-bold text-[#242526] mb-4">Budget Guide</h2>
      <div className="text-3xl font-bold text-green-600 mb-4">
        {budgetInfo.total_range}
      </div>
      <div className="space-y-3">
        {budgetInfo.breakdown.map((item, index) => (
          <div key={index} className="flex justify-between items-center py-2 border-b border-green-200 last:border-b-0">
            <div>
              <div className="font-medium text-[#242526]">{item.category}</div>
              <div className="text-sm text-gray-600">{item.description}</div>
            </div>
            <div className="font-semibold text-green-600">{item.amount}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Travel Tips Component
function TravelTipsSection({ tips }: { tips: TravelTips[] }) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-[#242526] mb-6">Travel Tips</h2>
      {tips.map((tipCategory, categoryIndex) => (
        <div key={categoryIndex} className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-[#242526] mb-4">{tipCategory.category}</h3>
          <ul className="space-y-2">
            {tipCategory.tips.map((tip, tipIndex) => (
              <li key={tipIndex} className="flex items-start gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <span className="text-gray-700">{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}

// Table of Contents Component
function ArticleTableOfContents({ tocItems }: { tocItems: TOCItem[] }) {
  const [activeSection, setActiveSection] = useState(tocItems[0]?.id || '')

  useEffect(() => {
    const handleScroll = () => {
      const sections = tocItems.map(item => ({
        id: item.id,
        element: document.getElementById(item.id)
      }))

      const scrollPosition = window.scrollY + 100

      for (let i = sections.length - 1; i >= 0; i--) {
        const section = sections[i]
        if (section.element) {
          const sectionTop = section.element.offsetTop
          if (scrollPosition >= sectionTop) {
            setActiveSection(section.id)
            break
          }
        }
      }
    }

    window.addEventListener('scroll', handleScroll)
    handleScroll()

    return () => window.removeEventListener('scroll', handleScroll)
  }, [tocItems])

  const handleClick = (id: string, event: React.MouseEvent) => {
    event.preventDefault()
    setActiveSection(id)
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      })
    }
  }

  if (tocItems.length === 0) return null

  return (
    <div className="mb-8" style={{ minHeight: '189px' }}>
      {/* TOC Title */}
      <div style={{ width: '136px', height: '29px', marginBottom: '32px' }}>
        <h3 
          className="text-[#242526]"
          style={{
            fontFamily: 'Poppins, sans-serif',
            fontWeight: 600,
            fontSize: '21px',
            lineHeight: '1.4em'
          }}
        >
          On this page
        </h3>
      </div>
      
      {/* TOC Navigation Links */}
      <div>
        <div className="space-y-0">
          {tocItems.map((item, index) => (
            <div 
              key={item.id}
              className="pb-6 last:pb-0"
            >
              <button 
                onClick={(e) => handleClick(item.id, e)}
                className={`text-left w-full block ${
                  activeSection === item.id 
                    ? 'text-[#242526] hover:text-[#242526]' 
                    : 'text-[#797882] hover:text-[#242526]'
                } transition-colors duration-200`}
                style={{
                  fontFamily: 'Poppins, sans-serif',
                  fontWeight: activeSection === item.id ? 600 : 500,
                  fontSize: '15px',
                  lineHeight: '1.5em',
                  textDecoration: 'none',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  paddingLeft: item.level === 2 ? '0px' : item.level === 3 ? '16px' : item.level === 4 ? '32px' : item.level === 5 ? '48px' : item.level === 6 ? '64px' : '0px', // Progressive indentation
                  paddingBottom: '8px'
                }}
              >
                {item.title}
              </button>
              {index < tocItems.length - 1 && (
                <div className="w-full h-[1px] bg-[#DFE2E5]"></div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function BlogArticleTemplate({ article, availableTranslations = [] }: BlogArticleTemplateProps) {
  // Extract headings from content to generate TOC
  const extractTOCFromContent = (content: string): TOCItem[] => {
    const matches = []
    
    // Try multiple patterns to catch headings with or without IDs
    const patterns = [
      // Pattern 1: Headings with id attributes
      /<(h[1-6])[^>]*id=["']([^"']*)["'][^>]*>([^<]+)<\/h[1-6]>/gi,
      // Pattern 2: Headings without id attributes (generate id from title)
      /<(h[1-6])[^>]*>([^<]+)<\/h[1-6]>/gi
    ]
    
    // First try to find headings with IDs
    let match
    const headingRegexWithId = /<(h[2-6])[^>]*id=["']([^"']*)["'][^>]*>([^<]+)<\/h[2-6]>/gi
    
    while ((match = headingRegexWithId.exec(content)) !== null) {
      const [, tag, id, title] = match
      matches.push({
        id,
        title: title.trim().replace(/<[^>]*>/g, ''), // Strip any HTML tags
        level: parseInt(tag.charAt(1))
      })
    }
    
    // If no headings with IDs found, try headings without IDs (H2-H6)
    if (matches.length === 0) {
      const headingRegexNoId = /<(h[2-6])[^>]*>([^<]+)<\/h[2-6]>/gi
      let matchIndex = 0
      
      while ((match = headingRegexNoId.exec(content)) !== null) {
        const [, tag, title] = match
        const cleanTitle = title.trim().replace(/<[^>]*>/g, '')
        const generatedId = cleanTitle.toLowerCase()
          .replace(/[^a-z0-9\s]/g, '')
          .replace(/\s+/g, '-')
          .substring(0, 50) + (matchIndex > 0 ? `-${matchIndex}` : '')
        
        matches.push({
          id: generatedId,
          title: cleanTitle,
          level: parseInt(tag.charAt(1))
        })
        matchIndex++
      }
    }
    
    console.log('TOC Debug - Extracted headings:', matches)
    return matches
  }

  const tocItems = extractTOCFromContent(article.content)

  // JSON-LD structured data for SEO
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.excerpt || article.seo_description,
    image: article.og_image?.file_url || article.featured_image?.file_url,
    datePublished: article.published_at,
    dateModified: article.updated_at || article.published_at,
    author: {
      '@type': 'Person',
      name: article.author.display_name,
    },
    publisher: {
      '@type': 'Organization',
      name: 'CuddlyNest',
      logo: {
        '@type': 'ImageObject',
        url: 'https://cuddlynest.com/logo.png',
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://cuddlynest.com/article/${article.slug}`,
    },
    articleSection: 'Travel Guide',
    keywords: article.meta_keywords,
  }

  return (
    <>
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Main container with fixed 1600px width */}
      <div className="w-[1600px] mx-auto bg-white min-h-screen relative">
        
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
              width: '200px',
              height: '43.61px'
            }}
          >
            <Link href="/blog">
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
                
                {/* CuddlyNest Text */}
                <div
                  style={{
                    position: 'absolute',
                    left: '75px',
                    top: '8px',
                    fontSize: '18px',
                    fontWeight: 700,
                    fontFamily: 'Poppins, sans-serif',
                    color: '#242526',
                    letterSpacing: '-0.02em'
                  }}
                >
                  CuddlyNest
                </div>
              </div>
            </Link>
          </div>

          {/* Search removed as requested */}

          {/* Navigation Links */}
          {/* Categories -> Editorial Policy */}
          <Link
            href="/blog/editorial-policy"
            style={{
              position: 'absolute',
              left: '1280px',
              top: '30px',
              width: '79px',
              height: '19px',
              fontFamily: 'Poppins, sans-serif',
              fontWeight: 600,
              fontSize: '14px',
              lineHeight: '1.3571428571428572em',
              color: '#797882',
              textDecoration: 'none'
            }}
            className="hover:text-[#242526] transition-colors"
          >
            Editorial Policy
          </Link>

          {/* About us */}
          <Link
            href="https://www.cuddlynest.com/pages/about-us"
            style={{
              position: 'absolute',
              left: '1386px',
              top: '30px',
              width: '64px',
              height: '19px',
              fontFamily: 'Poppins, sans-serif',
              fontWeight: 600,
              fontSize: '14px',
              lineHeight: '1.3571428571428572em',
              color: '#797882',
              textDecoration: 'none'
            }}
            className="hover:text-[#242526] transition-colors"
          >
            About us
          </Link>
        </header>

        {/* Main Content Area - Using flex layout, starting directly after header */}
        <div className="flex" style={{ marginTop: '20px', paddingLeft: '160px', paddingRight: '152px', gap: '77px' }}>
          
          {/* Article Content - 851px wide */}
          <div style={{ width: '851px', flex: 'none' }}>
            
            {/* Article Title */}
            <h1 
              className="text-[#242526] mb-8"
              style={{ 
                fontSize: '36px', 
                fontWeight: 600, 
                lineHeight: '1.4em', 
                letterSpacing: '-0.02em',
                fontFamily: 'Poppins, sans-serif'
              }}
            >
              {article.title}
            </h1>

            {/* Featured Image - full container width */}
            {(article.featured_image?.file_url || article.og_image?.file_url) && (
              <div 
                className="relative mb-8"
                style={{ width: '851px', height: '395px' }}
              >
                <img
                  src={article.featured_image?.file_url || article.og_image?.file_url}
                  alt={article.title}
                  className="w-full h-full object-cover"
                  style={{ borderRadius: '15px' }}
                />
                <div 
                  className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"
                  style={{ borderRadius: '15px' }}
                ></div>
                
                {/* Share Button */}
                <div className="absolute" style={{ top: '25px', right: '25px' }}>
                  <div 
                    className="bg-white rounded-full flex items-center justify-center shadow-lg cursor-pointer"
                    style={{ width: '48px', height: '48px' }}
                  >
                    <Share2 className="w-6 h-6 text-black" />
                  </div>
                </div>
              </div>
            )}

            {/* Author Info Bar */}
            <div 
              className="flex items-center gap-2 mb-8"
              style={{ marginLeft: '0px' }}
            >
              {/* Author Avatar */}
              <div 
                className="bg-gray-300 rounded-full overflow-hidden"
                style={{ width: '20.16px', height: '18px' }}
              >
                {article.author.avatar ? (
                  <img 
                    src={article.author.avatar} 
                    alt={article.author.display_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-400"></div>
                )}
              </div>
              
              <span 
                className="text-[#242526]"
                style={{ 
                  fontSize: '12px', 
                  lineHeight: '1.67em',
                  fontFamily: 'Poppins, sans-serif',
                  width: '87px'
                }}
              >
                {article.author.display_name}
              </span>
              
              <div 
                className="bg-[#F35597] rounded-full"
                style={{ width: '3px', height: '3px' }}
              ></div>
              
              <Calendar className="w-3 h-3 text-[#242526]" />
              
              <span 
                className="text-[#242526]"
                style={{ 
                  fontSize: '12px', 
                  lineHeight: '1.67em',
                  fontFamily: 'Poppins, sans-serif',
                  width: '76px'
                }}
              >
                {new Date(article.published_at).toLocaleDateString('en-US', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </span>
              
              <div 
                className="bg-[#F35597] rounded-full"
                style={{ width: '3px', height: '3px' }}
              ></div>
              
              <Clock className="w-3 h-3 text-[#242526]" />
              
              <span 
                className="text-[#242526]"
                style={{ 
                  fontSize: '12px', 
                  lineHeight: '1.67em',
                  fontFamily: 'Poppins, sans-serif',
                  width: '76px'
                }}
              >
                {article.read_time}
              </span>
              
              {/* Stays You'll Love Badge - positioned at right */}
              <div style={{ marginLeft: 'auto' }}>
                <div 
                  className="bg-white border border-black rounded-full flex items-center justify-center px-4 py-2"
                  style={{ height: '40px' }}
                >
                  <span 
                    className="text-[#242526]"
                    style={{ 
                      fontSize: '16px', 
                      fontWeight: 500,
                      lineHeight: '1.25em',
                      fontFamily: 'Poppins, sans-serif'
                    }}
                  >
                    Stays You'll Love
                  </span>
                </div>
              </div>
            </div>

            {/* Article Content */}
            <SafeBlogContent
              html={article.content}
              className="text-[#242526] mb-8 prose prose-lg max-w-none"
              style={{ 
                fontSize: '18px', 
                lineHeight: '1.5em', 
                letterSpacing: '-0.02em',
                fontFamily: 'Poppins, sans-serif',
                marginLeft: '0px',
                width: '851px'
              }}
            />
            
            {/* CTAs - Position 1: After introduction */}
            {article.ctas && article.ctas.filter(cta => cta.position === 1).map(cta => (
              <CtaDisplay
                key={cta.id}
                title={cta.title}
                description={cta.description}
                buttonText={cta.button_text}
                buttonLink={cta.button_link}
              />
            ))}
            
            {/* Enhanced Content Sections */}
            
            {/* Hotels Section */}
            {article.hotels && article.hotels.length > 0 && (
              <section className="mt-12 mb-8">
                <h2 
                  className="text-[#242526] mb-6"
                  style={{
                    fontFamily: 'Poppins, sans-serif',
                    fontWeight: 700,
                    fontSize: '28px',
                    lineHeight: '1.2em',
                    letterSpacing: '-0.02em'
                  }}
                >
                  Where to Stay
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {article.hotels.slice(0, 4).map((hotel, index) => (
                    <HotelCard key={index} hotel={hotel} />
                  ))}
                </div>
              </section>
            )}
            
            {/* Budget Info Section */}
            {article.budget_info && (
              <section className="mt-12 mb-8">
                <BudgetSection budgetInfo={article.budget_info} />
              </section>
            )}
            
            {/* Itinerary Section */}
            {article.itinerary && article.itinerary.length > 0 && (
              <section className="mt-12 mb-8">
                <ItinerarySection itinerary={article.itinerary} />
              </section>
            )}
            
            {/* CTAs - Position 2: Middle of content */}
            {article.ctas && article.ctas.filter(cta => cta.position === 2).map(cta => (
              <CtaDisplay
                key={cta.id}
                title={cta.title}
                description={cta.description}
                buttonText={cta.button_text}
                buttonLink={cta.button_link}
              />
            ))}
            
            {/* Travel Tips Section */}
            {article.travel_tips && article.travel_tips.length > 0 && (
              <section className="mt-12 mb-8">
                <TravelTipsSection tips={article.travel_tips} />
              </section>
            )}
            
          </div>
          
          {/* Sticky Sidebar - 360px wide */}
          <div style={{ width: '360px', flex: 'none' }}>
            <div className="sticky" style={{ top: '20px' }}>
              {/* Table of Contents */}
              <ArticleTableOfContents tocItems={tocItems} />

              {/* Categories Section */}
              {article.categories && article.categories.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-xl font-semibold mb-6 text-[#242526]">Categories</h3>
                  <div className="flex flex-wrap gap-3">
                    {article.categories.map((category, index) => (
                      <div key={index} className="bg-gray-100 px-3 py-2 rounded-lg">
                        <span className="text-sm font-medium text-gray-700">{category}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Discount Code CTA - Gradient Background */}
              <div 
                className="relative rounded-[20px] mb-6"
                style={{ 
                  width: '361px',
                  height: '317px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  overflow: 'visible'
                }}
              >
                {/* Main Discount Text - Left Side */}
                <div 
                  className="absolute text-white"
                  style={{ 
                    left: '29px',
                    top: '50px',
                    width: '142px',
                    height: '136px',
                    fontFamily: 'Poppins, sans-serif',
                    fontWeight: 700,
                    fontSize: '28px',
                    lineHeight: '1.2em'
                  }}
                >
                  Save 15% on your next booking!
                </div>
                
                {/* Discount Code Section - Right Side */}
                <div 
                  className="absolute"
                  style={{ 
                    right: '26px',
                    top: '80px',
                    width: '140px',
                    textAlign: 'center'
                  }}
                >
                  <div 
                    className="text-white mb-3"
                    style={{ 
                      fontFamily: 'Poppins, sans-serif',
                      fontWeight: 600,
                      fontSize: '14px',
                      lineHeight: '1.5em'
                    }}
                  >
                    Use code:
                  </div>
                  
                  {/* Discount Code with Copy Button */}
                  <div 
                    className="bg-white/20 backdrop-blur-sm rounded-lg px-3 py-3 flex items-center justify-between cursor-pointer hover:bg-white/30 transition-all mb-4"
                    onClick={() => {
                      navigator.clipboard.writeText('CUDDLY15');
                      // Show feedback (you could add a toast here)
                      const btn = event.target.closest('div');
                      const originalText = btn.innerHTML;
                      btn.innerHTML = '<span style="color: white; font-size: 12px; display: flex; align-items: center; justify-content: center; gap: 4px;"><span>Copied!</span> <span>✓</span></span>';
                      setTimeout(() => {
                        btn.innerHTML = originalText;
                      }, 2000);
                    }}
                  >
                    <span 
                      className="text-white font-mono"
                      style={{
                        fontFamily: 'monospace',
                        fontSize: '16px',
                        fontWeight: 700,
                        letterSpacing: '1px'
                      }}
                    >
                      CUDDLY15
                    </span>
                    <span 
                      className="text-white/80"
                      style={{ fontSize: '12px' }}
                    >
                      📋
                    </span>
                  </div>
                  
                  {/* CTA Button */}
                  <a 
                    href="https://cuddlynest.com" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="bg-white text-purple-700 px-4 py-2 rounded-full hover:bg-gray-100 transition-colors w-full"
                    style={{
                      fontFamily: 'Poppins, sans-serif',
                      fontSize: '12px',
                      fontWeight: 600,
                      textDecoration: 'none',
                      display: 'inline-block',
                      textAlign: 'center'
                    }}
                  >
                    Book Now & Save
                  </a>
                </div>
              </div>

            </div>
          </div>
          
        </div>

        {/* FAQ Section - Fixed Layout to Prevent Overlapping */}
        {article.faqs && article.faqs.length > 0 && (
          <section style={{ marginTop: '80px', paddingLeft: '160px', paddingRight: '160px' }}>
            <div 
              className="bg-white"
              style={{ 
                width: '1280px',
                minHeight: '420px',
                borderRadius: '15px',
                padding: '30px',
                position: 'relative'
              }}
            >
              {/* FAQ Title */}
              <h2 
                className="text-[#242526] mb-[56px]"
                style={{
                  fontFamily: 'Poppins, sans-serif',
                  fontWeight: 700,
                  fontSize: '24px',
                  lineHeight: '1.0833333333333333em',
                  letterSpacing: '-1%'
                }}
              >
                Frequently asked questions about family vacations
              </h2>

              {/* FAQ Accordion */}
              <Accordion type="single" collapsible defaultValue="item-0" className="space-y-0">
                {article.faqs.slice(0, 5).map((faq, index) => (
                  <div key={faq.id || index}>
                    <AccordionItem value={`item-${index}`} className="border-none">
                      <AccordionTrigger 
                        className="text-[#242526] hover:no-underline p-0 pb-[10px]"
                        style={{
                          fontFamily: 'Poppins, sans-serif',
                          fontWeight: 600,
                          fontSize: '16px',
                          lineHeight: '1.25em',
                          textAlign: 'left',
                          minHeight: '20px'
                        }}
                      >
                        {faq.question}
                      </AccordionTrigger>
                      <AccordionContent 
                        className="text-[#797882] pb-[20px]"
                        style={{
                          fontFamily: 'Fira Sans, sans-serif',
                          fontWeight: 400,
                          fontSize: '16px',
                          lineHeight: '1.25em',
                          paddingTop: '0px'
                        }}
                      >
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>

                    {/* Divider - Only show between items, not after the last one */}
                    {index < article.faqs.slice(0, 5).length - 1 && (
                      <div 
                        style={{
                          width: '100%',
                          height: '1px',
                          backgroundColor: '#E9E9EB',
                          margin: '20px 0'
                        }}
                      ></div>
                    )}
                  </div>
                ))}
              </Accordion>
            </div>
          </section>
        )}
        
        {/* CTAs - Position 3: Before conclusion */}
        {article.ctas && article.ctas.filter(cta => cta.position === 3).map(cta => (
          <div key={cta.id} style={{ paddingLeft: '160px', paddingRight: '160px', marginTop: '40px' }}>
            <CtaDisplay
              title={cta.title}
              description={cta.description}
              buttonText={cta.button_text}
              buttonLink={cta.button_link}
            />
          </div>
        ))}

        {/* CTAs - Position 4: End of content */}
        {article.ctas && article.ctas.filter(cta => cta.position === 4).map(cta => (
          <div key={cta.id} style={{ paddingLeft: '160px', paddingRight: '160px', marginTop: '40px' }}>
            <CtaDisplay
              title={cta.title}
              description={cta.description}
              buttonText={cta.button_text}
              buttonLink={cta.button_link}
            />
          </div>
        ))}

        {/* Author Section */}
        <section style={{ marginTop: '80px', paddingLeft: '160px', paddingRight: '160px' }}>
          <div 
            className="bg-white"
            style={{ 
              width: '1280px',
              minHeight: '200px',
              borderRadius: '15px',
              padding: '40px'
            }}
          >
            {/* Author Info */}
            <div className="flex items-start gap-6 mb-6">
              <div 
                className="bg-gray-300 rounded-full overflow-hidden flex-shrink-0"
                style={{ width: '80px', height: '80px' }}
              >
                {article.author.avatar ? (
                  <img 
                    src={article.author.avatar} 
                    alt={article.author.display_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-400 flex items-center justify-center">
                    <User className="w-8 h-8 text-gray-600" />
                  </div>
                )}
              </div>
              
              <div className="flex-1">
                <h3 
                  className="text-[#242526] mb-3"
                  style={{
                    fontFamily: 'Poppins, sans-serif',
                    fontWeight: 600,
                    fontSize: '24px',
                    lineHeight: '1.2em'
                  }}
                >
                  {article.author.display_name}
                </h3>
                
                <p 
                  className="text-[#797882] mb-4"
                  style={{
                    fontFamily: 'Fira Sans, sans-serif',
                    fontWeight: 400,
                    fontSize: '16px',
                    lineHeight: '1.5em'
                  }}
                >
                  {article.author.bio || `${article.author.display_name} is a passionate travel writer who specializes in creating comprehensive guides that help travelers discover authentic experiences around the world. With years of expertise in travel journalism, they provide insider tips and practical advice for memorable journeys.`}
                </p>
                
                {/* Links */}
                <div className="flex gap-6">
                  <Link 
                    href="/blog/editorial-policy"
                    className="text-[#0066CC] hover:text-[#0052A3] transition-colors"
                    style={{
                      fontFamily: 'Poppins, sans-serif',
                      fontWeight: 500,
                      fontSize: '14px',
                      textDecoration: 'underline'
                    }}
                  >
                    Our Editorial Policy
                  </Link>
                  
                  <Link 
                    href={`/authors/${article.author.display_name.toLowerCase().replace(/\s+/g, '-')}`}
                    className="text-[#0066CC] hover:text-[#0052A3] transition-colors"
                    style={{
                      fontFamily: 'Poppins, sans-serif',
                      fontWeight: 500,
                      fontSize: '14px',
                      textDecoration: 'underline'
                    }}
                  >
                    More articles by {article.author.display_name}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Related Articles Section */}
        <section style={{ marginTop: '80px', paddingLeft: '160px', paddingRight: '160px' }}>
          <div 
            className="bg-white"
            style={{ 
              width: '1280px',
              minHeight: '400px',
              borderRadius: '15px',
              padding: '40px'
            }}
          >
            {/* Section Title */}
            <h2 
              className="text-[#242526] mb-8"
              style={{
                fontFamily: 'Poppins, sans-serif',
                fontWeight: 700,
                fontSize: '28px',
                lineHeight: '1.2em',
                letterSpacing: '-0.02em'
              }}
            >
              Related Articles
            </h2>

            {/* Articles Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Article 1 */}
              <div className="group cursor-pointer">
                <Link href="/blog/paris-hidden-gems">
                  <div className="relative mb-4">
                    <div 
                      className="relative overflow-hidden"
                      style={{ width: '100%', height: '200px', borderRadius: '12px' }}
                    >
                      <img
                        src="https://images.unsplash.com/photo-1502602898536-47ad22581b52?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                        alt="Paris Hidden Gems"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                    </div>
                  </div>
                  <h3 
                    className="text-[#242526] mb-2 group-hover:text-[#0066CC] transition-colors"
                    style={{
                      fontFamily: 'Poppins, sans-serif',
                      fontWeight: 600,
                      fontSize: '18px',
                      lineHeight: '1.3em',
                      letterSpacing: '-0.01em'
                    }}
                  >
                    Hidden Gems of Paris: Local Secrets Revealed
                  </h3>
                  <p 
                    className="text-[#797882] mb-3"
                    style={{
                      fontFamily: 'Fira Sans, sans-serif',
                      fontWeight: 400,
                      fontSize: '14px',
                      lineHeight: '1.4em'
                    }}
                  >
                    Discover the secret spots that locals love, from hidden cafés to underground art scenes.
                  </p>
                  <div className="flex items-center gap-2 text-sm text-[#797882]">
                    <span>5 min read</span>
                    <span>•</span>
                    <span>March 15, 2025</span>
                  </div>
                </Link>
              </div>

              {/* Article 2 */}
              <div className="group cursor-pointer">
                <Link href="/blog/tokyo-travel-guide">
                  <div className="relative mb-4">
                    <div 
                      className="relative overflow-hidden"
                      style={{ width: '100%', height: '200px', borderRadius: '12px' }}
                    >
                      <img
                        src="https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                        alt="Tokyo Travel Guide"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                    </div>
                  </div>
                  <h3 
                    className="text-[#242526] mb-2 group-hover:text-[#0066CC] transition-colors"
                    style={{
                      fontFamily: 'Poppins, sans-serif',
                      fontWeight: 600,
                      fontSize: '18px',
                      lineHeight: '1.3em',
                      letterSpacing: '-0.01em'
                    }}
                  >
                    Ultimate Tokyo Guide: Modern Meets Traditional
                  </h3>
                  <p 
                    className="text-[#797882] mb-3"
                    style={{
                      fontFamily: 'Fira Sans, sans-serif',
                      fontWeight: 400,
                      fontSize: '14px',
                      lineHeight: '1.4em'
                    }}
                  >
                    Navigate Japan's capital with insider tips on the best neighborhoods, food, and culture.
                  </p>
                  <div className="flex items-center gap-2 text-sm text-[#797882]">
                    <span>8 min read</span>
                    <span>•</span>
                    <span>March 12, 2025</span>
                  </div>
                </Link>
              </div>

              {/* Article 3 */}
              <div className="group cursor-pointer">
                <Link href="/blog/rome-ancient-wonders">
                  <div className="relative mb-4">
                    <div 
                      className="relative overflow-hidden"
                      style={{ width: '100%', height: '200px', borderRadius: '12px' }}
                    >
                      <img
                        src="https://images.unsplash.com/photo-1552832230-c0197dd311b5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                        alt="Rome Ancient Wonders"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                    </div>
                  </div>
                  <h3 
                    className="text-[#242526] mb-2 group-hover:text-[#0066CC] transition-colors"
                    style={{
                      fontFamily: 'Poppins, sans-serif',
                      fontWeight: 600,
                      fontSize: '18px',
                      lineHeight: '1.3em',
                      letterSpacing: '-0.01em'
                    }}
                  >
                    Rome's Ancient Wonders: A Timeless Journey
                  </h3>
                  <p 
                    className="text-[#797882] mb-3"
                    style={{
                      fontFamily: 'Fira Sans, sans-serif',
                      fontWeight: 400,
                      fontSize: '14px',
                      lineHeight: '1.4em'
                    }}
                  >
                    Walk through history in the Eternal City, from the Colosseum to hidden archaeological gems.
                  </p>
                  <div className="flex items-center gap-2 text-sm text-[#797882]">
                    <span>6 min read</span>
                    <span>•</span>
                    <span>March 10, 2025</span>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Footer Section - Exact Figma Implementation */}
        <section style={{ marginTop: '80px', position: 'relative', width: '100%', height: '134px' }}>
          {/* Breadcrumbs */}
          <div
            style={{
              position: 'absolute',
              width: '121px',
              height: '24px',
              left: '152px',
              top: '0px',
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '0px',
              gap: '5px'
            }}
          >
            <Link 
              href="/blog"
              className="text-[#797882] hover:text-[#242526] transition-colors"
              style={{
                fontFamily: 'Poppins, sans-serif',
                fontSize: '12px',
                fontWeight: 400,
                textDecoration: 'none'
              }}
            >
              Blog
            </Link>
            <span className="text-[#797882]" style={{ fontSize: '12px' }}>/</span>
            <Link 
              href={`/blog/${article.categories?.[0]?.toLowerCase() || 'travel'}`}
              className="text-[#797882] hover:text-[#242526] transition-colors"
              style={{
                fontFamily: 'Poppins, sans-serif',
                fontSize: '12px',
                fontWeight: 400,
                textDecoration: 'none'
              }}
            >
              {article.categories?.[0] || 'Travel'}
            </Link>
          </div>

          {/* Main Footer Container */}
          <div
            style={{
              position: 'absolute',
              width: '1266px',
              height: '80px',
              left: '152px',
              top: '54px'
            }}
          >
            {/* Footer Text */}
            <div
              style={{
                position: 'absolute',
                width: '566.32px',
                height: '80px',
                left: '0px',
                top: '0px',
                fontFamily: 'Merriweather, serif',
                fontStyle: 'normal',
                fontWeight: 700,
                fontSize: '40px',
                lineHeight: '1em',
                letterSpacing: '-4%',
                color: 'rgba(36, 37, 38, 0.4)'
              }}
            >
              Travel is for <br />everyone.
            </div>

            {/* Copyright */}
            <div
              style={{
                position: 'absolute',
                width: '256.35px',
                height: '18px',
                left: '1009.65px',
                top: '61px',
                fontFamily: 'Poppins, sans-serif',
                fontStyle: 'normal',
                fontWeight: 400,
                fontSize: '12px',
                lineHeight: '150%',
                textAlign: 'right',
                letterSpacing: '1%',
                color: '#797882'
              }}
            >
              © 2025 CuddlyNest. VRMA member.
            </div>
          </div>
        </section>
      </div>
    </>
  )
}