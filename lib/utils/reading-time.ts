/**
 * Calculate reading time based on content
 * Average reading speed: 200-250 words per minute
 * We'll use 200 WPM for a conservative estimate
 */

export function calculateReadingTime(content: string): number {
  if (!content || typeof content !== 'string') {
    return 1
  }

  // Remove HTML tags for more accurate word count
  const plainText = content.replace(/<[^>]*>/g, ' ')
  
  // Split by whitespace and filter out empty strings
  const words = plainText.split(/\s+/).filter(word => word.length > 0)
  
  // Calculate reading time in minutes (200 WPM)
  const readingTimeMinutes = Math.max(1, Math.ceil(words.length / 200))
  
  return readingTimeMinutes
}

export function formatReadingTime(minutes: number): string {
  if (minutes === 1) {
    return '1 min read'
  }
  return `${minutes} min read`
}