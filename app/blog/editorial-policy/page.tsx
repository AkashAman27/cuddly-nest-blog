import { Footer } from "@/components/footer"
import Link from "next/link"
import { Calendar, Clock, User } from "lucide-react"
import { Metadata } from 'next'

export default function EditorialPolicyPage() {
  return (
    <div className="w-[1600px] mx-auto bg-white min-h-screen relative">
      
      {/* Sticky Header */}
      <header 
        className="sticky top-0 z-50 bg-white"
        style={{ width: '1600px', height: '79px' }}
      >
        {/* Header Logo */}
        <div style={{ position: 'absolute', left: '100px', top: '18px' }}>
          <Link href="/blog">
            <div className="flex items-center">
              {/* Logo Group */}
              <div style={{ position: 'relative', width: '48px', height: '43.61px' }}>
                {/* Vector elements for logo */}
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
                  marginLeft: '27px',
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

        {/* Search Field */}
        <div 
          style={{
            position: 'absolute',
            left: '915px',
            top: '21px',
            width: '314px',
            height: '38px'
          }}
        >
          <div
            style={{
              width: '314px',
              height: '38px',
              borderRadius: '19px',
              border: '1px solid #DFE2E5',
              backgroundColor: 'white',
              display: 'flex',
              alignItems: 'center',
              paddingLeft: '16px',
              paddingRight: '16px'
            }}
          >
            <input
              type="text"
              placeholder="Search on the blog"
              readOnly
              disabled
              style={{
                flex: 1,
                border: 'none',
                outline: 'none',
                fontFamily: 'Poppins, sans-serif',
                fontSize: '14px',
                color: '#797882',
                backgroundColor: 'transparent',
                cursor: 'default'
              }}
            />
          </div>
        </div>

        {/* Navigation Links */}
        <div className="absolute right-[100px] top-[30px] flex gap-6">
          <Link href="/blog" style={{
            fontFamily: 'Poppins, sans-serif',
            fontWeight: 500,
            fontSize: '14px',
            color: '#242526',
            textDecoration: 'none'
          }}>
            Blog
          </Link>
          <Link href="https://www.cuddlynest.com/pages/about-us" style={{
            fontFamily: 'Poppins, sans-serif',
            fontWeight: 500,
            fontSize: '14px',
            color: '#242526',
            textDecoration: 'none'
          }}>
            About us
          </Link>
        </div>
      </header>

      {/* Main Content Area - Using same layout as article template */}
      <div className="flex" style={{ marginTop: '20px', paddingLeft: '160px', paddingRight: '152px', gap: '77px' }}>
        
        {/* Article Content - 851px wide */}
        <div style={{ width: '851px', flex: 'none' }}>
          
          {/* Page Title */}
          <div className="mb-8">
            <h1 
              className="text-[#242526] leading-tight"
              style={{
                fontFamily: 'Poppins, sans-serif',
                fontWeight: 700,
                fontSize: '48px',
                lineHeight: '1.2em',
                marginBottom: '16px'
              }}
            >
              Editorial Policy
            </h1>
            <p 
              className="text-[#797882]"
              style={{
                fontFamily: 'Poppins, sans-serif',
                fontSize: '18px',
                lineHeight: '1.6em',
                marginBottom: '0px'
              }}
            >
              Our commitment to accuracy, transparency, and quality in travel content
            </p>
          </div>

          {/* Author Info Bar */}
          <div className="flex items-center gap-2 mb-8">
            <User size={18} className="text-[#797882]" />
            <span className="text-[#242526] text-sm font-medium">CuddlyNest Editorial Team</span>
            <span className="text-[#DFE2E5] text-xs">•</span>
            <Calendar size={12} className="text-[#797882]" />
            <span className="text-[#797882] text-sm">Updated January 2024</span>
            <span className="text-[#DFE2E5] text-xs">•</span>
            <Clock size={12} className="text-[#797882]" />
            <span className="text-[#797882] text-sm">5 min read</span>
          </div>

          {/* Article Content */}
          <div 
            className="text-[#242526] mb-8 prose prose-lg max-w-none"
            style={{
              fontFamily: 'Poppins, sans-serif',
              fontSize: '16px',
              lineHeight: '1.8em',
              color: '#242526'
            }}
          >
            
            <section id="our-mission" className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-[#242526]">Our Mission</h2>
              <p className="mb-4">
                At CuddlyNest, we are committed to providing accurate, helpful, and inspiring travel content that empowers our readers to make informed decisions about their journeys. Our editorial policy ensures that every piece of content we publish meets the highest standards of quality, accuracy, and integrity.
              </p>
            </section>

            <section id="content-standards" className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-[#242526]">Content Standards</h2>
              
              <h3 className="text-xl font-semibold mb-3 text-[#242526]">Accuracy & Research</h3>
              <ul className="mb-4 pl-6 space-y-2">
                <li>All travel information is thoroughly researched and fact-checked</li>
                <li>We verify accommodations, attractions, and travel details through multiple sources</li>
                <li>Content is regularly updated to reflect current conditions and changes</li>
                <li>We clearly distinguish between first-hand experiences and researched information</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3 text-[#242526]">Editorial Independence</h3>
              <ul className="mb-4 pl-6 space-y-2">
                <li>Our editorial decisions are independent of commercial interests</li>
                <li>Recommendations are based on merit, not financial arrangements</li>
                <li>Sponsored content is clearly labeled and distinguished from editorial content</li>
                <li>We maintain editorial integrity in all partnerships and collaborations</li>
              </ul>
            </section>

            <section id="content-creation-process" className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-[#242526]">Content Creation Process</h2>
              
              <h3 className="text-xl font-semibold mb-3 text-[#242526]">Research & Writing</h3>
              <p className="mb-4">
                Our content creation process involves extensive research from reliable sources including official tourism boards, verified travel websites, and first-hand travel experiences. Each article undergoes multiple rounds of review before publication.
              </p>

              <h3 className="text-xl font-semibold mb-3 text-[#242526]">Review & Editing</h3>
              <ul className="mb-4 pl-6 space-y-2">
                <li>Content is reviewed by experienced travel editors</li>
                <li>Fact-checking is performed on all travel details and recommendations</li>
                <li>Copy editing ensures clarity, consistency, and readability</li>
                <li>Final approval by senior editorial team before publication</li>
              </ul>
            </section>

            <section id="transparency-corrections" className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-[#242526]">Transparency & Corrections</h2>
              
              <h3 className="text-xl font-semibold mb-3 text-[#242526]">Error Corrections</h3>
              <p className="mb-4">
                We are committed to correcting errors promptly and transparently. If you notice any inaccuracies in our content, please contact us immediately. Corrections will be made as quickly as possible and clearly noted.
              </p>

              <h3 className="text-xl font-semibold mb-3 text-[#242526]">Content Updates</h3>
              <p className="mb-4">
                Travel information changes frequently. We regularly review and update our content to ensure it remains current and accurate. Update dates are clearly displayed on all articles.
              </p>
            </section>

            <section id="affiliate-relationships" className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-[#242526]">Affiliate Relationships & Monetization</h2>
              <p className="mb-4">
                CuddlyNest may earn commissions from bookings made through our platform. However, this does not influence our editorial content or recommendations. All affiliate relationships are disclosed transparently, and our editorial team maintains full independence in content creation.
              </p>
            </section>

            <section id="contact-information" className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-[#242526]">Contact Information</h2>
              <p className="mb-4">
                For questions about our editorial policy, content corrections, or general inquiries, please contact our editorial team:
              </p>
              <ul className="mb-4 pl-6 space-y-2">
                <li>Email: editorial@cuddlynest.com</li>
                <li>Response time: Within 48 hours</li>
                <li>Content corrections: Immediate review and response</li>
              </ul>
            </section>

            <div className="bg-blue-50 p-6 rounded-lg">
              <p className="text-sm text-[#242526] mb-0">
                <strong>Last Updated:</strong> January 15, 2024<br />
                This editorial policy is reviewed and updated regularly to ensure it reflects our current practices and standards.
              </p>
            </div>

          </div>
        </div>
        
        {/* Sticky Sidebar - 360px wide */}
        <div style={{ width: '360px', flex: 'none' }}>
          <div className="sticky top-[20px]">
            
            {/* Table of Contents */}
            <div className="mb-8 bg-blue-50 p-6 rounded-lg">
              <h3 className="text-xl font-semibold mb-4 mt-0 text-gray-900">Contents</h3>
              <ul className="space-y-3">
                <li>
                  <a href="#our-mission" className="text-blue-600 hover:text-blue-800 transition hover:underline flex items-center">
                    → Our Mission
                  </a>
                </li>
                <li>
                  <a href="#content-standards" className="text-blue-600 hover:text-blue-800 transition hover:underline flex items-center">
                    → Content Standards
                  </a>
                </li>
                <li>
                  <a href="#content-creation-process" className="text-blue-600 hover:text-blue-800 transition hover:underline flex items-center">
                    → Content Creation Process
                  </a>
                </li>
                <li>
                  <a href="#transparency-corrections" className="text-blue-600 hover:text-blue-800 transition hover:underline flex items-center">
                    → Transparency & Corrections
                  </a>
                </li>
                <li>
                  <a href="#affiliate-relationships" className="text-blue-600 hover:text-blue-800 transition hover:underline flex items-center">
                    → Affiliate Relationships
                  </a>
                </li>
                <li>
                  <a href="#contact-information" className="text-blue-600 hover:text-blue-800 transition hover:underline flex items-center">
                    → Contact Information
                  </a>
                </li>
              </ul>
            </div>

            {/* Trust & Quality Badge */}
            <div 
              className="relative rounded-[20px] mb-6 bg-gradient-to-br from-blue-500 to-purple-600 text-white"
              style={{ 
                width: '360px',
                height: '280px',
                padding: '32px'
              }}
            >
              <div className="text-center">
                <div className="mb-4">
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg width="32" height="32" fill="white" viewBox="0 0 24 24">
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold mb-2">Trust & Quality</h3>
                  <p className="text-white/90 text-sm leading-relaxed mb-6">
                    Our editorial team follows strict guidelines to ensure every piece of content meets the highest standards of accuracy and usefulness for travelers.
                  </p>
                </div>
                <div className="text-xs text-white/80">
                  Committed to Editorial Excellence
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  )
}

// Metadata for SEO
export const metadata: Metadata = {
  title: 'Editorial Policy | CuddlyNest Travel Blog',
  description: 'Learn about CuddlyNest\'s commitment to accuracy, transparency, and quality in travel content. Our editorial standards and policies.',
  keywords: 'editorial policy, travel blog standards, content quality, transparency',
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: 'Editorial Policy | CuddlyNest Travel Blog',
    description: 'Our commitment to accuracy, transparency, and quality in travel content',
    type: 'website',
  },
}