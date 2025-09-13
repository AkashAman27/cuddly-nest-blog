import sharp from 'sharp'
import { supabase } from '@/lib/supabase'
import { v4 as uuidv4 } from 'uuid'

interface ProcessingOptions {
  quality?: number
  width?: number
  height?: number
  format?: 'webp' | 'jpeg' | 'png'
  progressive?: boolean
}

interface UploadResult {
  publicUrl: string
  fileName: string
  fileSize: number
  dimensions: {
    width: number
    height: number
  }
}

export class ImageProcessingService {
  private bucket: string

  constructor() {
    this.bucket = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || 'blog-images'
  }

  /**
   * Process a base64 image and convert it to WebP format with optimization
   */
  async processBase64Image(
    base64Data: string, 
    options: ProcessingOptions = {}
  ): Promise<Buffer> {
    const {
      quality = 85,
      width,
      height,
      format = 'webp',
      progressive = true
    } = options

    try {
      // Remove data URL prefix if present
      const base64WithoutPrefix = base64Data.replace(/^data:image\/[a-z]+;base64,/, '')
      const imageBuffer = Buffer.from(base64WithoutPrefix, 'base64')

      let sharpInstance = sharp(imageBuffer)

      // Get original dimensions
      const metadata = await sharpInstance.metadata()
      console.log('Original image metadata:', {
        width: metadata.width,
        height: metadata.height,
        format: metadata.format,
        size: imageBuffer.length
      })

      // Resize if dimensions specified
      if (width || height) {
        sharpInstance = sharpInstance.resize(width, height, {
          fit: 'inside',
          withoutEnlargement: true
        })
      }

      // Apply format and quality settings
      switch (format) {
        case 'webp':
          sharpInstance = sharpInstance.webp({
            quality,
            progressive,
            effort: 6, // Higher effort for better compression
            nearLossless: false
          })
          break
        case 'jpeg':
          sharpInstance = sharpInstance.jpeg({
            quality,
            progressive,
            mozjpeg: true
          })
          break
        case 'png':
          sharpInstance = sharpInstance.png({
            progressive,
            compressionLevel: 9,
            adaptiveFiltering: true
          })
          break
      }

      const processedBuffer = await sharpInstance.toBuffer()
      
      console.log('Processed image:', {
        originalSize: imageBuffer.length,
        processedSize: processedBuffer.length,
        compressionRatio: Math.round((1 - processedBuffer.length / imageBuffer.length) * 100),
        format
      })

      return processedBuffer
    } catch (error) {
      console.error('Error processing image:', error)
      throw new Error(`Image processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Upload processed image to Supabase storage
   */
  async uploadToSupabase(
    processedBuffer: Buffer, 
    fileName?: string,
    folder: string = 'generated'
  ): Promise<UploadResult> {
    try {
      const finalFileName = fileName || `${uuidv4()}.webp`
      const filePath = `${folder}/${finalFileName}`

      console.log(`Uploading image to Supabase: ${filePath}`)

      // Upload to Supabase storage
      const { data, error } = await supabase.storage
        .from(this.bucket)
        .upload(filePath, processedBuffer, {
          contentType: 'image/webp',
          cacheControl: '3600',
          upsert: false
        })

      if (error) {
        console.error('Supabase storage error:', error)
        throw new Error(`Upload failed: ${error.message}`)
      }

      console.log('Upload successful:', data)

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from(this.bucket)
        .getPublicUrl(filePath)

      if (!publicUrlData.publicUrl) {
        throw new Error('Failed to get public URL')
      }

      // Get image dimensions from processed buffer
      const metadata = await sharp(processedBuffer).metadata()

      return {
        publicUrl: publicUrlData.publicUrl,
        fileName: finalFileName,
        fileSize: processedBuffer.length,
        dimensions: {
          width: metadata.width || 0,
          height: metadata.height || 0
        }
      }
    } catch (error) {
      console.error('Error uploading to Supabase:', error)
      throw new Error(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Complete pipeline: process base64 image and upload to Supabase
   */
  async processAndUpload(
    base64Data: string,
    options: ProcessingOptions & { fileName?: string; folder?: string } = {}
  ): Promise<UploadResult> {
    const { fileName, folder, ...processingOptions } = options

    try {
      console.log('Starting image processing and upload pipeline')
      
      // Process the image
      const processedBuffer = await this.processBase64Image(base64Data, processingOptions)
      
      // Upload to Supabase
      const uploadResult = await this.uploadToSupabase(processedBuffer, fileName, folder)
      
      console.log('Pipeline completed successfully:', uploadResult)
      return uploadResult
    } catch (error) {
      console.error('Error in processing pipeline:', error)
      throw error
    }
  }

  /**
   * Generate multiple sizes for responsive images
   */
  async generateResponsiveSizes(
    base64Data: string,
    baseName?: string,
    folder: string = 'generated'
  ): Promise<{
    original: UploadResult
    large: UploadResult
    medium: UploadResult
    small: UploadResult
    thumbnail: UploadResult
  }> {
    const name = baseName || uuidv4()
    
    const sizes = [
      { size: 'original', width: undefined, height: undefined },
      { size: 'large', width: 1920, height: 1080 },
      { size: 'medium', width: 1200, height: 675 },
      { size: 'small', width: 800, height: 450 },
      { size: 'thumbnail', width: 300, height: 169 }
    ]

    const results = await Promise.all(
      sizes.map(async ({ size, width, height }) => {
        const fileName = `${name}-${size}.webp`
        const result = await this.processAndUpload(base64Data, {
          width,
          height,
          fileName,
          folder
        })
        return { size, result }
      })
    )

    return {
      original: results.find(r => r.size === 'original')!.result,
      large: results.find(r => r.size === 'large')!.result,
      medium: results.find(r => r.size === 'medium')!.result,
      small: results.find(r => r.size === 'small')!.result,
      thumbnail: results.find(r => r.size === 'thumbnail')!.result
    }
  }

  /**
   * Create optimized images specifically for blog content
   */
  async createBlogImage(
    base64Data: string,
    blogSlug: string,
    imageType: 'hero' | 'content' | 'gallery' | 'thumbnail' = 'content'
  ): Promise<UploadResult> {
    const folder = `blog-images/${blogSlug}`
    const timestamp = Date.now()
    
    let processingOptions: ProcessingOptions
    
    switch (imageType) {
      case 'hero':
        processingOptions = {
          width: 1920,
          height: 1080,
          quality: 90,
          format: 'webp'
        }
        break
      case 'content':
        processingOptions = {
          width: 1200,
          height: 675,
          quality: 85,
          format: 'webp'
        }
        break
      case 'gallery':
        processingOptions = {
          width: 800,
          height: 600,
          quality: 80,
          format: 'webp'
        }
        break
      case 'thumbnail':
        processingOptions = {
          width: 400,
          height: 225,
          quality: 75,
          format: 'webp'
        }
        break
    }

    const fileName = `${imageType}-${timestamp}.webp`
    
    return this.processAndUpload(base64Data, {
      ...processingOptions,
      fileName,
      folder
    })
  }

  /**
   * Check if storage bucket exists and create it if necessary
   */
  async ensureBucketExists(): Promise<boolean> {
    try {
      console.log(`Checking if storage bucket '${this.bucket}' exists...`)
      const { data: buckets, error } = await supabase.storage.listBuckets()
      
      if (error) {
        console.warn('Cannot list buckets (may be permissions issue):', error.message)
        // Don't fail here - bucket might exist but we can't list it due to permissions
        // Try a simple upload test instead
        return await this.testBucketAccess()
      }

      const bucketExists = buckets?.some(bucket => bucket.name === this.bucket)
      console.log(`Bucket '${this.bucket}' exists:`, bucketExists)
      
      if (!bucketExists) {
        console.log(`Creating storage bucket: ${this.bucket}`)
        const { data, error: createError } = await supabase.storage.createBucket(this.bucket, {
          public: true,
          fileSizeLimit: 10 * 1024 * 1024, // 10MB limit
          allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
        })

        if (createError) {
          console.warn('Cannot create bucket (may already exist or permissions issue):', createError.message)
          // Don't fail - try to test access instead
          return await this.testBucketAccess()
        }

        console.log('✅ Bucket created successfully:', data)
      } else {
        console.log('✅ Bucket already exists')
      }

      return true
    } catch (error) {
      console.warn('Error checking bucket existence (trying access test):', error)
      return await this.testBucketAccess()
    }
  }

  private async testBucketAccess(): Promise<boolean> {
    try {
      // Try to list files in the bucket to test access
      const { data, error } = await supabase.storage.from(this.bucket).list('', { limit: 1 })
      
      if (error) {
        console.error('Bucket access test failed:', error.message)
        return false
      }
      
      console.log('✅ Bucket access test passed')
      return true
    } catch (error) {
      console.error('Bucket access test exception:', error)
      return false
    }
  }
}

export default ImageProcessingService