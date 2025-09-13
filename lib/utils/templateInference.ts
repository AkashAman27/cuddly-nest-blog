/**
 * Infer template name from section data structure
 * This is used when template_name is not available in the database
 */
export function inferTemplateFromData(sectionData: any, position?: number): string {
  if (!sectionData) return 'rich-text-content';

  // Check for specific data patterns to determine template type
  if (sectionData.backgroundImage && sectionData.location && sectionData.subtitle) {
    return 'hero-section';
  }
  
  if (sectionData.content && typeof sectionData.content === 'string' && sectionData.content.includes('<')) {
    return 'rich-text-content';
  }
  
  if (sectionData.reasons && Array.isArray(sectionData.reasons)) {
    return 'why-destination-different';
  }
  
  if (sectionData.activities && Array.isArray(sectionData.activities)) {
    return 'things-to-do-cards';
  }
  
  if (sectionData.hotels && Array.isArray(sectionData.hotels)) {
    return 'hotel-carousel';
  }
  
  if (sectionData.neighborhoods && Array.isArray(sectionData.neighborhoods)) {
    return 'where-to-stay';
  }
  
  if (sectionData.buttonUrl && sectionData.buttonText) {
    return 'starter-pack-section';
  }
  
  if (sectionData.faqs && Array.isArray(sectionData.faqs)) {
    return 'faq';
  }
  
  if (sectionData.links && Array.isArray(sectionData.links)) {
    return 'internal-links-section';
  }
  
  if (sectionData.authorName && (sectionData.updatedDate || sectionData.publishedDate)) {
    return 'author-scroll-badge';
  }
  
  // Fallback based on position if provided
  if (position !== undefined) {
    const positionTemplateMap: { [key: number]: string } = {
      0: 'hero-section',
      1: 'rich-text-content',
      2: 'rich-text-content',
      3: 'why-destination-different',
      4: 'things-to-do-cards',
      5: 'where-to-stay',
      6: 'starter-pack-section',
      7: 'faq',
      8: 'internal-links-section',
      9: 'starter-pack-section',
      10: 'author-scroll-badge'
    };
    
    return positionTemplateMap[position] || 'rich-text-content';
  }
  
  // Default fallback
  return 'rich-text-content';
}