'use client'

/**
 * Safe HTML Component
 * Simple wrapper around dangerouslySetInnerHTML for controlled content
 */

import React from 'react'

export interface SafeHtmlProps {
  html: string
  className?: string
  style?: React.CSSProperties
  as?: keyof JSX.IntrinsicElements
  fallback?: React.ReactNode
}

export function SafeHtml({
  html,
  className,
  style,
  as: Component = 'div',
  fallback = null
}: SafeHtmlProps) {
  // Early return for empty/invalid content
  if (!html || typeof html !== 'string') {
    return <>{fallback}</>
  }

  return (
    <Component
      className={className}
      style={style}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}

// Specialized components for common use cases
export function SafeBlogContent({ html, className, style }: Omit<SafeHtmlProps, 'sanitizer'>) {
  return (
    <SafeHtml
      html={html}
      className={className}
      style={style}
      fallback={<div className="text-gray-500 italic">Content loading...</div>}
    />
  )
}

export function SafeUserContent({ html, className, style }: Omit<SafeHtmlProps, 'sanitizer'>) {
  return (
    <SafeHtml
      html={html}
      className={className}
      style={style}
      as="span"
    />
  )
}

export function SafeCategoryContent({ html, className, style }: Omit<SafeHtmlProps, 'sanitizer'>) {
  return (
    <SafeHtml
      html={html}
      className={className}
      style={style}
      fallback={<div className="text-gray-500 italic">No description available</div>}
    />
  )
}

// Hook for programmatic HTML handling
export function useSafeHtml(html: string) {
  return React.useMemo(() => {
    if (!html || typeof html !== 'string') return ''
    return html
  }, [html])
}