'use client'

import { supabase } from '@/lib/supabase'
import Papa from 'papaparse'

export interface PostTemplate {
  id: string
  name: string
  description: string
  required_fields: string[]
  optional_fields: Record<string, string>
  field_mappings: Record<string, string>
  default_values: Record<string, any>
  validation_rules: Record<string, any>
  version: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface BulkUploadJob {
  id: string
  template_id: string
  job_name: string
  original_filename: string
  file_size: number
  total_rows: number
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'paused'
  processed_rows: number
  successful_rows: number
  failed_rows: number
  errors: any[]
  warnings: any[]
  processing_started_at?: string
  processing_completed_at?: string
  created_by?: string
  created_at: string
  updated_at: string
}

export interface CSVUploadData {
  id: string
  job_id: string
  row_number: number
  raw_data: Record<string, any>
  processed_data?: Record<string, any>
  validation_errors: any[]
  processing_status: 'pending' | 'processed' | 'failed' | 'skipped'
  created_at: string
}

export interface BulkGeneratedPost {
  id: string
  job_id: string
  csv_row_id: string
  template_id: string
  post_id?: string
  title: string
  slug: string
  status: 'draft' | 'published' | 'failed'
  generation_errors: any[]
  created_at: string
}

export interface ValidationError {
  field: string
  value: any
  error: string
  severity: 'error' | 'warning'
}

export interface ProcessingProgress {
  jobId: string
  totalRows: number
  processedRows: number
  successfulRows: number
  failedRows: number
  status: string
  errors: any[]
  warnings: any[]
}

export class BulkUploadService {
  
  // ===== TEMPLATE MANAGEMENT =====

