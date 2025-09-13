'use client'

import { useEffect, useState } from 'react'

interface TOCItem {
  id: string
  title: string
  href: string
}

const tocItems: TOCItem[] = [
  {
    id: 'food-wine-destinations',
    title: 'Food and Wine Destinations',
    href: '#food-wine-destinations'
  },
  {
    id: 'cultural-historical-destinations', 
    title: 'Cultural and Historical Destinations',
    href: '#cultural-historical-destinations'
  },
  {
    id: 'adventure-outdoor-destinations',
    title: 'Adventure and Outdoor Destinations', 
    href: '#adventure-outdoor-destinations'
  }
]

export function ArticleTableOfContents() {
  const [activeSection, setActiveSection] = useState('food-wine-destinations')

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
    handleScroll() // Call once to set initial state

    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleClick = (href: string, id: string, event: React.MouseEvent) => {
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

  return (
    <div className="mb-8" style={{ height: '189px' }}>
      {/* TOC Title */}
      <div style={{ width: '136px', height: '29px', marginBottom: '72px' }}>
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
      <div style={{ height: '117px' }}>
        <div className="space-y-0">
          {tocItems.map((item, index) => (
            <div 
              key={item.id}
              style={{ 
                height: '23px', 
                marginBottom: index < tocItems.length - 1 ? '24px' : '0px' 
              }}
            >
              <button 
                onClick={(e) => handleClick(item.href, item.id, e)}
                className={`text-left w-full ${
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
                  padding: 0
                }}
              >
                {item.title}
              </button>
              {index < tocItems.length - 1 && (
                <div className="w-full h-[1px] bg-[#DFE2E5] mt-2"></div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}