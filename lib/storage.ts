import { supabase } from './supabase'

// Storage bucket name for blog images
const BLOG_IMAGES_BUCKET = 'blog-images'

// Initialize storage bucket if it doesn't exist
export async function initializeBlogImagesBucket() {
  try {
    // Check if bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()
    
    if (listError) {
      console.warn('Cannot list buckets (may need manual setup):', listError.message)
      // Continue anyway - bucket might exist but we can't list it
      return true
    }

    const bucketExists = buckets?.some(bucket => bucket.name === BLOG_IMAGES_BUCKET)

    if (!bucketExists) {
      // Try to create the bucket with public read access
      const { error: createError } = await supabase.storage.createBucket(BLOG_IMAGES_BUCKET, {
        public: true,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
        fileSizeLimit: 10485760, // 10MB limit
      })

      if (createError) {
        console.warn('Cannot create bucket automatically (may need manual setup):', createError.message)
        // Don't fail - bucket might need to be created manually in Supabase dashboard
        return true
      }

      console.log('Blog images bucket created successfully')
    }

    return true
  } catch (error) {
    console.warn('Error with bucket initialization (may need manual setup):', error)
    // Don't fail - proceed with uploads anyway
    return true
  }
}

// Upload image to Supabase Storage
export async function uploadBlogImage(file: File): Promise<{ url: string; path: string } | null> {
  try {
    // Generate unique filename with timestamp
    const timestamp = Date.now()
    const randomId = Math.random().toString(36).substring(2, 15)
    const fileExtension = file.name.split('.').pop()
    const fileName = `${timestamp}-${randomId}.${fileExtension}`
    const filePath = `uploads/${fileName}`

    // Upload file to Supabase Storage
    const { data, error } = await supabase.storage
      .from(BLOG_IMAGES_BUCKET)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      console.error('Error uploading image:', error)
      return null
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(BLOG_IMAGES_BUCKET)
      .getPublicUrl(filePath)

    if (!urlData?.publicUrl) {
      console.error('Error getting public URL')
      return null
    }

    return {
      url: urlData.publicUrl,
      path: filePath
    }
  } catch (error) {
    console.error('Exception uploading image:', error)
    return null
  }
}

// Delete image from Supabase Storage
export async function deleteBlogImage(filePath: string): Promise<boolean> {
  try {
    const { error } = await supabase.storage
      .from(BLOG_IMAGES_BUCKET)
      .remove([filePath])

    if (error) {
      console.error('Error deleting image:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Exception deleting image:', error)
    return false
  }
}

// Get optimized image URL with transformations
export function getOptimizedImageUrl(
  url: string, 
  options: {
    width?: number
    height?: number
    quality?: number
    format?: 'webp' | 'jpeg' | 'png'
  } = {}
): string {
  // For Supabase Storage, we'll use basic URL transformations
  // In production, you might want to use a service like Cloudinary or ImageKit
  const { width, height, quality = 80 } = options
  
  if (!width && !height) return url
  
  // Basic transformation - this would need to be enhanced based on your CDN
  let transformedUrl = url
  
  // Add transform parameters if your Supabase setup supports them
  // This is a placeholder - actual implementation depends on your image processing service
  const params = new URLSearchParams()
  if (width) params.append('w', width.toString())
  if (height) params.append('h', height.toString())
  if (quality) params.append('q', quality.toString())
  
  if (params.toString()) {
    transformedUrl += `?${params.toString()}`
  }
  
  return transformedUrl
}

// Validate image file
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  // Check file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Invalid file type. Please upload JPEG, PNG, WebP, or GIF images.'
    }
  }

  // Check file size (10MB limit)
  const maxSize = 10 * 1024 * 1024 // 10MB
  if (file.size > maxSize) {
    return {
      valid: false,
      error: 'File size too large. Please upload images under 10MB.'
    }
  }

  return { valid: true }
}

// Helper to extract file path from Supabase Storage URL
export function extractFilePathFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url)
    const pathParts = urlObj.pathname.split('/')
    const bucketIndex = pathParts.findIndex(part => part === BLOG_IMAGES_BUCKET)
    
    if (bucketIndex === -1) return null
    
    return pathParts.slice(bucketIndex + 1).join('/')
  } catch (error) {
    console.error('Error extracting file path from URL:', error)
    return null
  }
}

// Note: Bucket should be created manually in Supabase Dashboard with these settings:
// - Name: blog-images
// - Public: true
// - Allowed MIME types: image/jpeg, image/png, image/webp, image/gif
// - File size limit: 10MB
// - RLS policies for public access

// Don't auto-initialize on module load to avoid permission errors
// initializeBlogImagesBucket()