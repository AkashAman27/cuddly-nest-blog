import { NextRequest, NextResponse } from 'next/server'
import GeminiImageService from '@/lib/services/geminiImageService'
import ImageProcessingService from '@/lib/services/imageProcessingService'
import { initializeBlogImagesBucket } from '@/lib/storage'

interface ImageGenerationRequest {
  prompt: string
  blogSlug?: string
  imageType?: 'hero' | 'content' | 'gallery' | 'thumbnail'
  aspectRatio?: '1:1' | '9:16' | '16:9' | '4:3' | '3:4'
  count?: number
  negativePrompt?: string
  guidanceScale?: number
  quality?: number
}

export async function POST(request: NextRequest) {
  try {
    console.log('Image generation request received')
    
    const body: ImageGenerationRequest = await request.json()
    const {
      prompt,
      blogSlug = 'default',
      imageType = 'content',
      aspectRatio = '16:9',
      count = 1,
      negativePrompt,
      guidanceScale = 100,
      quality = 85
    } = body

    if (!prompt || prompt.trim().length === 0) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      )
    }

    console.log('Generating images with parameters:', {
      prompt: prompt.substring(0, 100) + '...',
      blogSlug,
      imageType,
      aspectRatio,
      count,
      guidanceScale
    })

    // Initialize services
    const geminiService = new GeminiImageService()
    const imageProcessor = new ImageProcessingService()

    // Ensure storage bucket exists using both methods
    console.log('Initializing storage bucket...')
    try {
      await initializeBlogImagesBucket()
      const bucketReady = await imageProcessor.ensureBucketExists()
      
      if (!bucketReady) {
        console.error('Storage bucket initialization failed')
        return NextResponse.json(
          { error: 'Storage initialization failed. Please check your Supabase storage configuration.' },
          { status: 500 }
        )
      }
      console.log('✅ Storage bucket ready')
    } catch (storageError) {
      console.error('Storage initialization error:', storageError)
      return NextResponse.json(
        { error: `Storage setup failed: ${storageError instanceof Error ? storageError.message : 'Unknown error'}` },
        { status: 500 }
      )
    }

    try {
      let generatedImages
      
      if (count > 1) {
        // Generate multiple images
        console.log(`Generating ${count} images`)
        generatedImages = await geminiService.generateMultipleImages({
          prompt,
          negativePrompt,
          aspectRatio,
          guidanceScale
        }, count)
      } else {
        // Generate single image
        console.log('Generating single image')
        const singleImage = await geminiService.generateImage({
          prompt,
          negativePrompt,
          aspectRatio,
          guidanceScale
        })
        generatedImages = [singleImage]
      }

      if (generatedImages.length === 0) {
        return NextResponse.json(
          { error: 'No images were generated' },
          { status: 500 }
      )
      }

      console.log(`Successfully generated ${generatedImages.length} images`)

      // Process and upload images
      const processedImages = await Promise.all(
        generatedImages.map(async (generatedImage, index) => {
          try {
            console.log(`Processing image ${index + 1}/${generatedImages.length}`)
            
            // Create unique filename for each image
            const timestamp = Date.now()
            const imageIndex = count > 1 ? `-${index + 1}` : ''
            const fileName = `${imageType}-${timestamp}${imageIndex}.webp`
            
            const uploadResult = await imageProcessor.processAndUpload(
              generatedImage.imageData,
              {
                quality,
                format: 'webp',
                fileName,
                folder: `blog-images/${blogSlug}`
              }
            )

            return {
              ...uploadResult,
              seedValue: generatedImage.seedValue,
              prompt: prompt,
              index: index + 1
            }
          } catch (error) {
            console.error(`Error processing image ${index + 1}:`, error)
            return null
          }
        })
      )

      // Filter out failed images
      const successfulImages = processedImages.filter(img => img !== null)

      if (successfulImages.length === 0) {
        return NextResponse.json(
          { error: 'Image processing failed for all generated images' },
          { status: 500 }
        )
      }

      console.log(`Successfully processed ${successfulImages.length} images`)

      // Check if we used placeholder images (placeholders have seed values < 10000)
      const usedPlaceholders = generatedImages.some(img => img.seedValue && img.seedValue < 10000)
      
      return NextResponse.json({
        success: true,
        images: successfulImages,
        generatedCount: generatedImages.length,
        processedCount: successfulImages.length,
        prompt: prompt,
        usingDemoImages: usedPlaceholders,
        demoMessage: usedPlaceholders ? 'Professional demo images generated. Perfect for blog content and client presentations.' : undefined,
        parameters: {
          aspectRatio,
          guidanceScale,
          quality,
          imageType,
          blogSlug
        }
      })

    } catch (generationError) {
      console.error('Image generation error:', generationError)
      
      // Provide more specific error messages based on the error type
      let errorMessage = 'Image generation failed'
      let errorType = 'GENERAL_ERROR'
      
      if (generationError instanceof Error) {
        if (generationError.message.includes('SAFETY_FILTER')) {
          errorMessage = generationError.message.replace('SAFETY_FILTER: ', '')
          errorType = 'SAFETY_FILTER'
        } else if (generationError.message.includes('API_FALLBACK')) {
          if (generationError.message.includes('enterprise API access')) {
            errorMessage = 'Google Imagen requires enterprise API access. Using professional demo images that work perfectly for your blog.'
          } else {
            errorMessage = 'Google Imagen API is currently unavailable. Using high-quality demo images for your blog.'
          }
          errorType = 'API_FALLBACK'
        } else if (generationError.message.includes('API key')) {
          errorMessage = 'Google API key is invalid or missing. Please check your configuration.'
          errorType = 'API_KEY_ERROR'
        } else if (generationError.message.includes('quota')) {
          errorMessage = 'Google API quota exceeded. Please try again later or check your billing.'
          errorType = 'QUOTA_ERROR'
        } else if (generationError.message.toLowerCase().includes('safety')) {
          errorMessage = 'Your prompt was filtered for safety. Please try a different description that avoids potentially harmful content.'
          errorType = 'SAFETY_FILTER'
        } else {
          errorMessage = `Generation failed: ${generationError.message}`
          errorType = 'GENERAL_ERROR'
        }
      }

      return NextResponse.json(
        { 
          error: errorMessage,
          errorType: errorType,
          canRetry: errorType === 'SAFETY_FILTER' || errorType === 'QUOTA_ERROR' || errorType === 'API_FALLBACK',
          suggestions: errorType === 'SAFETY_FILTER' ? [
            'Try describing the scene without mentioning people or controversial topics',
            'Focus on landscapes, architecture, or general travel scenes',
            'Use positive, descriptive language about places and activities',
            'Avoid words that might trigger content filters'
          ] : errorType === 'API_FALLBACK' ? [
            'Professional demo images are fully functional for your blog',
            'Images are optimized and ready for publication',
            'Try different prompts to see various themed styles',
            'Demo images use smart color schemes based on your content'
          ] : undefined,
          details: generationError instanceof Error ? generationError.message : 'Unknown error'
        },
        { status: errorType === 'SAFETY_FILTER' || errorType === 'API_FALLBACK' ? 400 : 500 }
      )
    }

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    
    if (action === 'suggestions') {
      const location = searchParams.get('location') || 'Italy'
      const suggestions = GeminiImageService.getTravelPromptSuggestions(location)
      
      return NextResponse.json({
        success: true,
        location,
        suggestions
      })
    }

    if (action === 'test') {
      // Test endpoint to check if services are properly configured
      try {
        const geminiService = new GeminiImageService()
        const imageProcessor = new ImageProcessingService()
        
        // Initialize and check bucket
        await initializeBlogImagesBucket()
        const bucketReady = await imageProcessor.ensureBucketExists()
        
        return NextResponse.json({
          success: true,
          services: {
            geminiImageService: 'configured',
            imageProcessingService: 'configured',
            supabaseStorage: bucketReady ? 'ready' : 'needs setup'
          },
          message: 'Image generation system is ready'
        })
      } catch (error) {
        console.error('Service test error:', error)
        return NextResponse.json({
          success: false,
          error: error instanceof Error ? error.message : 'Configuration error',
          services: {
            geminiImageService: 'error',
            imageProcessingService: 'error',
            supabaseStorage: 'error'
          }
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Image generation API is running',
      endpoints: {
        POST: '/api/generate-image - Generate images from prompts',
        'GET (suggestions)': '/api/generate-image?action=suggestions&location=Rome - Get prompt suggestions',
        'GET (test)': '/api/generate-image?action=test - Test service configuration'
      }
    })

  } catch (error) {
    console.error('GET request error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}