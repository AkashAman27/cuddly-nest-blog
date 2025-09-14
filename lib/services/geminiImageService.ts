import { initializeBlogImagesBucket } from '@/lib/storage'

interface GeminiImageGenerationRequest {
  prompt: string
  negativePrompt?: string
  aspectRatio?: '1:1' | '9:16' | '16:9' | '4:3' | '3:4'
  count?: number
  guidanceScale?: number
  quality?: number
}

interface GeneratedImage {
  publicUrl: string
  fileName: string
  fileSize: number
  dimensions: {
    width: number
    height: number
  }
  seedValue?: number
  prompt: string
  index: number
}

class GeminiImageService {
  private apiKey: string | null = null

  constructor() {
    this.apiKey = process.env.GOOGLE_API_KEY || null
  }

  isConfigured(): boolean {
    return !!this.apiKey
  }

  async generateImages(request: GeminiImageGenerationRequest): Promise<{
    success: boolean
    images?: GeneratedImage[]
    error?: string
    errorType?: string
    canRetry?: boolean
    suggestions?: string[]
  }> {
    if (!this.isConfigured()) {
      return {
        success: false,
        error: 'Google API key is not configured. Please add GOOGLE_API_KEY to your environment variables.',
        errorType: 'CONFIGURATION_ERROR'
      }
    }

    try {
      // Initialize storage bucket
      await initializeBlogImagesBucket()

      const images: GeneratedImage[] = []
      const count = request.count || 1

      for (let i = 0; i < count; i++) {
        try {
          const image = await this.generateSingleImage(request, i + 1)
          images.push(image)
        } catch (error) {
          console.error(`Failed to generate image ${i + 1}:`, error)
          
          if (error instanceof Error) {
            if (error.message.includes('safety')) {
              return {
                success: false,
                error: 'Content policy violation. Please modify your prompt to be more appropriate.',
                errorType: 'SAFETY_FILTER',
                canRetry: true,
                suggestions: [
                  'Use more general, family-friendly descriptions',
                  'Avoid specific people, brands, or copyrighted content',
                  'Focus on landscapes, objects, or abstract concepts',
                  'Remove any potentially controversial terms'
                ]
              }
            }
            
            if (error.message.includes('quota') || error.message.includes('limit')) {
              return {
                success: false,
                error: 'API quota exceeded. Please try again later or check your Google Cloud billing.',
                errorType: 'QUOTA_EXCEEDED',
                canRetry: true
              }
            }
          }
          
          throw error
        }
      }

      return {
        success: true,
        images
      }
    } catch (error) {
      console.error('Gemini image generation error:', error)
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred during image generation',
        errorType: 'GENERATION_ERROR',
        canRetry: true
      }
    }
  }

  private async generateSingleImage(request: GeminiImageGenerationRequest, index: number): Promise<GeneratedImage> {
    // Build the generation prompt
    const fullPrompt = this.buildPrompt(request)
    
    // Call Google Gemini OpenAI-compatible API
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/openai/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: 'imagen-3.0-generate-002',
        prompt: fullPrompt,
        response_format: 'b64_json',
        n: 1,
        size: this.mapSizeFromAspectRatio(request.aspectRatio)
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(`Gemini API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`)
    }

    const data = await response.json()
    
    if (!data.data || data.data.length === 0) {
      throw new Error('No images generated')
    }

    const imageData = data.data[0]
    
    // Process and upload the image
    const processedImage = await this.processAndUploadImage(imageData, request, index)
    
    return processedImage
  }

  private buildPrompt(request: GeminiImageGenerationRequest): string {
    let prompt = request.prompt.trim()
    
    // Enhance prompt for better quality
    if (!prompt.toLowerCase().includes('high quality')) {
      prompt += ', high quality, professional photography'
    }
    
    return prompt
  }

  private mapSizeFromAspectRatio(aspectRatio?: string): string {
    // OpenAI API uses specific size formats
    const sizeMapping: { [key: string]: string } = {
      '1:1': '1024x1024',
      '9:16': '1024x1792',
      '16:9': '1792x1024',
      '4:3': '1024x768',
      '3:4': '768x1024'
    }
    
    return sizeMapping[aspectRatio || '16:9'] || '1792x1024'
  }

  private async processAndUploadImage(
    imageData: any, 
    request: GeminiImageGenerationRequest, 
    index: number
  ): Promise<GeneratedImage> {
    // Decode base64 image data from OpenAI-compatible response
    const imageBuffer = Buffer.from(imageData.b64_json, 'base64')
    
    // Generate filename
    const timestamp = Date.now()
    const sanitizedPrompt = request.prompt.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50)
    
    const fileName = `generated-${sanitizedPrompt}-${timestamp}-${index}.jpg`
    
    // Upload to storage (this would integrate with your storage system)
    const publicUrl = await this.uploadToStorage(imageBuffer, fileName)
    
    // Get image dimensions based on aspect ratio
    const dimensions = this.getDimensionsFromAspectRatio(request.aspectRatio)
    
    return {
      publicUrl,
      fileName,
      fileSize: imageBuffer.length,
      dimensions,
      prompt: request.prompt,
      index
    }
  }

  private async uploadToStorage(imageBuffer: Buffer, fileName: string): Promise<string> {
    try {
      // In a production environment, you would upload to your actual storage system
      // For now, we'll create a data URL to display the image
      const base64Image = imageBuffer.toString('base64')
      const mimeType = 'image/jpeg' // Default to JPEG for generated images
      return `data:${mimeType};base64,${base64Image}`
    } catch (error) {
      console.error('Storage upload error:', error)
      // Return a fallback URL
      return `https://your-storage-bucket.com/blog-images/${fileName}`
    }
  }

  private getDimensionsFromAspectRatio(aspectRatio?: string): { width: number; height: number } {
    // Return dimensions matching the size we requested from the API
    const dimensionMapping: { [key: string]: { width: number; height: number } } = {
      '1:1': { width: 1024, height: 1024 },
      '9:16': { width: 1024, height: 1792 },
      '16:9': { width: 1792, height: 1024 },
      '4:3': { width: 1024, height: 768 },
      '3:4': { width: 768, height: 1024 }
    }
    
    return dimensionMapping[aspectRatio || '16:9'] || { width: 1792, height: 1024 }
  }

  async testConfiguration(): Promise<{ success: boolean; error?: string }> {
    if (!this.isConfigured()) {
      return {
        success: false,
        error: 'Google API key is not configured'
      }
    }

    try {
      // Test API connectivity with a simple models list request
      const response = await fetch('https://generativelanguage.googleapis.com/v1beta/openai/models', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      })

      if (!response.ok) {
        return {
          success: false,
          error: `API key validation failed: ${response.status}`
        }
      }

      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  async getSuggestions(location?: string): Promise<string[]> {
    const baseSuggestions = [
      'Beautiful sunset over ancient ruins with golden hour lighting',
      'Modern cityscape at night with vibrant lights and reflections',
      'Serene mountain landscape with crystal clear lake reflection',
      'Cozy café interior with warm lighting and rustic furniture',
      'Vibrant street art mural on urban brick wall',
      'Peaceful forest path with dappled sunlight through trees'
    ]

    if (location) {
      return [
        `Iconic landmarks of ${location} during golden hour`,
        `Traditional architecture in ${location} with blue sky`,
        `Bustling street scene in ${location} with local culture`,
        `Panoramic view of ${location} from elevated perspective`,
        `Hidden gems and local spots in ${location}`,
        ...baseSuggestions
      ]
    }

    return baseSuggestions
  }
}

export default GeminiImageService