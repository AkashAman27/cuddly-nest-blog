'use client'

import { Badge } from "@/components/ui/badge"

export function AuthorScrollBadge() {
  const scrollToAuthor = () => {
    const authorSection = document.getElementById('author-section')
    if (authorSection) {
      authorSection.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <Badge 
      className="bg-brand-pink/90 backdrop-blur-md text-brand-deep-purple border-0 cursor-pointer hover:bg-brand-pink transition-all duration-200 px-4 py-2 shadow-lg font-medium"
      onClick={scrollToAuthor}
    >
      See my work
    </Badge>
  )
}