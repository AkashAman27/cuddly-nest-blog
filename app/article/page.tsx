'use client'

import { useState } from "react"
import { Footer } from "@/components/footer"
import { LanguageSwitcher } from "@/components/LanguageSwitcher"
import { LogoImage } from "@/components/LogoImage"
import Link from "next/link"
import { Metadata } from "next"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Calendar, Clock, Share2, User } from "lucide-react"
import { ArticleTableOfContents } from "@/components/article-table-of-contents"

// Mock article data - this would typically come from a database or CMS
const mockArticle = {
  id: "article-1",
  title: "The Best Places to Travel According to Your Zodiac",
  excerpt: "Discover breathtaking seaside destinations that offer crystal-clear waters, ancient history, and unforgettable experiences along the Mediterranean coast.",
  slug: "best-places-travel-zodiac",
  author: {
    display_name: "Sebastian Doe",
    bio: "Travel writer specializing in Mediterranean destinations",
    avatar: "/blog-images/author-avatar.png"
  },
  published_at: "2021-06-30T10:00:00Z",
  updated_at: "2021-06-30T10:00:00Z",
  read_time: "10 mins read",
  seo_title: "The Best Places to Travel According to Your Zodiac | CuddlyNest Blog",
  seo_description: "Explore travel destinations based on your zodiac sign. From adventure-seeking Aries to dreamy Pisces, find your perfect getaway.",
  meta_keywords: "zodiac travel, astrology travel, travel destinations, zodiac signs, travel guide",
  og_image: {
    file_url: "/blog-images/hero-background-5d4a0e.png"
  },
  status: "published"
}