  async getPostTemplates(): Promise<PostTemplate[]> {
    // Enhanced template with all section types and fields
    return [
      {
        id: 'travel-guide-template',
        name: 'Complete Travel Guide Posts',
        description: 'Create comprehensive travel guide blog posts with all available sections and SEO optimization',
        required_fields: ['title', 'excerpt'],
        optional_fields: {
          // Basic Post Fields
          'slug': 'URL Slug (auto-generated if empty)',
          'status': 'Post Status (draft/published)',
          'featured_image': 'Featured Image URL',
          'tags': 'Tags (comma-separated)',
          
          // SEO & Social Media Fields
          'seo_title': 'SEO Title (max 60 chars)',
          'seo_description': 'SEO Description (max 160 chars)',
          'seo_keywords': 'SEO Keywords (comma-separated)',
          'canonical_url': 'Canonical URL',
          'focus_keyword': 'Focus Keyword for SEO',
          'robots_index': 'Allow Search Indexing (true/false)',
          'robots_follow': 'Allow Link Following (true/false)',
          'robots_nosnippet': 'Disable Snippets (true/false)',
          'og_title': 'Open Graph Title',
          'og_description': 'Open Graph Description',
          'og_image': 'Open Graph Image URL',
          'og_image_alt': 'Open Graph Image Alt Text',
          'twitter_title': 'Twitter Card Title',
          'twitter_description': 'Twitter Card Description',
          'twitter_image': 'Twitter Card Image URL',
          'twitter_image_alt': 'Twitter Card Image Alt Text',
          
          // Structured Data Fields
          'structured_data_enabled': 'Enable Structured Data (true/false)',
          'structured_data_type': 'Schema Type (BlogPosting/TouristAttraction/etc)',
          'custom_json_ld': 'Custom JSON-LD Schema',
          
          // Hero Section Fields
          'hero_enabled': 'Include Hero Section (true/false)',
          'hero_title': 'Hero Section Title',
          'hero_subtitle': 'Hero Section Subtitle',
          'hero_background': 'Hero Background Image URL',
          'hero_badge': 'Hero Badge Text',
          'hero_location': 'Location Display',
          
          // Author Section Fields
          'author_enabled': 'Include Author Section (true/false)',
          'author_name': 'Author Name',
          'author_bio': 'Author Bio',
          'author_avatar': 'Author Avatar URL',
          
          // Starter Pack Section Fields
          'starter_pack_enabled': 'Include Starter Pack Section (true/false)',
          'starter_pack_badge': 'Starter Pack Badge',
          'starter_pack_title': 'Starter Pack Title',
          'starter_pack_description': 'Starter Pack Description',
          
          // Blog Content Section
          'content_enabled': 'Include Content Section (true/false)',
          'content': 'Main Blog Content (HTML)',
          
          // Overview Section Fields
          'overview_enabled': 'Include Overview Section (true/false)',
          'overview_title': 'Overview Title',
          'overview_description': 'Overview Description',
          
          // Attractions Section Fields
          'attractions_enabled': 'Include Attractions Section (true/false)',
          'attractions_title': 'Attractions Section Title',
          'attractions_description': 'Attractions Description',
          
          // Places Section Fields
          'places_enabled': 'Include Places Section (true/false)',
          'places_title': 'Places Section Title',
          'places_description': 'Places Description',
          
          // Where to Stay Section Fields
          'stay_enabled': 'Include Where to Stay Section (true/false)',
          'stay_title': 'Where to Stay Title',
          'stay_description': 'Where to Stay Description',
          
          // Hotels Section Fields
          'hotels_enabled': 'Include Hotels Section (true/false)',
          'hotels_title': 'Hotels Section Title',
          'hotels_description': 'Hotels Description',
          
          // AI CTA Section Fields
          'ai_cta_enabled': 'Include AI CTA Section (true/false)',
          'ai_cta_title': 'AI CTA Title',
          'ai_cta_description': 'AI CTA Description',
          
          // Internal Links Section Fields
          'internal_links_enabled': 'Include Internal Links Section (true/false)',
          'internal_links_auto': 'Auto-generate Links (true/false)',
          'internal_links_manual': 'Manual Links (JSON format)',
          
          // FAQ Section Fields
          'faq_enabled': 'Include FAQ Section (true/false)',
          'faq_items': 'FAQ Items (JSON format: [{"question":"Q1","answer":"A1"}])',
          
          // Additional Content Fields
          'reading_time': 'Estimated Reading Time (minutes)',
          'difficulty_level': 'Content Difficulty (beginner/intermediate/advanced)',
          'best_season': 'Best Season to Visit',
          'budget_range': 'Budget Range ($/$$/$$$)',
          'duration': 'Trip Duration',
          'highlights': 'Key Highlights (comma-separated)'
        },
        field_mappings: {
          'title': 'title',
          'excerpt': 'excerpt',
          'slug': 'slug'
        },
        default_values: {
          'status': 'draft',
          'author_name': 'CuddlyNest Team',
          'author_bio': 'Travel experts helping you discover amazing destinations'
        },
        validation_rules: {
          // Required field validation
          'title': { min_length: 5, max_length: 200, required: true },
          'excerpt': { min_length: 10, max_length: 500, required: true },
          
          // Basic field validation
          'slug': { pattern: '^[a-z0-9-]+$', max_length: 100 },
          'status': { enum: ['draft', 'published'] },
          
          // SEO field validation
          'seo_title': { max_length: 60 },
          'seo_description': { max_length: 160 },
          'seo_keywords': { max_length: 200 },
          'focus_keyword': { max_length: 50 },
          
          // Boolean field validation
          'robots_index': { type: 'boolean' },
          'robots_follow': { type: 'boolean' },
          'robots_nosnippet': { type: 'boolean' },
          'structured_data_enabled': { type: 'boolean' },
          
          // URL field validation
          'canonical_url': { format: 'url' },
          'og_image': { format: 'url' },
          'twitter_image': { format: 'url' },
          'hero_background': { format: 'url' },
          'author_avatar': { format: 'url' },
          'featured_image': { format: 'url' },
          
          // Social media field validation
          'og_title': { max_length: 60 },
          'og_description': { max_length: 160 },
          'twitter_title': { max_length: 60 },
          'twitter_description': { max_length: 160 },
          
          // Structured data validation
          'structured_data_type': { enum: ['BlogPosting', 'TouristAttraction', 'LocalBusiness', 'Product', 'Event', 'Article', 'Organization', 'WebSite', 'BreadcrumbList', 'FAQPage', 'Review', 'Offer', 'Service'] },
          
          // Section enable/disable validation
          'hero_enabled': { type: 'boolean' },
          'author_enabled': { type: 'boolean' },
          'starter_pack_enabled': { type: 'boolean' },
          'content_enabled': { type: 'boolean' },
          'overview_enabled': { type: 'boolean' },
          'attractions_enabled': { type: 'boolean' },
          'places_enabled': { type: 'boolean' },
          'stay_enabled': { type: 'boolean' },
          'hotels_enabled': { type: 'boolean' },
          'ai_cta_enabled': { type: 'boolean' },
          'internal_links_enabled': { type: 'boolean' },
          'faq_enabled': { type: 'boolean' },
          'internal_links_auto': { type: 'boolean' },
          
          // Content field validation
          'hero_title': { max_length: 100 },
          'hero_subtitle': { max_length: 200 },
          'hero_badge': { max_length: 50 },
          'hero_location': { max_length: 100 },
          'author_name': { max_length: 100 },
          'author_bio': { max_length: 500 },
          
          // Enum validation
          'difficulty_level': { enum: ['beginner', 'intermediate', 'advanced'] },
          'budget_range': { enum: ['$', '$$', '$$$'] },
          
          // Number validation
          'reading_time': { type: 'number', min: 1, max: 120 }
        },
        version: '1.0.0',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ]
  }

  async getPostTemplate(id: string): Promise<PostTemplate | null> {
    const templates = await this.getPostTemplates()
    return templates.find(t => t.id === id) || null
  }

  // ===== CSV PROCESSING =====

  async parseCSV(file: File): Promise<{
    headers: string[]
    data: Record<string, any>[]
    errors: string[]
  }> {
    return new Promise((resolve, reject) => {
      const errors: string[] = []
      
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => {
          // Clean and normalize header names
          return header.trim().toLowerCase().replace(/\s+/g, '_')
        },
        transform: (value, field) => {
          // Handle completely empty or null values
          if (value === null || value === undefined) {
            return null
          }
          
          // Convert to string and trim
          const stringValue = String(value).trim()
          
          // Handle special data types
          if (field && field.endsWith('_array')) {
            // Handle arrays (comma-separated values)
            return stringValue ? stringValue.split(',').map(v => v.trim()) : []
          }
          if (field && field.endsWith('_json')) {
            // Handle JSON fields
            try {
              return stringValue ? JSON.parse(stringValue) : null
            } catch (e) {
              errors.push(`Invalid JSON in field ${field}: ${stringValue}`)
              return null
            }
          }
          if (field && field.endsWith('_boolean')) {
            // Handle boolean fields
            return stringValue ? ['true', '1', 'yes', 'on'].includes(stringValue.toLowerCase()) : false
          }
          if (field && field.endsWith('_number')) {
            // Handle numeric fields
            const num = parseFloat(stringValue)
            return !isNaN(num) ? num : null
          }
          
          // Handle tags and highlights (comma-separated)
          if (field === 'tags' || field === 'highlights' || field === 'seo_keywords') {
            return stringValue ? stringValue.split(',').map(v => v.trim()) : []
          }

          // Handle boolean fields
          if (field && (field.endsWith('_enabled') || field.includes('robots_') || field === 'structured_data_enabled')) {
            return stringValue ? ['true', '1', 'yes', 'on'].includes(stringValue.toLowerCase()) : false
          }

          // Handle JSON fields (FAQ items, internal links)
          if (field === 'faq_items' || field === 'internal_links_manual' || field === 'custom_json_ld') {
            try {
              return stringValue ? JSON.parse(stringValue) : null
            } catch (e) {
              errors.push(`Invalid JSON in field ${field}: ${stringValue}`)
              return null
            }
          }

          // Handle numeric fields
          if (field === 'reading_time') {
            const num = parseFloat(stringValue)
            return !isNaN(num) ? num : null
          }
          
          // Default: return as string, or null if empty
          return stringValue || null
        },
        complete: (results) => {
          if (results.errors.length > 0) {
            results.errors.forEach(error => {
              errors.push(`Row ${error.row}: ${error.message}`)
            })
          }

          resolve({
            headers: results.meta.fields || [],
            data: results.data as Record<string, any>[],
            errors
          })
        },
        error: (error) => {
          reject(new Error(`CSV parsing failed: ${error.message}`))
        }
      })
    })
  }

