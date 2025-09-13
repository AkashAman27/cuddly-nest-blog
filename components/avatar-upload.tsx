'use client'

import { useState, useRef } from 'react'
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Upload, X, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface AvatarUploadProps {
  currentAvatarUrl: string
  authorName: string
  onAvatarChange: (newAvatarUrl: string) => void
}

export function AvatarUpload({ currentAvatarUrl, authorName, onAvatarChange }: AvatarUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const uploadAvatar = async (file: File) => {
    try {
      setUploading(true)

      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error('Please select an image file')
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('File size must be less than 5MB')
      }

      // Generate unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `avatars/${fileName}`

      // Upload file to Supabase storage
      const { data, error } = await supabase.storage
        .from('blog-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) {
        // If bucket doesn't exist or other storage error, provide helpful message
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
        onAvatarChange(urlData.publicUrl)
        setPreviewUrl(null)
      } else {
        throw new Error('Failed to get public URL for uploaded image')
      }

    } catch (error) {
      console.error('Error uploading avatar:', error)
      alert(error instanceof Error ? error.message : 'Error uploading avatar')
      setPreviewUrl(null) // Clear preview on error
    } finally {
      setUploading(false)
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Show preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string)
      }
      reader.readAsDataURL(file)

      // Upload file
      uploadAvatar(file)
    }
  }

  const handleRemoveImage = async () => {
    try {
      // If current avatar is from Supabase storage, attempt to delete it
      if (currentAvatarUrl.includes('supabase') && currentAvatarUrl.includes('avatars/')) {
        const urlParts = currentAvatarUrl.split('/')
        const fileName = urlParts[urlParts.length - 1]
        const filePath = `avatars/${fileName}`
        
        // Attempt to delete old file (don't throw error if it fails)
        await supabase.storage
          .from('blog-images')
          .remove([filePath])
      }
    } catch (error) {
      console.log('Could not delete old avatar file:', error)
      // Continue anyway since we still want to remove the reference
    }

    setPreviewUrl(null)
    onAvatarChange('/placeholder.svg')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const displayUrl = previewUrl || currentAvatarUrl
  const isPlaceholder = currentAvatarUrl === '/placeholder.svg'

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Avatar className="w-20 h-20">
          <AvatarImage src={displayUrl} alt={authorName} />
          <AvatarFallback className="text-lg">
            {authorName.split(' ').map(n => n[0]).join('')}
          </AvatarFallback>
        </Avatar>

        <div className="flex flex-col gap-2">
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
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-fit"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Upload Avatar
              </>
            )}
          </Button>

          {!isPlaceholder && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRemoveImage}
              disabled={uploading}
              className="w-fit text-red-600 hover:text-red-700"
            >
              <X className="w-4 h-4 mr-2" />
              Remove Image
            </Button>
          )}
        </div>
      </div>

      <div className="text-sm text-gray-600">
        <p>• Upload JPG, PNG, or GIF image</p>
        <p>• Maximum file size: 5MB</p>
        <p>• Recommended size: 400x400px</p>
      </div>
    </div>
  )
}