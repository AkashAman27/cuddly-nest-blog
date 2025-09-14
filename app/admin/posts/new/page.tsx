'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { AuthWrapper } from '@/components/admin/AuthWrapper'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { 
  ArrowLeft,
  Save,
  Eye,
  Calendar,
  Image,
  Tag,
  FolderOpen,
  Settings,
  Upload,
  X,
  Plus,
  Sparkles,
  FileText,
  Globe
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'
import { toast } from 'sonner'
import dynamic from 'next/dynamic'
import { CategoryManager } from '@/components/admin/CategoryManager'

// Dynamically import rich text editor to avoid SSR issues
const RichTextEditor = dynamic(() => import('@/components/rich-text-editor'), {
  ssr: false,
  loading: () => <div className="h-64 bg-muted animate-pulse rounded-md" />
})

interface Author {
  id: string
  display_name: string
  email: string
}

interface PostData {
  title: string
  slug: string
  excerpt: string
  content: string
  status: 'draft' | 'published'
  featured_image_url: string
  author_id: string
  seo_title: string
  seo_description: string
  categories: string[] // Category IDs
  tags: string[]
  publish_date: string
}

export default function NewPostPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [authors, setAuthors] = useState<Author[]>([])
  const [postData, setPostData] = useState<PostData>({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    status: 'draft',
    featured_image_url: '',
    author_id: '',
    seo_title: '',
    seo_description: '',
    categories: [],
    tags: [],
    publish_date: ''
  })
  
  const [newTag, setNewTag] = useState('')
  const [showPreview, setShowPreview] = useState(false)
  const [autoSave, setAutoSave] = useState(true)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  useEffect(() => {
    fetchAuthors()
    // Auto-generate slug when title changes
    if (postData.title && !postData.slug) {
      const slug = postData.title
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '')
      setPostData(prev => ({ ...prev, slug }))
    }
    
    // Auto-generate SEO title if not set
    if (postData.title && !postData.seo_title) {
      setPostData(prev => ({ ...prev, seo_title: postData.title }))
    }
  }, [postData.title])

  const fetchAuthors = async () => {
    try {
      const { data, error } = await supabase
        .from('modern_authors')
        .select('id, display_name, email')
        .eq('is_active', true)
        .order('display_name')

      if (error) throw error
      setAuthors(data || [])
      
      // Set first author as default if none selected
      if (data && data.length > 0 && !postData.author_id) {
        setPostData(prev => ({ ...prev, author_id: data[0].id }))
      }
    } catch (error) {
      console.error('Error fetching authors:', error)
      toast.error('Failed to load authors')
    }
  }

  const handleSave = async (status: 'draft' | 'published' = postData.status) => {
    if (!postData.title.trim()) {
      toast.error('Title is required')
      return
    }

    if (!postData.slug.trim()) {
      toast.error('Slug is required')
      return
    }

    try {
      setSaving(true)
      
      const now = new Date().toISOString()
      
      // Prepare post data (excluding categories and tags which are handled separately)
      const dataToSave = {
        title: postData.title.trim(),
        slug: postData.slug.trim(),
        excerpt: postData.excerpt.trim() || '',
        content: postData.content || '',
        status,
        og_image: postData.featured_image_url || null, // Use og_image instead of featured_image_url
        author_id: postData.author_id,
        meta_title: postData.seo_title || postData.title, // Use meta_title instead of seo_title
        meta_description: postData.seo_description.trim() || '',
        seo_title: postData.seo_title || postData.title,
        seo_description: postData.seo_description.trim() || '',
        created_at: now,
        updated_at: now,
        published_at: status === 'published' ? (postData.publish_date || now) : null,
        // Additional fields that exist in the schema
        is_featured: false,
        allow_comments: true,
        robots_index: true,
        robots_follow: true,
        robots_nosnippet: false,
        view_count: 0
      }

      // Insert the post first
      const { data, error } = await supabase
        .from('cuddly_nest_modern_post')
        .insert(dataToSave)
        .select()
        .single()

      if (error) {
        console.error('Post insert error:', error)
        throw error
      }

      // Now handle categories if any are selected
      if (postData.categories && postData.categories.length > 0) {
        const categoryRelations = postData.categories.map(categoryId => ({
          post_id: data.id,
          category_id: categoryId
        }))

        const { error: categoriesError } = await supabase
          .from('modern_post_categories')
          .insert(categoryRelations)

        if (categoriesError) {
          console.error('Categories insert error:', categoriesError)
          // Don't fail the entire operation for category errors, just warn
          toast.error('Post saved but categories could not be assigned')
        }
      }

      // Handle tags if any are provided
      if (postData.tags && postData.tags.length > 0) {
        try {
          // First, ensure tags exist in modern_tags table
          for (const tagName of postData.tags) {
            const { error: tagUpsertError } = await supabase
              .from('modern_tags')
              .upsert({ name: tagName.trim() }, { onConflict: 'name' })

            if (tagUpsertError) {
              console.error('Tag upsert error:', tagUpsertError)
            }
          }

          // Get tag IDs
          const { data: tagData, error: tagSelectError } = await supabase
            .from('modern_tags')
            .select('id, name')
            .in('name', postData.tags)

          if (tagSelectError) {
            console.error('Tag select error:', tagSelectError)
          } else if (tagData) {
            // Create post-tag relationships
            const tagRelations = tagData.map(tag => ({
              post_id: data.id,
              tag_id: tag.id
            }))

            const { error: tagsError } = await supabase
              .from('modern_post_tags')
              .insert(tagRelations)

            if (tagsError) {
              console.error('Tags insert error:', tagsError)
              toast.error('Post saved but tags could not be assigned')
            }
          }
        } catch (tagError) {
          console.error('Tag handling error:', tagError)
        }
      }

      setLastSaved(new Date())
      toast.success(`Post ${status === 'published' ? 'published' : 'saved as draft'} successfully`)
      
      // Redirect to edit page for the new post
      router.push(`/admin/posts/${data.id}/edit`)
    } catch (error) {
      console.error('Error saving post:', error)
      toast.error(`Failed to save post: ${error?.message || 'Unknown error'}`)
    } finally {
      setSaving(false)
    }
  }

  const handleCategoryChange = (categoryIds: string[]) => {
    setPostData(prev => ({
      ...prev,
      categories: categoryIds
    }))
  }

  const handleAddTag = () => {
    if (newTag.trim() && !postData.tags.includes(newTag.trim())) {
      setPostData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }))
      setNewTag('')
    }
  }

  const handleRemoveTag = (tag: string) => {
    setPostData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }))
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}.${fileExt}`
      const { data, error } = await supabase.storage
        .from('blog-images')
        .upload(`featured/${fileName}`, file)

      if (error) throw error

      // Get public URL
      const { data: publicUrl } = supabase.storage
        .from('blog-images')
        .getPublicUrl(`featured/${fileName}`)

      setPostData(prev => ({
        ...prev,
        featured_image_url: publicUrl.publicUrl
      }))
      
      toast.success('Featured image uploaded successfully')
    } catch (error) {
      console.error('Error uploading image:', error)
      toast.error('Failed to upload image')
    }
  }

  return (
    <AuthWrapper>
      <div className="container mx-auto p-6 max-w-6xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" asChild>
              <Link href="/admin/posts">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Posts
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Add New Post</h1>
              <p className="text-muted-foreground">Create a new blog post</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {lastSaved && (
              <span className="text-sm text-muted-foreground mr-4">
                Last saved: {format(lastSaved, 'HH:mm:ss')}
              </span>
            )}
            <Button 
              variant="outline" 
              onClick={() => handleSave('draft')}
              disabled={saving}
            >
              <Save className="h-4 w-4 mr-2" />
              Save Draft
            </Button>
            <Button 
              onClick={() => handleSave('published')}
              disabled={saving || !postData.title.trim()}
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Publish
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title and Slug */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Post Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={postData.title}
                    onChange={(e) => setPostData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter your post title"
                    className="text-lg font-medium"
                  />
                </div>
                
                <div>
                  <Label htmlFor="slug">URL Slug *</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">/blog/</span>
                    <Input
                      id="slug"
                      value={postData.slug}
                      onChange={(e) => setPostData(prev => ({ ...prev, slug: e.target.value }))}
                      placeholder="post-url-slug"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="excerpt">Excerpt</Label>
                  <Textarea
                    id="excerpt"
                    value={postData.excerpt}
                    onChange={(e) => setPostData(prev => ({ ...prev, excerpt: e.target.value }))}
                    placeholder="Brief description of your post"
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Used in post previews and meta descriptions (recommended: 150-160 characters)
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Content Editor */}
            <Card>
              <CardHeader>
                <CardTitle>Content</CardTitle>
              </CardHeader>
              <CardContent>
                <RichTextEditor
                  content={postData.content}
                  onChange={(content) => setPostData(prev => ({ ...prev, content }))}
                  placeholder="Start writing your post..."
                />
              </CardContent>
            </Card>

            {/* SEO Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  SEO Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="seo_title">SEO Title</Label>
                  <Input
                    id="seo_title"
                    value={postData.seo_title}
                    onChange={(e) => setPostData(prev => ({ ...prev, seo_title: e.target.value }))}
                    placeholder="SEO title for search engines"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {postData.seo_title.length}/60 characters
                  </p>
                </div>
                
                <div>
                  <Label htmlFor="seo_description">SEO Description</Label>
                  <Textarea
                    id="seo_description"
                    value={postData.seo_description}
                    onChange={(e) => setPostData(prev => ({ ...prev, seo_description: e.target.value }))}
                    placeholder="Meta description for search engines"
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {postData.seo_description.length}/160 characters
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Publish Options */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Publish
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={postData.status} onValueChange={(value) => setPostData(prev => ({ ...prev, status: value as 'draft' | 'published' }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="author">Author</Label>
                  <Select value={postData.author_id} onValueChange={(value) => setPostData(prev => ({ ...prev, author_id: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select author" />
                    </SelectTrigger>
                    <SelectContent>
                      {authors.map((author) => (
                        <SelectItem key={author.id} value={author.id}>
                          {author.display_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="publish_date">Publish Date</Label>
                  <Input
                    id="publish_date"
                    type="datetime-local"
                    value={postData.publish_date}
                    onChange={(e) => setPostData(prev => ({ ...prev, publish_date: e.target.value }))}
                  />
                </div>

                {/* Template system removed - no longer supported */}
              </CardContent>
            </Card>

            {/* Featured Image */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Image className="h-5 w-5" />
                  Featured Image
                </CardTitle>
              </CardHeader>
              <CardContent>
                {postData.featured_image_url ? (
                  <div className="space-y-2">
                    <img
                      src={postData.featured_image_url}
                      alt="Featured image"
                      className="w-full h-32 object-cover rounded-md"
                    />
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPostData(prev => ({ ...prev, featured_image_url: '' }))}
                      >
                        Remove
                      </Button>
                      <Label htmlFor="featured_image" className="flex-1">
                        <Button variant="outline" size="sm" className="w-full">
                          <Upload className="h-4 w-4 mr-2" />
                          Change
                        </Button>
                        <input
                          id="featured_image"
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </Label>
                    </div>
                  </div>
                ) : (
                  <Label htmlFor="featured_image">
                    <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center hover:bg-muted/25 cursor-pointer transition-colors">
                      <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">Click to upload featured image</p>
                    </div>
                    <input
                      id="featured_image"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </Label>
                )}
              </CardContent>
            </Card>

            {/* Categories */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FolderOpen className="h-5 w-5" />
                  Categories
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CategoryManager
                  selectedCategoryIds={postData.categories}
                  onCategoryChange={handleCategoryChange}
                  showTitle={false}
                />
              </CardContent>
            </Card>

            {/* Tags */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Tag className="h-5 w-5" />
                  Tags
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Add new tag"
                    onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                  />
                  <Button size="sm" onClick={handleAddTag}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {postData.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="flex items-center gap-1">
                      {tag}
                      <X 
                        className="h-3 w-3 cursor-pointer" 
                        onClick={() => handleRemoveTag(tag)}
                      />
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AuthWrapper>
  )
}