  async validateCSVData(
    data: Record<string, any>[],
    template: PostTemplate
  ): Promise<{
    validData: Record<string, any>[]
    errors: Array<{ row: number; errors: ValidationError[] }>
  }> {
    const validData: Record<string, any>[] = []
    const errors: Array<{ row: number; errors: ValidationError[] }> = []

    for (let i = 0; i < data.length; i++) {
      const row = data[i]
      const rowErrors: ValidationError[] = []

      // Check required fields
      template.required_fields.forEach(field => {
        const value = row[field]
        if (!value || (typeof value === 'string' && value.trim() === '')) {
          rowErrors.push({
            field,
            value,
            error: `Required field '${field}' is missing or empty`,
            severity: 'error'
          })
        }
      })

      // Validate field types and rules
      Object.keys(template.validation_rules).forEach(field => {
        const rules = template.validation_rules[field]
        const value = row[field]

        if (value !== null && value !== undefined && value !== '') {
          // Length validation
          if (rules.min_length && typeof value === 'string' && value.length < rules.min_length) {
            rowErrors.push({
              field,
              value,
              error: `Field '${field}' must be at least ${rules.min_length} characters long`,
              severity: 'error'
            })
          }

          if (rules.max_length && typeof value === 'string' && value.length > rules.max_length) {
            rowErrors.push({
              field,
              value,
              error: `Field '${field}' must not exceed ${rules.max_length} characters`,
              severity: 'error'
            })
          }

          // Pattern validation
          if (rules.pattern && typeof value === 'string' && !new RegExp(rules.pattern).test(value)) {
            rowErrors.push({
              field,
              value,
              error: `Field '${field}' does not match required pattern`,
              severity: 'error'
            })
          }

          // Format validation
          if (rules.format === 'url' && typeof value === 'string') {
            try {
              new URL(value)
            } catch {
              rowErrors.push({
                field,
                value,
                error: `Field '${field}' must be a valid URL`,
                severity: 'error'
              })
            }
          }
        }
      })

      // Check for duplicate slugs
      if (row.slug) {
        const duplicateIndex = validData.findIndex(item => item.slug === row.slug)
        if (duplicateIndex !== -1) {
          rowErrors.push({
            field: 'slug',
            value: row.slug,
            error: `Duplicate slug found at row ${duplicateIndex + 1}`,
            severity: 'error'
          })
        }
      }

      if (rowErrors.length > 0) {
        errors.push({ row: i + 1, errors: rowErrors })
      } else {
        validData.push(row)
      }
    }

    return { validData, errors }
  }

