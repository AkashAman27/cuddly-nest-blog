'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { AuthWrapper } from '@/components/admin/AuthWrapper'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  ArrowLeft,
  Save,
  Eye,
  Languages,
  AlertTriangle,
  CheckCircle,
  RefreshCw
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'
import { toast } from 'sonner'
import dynamic from 'next/dynamic'

// Dynamically import rich text editor to avoid SSR issues
const RichTextEditor = dynamic(() => import('@/components/rich-text-editor'), {
  ssr: false,
  loading: () => <div className="h-96 bg-gray-100 animate-pulse rounded"></div>
})

interface TranslationData {
  id: string
  original_post_id: string
  language_code: string
  translated_title: string
  translated_excerpt: string
  translated_content: string
  translated_slug: string
  translation_status: string
  seo_data: {
    seo_title?: string
    seo_description?: string
  }
  created_at: string
  updated_at: string
}

interface OriginalPostData {
  id: string
  title: string
  excerpt: string
  content: string
  slug: string
}

export default function EditTranslationPage() {
  const router = useRouter()
  const params = useParams()
  const translationId = params.id as string
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [translationData, setTranslationData] = useState<TranslationData | null>(null)
  const [originalPost, setOriginalPost] = useState<OriginalPostData | null>(null)
  const [availablePosts, setAvailablePosts] = useState<any[]>([])
  const [showMigrationHelper, setShowMigrationHelper] = useState(false)
  
  // Language mappings
  const languageMap: { [key: string]: { name: string, flag: string } } = {
    'fr': { name: 'French', flag: '🇫🇷' },
    'it': { name: 'Italian', flag: '🇮🇹' },
    'de': { name: 'German', flag: '🇩🇪' },
    'es': { name: 'Spanish', flag: '🇪🇸' }
  }

  const fetchTranslationData = async () => {
    try {
      setLoading(true)
      
      // Fetch translation data
      const { data: translation, error: translationError } = await supabase
        .from('post_translations')
        .select('*')
        .eq('id', translationId)
        .single()

      if (translationError) throw translationError

      setTranslationData(translation)

      // Fetch original post data - handle migration scenario
      let originalPostData = null
      if (translation.original_post_id) {
        const { data, error: originalError } = await supabase
          .from('cuddly_nest_modern_post')
          .select('id, title, excerpt, content, slug')
          .eq('id', translation.original_post_id)
          .single()

        if (originalError) {
          console.warn('Could not find original post:', originalError)
          // Set a placeholder for migration
          originalPostData = {
            id: translation.original_post_id,
            title: '[NEEDS MIGRATION] Original post not found',
            excerpt: 'This translation needs to be migrated to a new post.',
            content: '',
            slug: 'migration-needed'
          }
        } else {
          originalPostData = data
        }
      } else {
        // Handle migration scenario where original_post_id is NULL
        originalPostData = {
          id: translation.old_original_post_id || 'unknown',
          title: '[MIGRATION NEEDED] ' + (translation.translated_title || 'Unknown Post'),
          excerpt: 'This translation references an old post system and needs to be migrated.',
          content: '',
          slug: 'migration-needed'
        }
      }

      setOriginalPost(originalPostData)

      // Check if migration is needed and fetch available posts
      if (!translation.original_post_id) {
        setShowMigrationHelper(true)
        await fetchAvailablePosts()
      }

    } catch (error) {
      console.error('Error fetching translation data:', error)
      toast.error('Failed to load translation data')
      router.push('/admin/posts')
    } finally {
      setLoading(false)
    }
  }

  const fetchAvailablePosts = async () => {
    try {
      const { data: posts, error } = await supabase
        .from('cuddly_nest_modern_post')
        .select('id, title, slug, status')
        .eq('status', 'published')
        .order('title', { ascending: true })
        .limit(50)

      if (error) throw error
      setAvailablePosts(posts || [])
    } catch (error) {
      console.error('Error fetching available posts:', error)
    }
  }

  const handleMigrateToPost = async (postId: string) => {
    if (!translationData) return

    try {
      setSaving(true)
      
      const { error } = await supabase
        .from('post_translations')
        .update({ 
          original_post_id: postId,
          needs_migration: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', translationId)

      if (error) throw error

      toast.success('Translation successfully migrated to new post!')
      setShowMigrationHelper(false)
      await fetchTranslationData() // Refresh data
      
    } catch (error) {
      console.error('Error migrating translation:', error)
      toast.error('Failed to migrate translation')
    } finally {
      setSaving(false)
    }
  }

  const handleSave = async () => {
    if (!translationData) return

    try {
      setSaving(true)
      
      const updateData = {
        translated_title: translationData.translated_title,
        translated_excerpt: translationData.translated_excerpt,
        translated_content: translationData.translated_content,
        seo_data: translationData.seo_data,
        updated_at: new Date().toISOString()
      }

      const { error } = await supabase
        .from('post_translations')
        .update(updateData)
        .eq('id', translationId)

      if (error) throw error

      toast.success('Translation updated successfully!')
      
    } catch (error) {
      console.error('Error saving translation:', error)
      toast.error('Failed to save translation')
    } finally {
      setSaving(false)
    }
  }

  const handleRegenerateTranslation = async () => {
    if (!originalPost || !translationData) return

    try {
      setSaving(true)
      toast.info('Regenerating translation with AI...')

      const response = await fetch('/api/admin/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          postId: originalPost.id,
          languages: [translationData.language_code],
          regenerate: true // Flag to indicate regeneration
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to regenerate translation')
      }

      toast.success('Translation regenerated successfully!')
      await fetchTranslationData() // Refresh the data
      
    } catch (error) {
      console.error('Error regenerating translation:', error)
      toast.error('Failed to regenerate translation')
    } finally {
      setSaving(false)
    }
  }

  useEffect(() => {
    if (translationId) {
      fetchTranslationData()
    }
  }, [translationId])

  if (loading) {
    return (
      <AuthWrapper>
        <div className="container mx-auto p-6">
          <div className="flex items-center justify-center min-h-[400px]">
            <RefreshCw className="h-8 w-8 animate-spin" />
          </div>
        </div>
      </AuthWrapper>
    )
  }

  if (!translationData || !originalPost) {
    return (
      <AuthWrapper>
        <div className="container mx-auto p-6">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Translation not found or you don't have permission to edit it.
            </AlertDescription>
          </Alert>
        </div>
      </AuthWrapper>
    )
  }

  const language = languageMap[translationData.language_code] || { 
    name: translationData.language_code, 
    flag: '🏳️' 
  }

  return (
    <AuthWrapper>
      <div className="container mx-auto p-6 max-w-5xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link href={`/admin/posts/${originalPost.id}/edit`}>
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Post
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Languages className="h-6 w-6" />
                Edit Translation
                <span className="text-xl">{language.flag}</span>
              </h1>
              <p className="text-muted-foreground">
                {language.name} translation of "{originalPost.title}"
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleRegenerateTranslation}
              disabled={saving}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${saving ? 'animate-spin' : ''}`} />
              Regenerate AI Translation
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                const slug = translationData.translated_slug
                const slugParts = slug.split('/')
                let previewUrl = ''
                
                if (slugParts.length >= 2) {
                  // Has country: thailand/post-name -> /blog/thailand/fr/post-name
                  const country = slugParts[0]
                  const postSlug = slugParts.slice(1).join('/')
                  previewUrl = `/blog/${country}/${translationData.language_code}/${postSlug}`
                } else {
                  // No country: post-name -> /blog/post-name/fr
                  previewUrl = `/blog/${slug}/${translationData.language_code}`
                }
                
                window.open(previewUrl, '_blank')
              }}
            >
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {saving ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Migration Helper */}
        {showMigrationHelper && (
          <div className="mb-6">
            <Alert className="border-amber-200 bg-amber-50">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                <div className="flex flex-col gap-3">
                  <div>
                    <strong>Migration Required:</strong> This translation needs to be linked to a current post.
                    The original post reference was lost during the system migration.
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium">Select the correct post for this translation:</label>
                    <Select onValueChange={handleMigrateToPost} disabled={saving}>
                      <SelectTrigger className="w-full bg-white">
                        <SelectValue placeholder="Choose a post..." />
                      </SelectTrigger>
                      <SelectContent>
                        {availablePosts.map((post) => (
                          <SelectItem key={post.id} value={post.id}>
                            <div className="flex flex-col">
                              <span className="font-medium">{post.title}</span>
                              <span className="text-xs text-muted-foreground">/{post.slug}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {availablePosts.length === 0 && (
                    <div className="text-sm text-muted-foreground">
                      Loading available posts...
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Original Content */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Original Content (English)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Original Title</Label>
                  <div className="p-2 bg-gray-50 rounded border text-sm">
                    {originalPost.title}
                  </div>
                </div>
                <div>
                  <Label>Original Excerpt</Label>
                  <div className="p-2 bg-gray-50 rounded border text-sm max-h-24 overflow-y-auto">
                    {originalPost.excerpt}
                  </div>
                </div>
                <div>
                  <Label>Original Content</Label>
                  <div className="p-2 bg-gray-50 rounded border text-sm max-h-64 overflow-y-auto">
                    <div dangerouslySetInnerHTML={{ __html: originalPost.content || 'No content' }} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Translation Content */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  Translation Content <span>{language.flag}</span> {language.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="translated_title">Translated Title</Label>
                  <Input
                    id="translated_title"
                    value={translationData.translated_title}
                    onChange={(e) => setTranslationData(prev => prev ? ({
                      ...prev,
                      translated_title: e.target.value
                    }) : null)}
                    className="mt-1"
                    placeholder="Enter translated title..."
                  />
                </div>
                
                <div>
                  <Label htmlFor="translated_excerpt">Translated Excerpt</Label>
                  <Textarea
                    id="translated_excerpt"
                    value={translationData.translated_excerpt}
                    onChange={(e) => setTranslationData(prev => prev ? ({
                      ...prev,
                      translated_excerpt: e.target.value
                    }) : null)}
                    className="mt-1"
                    rows={3}
                    placeholder="Enter translated excerpt..."
                  />
                </div>

                <div>
                  <Label htmlFor="seo_title">SEO Title</Label>
                  <Input
                    id="seo_title"
                    value={translationData.seo_data?.seo_title || ''}
                    onChange={(e) => setTranslationData(prev => prev ? ({
                      ...prev,
                      seo_data: {
                        ...prev.seo_data,
                        seo_title: e.target.value
                      }
                    }) : null)}
                    className="mt-1"
                    placeholder="Enter SEO title..."
                  />
                </div>

                <div>
                  <Label htmlFor="seo_description">SEO Description</Label>
                  <Textarea
                    id="seo_description"
                    value={translationData.seo_data?.seo_description || ''}
                    onChange={(e) => setTranslationData(prev => prev ? ({
                      ...prev,
                      seo_data: {
                        ...prev.seo_data,
                        seo_description: e.target.value
                      }
                    }) : null)}
                    className="mt-1"
                    rows={2}
                    placeholder="Enter SEO description..."
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Rich Text Content Editor */}
        <div className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Translated Content</CardTitle>
              <p className="text-sm text-muted-foreground">
                Edit the translated content. The rich text editor supports HTML formatting.
              </p>
            </CardHeader>
            <CardContent>
              <RichTextEditor
                content={translationData.translated_content}
                onChange={(content) => setTranslationData(prev => prev ? ({
                  ...prev,
                  translated_content: content
                }) : null)}
                placeholder="Enter translated content..."
              />
            </CardContent>
          </Card>
        </div>

        {/* Translation Info */}
        <div className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Translation Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Translation Status:</strong>
                  <div className="flex items-center gap-2 mt-1">
                    {translationData.translation_status === 'completed' ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    )}
                    {translationData.translation_status}
                  </div>
                </div>
                <div>
                  <strong>Language:</strong>
                  <div className="mt-1">
                    {language.flag} {language.name} ({translationData.language_code})
                  </div>
                </div>
                <div>
                  <strong>Created:</strong>
                  <div className="mt-1">
                    {format(new Date(translationData.created_at), 'MMM dd, yyyy HH:mm')}
                  </div>
                </div>
                <div>
                  <strong>Last Updated:</strong>
                  <div className="mt-1">
                    {format(new Date(translationData.updated_at), 'MMM dd, yyyy HH:mm')}
                  </div>
                </div>
                <div className="col-span-2">
                  <strong>Translation URL:</strong>
                  <div className="mt-1">
                    <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                      /blog/{translationData.translated_slug.includes('/') 
                        ? translationData.translated_slug.replace(/\/([^\/]+)$/, `/${translationData.language_code}/$1`) 
                        : `${translationData.translated_slug}/${translationData.language_code}`}
                    </code>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AuthWrapper>
  )
}