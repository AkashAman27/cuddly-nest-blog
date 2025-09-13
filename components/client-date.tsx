'use client'

import { useState, useEffect } from 'react'
import { formatDate } from '@/lib/date-utils'

interface ClientDateProps {
  dateString: string
  className?: string
}

export function ClientDate({ dateString, className }: ClientDateProps) {
  const [formattedDate, setFormattedDate] = useState<string>('')
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    setFormattedDate(formatDate(dateString))
  }, [dateString])

  // Return placeholder during SSR to prevent hydration mismatch
  if (!isClient) {
    return <span className={className}>Loading...</span>
  }

  return <span className={className}>{formattedDate}</span>
}