  // ===== JOB MANAGEMENT =====

  async createBulkUploadJob(
    templateId: string,
    jobName: string,
    filename: string,
    fileSize: number,
    totalRows: number,
    userId?: string
  ): Promise<BulkUploadJob> {
    // For now, create a mock job in localStorage since we don't have the database tables yet
    const job: BulkUploadJob = {
      id: `job_${Date.now()}`,
      template_id: templateId,
      job_name: jobName,
      original_filename: filename,
      file_size: fileSize,
      total_rows: totalRows,
      status: 'pending',
      processed_rows: 0,
      successful_rows: 0,
      failed_rows: 0,
      errors: [],
      warnings: [],
      created_by: userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    // Store in localStorage for now
    const jobs = this.getStoredJobs()
    jobs.push(job)
    localStorage.setItem('bulk_upload_jobs', JSON.stringify(jobs))

    return job
  }

  async updateJobStatus(
    jobId: string,
    status: BulkUploadJob['status'],
    updates?: Partial<BulkUploadJob>
  ): Promise<void> {
    const jobs = this.getStoredJobs()
    const jobIndex = jobs.findIndex(j => j.id === jobId)
    
    if (jobIndex !== -1) {
      jobs[jobIndex] = {
        ...jobs[jobIndex],
        status,
        ...updates,
        ...(status === 'processing' && { processing_started_at: new Date().toISOString() }),
        ...(status === 'completed' && { processing_completed_at: new Date().toISOString() }),
        updated_at: new Date().toISOString()
      }
      localStorage.setItem('bulk_upload_jobs', JSON.stringify(jobs))
    }
  }

  async getJob(jobId: string): Promise<BulkUploadJob | null> {
    const jobs = this.getStoredJobs()
    return jobs.find(j => j.id === jobId) || null
  }

  async getAllJobs(): Promise<BulkUploadJob[]> {
    return this.getStoredJobs()
  }

  // ===== CSV DATA STORAGE =====

  async storeCSVData(
    jobId: string,
    csvData: Record<string, any>[]
  ): Promise<void> {
    const records: CSVUploadData[] = csvData.map((row, index) => ({
      id: `csv_${jobId}_${index}`,
      job_id: jobId,
      row_number: index + 1,
      raw_data: row,
      validation_errors: [],
      processing_status: 'pending',
      created_at: new Date().toISOString()
    }))

    localStorage.setItem(`csv_data_${jobId}`, JSON.stringify(records))
  }

  async getCSVData(jobId: string): Promise<CSVUploadData[]> {
    const data = localStorage.getItem(`csv_data_${jobId}`)
    return data ? JSON.parse(data) : []
  }

  // ===== SLUG GENERATION =====

  generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
  }