export default function ArticlePage() {
  const [searchQuery, setSearchQuery] = useState('')

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      // In the future, this will connect to the database
      // For now, redirect to a search results page
      window.location.href = `/search?q=${encodeURIComponent(searchQuery.trim())}`
    }
  }
  // JSON-LD structured data for SEO
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: mockArticle.title,
    description: mockArticle.excerpt,
    image: mockArticle.og_image.file_url,
    datePublished: mockArticle.published_at,
    dateModified: mockArticle.updated_at,
    author: {
      '@type': 'Person',
      name: mockArticle.author.display_name,
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
      '@id': `https://cuddlynest.com/article`,
    },
    articleSection: 'Travel Guide',
    keywords: mockArticle.meta_keywords,
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
                      width: '14.35px',
                      height: '7.91px'
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
                      width: '47.85px',
                      height: '38.15px'
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

          {/* Search Group */}
          <div 
            style={{
              position: 'absolute',
              left: '915px',
              top: '21px',
              width: '314px',
              height: '38px'
            }}
          >
            {/* Search Field */}
            <form onSubmit={handleSearchSubmit}>
              <div
                style={{
                  position: 'absolute',
                  width: '314px',
                  height: '38px',
                  backgroundColor: '#F7F7F7',
                  border: '1px solid #E9E9EB',
                  borderRadius: '19px'
                }}
              >
                <input
                  type="text"
                  placeholder="Search on the blog"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-full bg-transparent outline-none"
                  style={{
                    paddingLeft: '22px',
                    paddingRight: '50px',
                    fontFamily: 'Poppins, sans-serif',
                    fontSize: '16px',
                    fontWeight: 400,
                    lineHeight: '1.25em',
                    color: '#797882'
                  }}
                />
              </div>
            </form>
            
            {/* Search Icon */}
            <div
              style={{
                position: 'absolute',
                left: '277px',
                top: '7px',
                width: '24px',
                height: '24px'
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  left: '1.33px',
                  top: '1.83px',
                  width: '23.33px',
                  height: '23.33px'
                }}
              >
                <div
                  style={{
                    width: '19.8px',
                    height: '19.8px',
                    border: '2px solid #242526',
                    borderRadius: '50%',
                    position: 'absolute'
                  }}
                />
                <div
                  style={{
                    width: '6.36px',
                    height: '6.36px',
                    backgroundColor: '#242526',
                    borderRadius: '0px 0px 45% 0px',
                    position: 'absolute',
                    right: '0px',
                    bottom: '0px',
                    transform: 'rotate(45deg)',
                    transformOrigin: 'bottom right'
                  }}
                />
              </div>
            </div>
          </div>

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
            href="/about-us"
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
        <div className="flex" style={{ marginTop: '36px', paddingLeft: '160px', paddingRight: '152px', gap: '77px' }}>
          
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
              {mockArticle.title}
            </h1>

            {/* First Image - full container width */}
            <div 
              className="relative mb-8"
              style={{ width: '851px', height: '395px' }}
            >
              <img
                src="/blog-images/section-image-1.png"
                alt="Travel destination"
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
                <div className="w-full h-full bg-gray-400"></div>
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
                {mockArticle.author.display_name}
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
                30 June 2021
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
                {mockArticle.read_time}
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

            {/* Article Text - positioned -5px left */}
            <div 
              className="text-[#242526] mb-8"
              style={{ 
                fontSize: '18px', 
                lineHeight: '1.5em', 
                letterSpacing: '-0.02em',
                fontFamily: 'Poppins, sans-serif',
                marginLeft: '0px',
                width: '851px'
              }}
            >
              <p className="mb-4" id="food-wine-destinations">
                <strong>1. Food and Wine Destinations:</strong>
              </p>
              <div className="pl-4 space-y-2">
                <p>   - Champagne Region: Just a short trip from Paris, you can explore the Champagne vineyards and cellars, taste exquisite sparkling wines and learn about the wine-making process.</p>
                <p>   - Normandy: Known for its delicious cuisine, particularly its seafood and apple-based specialties, Normandy is a great destination for food lovers.</p>
                <p>   - Champagne Region: Just a short trip from Paris, you can explore the Champagne vineyards and cellars, taste exquisite sparkling wines and learn about the wine-making process.</p>
                <p>   - Normandy: Known for its delicious cuisine, particularly its seafood and apple-based specialties, Normandy is a great destination for food lovers.</p>
              </div>
            </div>

            {/* Second Image - positioned at 782px from container top */}
            <div 
              className="relative mb-8"
              style={{ 
                width: '851px', 
                height: '395px', 
                marginLeft: '0px',
                marginTop: '143px'
              }}
            >
              <img
                src="/blog-images/section-image-2.png"
                alt="Travel destination"
                className="w-full h-full object-cover"
                style={{ borderRadius: '15px' }}
              />
              <div 
                className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"
                style={{ borderRadius: '15px' }}
              ></div>
            </div>

            {/* More Article Text */}
            <div 
              className="text-[#242526] mb-8"
              style={{ 
                fontSize: '18px', 
                lineHeight: '1.5em', 
                letterSpacing: '-0.02em',
                fontFamily: 'Poppins, sans-serif',
                marginLeft: '0px',
                width: '851px',
                marginTop: '36px'
              }}
            >
              <p className="mb-4" id="cultural-historical-destinations">
                <strong>2. Cultural and Historical Destinations:</strong>
              </p>
              <div className="pl-4 space-y-2">
                <p>   - Loire Valley: Explore the magnificent castles and châteaux scattered throughout the Loire Valley, each with its own unique history and architectural style.</p>
                <p>   - Provence: Discover the lavender fields, Roman ruins, and charming villages of Provence, where history and natural beauty intertwine.</p>
                <p>   - Dordogne: Step back in time in the prehistoric caves and medieval villages of the Dordogne region.</p>
                <p>   - Alsace: Experience the unique blend of French and German cultures in this picturesque region with its half-timbered houses and wine routes.</p>
              </div>
            </div>

            {/* Third Image - positioned with proper spacing */}
            <div 
              className="relative mb-8"
              style={{ 
                width: '851px', 
                height: '395px', 
                marginLeft: '0px',
                marginTop: '48px'
              }}
            >
              <img
                src="/blog-images/section-image-3.png"
                alt="Travel destination"
                className="w-full h-full object-cover"
                style={{ borderRadius: '15px' }}
              />
              <div 
                className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"
                style={{ borderRadius: '15px' }}
              ></div>
            </div>

            {/* Final Article Text */}
            <div 
              className="text-[#242526] mb-12"
              style={{ 
                fontSize: '18px', 
                lineHeight: '1.5em', 
                letterSpacing: '-0.02em',
                fontFamily: 'Poppins, sans-serif',
                marginLeft: '0px',
                width: '851px',
                marginTop: '36px'
              }}
            >
              <p className="mb-4" id="adventure-outdoor-destinations">
                <strong>3. Adventure and Outdoor Destinations:</strong>
              </p>
              <div className="pl-4 space-y-2">
                <p>   - French Alps: Perfect for skiing in winter and hiking in summer, offering breathtaking mountain scenery and outdoor adventures.</p>
                <p>   - Pyrenees: Explore this natural border between France and Spain, ideal for hiking, cycling, and discovering remote mountain villages.</p>
                <p>   - Corsica: Experience the "Island of Beauty" with its dramatic coastlines, pristine beaches, and rugged mountain interior.</p>
                <p>   - Brittany: Discover the Celtic heritage, dramatic coastlines, and charming fishing villages of this northwestern region.</p>
              </div>
              
              <p className="mt-6 mb-4">
                Each of these destinations offers a unique perspective on what makes France such a captivating country. Whether you're drawn to culinary adventures, historical exploration, or outdoor activities, France provides endless opportunities for discovery and wonder.
              </p>
              
              <p className="mb-4">
                The beauty of French travel lies not just in the famous landmarks, but in the everyday moments—sitting at a café watching the world go by, exploring local markets filled with fresh produce and artisanal goods, or stumbling upon a hidden village that feels untouched by time.
              </p>
            </div>
            
          </div>
          
          {/* Sticky Sidebar - 360px wide */}
          <div style={{ width: '360px', flex: 'none' }}>
            <div className="sticky" style={{ top: '20px' }}>
              {/* Table of Contents */}
              <ArticleTableOfContents />

              {/* Categories Section */}
              <div className="mb-8">
                <h3 className="text-xl font-semibold mb-6 text-[#242526]">Categories</h3>
                <div className="flex flex-wrap gap-3">
                  <div className="bg-gray-100 px-3 py-2 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">Travel</span>
                  </div>
                  <div className="bg-gray-100 px-3 py-2 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">Adventure</span>
                  </div>
                  <div className="bg-gray-100 px-3 py-2 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">Culture</span>
                  </div>
                </div>
              </div>

              {/* App Download CTA - Exact Figma Implementation */}
              <div 
                className="relative rounded-[20px] mb-6"
                style={{ 
                  width: '361px',
                  height: '317px',
                  background: 'linear-gradient(135deg, rgba(232, 237, 237, 1) 0%, rgba(244, 244, 244, 1) 100%)',
                  overflow: 'visible'
                }}
              >
                {/* Main App Description Text */}
                <div 
                  className="absolute text-[#64748B]"
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
                  Millions of places to stay, one app.
                </div>
                
                {/* CTA Text */}
                <div 
                  className="absolute text-[#64748B]"
                  style={{ 
                    left: '26px',
                    top: '226px',
                    width: '77px',
                    height: '13px',
                    fontFamily: 'Poppins, sans-serif',
                    fontWeight: 600,
                    fontSize: '8.76px',
                    lineHeight: '1.5em',
                    letterSpacing: '0.01em'
                  }}
                >
                  Get the app now.
                </div>
                
                {/* App Store Badges - Using actual Figma images */}
                <div 
                  className="absolute flex gap-[5.76px]"
                  style={{ 
                    left: '26px',
                    top: '249.48px'
                  }}
                >
                  {/* Apple Store Badge */}
                  <a 
                    href="https://apps.apple.com/app/cuddlynest" 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    <img 
                      src="/blog-images/app-store-badge.png"
                      alt="Download on the App Store"
                      style={{ 
                        width: '82px',
                        height: '27px'
                      }}
                      className="hover:opacity-90 transition-opacity"
                    />
                  </a>
                  
                  {/* Google Play Badge */}
                  <a 
                    href="https://play.google.com/store/apps/details?id=com.cuddlynest" 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    <img 
                      src="/blog-images/google-play-badge.png"
                      alt="Get it on Google Play"
                      style={{ 
                        width: '92px',
                        height: '27px'
                      }}
                      className="hover:opacity-90 transition-opacity"
                    />
                  </a>
                </div>
                
                {/* iPhone Mockup - Using correct iPhone 17 image with percentage positioning */}
                <div 
                  className="absolute"
                  style={{ 
                    left: '57.52%',
                    right: '-7.37%',
                    top: '9.28%',
                    bottom: '-27.1%'
                  }}
                >
                  <img 
                    src="/blog-images/iphone-17-mockup.png"
                    alt="CuddlyNest mobile app"
                    style={{ 
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain'
                    }}
                  />
                </div>
              </div>

            </div>
          </div>
          
        </div>

        {/* FAQ Section - Fixed Layout to Prevent Overlapping */}
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
              <AccordionItem value="item-0" className="border-none">
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
                  What are the best family vacations?
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
                  The best family vacation destinations largely depend on the age group traveling. In general, popular choices for family vacations include cities near beaches, safaris, and museums — and of course, destinations with the best water parks and the best amusement parks.
                </AccordionContent>
              </AccordionItem>

              {/* Divider */}
              <div 
                style={{
                  width: '100%',
                  height: '1px',
                  backgroundColor: '#E9E9EB',
                  margin: '20px 0'
                }}
              ></div>

              <AccordionItem value="item-1" className="border-none">
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
                  Where is the cheapest place for a family vacation?
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
                  Budget-friendly family destinations often include camping at state parks, visiting free attractions in major cities, or choosing destinations with favorable exchange rates.
                </AccordionContent>
              </AccordionItem>

              {/* Divider */}
              <div 
                style={{
                  width: '100%',
                  height: '1px',
                  backgroundColor: '#E9E9EB',
                  margin: '20px 0'
                }}
              ></div>

              <AccordionItem value="item-2" className="border-none">
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
                  How do you plan a family vacation on a budget?
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
                  Planning a budget family vacation involves booking in advance, traveling during off-peak seasons, choosing accommodations with kitchens, and researching free local activities.
                </AccordionContent>
              </AccordionItem>

              {/* Divider */}
              <div 
                style={{
                  width: '100%',
                  height: '1px',
                  backgroundColor: '#E9E9EB',
                  margin: '20px 0'
                }}
              ></div>

              <AccordionItem value="item-3" className="border-none">
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
                  How much does a trip to Disney cost for a family of 4?
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
                  A Disney World vacation for a family of 4 typically costs $6,000-$8,000 for a week, including park tickets ($500-$600 per person), hotel ($200-$400 per night), meals ($60-$80 per person per day), and transportation.
                </AccordionContent>
              </AccordionItem>

              {/* Divider */}
              <div 
                style={{
                  width: '100%',
                  height: '1px',
                  backgroundColor: '#E9E9EB',
                  margin: '20px 0'
                }}
              ></div>

              <AccordionItem value="item-4" className="border-none">
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
                  What are the best island vacations for families?
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
                  Top family island destinations include Hawaii (especially Maui and Oahu), the Bahamas, Turks and Caicos, and the U.S. Virgin Islands. These offer beautiful beaches, family resorts, and activities for all ages.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </section>


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
                {mockArticle.author.avatar ? (
                  <img 
                    src={mockArticle.author.avatar} 
                    alt={mockArticle.author.display_name}
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
                  {mockArticle.author.display_name}
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
                  {mockArticle.author.bio || `${mockArticle.author.display_name} is a passionate travel writer who specializes in creating comprehensive guides that help travelers discover authentic experiences around the world. With years of expertise in travel journalism, they provide insider tips and practical advice for memorable journeys.`}
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
                    href={`/authors/${mockArticle.author.display_name.toLowerCase().replace(/\s+/g, '-')}`}
                    className="text-[#0066CC] hover:text-[#0052A3] transition-colors"
                    style={{
                      fontFamily: 'Poppins, sans-serif',
                      fontWeight: 500,
                      fontSize: '14px',
                      textDecoration: 'underline'
                    }}
                  >
                    More articles by {mockArticle.author.display_name}
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
              href="/blog/travel"
              className="text-[#797882] hover:text-[#242526] transition-colors"
              style={{
                fontFamily: 'Poppins, sans-serif',
                fontSize: '12px',
                fontWeight: 400,
                textDecoration: 'none'
              }}
            >
              Travel
            </Link>
          </div>

          {/* Main Footer Container */}
          <div
            style={{
              position: 'absolute',
              width: '1266px',
              height: '80px',
              left: '152px',
              top: '54px' // Relative to section
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