// Utility functions for consistent date formatting to prevent hydration errors

export function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString)
    // Use toLocaleDateString with specific options for consistency
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  } catch (error) {
    console.error('Error formatting date:', error)
    return 'Invalid date'
  }
}

export function formatDateForDisplay(dateString: string): string {
  try {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    // If less than 7 days, show relative time
    if (diffDays <= 7) {
      if (diffDays === 1) return '1 day ago'
      if (diffDays < 7) return `${diffDays} days ago`
    }
    
    // Otherwise show formatted date
    return formatDate(dateString)
  } catch (error) {
    console.error('Error formatting date for display:', error)
    return formatDate(dateString)
  }
}