  async ensureUniqueSlug(slug: string, excludeId?: string): Promise<string> {
    let uniqueSlug = slug
    let counter = 1

    while (true) {
      let query = supabase
        .from('cuddly_nest_modern_post')
        .select('id')
        .eq('slug', uniqueSlug)

      if (excludeId) {
        query = query.neq('id', excludeId)
      }

      const { data } = await query
      
      if (!data || data.length === 0) {
        break
      }

      uniqueSlug = `${slug}-${counter}`
      counter++
    }

    return uniqueSlug
  }

  // ===== PROGRESS TRACKING =====

  async getJobProgress(jobId: string): Promise<ProcessingProgress | null> {
    const job = await this.getJob(jobId)
    if (!job) return null

    return {
      jobId: job.id,
      totalRows: job.total_rows,
      processedRows: job.processed_rows,
      successfulRows: job.successful_rows,
      failedRows: job.failed_rows,
      status: job.status,
      errors: job.errors,
      warnings: job.warnings
    }
  }

  // ===== PRIVATE UTILITY METHODS =====

  private getStoredJobs(): BulkUploadJob[] {
    const data = localStorage.getItem('bulk_upload_jobs')
    return data ? JSON.parse(data) : []
  }

  // ===== POST PROCESSING =====
  
  async processCSVRow(csvRow: CSVUploadData, template: PostTemplate): Promise<{
    success: boolean
    postId?: string
    errors: string[]
  }> {
    try {
      const rowData = csvRow.raw_data
      
      // Generate slug if not provided
      let slug = rowData.slug
      if (!slug && rowData.title) {
        slug = this.generateSlug(rowData.title)
        slug = await this.ensureUniqueSlug(slug)
      }

      // Use existing author ID from the database
      let authorId = '5b91d6bf-49da-473a-a106-97678a9dc970' // existing author from database
      
      // If author data is provided in CSV, could potentially create/find author
      // For now, using the existing author ID found in the database

      // Create the post
      const { data: post, error: postError } = await supabase
        .from('cuddly_nest_modern_post')
        .insert({
          title: rowData.title,
          slug: slug,
          excerpt: rowData.excerpt,
          status: rowData.status || 'draft',
          author_id: authorId,
          // SEO fields
          seo_title: rowData.seo_title,
          seo_description: rowData.seo_description,
          seo_keywords: Array.isArray(rowData.seo_keywords) ? rowData.seo_keywords.join(', ') : rowData.seo_keywords,
          canonical_url: rowData.canonical_url,
          robots_index: rowData.robots_index !== false,
          robots_follow: rowData.robots_follow !== false,
          robots_nosnippet: rowData.robots_nosnippet === true,
          og_title: rowData.og_title,
          og_description: rowData.og_description,
          og_image: rowData.og_image,
          og_image_alt: rowData.og_image_alt,
          twitter_title: rowData.twitter_title || rowData.og_title,
          twitter_description: rowData.twitter_description || rowData.og_description,
          twitter_image: rowData.twitter_image || rowData.og_image,
          twitter_image_alt: rowData.twitter_image_alt || rowData.og_image_alt,
          focus_keyword: rowData.focus_keyword,
          // Structured data fields
          structured_data_enabled: rowData.structured_data_enabled !== false,
          structured_data_type: rowData.structured_data_type || 'BlogPosting',
          custom_json_ld: rowData.custom_json_ld ? JSON.stringify(rowData.custom_json_ld) : null,
          schema_override_priority: 0
        })
        .select()
        .single()

      if (postError) {
        return { success: false, errors: [postError.message] }
      }

      // Create sections if data is provided
      if (post && post.id) {
        await this.createPostSections(post.id, rowData)
      }

      return { success: true, postId: post.id, errors: [] }
    } catch (error) {
      return { 
        success: false, 
        errors: [error instanceof Error ? error.message : 'Unknown error'] 
      }
    }
  }

