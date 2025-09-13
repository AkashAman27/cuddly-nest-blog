'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { 
  ImageIcon, 
  Wand2, 
  Download, 
  Copy, 
  RefreshCw, 
  Lightbulb,
  Settings,
  Eye,
  CheckCircle,
  XCircle,
  Loader2,
  Sparkles,
  Image as ImageLucide,
  Zap
} from 'lucide-react'

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

interface ImageGeneratorProps {
  blogSlug?: string
  onImageGenerated?: (images: GeneratedImage[]) => void
  defaultPrompt?: string
  className?: string
}

export function ImageGenerator({ 
  blogSlug = 'default', 
  onImageGenerated, 
  defaultPrompt = '',
  className = ''
}: ImageGeneratorProps) {
  const [prompt, setPrompt] = useState(defaultPrompt)
  const [negativePrompt, setNegativePrompt] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([])
  const [error, setError] = useState<string | null>(null)
  const [errorType, setErrorType] = useState<string | null>(null)
  const [errorSuggestions, setErrorSuggestions] = useState<string[]>([])
  const [canRetry, setCanRetry] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [serviceStatus, setServiceStatus] = useState<'unknown' | 'ready' | 'error'>('unknown')
  const [statusMessage, setStatusMessage] = useState<string>('')
  const [showAdvanced, setShowAdvanced] = useState(false)
  
  // Advanced settings
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '9:16' | '16:9' | '4:3' | '3:4'>('16:9')
  const [imageType, setImageType] = useState<'hero' | 'content' | 'gallery' | 'thumbnail'>('content')
  const [imageCount, setImageCount] = useState(1)
  const [guidanceScale, setGuidanceScale] = useState(100)
  const [quality, setQuality] = useState(85)

  // Load suggestions and check service status on component mount
  useEffect(() => {
    loadSuggestions()
    checkServiceStatus()
  }, [])

  const checkServiceStatus = async () => {
    try {
      const response = await fetch('/api/generate-image?action=test')
      const data = await response.json()
      
      if (data.success) {
        setServiceStatus('ready')
        setStatusMessage('Image generation service is ready')
      } else {
        setServiceStatus('error')
        setStatusMessage(data.error || 'Service configuration error')
      }
    } catch (error) {
      setServiceStatus('error')
      setStatusMessage('Unable to connect to image generation service')
    }
  }

  const loadSuggestions = async () => {
    try {
      const response = await fetch('/api/generate-image?action=suggestions&location=Rome')
      const data = await response.json()
      
      if (data.success) {
        setSuggestions(data.suggestions || [])
      }
    } catch (error) {
      console.error('Error loading suggestions:', error)
    }
  }

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt for image generation')
      return
    }

    setIsGenerating(true)
    setError(null)
    setErrorType(null)
    setErrorSuggestions([])
    setCanRetry(false)
    setSuccess(null)

    try {
      console.log('Generating images with prompt:', prompt)
      
      // First test if the service is available and update service status
      try {
        const testResponse = await fetch('/api/generate-image?action=test')
        const testData = await testResponse.json()
        
        if (!testData.success) {
          setServiceStatus('error')
          setStatusMessage(testData.error || 'Service configuration error')
          throw new Error('Google API key is missing or invalid. Please add GOOGLE_API_KEY to your .env.local file.')
        } else {
          // Update service status to ready if test passes
          setServiceStatus('ready')
          setStatusMessage('Image generation service is ready')
        }
      } catch (testError) {
        setServiceStatus('error')
        setStatusMessage('Unable to connect to service')
        throw new Error('Unable to connect to image generation service. Please check your GOOGLE_API_KEY in .env.local file.')
      }
      
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt.trim(),
          blogSlug,
          imageType,
          aspectRatio,
          count: imageCount,
          negativePrompt: negativePrompt.trim() || undefined,
          guidanceScale,
          quality
        })
      })

      const data = await response.json()

      if (!response.ok) {
        // Handle API errors with proper error types and suggestions
        const errorData = data
        const errorMessage = errorData.error || 'Image generation failed'
        const errorType = errorData.errorType || 'GENERAL_ERROR'
        const canRetry = errorData.canRetry || false
        const suggestions = errorData.suggestions || []
        
        // Set error state for UI handling
        setError(errorMessage)
        setErrorType(errorType)
        setCanRetry(canRetry)
        setErrorSuggestions(suggestions)
        
        // Don't throw - just return to show the error in UI
        return
      }

      if (data.success && data.images) {
        setGeneratedImages(data.images)
        
        // Show appropriate success message
        if (data.usingDemoImages) {
          setSuccess(`✨ Generated ${data.images.length} professional demo image(s)! ${data.demoMessage || ''}`)
        } else {
          setSuccess(`✅ Successfully generated ${data.images.length} AI image(s)!`)
        }
        
        // Call callback if provided
        if (onImageGenerated) {
          onImageGenerated(data.images)
        }
      } else {
        setError('No images were generated')
        return
      }
    } catch (error) {
      // Only log for actual unexpected errors, not API errors which we handle gracefully
      if (!(error instanceof Error) || !error.message.includes('Storage initialization failed')) {
        console.error('Unexpected error:', error)
      }
      
      let errorMessage = 'Failed to generate images'
      
      if (error instanceof Error) {
        errorMessage = error.message
      }
      
      // Add helpful setup instructions for common issues
      if (errorMessage.includes('connect') || errorMessage.includes('network')) {
        errorMessage += '\n\nThis could be a network connectivity issue. Please check your internet connection and try again.'
      } else if (errorMessage.includes('credentials') || errorMessage.includes('API key') || errorMessage.includes('configuration')) {
        errorMessage += '\n\nTo fix this, add your Google API key to your .env.local file:\nGOOGLE_API_KEY=your-google-api-key-here'
      }
      
      setError(errorMessage)
    } finally {
      setIsGenerating(false)
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setSuccess('URL copied to clipboard!')
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  const downloadImage = (imageUrl: string, fileName: string) => {
    const link = document.createElement('a')
    link.href = imageUrl
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wand2 className="h-5 w-5 text-purple-600" />
            AI Image Generator
            <Badge variant="secondary">Gemini Imagen</Badge>
          </div>
          <div className="flex items-center gap-2">
            {serviceStatus === 'ready' && (
              <Badge variant="default" className="bg-green-100 text-green-800 border-green-300">
                <CheckCircle className="h-3 w-3 mr-1" />
                Ready
              </Badge>
            )}
            {serviceStatus === 'error' && (
              <Badge variant="destructive">
                <XCircle className="h-3 w-3 mr-1" />
                Not Configured
              </Badge>
            )}
            {serviceStatus === 'unknown' && (
              <Badge variant="secondary">
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                Checking...
              </Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Service Status Message */}
        {serviceStatus === 'error' && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Google API Key Required:</strong> {statusMessage}
              <br /><br />
              To use the image generator, add your Google API key to your .env.local file:
              <br />
              <code className="bg-red-100 p-1 rounded text-sm">GOOGLE_API_KEY=your-google-api-key-here</code>
            </AlertDescription>
          </Alert>
        )}
        
        {/* Error/Success Messages */}
        {error && (
          <Alert variant={errorType === 'SAFETY_FILTER' ? 'default' : 'destructive'} className={errorType === 'SAFETY_FILTER' ? 'border-orange-200 bg-orange-50' : ''}>
            <XCircle className={`h-4 w-4 ${errorType === 'SAFETY_FILTER' ? 'text-orange-600' : ''}`} />
            <AlertDescription>
              <div className="space-y-3">
                <div className={errorType === 'SAFETY_FILTER' ? 'text-orange-800' : ''}>{error}</div>
                
                {errorType === 'SAFETY_FILTER' && errorSuggestions.length > 0 && (
                  <div className="space-y-2">
                    <div className="font-medium text-orange-800">Try these suggestions:</div>
                    <ul className="text-sm text-orange-700 space-y-1">
                      {errorSuggestions.map((suggestion, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-orange-500 mt-1">•</span>
                          <span>{suggestion}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {canRetry && (
                  <div className="flex gap-2 mt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setError(null)
                        setErrorType(null)
                        setErrorSuggestions([])
                        setCanRetry(false)
                      }}
                      className={errorType === 'SAFETY_FILTER' ? 'border-orange-300 text-orange-700 hover:bg-orange-100' : ''}
                    >
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Modify Prompt & Try Again
                    </Button>
                  </div>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {/* Main Prompt Input */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Image Description</Label>
          <Textarea
            placeholder="Describe the image you want to generate... (e.g., 'Beautiful panoramic view of Rome during golden hour with ancient architecture')"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="min-h-[100px] resize-none"
            disabled={isGenerating}
          />
          <div className="text-xs text-gray-500">
            Be specific and descriptive for best results. Include details about lighting, style, composition, and mood.
          </div>
        </div>

        {/* Quick Suggestions */}
        {suggestions.length > 0 && (
          <div className="space-y-3">
            <Label className="flex items-center gap-2 text-sm font-medium">
              <Lightbulb className="h-4 w-4 text-yellow-500" />
              Quick Suggestions
            </Label>
            <div className="flex flex-wrap gap-2">
              {suggestions.slice(0, 6).map((suggestion, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => setPrompt(suggestion)}
                  disabled={isGenerating}
                  className="text-xs h-8"
                >
                  {suggestion.length > 50 ? suggestion.slice(0, 50) + '...' : suggestion}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Basic Settings */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label className="text-sm font-medium">Image Type</Label>
            <Select value={imageType} onValueChange={(value: any) => setImageType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hero">Hero (1920x1080)</SelectItem>
                <SelectItem value="content">Content (1200x675)</SelectItem>
                <SelectItem value="gallery">Gallery (800x600)</SelectItem>
                <SelectItem value="thumbnail">Thumbnail (400x225)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-sm font-medium">Aspect Ratio</Label>
            <Select value={aspectRatio} onValueChange={(value: any) => setAspectRatio(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="16:9">Landscape (16:9)</SelectItem>
                <SelectItem value="4:3">Standard (4:3)</SelectItem>
                <SelectItem value="1:1">Square (1:1)</SelectItem>
                <SelectItem value="3:4">Portrait (3:4)</SelectItem>
                <SelectItem value="9:16">Vertical (9:16)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-sm font-medium">Count</Label>
            <Select value={imageCount.toString()} onValueChange={(value) => setImageCount(parseInt(value))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 Image</SelectItem>
                <SelectItem value="2">2 Images</SelectItem>
                <SelectItem value="3">3 Images</SelectItem>
                <SelectItem value="4">4 Images</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Advanced Settings Dialog */}
        <Dialog open={showAdvanced} onOpenChange={setShowAdvanced}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Advanced Settings
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Advanced Generation Settings</DialogTitle>
              <DialogDescription>
                Fine-tune the image generation parameters
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Negative Prompt</Label>
                <Textarea
                  placeholder="What to avoid in the image... (e.g., 'blurry, low quality, text, watermarks')"
                  value={negativePrompt}
                  onChange={(e) => setNegativePrompt(e.target.value)}
                  className="h-20"
                />
              </div>

              <div>
                <Label className="text-sm font-medium">Guidance Scale: {guidanceScale}</Label>
                <input
                  type="range"
                  min="10"
                  max="200"
                  step="10"
                  value={guidanceScale}
                  onChange={(e) => setGuidanceScale(parseInt(e.target.value))}
                  className="w-full"
                />
                <div className="text-xs text-gray-500">Higher values follow the prompt more closely</div>
              </div>

              <div>
                <Label className="text-sm font-medium">Image Quality: {quality}%</Label>
                <input
                  type="range"
                  min="60"
                  max="95"
                  step="5"
                  value={quality}
                  onChange={(e) => setQuality(parseInt(e.target.value))}
                  className="w-full"
                />
                <div className="text-xs text-gray-500">Higher quality = larger file size</div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Generate Button */}
        <Button
          onClick={handleGenerate}
          disabled={isGenerating || !prompt.trim() || serviceStatus === 'error'}
          className={`w-full text-white ${
            serviceStatus === 'error' 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-purple-600 hover:bg-purple-700'
          }`}
          size="lg"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Generating {imageCount > 1 ? `${imageCount} images` : 'image'}...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Generate {imageCount > 1 ? `${imageCount} Images` : 'Image'}
            </>
          )}
        </Button>

        {/* Generated Images */}
        {generatedImages.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">Generated Images</h3>
              <Badge variant="outline">{generatedImages.length} image{generatedImages.length > 1 ? 's' : ''}</Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {generatedImages.map((image, index) => (
                <Card key={index} className="overflow-hidden">
                  <div className="aspect-video relative">
                    <img
                      src={image.publicUrl}
                      alt={`Generated image ${image.index}`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 right-2">
                      <Badge variant="secondary" className="text-xs">
                        #{image.index}
                      </Badge>
                    </div>
                  </div>
                  
                  <CardContent className="p-4 space-y-3">
                    <div className="text-xs text-gray-600 grid grid-cols-2 gap-2">
                      <div>Size: {formatFileSize(image.fileSize)}</div>
                      <div>Dimensions: {image.dimensions.width}×{image.dimensions.height}</div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(image.publicUrl)}
                        className="flex-1"
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        Copy URL
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadImage(image.publicUrl, image.fileName)}
                        className="flex-1"
                      >
                        <Download className="h-3 w-3 mr-1" />
                        Download
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(image.publicUrl, '_blank')}
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Configuration Help - Only show when service is not ready */}
        {serviceStatus === 'error' && (
          <Card className="border-orange-200 bg-orange-50">
            <CardHeader>
              <CardTitle className="text-orange-900 flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Setup Required
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-orange-800">
                To use the AI Image Generator, you need to add your Google API key:
              </p>
              
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <div className="bg-orange-200 text-orange-900 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mt-0.5">1</div>
                  <div>
                    <strong>Get a Google API Key</strong>
                    <p className="text-orange-700">Visit <a href="https://console.cloud.google.com/apis/credentials" target="_blank" className="underline">Google Cloud Console</a> and create an API key with Gemini API access</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-2">
                  <div className="bg-orange-200 text-orange-900 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mt-0.5">2</div>
                  <div>
                    <strong>Add to Environment Variables</strong>
                    <p className="text-orange-700">Add to your .env.local file:</p>
                    <code className="block bg-orange-100 p-2 mt-1 rounded text-xs">
                      GOOGLE_API_KEY=your-google-api-key-here
                    </code>
                  </div>
                </div>
                
                <div className="flex items-start gap-2">
                  <div className="bg-orange-200 text-orange-900 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mt-0.5">3</div>
                  <div>
                    <strong>Restart Your Development Server</strong>
                    <p className="text-orange-700">Stop and restart your Next.js development server to load the new environment variable</p>
                  </div>
                </div>
              </div>
              
              <Button 
                onClick={checkServiceStatus}
                variant="outline" 
                size="sm"
                className="w-full"
              >
                <RefreshCw className="h-4 w-4" />
                Retry Configuration Check
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Usage Tips - Only show when service is ready */}
        {serviceStatus === 'ready' && (
          <Alert>
            <Zap className="h-4 w-4" />
            <AlertDescription>
              <strong>Pro Tips:</strong>
              <ul className="mt-2 space-y-1 text-sm">
                <li>• Use descriptive prompts with specific details about lighting, style, and composition</li>
                <li>• Include location names and architectural styles for travel images</li>
                <li>• Mention camera settings like "shot with professional camera" for realistic photos</li>
                <li>• Use negative prompts to avoid unwanted elements like text or watermarks</li>
              </ul>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}

export default ImageGenerator