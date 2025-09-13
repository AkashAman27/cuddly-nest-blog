'use client'

import { useState, useRef } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Upload, Loader2, Image as ImageIcon, Link, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface ImageUploadDialogProps {
  open: boolean
  onClose: () => void
  onImageSelect: (url: string, alt?: string) => void
}

export function ImageUploadDialog({ open, onClose, onImageSelect }: ImageUploadDialogProps) {
  const [uploading, setUploading] = useState(false)
  const [uploadedUrl, setUploadedUrl] = useState('')
  const [externalUrl, setExternalUrl] = useState('')
  const [altText, setAltText] = useState('')
  const [previewUrl, setPreviewUrl] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const uploadImage = async (file: File) => {
    try {
      setUploading(true)

      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error('Please select an image file')
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        throw new Error('File size must be less than 10MB')
      }

      // Generate unique filename with timestamp and random string
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `content-images/${fileName}`

      // Upload file to Supabase storage
      const { data, error } = await supabase.storage
        .from('blog-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) {
        // If bucket doesn't exist, provide helpful message
        if (error.message.includes('not found') || error.message.includes('bucket')) {
          throw new Error('Storage bucket not configured. Please contact admin to set up file uploads.')
        }
        throw error
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('blog-images')
        .getPublicUrl(filePath)

      if (urlData?.publicUrl) {
        setUploadedUrl(urlData.publicUrl)
        setPreviewUrl(urlData.publicUrl)
        // Auto-generate alt text from filename (without extension and random parts)
        const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ')
        setAltText(cleanName)
      } else {
        throw new Error('Failed to get public URL for uploaded image')
      }

    } catch (error) {
      console.error('Error uploading image:', error)
      alert(error instanceof Error ? error.message : 'Error uploading image')
    } finally {
      setUploading(false)
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Show preview immediately
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string)
      }
      reader.readAsDataURL(file)
      
      // Upload file
      uploadImage(file)
    }
  }

  const handleExternalUrlChange = (url: string) => {
    setExternalUrl(url)
    setPreviewUrl(url)
    // Try to generate alt text from URL
    if (url) {
      const urlParts = url.split('/')
      const filename = urlParts[urlParts.length - 1]
      const cleanName = filename.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ')
      setAltText(cleanName)
    }
  }

  const handleInsertImage = () => {
    const finalUrl = uploadedUrl || externalUrl
    if (finalUrl) {
      onImageSelect(finalUrl, altText || 'Uploaded image')
      // Reset form
      setUploadedUrl('')
      setExternalUrl('')
      setAltText('')
      setPreviewUrl('')
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      onClose()
    }
  }

  const handleClose = () => {
    // Reset all states when dialog closes
    setUploadedUrl('')
    setExternalUrl('')
    setAltText('')
    setPreviewUrl('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    onClose()
  }

  const hasValidImage = uploadedUrl || (externalUrl && externalUrl.startsWith('http'))

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5" />
            Insert Image
          </DialogTitle>
          <DialogDescription>
            Upload an image file or provide an external image URL
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="upload" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Upload File
            </TabsTrigger>
            <TabsTrigger value="url" className="flex items-center gap-2">
              <Link className="w-4 h-4" />
              External URL
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label>Upload Image</Label>
                <div className="mt-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                    disabled={uploading}
                  />
                  
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="w-full h-32 border-dashed"
                  >
                    {uploading ? (
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="w-8 h-8 animate-spin" />
                        <span>Uploading...</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <Upload className="w-8 h-8" />
                        <span>Click to upload image</span>
                        <span className="text-sm text-muted-foreground">
                          JPG, PNG, GIF (max 10MB)
                        </span>
                      </div>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="url" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="image-url">Image URL</Label>
                <Input
                  id="image-url"
                  type="url"
                  placeholder="https://example.com/image.jpg"
                  value={externalUrl}
                  onChange={(e) => handleExternalUrlChange(e.target.value)}
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Preview Section */}
        {previewUrl && (
          <div className="space-y-4">
            <div>
              <Label>Preview</Label>
              <div className="mt-2 border rounded-lg p-4 bg-muted/50">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="max-w-full max-h-40 object-contain mx-auto"
                  onError={() => setPreviewUrl('')}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="alt-text">Alt Text (for accessibility)</Label>
              <Input
                id="alt-text"
                placeholder="Describe the image..."
                value={altText}
                onChange={(e) => setAltText(e.target.value)}
              />
              <p className="text-sm text-muted-foreground mt-1">
                Alt text helps screen readers and SEO. Describe what's in the image.
              </p>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleInsertImage} 
            disabled={!hasValidImage || uploading}
          >
            Insert Image
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}