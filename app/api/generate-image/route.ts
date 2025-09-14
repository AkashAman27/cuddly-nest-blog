import { NextRequest, NextResponse } from 'next/server'
import GeminiImageService from '@/lib/services/geminiImageService'
import ImageProcessingService from '@/lib/services/imageProcessingService'

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
    
    console.log('Request body:', {
      ...body,
      prompt: body.prompt?.substring(0, 100) + '...'
    })

    // Initialize services
    const geminiService = new GeminiImageService()
    const processingService = new ImageProcessingService()

    // Validate request
    if (!body.prompt?.trim()) {
      return NextResponse.json({
        success: false,
        error: 'Prompt is required',
        errorType: 'VALIDATION_ERROR'
      }, { status: 400 })
    }

    // Check if Gemini service is configured
    if (!geminiService.isConfigured()) {
      return NextResponse.json({
        success: false,
        error: 'Google API key is not configured. Please add GOOGLE_API_KEY to your environment variables.',
        errorType: 'CONFIGURATION_ERROR',
        canRetry: false
      }, { status: 503 })
    }

    // Generate images using Gemini
    console.log('Generating images with Gemini service...')
    const result = await geminiService.generateImages({
      prompt: body.prompt,
      negativePrompt: body.negativePrompt,
      aspectRatio: body.aspectRatio || '16:9',
      count: Math.min(body.count || 1, 4), // Limit to 4 images max
      guidanceScale: body.guidanceScale,
      quality: body.quality
    })

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error,
        errorType: result.errorType,
        canRetry: result.canRetry,
        suggestions: result.suggestions
      }, { status: 400 })
    }

    console.log(`Successfully generated ${result.images?.length || 0} images`)

    return NextResponse.json({
      success: true,
      images: result.images,
      requestId: `req_${Date.now()}`,
      processingTime: Date.now()
    })

  } catch (error) {
    console.error('Image generation API error:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      errorType: 'SERVER_ERROR',
      canRetry: true
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const location = searchParams.get('location')

    const geminiService = new GeminiImageService()

    // Handle different GET actions
    switch (action) {
      case 'test':
        console.log('Testing Gemini service configuration...')
        const testResult = await geminiService.testConfiguration()
        
        return NextResponse.json({
          success: testResult.success,
          error: testResult.error,
          features: {
            geminiImageService: testResult.success ? 'configured' : 'error',
            imageProcessingService: 'configured'
          }
        })

      case 'suggestions':
        console.log('Loading image generation suggestions...')
        const suggestions = await geminiService.getSuggestions(location || undefined)
        
        return NextResponse.json({
          success: true,
          suggestions
        })

      case 'status':
        return NextResponse.json({
          success: true,
          status: geminiService.isConfigured() ? 'ready' : 'not_configured',
          services: {
            gemini: geminiService.isConfigured() ? 'ready' : 'missing_api_key',
            processing: 'ready'
          }
        })

      default:
        // Default status check
        return NextResponse.json({
          status: geminiService.isConfigured() ? 'ready' : 'configuration_required',
          message: geminiService.isConfigured() 
            ? 'Image generation service is ready' 
            : 'Google API key required for image generation',
          features: {
            geminiImageService: geminiService.isConfigured() ? 'configured' : 'missing_api_key',
            imageProcessingService: 'configured',
          }
        })
    }
  } catch (error) {
    console.error('Image generation service check error:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      status: 'error'
    }, { status: 500 })
  }
}