  private async createPostSections(postId: string, rowData: any): Promise<void> {
    const sections = []

    // Always create all 9 sections in the correct order, matching our new structure
    
    // 1. Hero Section (Position 0)
    sections.push({
      post_id: postId,
      template_id: '6f579a71-463c-43b4-b203-c2cb46c80d47',
      position: 0,
      is_active: true,
      data: {
        title: rowData.hero_title || rowData.title || 'Discover Amazing Travel Destination',
        subtitle: rowData.hero_subtitle || rowData.excerpt || 'Explore culture, cuisine, and unforgettable experiences',
        backgroundImage: rowData.hero_background || rowData.featured_image || 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
        location: rowData.hero_location || rowData.destination || 'Amazing Destination'
      }
    })

    // 2. Main Content (HTML) - Position 1
    sections.push({
      post_id: postId,
      template_id: 'e30d9e40-eb3a-41d3-aeac-413cfca52fe0',
      position: 1,
      is_active: true,
      data: {
        content: rowData.content || rowData.main_content || '<div class="prose max-w-none"><p>Welcome to our comprehensive travel guide! This section contains the main content for your destination.</p><p>Discover everything you need to know about this amazing place, from its rich history to modern attractions.</p><h3>Getting Started</h3><p>This guide will help you navigate the best experiences this destination has to offer.</p></div>'
      }
    })

    // 3. Rich Text Editor - Position 2
    sections.push({
      post_id: postId,
      template_id: '550e8400-e29b-41d4-a716-446655440000',
      position: 2,
      is_active: true,
      data: {
        content: rowData.rich_content || '<div class="prose max-w-none"><h2>Planning Your Adventure</h2><p>Every journey begins with proper planning. Here\'s our insider guide to making the most of your visit.</p><blockquote class="border-l-4 border-blue-500 pl-4 italic"><p>"Travel is the only thing you buy that makes you richer" - Let us show you how!</p></blockquote><h3>Best Time to Visit</h3><ul><li><strong>Peak Season:</strong> Perfect weather, vibrant atmosphere</li><li><strong>Shoulder Season:</strong> Fewer crowds, better prices</li><li><strong>Off-Season:</strong> Authentic local experience</li></ul><p>💡 <strong>Pro Tip:</strong> Book accommodations in advance for the best deals and locations!</p></div>'
      }
    })

    // 4. Starter Pack (Why This Destination Hits Different) - Position 3
    sections.push({
      post_id: postId,
      template_id: 'b87245be-1b68-47d4-83a6-fac582a0847f',
      position: 3,
      is_active: true,
      data: {
        destination: rowData.destination || rowData.hero_location || 'Amazing Destination',
        bestTime: rowData.best_time || rowData.best_season || 'Year-round',
        duration: rowData.duration || '3-5 days',
        budget: rowData.budget || rowData.budget_range || '$100-300 per day',
        currency: rowData.currency || 'USD',
        language: rowData.language || 'English widely spoken',
        timezone: rowData.timezone || 'Local timezone',
        highlights: rowData.highlights ? (Array.isArray(rowData.highlights) ? rowData.highlights : rowData.highlights.split(',').map((h: string) => h.trim())) : [
          'Perfect Duration: 3-5 days - Ideal for exploring without rushing',
          'Budget Range: $100-300 per day - Options for every traveler',
          'Must-See Attractions: 10+ incredible experiences await',
          'Authentic Culture: Immerse yourself in local traditions and flavors'
        ]
      }
    })

    // 5. Where to Stay - Position 4
    sections.push({
      post_id: postId,
      template_id: '833666f2-e112-40c0-9d50-02f160b96f3a',
      position: 4,
      is_active: true,
      data: {
        neighborhoods: rowData.neighborhoods ? JSON.parse(rowData.neighborhoods) : [
          {
            name: 'City Center',
            description: 'Heart of the action with easy access to major attractions',
            priceRange: '$150-350/night',
            bestFor: 'First-time visitors, business travelers',
            highlights: ['Walking distance to attractions', 'Great dining options', 'Public transport hub']
          },
          {
            name: 'Historic District',
            description: 'Charming area with traditional architecture and culture',
            priceRange: '$100-250/night',
            bestFor: 'Culture enthusiasts, romantic getaways',
            highlights: ['Historic landmarks', 'Local markets', 'Authentic atmosphere']
          },
          {
            name: 'Modern Quarter',
            description: 'Contemporary area with upscale amenities',
            priceRange: '$200-400/night',
            bestFor: 'Luxury travelers, shopping lovers',
            highlights: ['Luxury shopping', 'Fine dining', 'Modern conveniences']
          }
        ],
        tips: rowData.accommodation_tips ? rowData.accommodation_tips.split(',').map((tip: string) => tip.trim()) : [
          'Book accommodations near transportation hubs for easy access',
          'Consider staying slightly outside the center for better value',
          'Look for properties with local experiences and cultural insights'
        ]
      }
    })

    // 6. AI CTA (Plan Your Perfect Trip) - Position 5
    sections.push({
      post_id: postId,
      template_id: '03d9efa8-2c31-489d-94af-d2d85f52aa9c',
      position: 5,
      is_active: true,
      data: {
        title: rowData.ai_cta_title || 'Plan Your Perfect Adventure',
        subtitle: rowData.ai_cta_subtitle || 'Let our AI travel assistant create a personalized itinerary just for you',
        description: rowData.ai_cta_description || 'Answer a few quick questions about your travel style, interests, and budget. Our AI will craft a detailed day-by-day itinerary with recommendations, optimal routes, and insider tips.',
        buttonText: rowData.ai_cta_button || 'Create My Custom Itinerary',
        buttonUrl: rowData.ai_cta_url || '/ai-planner',
        features: rowData.ai_features ? rowData.ai_features.split(',').map((f: string) => f.trim()) : [
          'Personalized day-by-day schedules',
          'Recommendations based on your interests',
          'Optimal routes to minimize travel time',
          'Real-time updates for events and closures'
        ],
        testimonial: rowData.ai_testimonial ? JSON.parse(rowData.ai_testimonial) : {
          text: 'The AI planner helped us discover hidden gems and create the perfect itinerary for our budget and interests!',
          author: 'Travel Enthusiast',
          location: 'Verified Traveler'
        }
      }
    })

    // 7. FAQ - Position 6
    sections.push({
      post_id: postId,
      template_id: '710f8880-c86d-4353-b16f-474c74debd31',
      position: 6,
      is_active: true,
      data: {
        faqs: rowData.faq_items ? (Array.isArray(rowData.faq_items) ? rowData.faq_items : JSON.parse(rowData.faq_items)) : [
          {
            question: 'How many days do I need for this destination?',
            answer: 'We recommend at least 3-5 days to see the main attractions without rushing. With more time, you can explore surrounding areas and have a more relaxed experience.'
          },
          {
            question: 'What\'s the best way to get around?',
            answer: 'The destination has excellent public transportation, but many attractions are also within walking distance. Taxis and ride-sharing services are widely available for longer distances.'
          },
          {
            question: 'Is it expensive to visit?',
            answer: 'Costs can vary greatly depending on your travel style. Budget travelers can expect to spend $100-150/day, while luxury travelers might spend $300-500/day including accommodation, meals, and activities.'
          },
          {
            question: 'When is the best time to visit?',
            answer: rowData.best_time_answer || 'The destination is beautiful year-round, but the best time depends on your preferences for weather, crowds, and activities. Each season offers unique experiences.'
          },
          {
            question: 'Do I need to book attractions in advance?',
            answer: 'For popular attractions, we highly recommend booking in advance, especially during peak season. This can save you time and sometimes money with early-bird discounts.'
          }
        ]
      }
    })

    // 8. Internal Links (Related Travel Guides) - Position 7
    sections.push({
      post_id: postId,
      template_id: 'c2caf0b9-68b6-48c1-999c-4cc48bd12242',
      position: 7,
      is_active: true,
      data: {
        title: rowData.related_title || 'Explore More Destinations',
        autoGenerate: rowData.internal_links_auto !== false,
        links: rowData.internal_links_manual ? (Array.isArray(rowData.internal_links_manual) ? rowData.internal_links_manual : JSON.parse(rowData.internal_links_manual)) : []
      }
    })

    // 9. Author Section - Position 8
    sections.push({
      post_id: postId,
      template_id: '58e1b71c-600b-48d3-a956-f9b27bc368b2',
      position: 8,
      is_active: true,
      data: {
        authorName: rowData.author_name || 'Travel Expert',
        bio: rowData.author_bio || 'Passionate travel writer with years of experience exploring amazing destinations around the world. Dedicated to helping fellow travelers discover authentic experiences and hidden gems.',
        avatar: rowData.author_avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80',
        location: rowData.author_location || 'World Traveler',
        experience: rowData.author_experience || '5+ years in travel',
        specialty: rowData.author_specialty || 'Cultural experiences & local cuisine',
        socialLinks: rowData.author_social ? JSON.parse(rowData.author_social) : {
          instagram: 'https://instagram.com/travelexpert',
          twitter: 'https://twitter.com/travelexpert',
          website: 'https://travelblog.com'
        },
        stats: rowData.author_stats ? JSON.parse(rowData.author_stats) : {
          articlesWritten: 25,
          countriesVisited: 15,
          yearsExperience: 5
        }
      }
    })

    // Insert all sections
    if (sections.length > 0) {
      await supabase
        .from('modern_post_sections')
        .insert(sections)
    }
  }

  async recordGeneratedPost(
    jobId: string,
    csvRowId: string,
    templateId: string,
    postId: string,
    title: string,
    slug: string,
    status: string
  ): Promise<void> {
    // Store generated post info in localStorage for now
    const generatedPosts = this.getStoredGeneratedPosts()
    generatedPosts.push({
      id: `gen_${Date.now()}`,
      job_id: jobId,
      csv_row_id: csvRowId,
      template_id: templateId,
      post_id: postId,
      title,
      slug,
      status: status as 'draft' | 'published' | 'failed',
      generation_errors: [],
      created_at: new Date().toISOString()
    })
    localStorage.setItem('bulk_generated_posts', JSON.stringify(generatedPosts))
  }

  private getStoredGeneratedPosts(): BulkGeneratedPost[] {
    const data = localStorage.getItem('bulk_generated_posts')
    return data ? JSON.parse(data) : []
  }
}

export const bulkUploadService = new BulkUploadService()