'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ImageIcon } from 'lucide-react'
import { ImageGenerator } from '@/components/admin/ImageGenerator'

export default function ImageGeneratorPage() {
  const [selectedBlogSlug, setSelectedBlogSlug] = useState('default')

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">AI Image Generator</h1>
          <p className="text-muted-foreground">Generate high-quality images for your travel blog posts using AI</p>
        </div>
      </div>

      {/* Image Generator Component */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Generate Images
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ImageGenerator 
            blogSlug={selectedBlogSlug}
            onImageGenerated={(images) => {
              console.log('Generated images:', images)
              // You can add logic here to integrate with post editing
            }}
          />
        </CardContent>
      </Card>

      {/* Tips */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-6">
          <h3 className="font-semibold text-blue-900 mb-2">AI Image Generation Tips</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Use descriptive prompts that include specific details about the destination</li>
            <li>• Include style preferences (e.g., "photorealistic", "landscape photography", "vibrant colors")</li>
            <li>• Specify the time of day or season for more accurate results</li>
            <li>• Consider the image's intended use (hero image, gallery, thumbnail)</li>
            <li>• Generated images are optimized for web use and travel content</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}