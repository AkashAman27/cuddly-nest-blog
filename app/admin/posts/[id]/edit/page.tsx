'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
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
import { Alert, AlertDescription } from '@/components/ui/alert'
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
  Globe,
  Clock,
  AlertTriangle,
  CheckCircle,
  Trash2,
  Copy,
  HelpCircle,
  Link as LinkIcon,
  ExternalLink,
  Edit,
  Languages,
  Flag
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'
import { toast } from 'sonner'
import dynamic from 'next/dynamic'

// Dynamically import rich text editor to avoid SSR issues
const RichTextEditor = dynamic(() => import('@/components/rich-text-editor'), {
  ssr: false,
  loading: () => <div className="h-64 bg-muted animate-pulse rounded-md" />
})

const LINK_CATEGORIES = [
  'Destinations',
  'Travel Guides', 
  'Experiences',
  'Hotels',
  'Activities',
  'Food & Dining',
  'Transportation',
  'Tips & Advice',
  'Other'
]

interface Author {
  id: string
  name: string
  title?: string
}


interface FAQ {
  id: string
  question: string
  answer: string
}

interface InternalLink {
  id: string
  title: string
  description: string
  url: string
  category: string
  is_published: boolean
  display_order: number
}

interface PostData {
  id: string
  title: string
  slug: string
  excerpt: string
  content: string
  status: 'draft' | 'published'
  featured_image_url: string | null
  author_id: string
  seo_title: string | null
  seo_description: string | null
  categories: string[]
  tags: string[]
  faqs: FAQ[]
  internal_links: InternalLink[]
  created_at: string
  updated_at: string
  published_at: string | null
  template_enabled: boolean
  template_type: string | null
  sections?: any[] // Keep minimal sections for CTA functionality
}

export default function EditPostPage() {
  const router = useRouter()
  
  // Translations state
  const [translations, setTranslations] = useState<any[]>([])
  const [loadingTranslations, setLoadingTranslations] = useState(false)
  const params = useParams()
  const postId = params.id as string
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [authors, setAuthors] = useState<Author[]>([])
  const [postData, setPostData] = useState<PostData | null>(null)
  const [originalData, setOriginalData] = useState<PostData | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [autoSaving, setAutoSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  
  const [newCategory, setNewCategory] = useState('')
  const [newTag, setNewTag] = useState('')
  const DEFAULT_RICH_TEXT_TEMPLATE = 'e30d9e40-eb3a-41d3-aeac-413cfca52fe0'
  const CTA_TEMPLATE = 'cta-template-id'
  // Section content states removed - no longer using modern_post_sections
  
  // Rich text editor state
  const [contentEditorMode, setContentEditorMode] = useState<'visual' | 'html'>('visual')
  
  // CTA state
  const [ctaData, setCtaData] = useState({
    title: '',
    buttonText: '',
    description: '',
    link: '',
    position: 'mid-content'
  })
  const [currentCtas, setCurrentCtas] = useState<any[]>([])

  // Internal Links state
  const [newInternalLink, setNewInternalLink] = useState({
    title: '',
    description: '',
    url: '',
    category: 'Travel Guides',
    is_published: true,
    display_order: 1
  })
  const [editingLinkId, setEditingLinkId] = useState<string | null>(null)
  const [editLinkForm, setEditLinkForm] = useState({
    title: '',
    description: '',
    url: '',
    category: '',
    is_published: true,
    display_order: 1
  })

  // Section content functions removed - no longer using modern_post_sections

  // Section content update function removed - no longer using modern_post_sections

  // Debounced save function removed - no longer using modern_post_sections

  // Cleanup timeout code removed - no longer using sections

  const fetchCtas = useCallback(async () => {
    if (!postId) return
    
    try {
      const response = await fetch(`/api/admin/ctas?post_id=${postId}`)
      if (response.ok) {
        const ctas = await response.json()
        setCurrentCtas(ctas)
      }
    } catch (error) {
      console.error('Error fetching CTAs:', error)
    }
  }, [postId])

  const fetchPost = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/posts/${postId}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          toast.error('Post not found')
          router.push('/admin/posts')
          return
        }
        throw new Error('Failed to fetch post')
      }
      
      const post = await response.json()

      const postWithDefaults = {
        ...post,
        // Ensure nullable fields are safe for .length and rendering
        content: post.content || '',
        excerpt: post.excerpt || '',
        seo_title: post.seo_title || '',
        seo_description: post.seo_description || '',
        categories: post.categories || [],
        tags: post.tags || [],
        faqs: post.faq_items || [],
        internal_links: post.internal_links || [],
        sections: post.sections?.sort((a, b) => a.position - b.position) || []
      }

      // If content is empty but sections exist, compose a readable HTML from sections
      if ((!postWithDefaults.content || postWithDefaults.content.trim().length === 0) && postWithDefaults.sections.length > 0) {
        const parts = postWithDefaults.sections.map((s) => {
          const title = s.title ? `<h2>${s.title}</h2>` : ''
          const body = s.content || ''
          return `${title}\n${body}`
        })
        postWithDefaults.content = parts.join('\n\n')
      }

      setPostData(postWithDefaults)
      setOriginalData(postWithDefaults)
      setLastSaved(new Date(post.updated_at))
      
      // No longer fetching section content
    } catch (error) {
      console.error('Error fetching post:', error)
      toast.error('Failed to load post')
      router.push('/admin/posts')
    } finally {
      setLoading(false)
    }
  }, [postId, router])

  const fetchAuthors = async () => {
    try {
      const { data, error } = await supabase
        .from('modern_authors')
        .select('id, display_name, email')
        .order('display_name')

      if (error) throw error
      
      // Transform to match the interface
      const transformedAuthors = (data || []).map(author => ({
        id: author.id,
        name: author.display_name,
        title: author.email
      }))
      
      setAuthors(transformedAuthors)
      return transformedAuthors
    } catch (error) {
      console.error('Error fetching authors:', error)
      // Set empty authors array as fallback
      setAuthors([])
      return []
    }
  }

  const fetchTranslations = async () => {
    if (!postId) return

    setLoadingTranslations(true)
    try {
      const { data, error } = await supabase
        .from('post_translations')
        .select('*')
        .eq('original_post_id', postId)
        .order('created_at', { ascending: false })

      if (error) throw error
      
      setTranslations(data || [])
    } catch (error) {
      console.error('Error fetching translations:', error)
      setTranslations([])
    } finally {
      setLoadingTranslations(false)
    }
  }

  useEffect(() => {
    if (postId) {
      fetchPost()
      fetchAuthors()
      fetchTranslations()
      fetchCtas()
    }
  }, [postId, fetchPost, fetchCtas])

  // Validate author ID after both post and authors are loaded
  useEffect(() => {
    if (postData && authors.length > 0) {
      const validAuthorIds = authors.map(a => a.id)
      const currentAuthorId = postData.author_id

      if (currentAuthorId && !validAuthorIds.includes(currentAuthorId)) {
        console.log(`Post has invalid author_id: ${currentAuthorId}. Setting to default author: ${authors[0].id}`)
        const fixedPostData = { 
          ...postData, 
          author_id: authors[0].id // Use first author as default
        }
        setPostData(fixedPostData)
        setOriginalData(fixedPostData)
      }
    }
  }, [postData, authors])

  // Check for unsaved changes
  useEffect(() => {
    if (originalData && postData) {
      const hasChanges = JSON.stringify(originalData) !== JSON.stringify(postData)
      setHasUnsavedChanges(hasChanges)
    }
  }, [originalData, postData])

  // Auto-save functionality
  useEffect(() => {
    if (hasUnsavedChanges && postData) {
      const timeoutId = setTimeout(async () => {
        await handleAutoSave()
      }, 30000) // Auto-save after 30 seconds

      return () => clearTimeout(timeoutId)
    }
  }, [hasUnsavedChanges, postData])

  // Auto-generate slug when title changes
  useEffect(() => {
    if (postData && originalData && postData.title !== originalData.title) {
      const slug = postData.title
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '')
      
      if (slug !== postData.slug) {
        setPostData(prev => prev ? ({ ...prev, slug }) : null)
      }
    }
  }, [postData?.title, originalData?.title, postData?.slug])

  const handleAutoSave = async () => {
    if (!postData || !hasUnsavedChanges) return

    try {
      setAutoSaving(true)
      await updatePost(postData.status, false)
      setLastSaved(new Date())
    } catch (error) {
      console.error('Auto-save failed:', error)
    } finally {
      setAutoSaving(false)
    }
  }

  const updatePost = async (status: 'draft' | 'published', showToast = true) => {
    if (!postData) return

    const payload = {
      title: postData.title.trim(),
      slug: postData.slug.trim(),
      excerpt: (postData.excerpt || '').trim(),
      content: postData.content || '',
      status,
      featured_image_url: postData.featured_image_url || null,
      author_id: postData.author_id,
      seo_title: (postData.seo_title || postData.title).trim(),
      seo_description: (postData.seo_description || '').trim(),
    }
    
    console.log('Updating post with ID:', postId)
    console.log('Sending update payload:', payload)

    const resp = await fetch(`/api/admin/posts/${postId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    
    let result = null
    let responseText = ''
    
    try {
      responseText = await resp.text()
      console.log('Raw response text:', responseText)
      if (responseText) {
        result = JSON.parse(responseText)
      }
    } catch (parseError) {
      console.error('Failed to parse response:', parseError)
      console.error('Response status:', resp.status)
      console.error('Raw response text:', responseText)
    }
    
    if (!resp.ok) {
      console.error('API Error Response:', {
        status: resp.status,
        statusText: resp.statusText,
        result,
        payload,
        responseText
      })
      
      let errorMessage = `Failed to save post (${resp.status}: ${resp.statusText})`
      if (result?.error) {
        errorMessage = result.error
      } else if (responseText && responseText !== '{}') {
        errorMessage = `Server returned: ${responseText}`
      }
      
      throw new Error(errorMessage)
    }

    // Update original data to reflect saved state
    const updatedPost = { ...postData, ...payload, updated_at: new Date().toISOString() }
    setOriginalData(updatedPost)
    setPostData(updatedPost)

    if (showToast) {
      toast.success(`Post ${status === 'published' ? 'published' : 'saved'} successfully`)
    }
  }

  const handleSave = async (status: 'draft' | 'published' = postData?.status || 'draft') => {
    if (!postData?.title.trim()) {
      toast.error('Title is required')
      return
    }

    if (!postData?.slug.trim()) {
      toast.error('Slug is required')
      return
    }

    try {
      setSaving(true)
      await updatePost(status)
      setHasUnsavedChanges(false)
    } catch (error) {
      console.error('Error saving post:', error)
      toast.error('Failed to save post')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      return
    }

    try {
      const resp = await fetch(`/api/admin/posts/${postId}`, { method: 'DELETE' })
      if (!resp.ok) throw new Error('Failed to delete post')
      toast.success('Post deleted successfully')
      router.push('/admin/posts')
    } catch (error) {
      console.error('Error deleting post:', error)
      toast.error('Failed to delete post')
    }
  }

  const handleDuplicate = async () => {
    if (!postData) return

    try {
      const duplicateData = {
        title: `${postData.title} (Copy)`,
        slug: `${postData.slug}-copy-${Date.now()}`,
        excerpt: postData.excerpt || '',
        content: postData.content,
        status: 'draft' as const,
        featured_image_url: postData.featured_image_url,
        author_id: postData.author_id,
        seo_title: postData.seo_title ? `${postData.seo_title} (Copy)` : '',
        seo_description: postData.seo_description || '',
        categories: postData.categories,
        tags: postData.tags,
        faq_items: postData.faqs,
        template_enabled: postData.template_enabled,
        template_type: postData.template_type,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('cuddly_nest_modern_post')
        .insert(duplicateData)
        .select()
        .single()

      if (error) throw error

      toast.success('Post duplicated successfully')
      router.push(`/admin/posts/${data.id}/edit`)
    } catch (error) {
      console.error('Error duplicating post:', error)
      toast.error('Failed to duplicate post')
    }
  }

  const handleAddCategory = () => {
    if (newCategory.trim() && postData && !postData.categories.includes(newCategory.trim())) {
      setPostData(prev => prev ? ({
        ...prev,
        categories: [...prev.categories, newCategory.trim()]
      }) : null)
      setNewCategory('')
    }
  }

  const handleRemoveCategory = (category: string) => {
    setPostData(prev => prev ? ({
      ...prev,
      categories: prev.categories.filter(c => c !== category)
    }) : null)
  }

  const handleAddTag = () => {
    if (newTag.trim() && postData && !postData.tags.includes(newTag.trim())) {
      setPostData(prev => prev ? ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }) : null)
      setNewTag('')
    }
  }

  const handleRemoveTag = (tag: string) => {
    setPostData(prev => prev ? ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }) : null)
  }


  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}.${fileExt}`
      const { data, error } = await supabase.storage
        .from('blog-images')
        .upload(`featured/${fileName}`, file)

      if (error) throw error

      const { data: publicUrl } = supabase.storage
        .from('blog-images')
        .getPublicUrl(`featured/${fileName}`)

      setPostData(prev => prev ? ({
        ...prev,
        featured_image_url: publicUrl.publicUrl
      }) : null)
      
      toast.success('Featured image uploaded successfully')
    } catch (error) {
      console.error('Error uploading image:', error)
      toast.error('Failed to upload image')
    }
  }

  const handleAddCTA = async () => {
    if (!postData || !ctaData.title || !ctaData.buttonText || !ctaData.link) {
      toast.error('Please fill in CTA title, button text, and link')
      return
    }

    try {
      const positionMap = {
        'after-intro': 1,
        'mid-content': 2,
        'before-conclusion': 3,
        'end-content': 4
      }

      const resp = await fetch('/api/admin/ctas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          post_id: postData.id,
          title: ctaData.title,
          description: ctaData.description || null,
          button_text: ctaData.buttonText,
          button_link: ctaData.link,
          position: positionMap[ctaData.position as keyof typeof positionMap] || 2
        })
      })

      if (!resp.ok) throw new Error('Failed to create CTA')

      // Refresh CTAs
      await fetchCtas()
      
      // Reset CTA form
      setCtaData({
        title: '',
        buttonText: '',
        description: '',
        link: '',
        position: 'mid-content'
      })

      toast.success('CTA added successfully')
    } catch (error) {
      console.error('Error adding CTA:', error)
      toast.error('Failed to create CTA')
    }
  }

  // Internal Links Management Functions
  const handleAddInternalLink = () => {
    if (!newInternalLink.title.trim() || !newInternalLink.description.trim() || !newInternalLink.url.trim() || !postData) {
      toast.error('Please fill in all required fields')
      return
    }

    const newLink: InternalLink = {
      id: `link-${Date.now()}`,
      title: newInternalLink.title.trim(),
      description: newInternalLink.description.trim(),
      url: newInternalLink.url.trim(),
      category: newInternalLink.category,
      is_published: newInternalLink.is_published,
      display_order: newInternalLink.display_order
    }

    setPostData(prev => prev ? ({
      ...prev,
      internal_links: [...prev.internal_links, newLink].sort((a, b) => b.display_order - a.display_order)
    }) : null)

    // Reset form
    setNewInternalLink({
      title: '',
      description: '',
      url: '',
      category: 'Travel Guides',
      is_published: true,
      display_order: 1
    })

    toast.success('Internal link added successfully')
  }

  const handleEditInternalLink = (link: InternalLink) => {
    setEditingLinkId(link.id)
    setEditLinkForm({
      title: link.title,
      description: link.description,
      url: link.url,
      category: link.category,
      is_published: link.is_published,
      display_order: link.display_order
    })
  }

  const handleUpdateInternalLink = () => {
    if (!editingLinkId || !postData) return

    const updatedLinks = postData.internal_links.map(link => 
      link.id === editingLinkId 
        ? {
            ...link,
            title: editLinkForm.title.trim(),
            description: editLinkForm.description.trim(),
            url: editLinkForm.url.trim(),
            category: editLinkForm.category,
            is_published: editLinkForm.is_published,
            display_order: editLinkForm.display_order
          }
        : link
    )

    setPostData(prev => prev ? ({
      ...prev,
      internal_links: updatedLinks.sort((a, b) => b.display_order - a.display_order)
    }) : null)

    setEditingLinkId(null)
    toast.success('Internal link updated successfully')
  }

  const handleDeleteInternalLink = (linkId: string) => {
    if (!window.confirm('Are you sure you want to delete this internal link?')) {
      return
    }

    setPostData(prev => prev ? ({
      ...prev,
      internal_links: prev.internal_links.filter(link => link.id !== linkId)
    }) : null)

    toast.success('Internal link deleted successfully')
  }

  if (loading) {
    return (
      <AuthWrapper>
        <div className="container mx-auto p-6 max-w-6xl">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div className="h-64 bg-gray-200 rounded"></div>
                <div className="h-96 bg-gray-200 rounded"></div>
              </div>
              <div className="space-y-6">
                <div className="h-32 bg-gray-200 rounded"></div>
                <div className="h-48 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </AuthWrapper>
    )
  }

  if (!postData) {
    return (
      <AuthWrapper>
        <div className="container mx-auto p-6 max-w-6xl">
          <div className="text-center py-12">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">Post not found</h2>
            <Button asChild>
              <Link href="/admin/posts">Back to Posts</Link>
            </Button>
          </div>
        </div>
      </AuthWrapper>
    )
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
              <h1 className="text-3xl font-bold">Edit Post</h1>
              <p className="text-muted-foreground">
                Last updated: {format(new Date(postData.updated_at), 'MMM d, yyyy at HH:mm')}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {autoSaving && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4 animate-spin" />
                Auto-saving...
              </div>
            )}
            
            {lastSaved && !autoSaving && (
              <span className="text-sm text-muted-foreground mr-4">
                Saved: {format(lastSaved, 'HH:mm:ss')}
              </span>
            )}
            
            <Button variant="ghost" onClick={handleDuplicate}>
              <Copy className="h-4 w-4 mr-2" />
              Duplicate
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => handleSave('draft')}
              disabled={saving || autoSaving}
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save'}
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => {
                const previewUrl = postData.status === 'draft' 
                  ? `/blog/${postData.slug}?preview=true&draft=true` 
                  : `/blog/${postData.slug}?preview=true`
                window.open(previewUrl, '_blank')
              }}
            >
              <Eye className="h-4 w-4 mr-2" />
              Preview {postData.status === 'draft' ? '(Draft)' : ''}
            </Button>
            
            {postData.status === 'draft' ? (
              <Button 
                onClick={() => handleSave('published')}
                disabled={saving || autoSaving || !postData.title.trim()}
              >
                <Sparkles className="h-4 w-4 mr-2" />
                {saving && postData.status === 'draft' ? 'Publishing...' : 'Publish'}
              </Button>
            ) : (
              <Button 
                onClick={() => handleSave('draft')}
                disabled={saving || autoSaving}
                variant="outline"
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Unpublishing...' : 'Unpublish'}
              </Button>
            )}
          </div>
        </div>

        {/* Unsaved changes warning */}
        {hasUnsavedChanges && (
          <Alert className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              You have unsaved changes. Your changes will be auto-saved in a few seconds, or you can save manually.
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="content" className="space-y-6">
          <TabsList>
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="seo">SEO & Meta</TabsTrigger>
            <TabsTrigger value="cta">Call to Action</TabsTrigger>
            <TabsTrigger value="internal-links">Internal Links</TabsTrigger>
            <TabsTrigger value="faqs">FAQs</TabsTrigger>
            <TabsTrigger value="translations">Translations</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="content">
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
                        onChange={(e) => setPostData(prev => prev ? ({ ...prev, title: e.target.value }) : null)}
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
                          onChange={(e) => setPostData(prev => prev ? ({ ...prev, slug: e.target.value }) : null)}
                          placeholder="post-url-slug"
                        />
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => {
                            const previewUrl = postData.status === 'draft' 
                              ? `/blog/${postData.slug}?preview=true&draft=true` 
                              : `/blog/${postData.slug}?preview=true`
                            window.open(previewUrl, '_blank')
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="excerpt">Excerpt</Label>
                      <Textarea
                        id="excerpt"
                        value={postData.excerpt || ''}
                        onChange={(e) => setPostData(prev => prev ? ({ ...prev, excerpt: e.target.value }) : null)}
                        placeholder="Brief description of your post"
                        rows={3}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Used in post previews and meta descriptions ({(postData.excerpt || '').length}/160 characters)
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Content Editor */}
                <Card>
                  <CardHeader>
                    <CardTitle>Content</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Content is now managed directly in the post content field. No longer using sections.
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Editor Mode Toggle */}
                      <div className="flex gap-2 mb-4">
                        <Button
                          type="button"
                          variant={contentEditorMode === 'visual' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setContentEditorMode('visual')}
                        >
                          Visual Editor
                        </Button>
                        <Button
                          type="button"
                          variant={contentEditorMode === 'html' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setContentEditorMode('html')}
                        >
                          HTML Editor
                        </Button>
                      </div>

                      {contentEditorMode === 'visual' ? (
                        /* Rich Text Editor */
                        <RichTextEditor
                          content={postData.content || ''}
                          onChange={(content) => setPostData(prev => prev ? ({ ...prev, content }) : null)}
                          placeholder="Start writing your post content..."
                        />
                      ) : (
                        /* HTML Source Editor */
                        <Textarea
                          value={postData.content || ''}
                          onChange={(e) => setPostData(prev => prev ? ({ ...prev, content: e.target.value }) : null)}
                          placeholder="Write your post content here..."
                          rows={15}
                          className="min-h-[400px] font-mono text-sm"
                        />
                      )}

                      <p className="text-xs text-muted-foreground">
                        {(postData.content || '').length} characters
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Status */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Publication Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={postData.status === 'published' ? 'default' : 'secondary'}
                        className="capitalize"
                      >
                        {postData.status}
                      </Badge>
                      {postData.status === 'published' && (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      )}
                    </div>

                    {postData.status === 'published' && postData.published_at && (
                      <div className="text-sm text-muted-foreground">
                        Published: {format(new Date(postData.published_at), 'MMM d, yyyy at HH:mm')}
                      </div>
                    )}

                    <div>
                      <Label htmlFor="author">Author</Label>
                      <Select 
                        value={authors.some(a => a.id === postData.author_id) ? postData.author_id : authors[0]?.id || ''} 
                        onValueChange={(value) => setPostData(prev => prev ? ({ ...prev, author_id: value }) : null)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select author" />
                        </SelectTrigger>
                        <SelectContent>
                          {authors.map((author) => (
                            <SelectItem key={author.id} value={author.id}>
                              {author.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {postData.author_id && !authors.some(a => a.id === postData.author_id) && (
                        <p className="text-xs text-orange-600 mt-1">
                          Invalid author ID detected - will use default author when saving
                        </p>
                      )}
                    </div>
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
                        <div className="w-full h-48 bg-gray-100 rounded-md overflow-hidden">
                          <img
                            src={postData.featured_image_url}
                            alt="Featured image"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPostData(prev => prev ? ({ ...prev, featured_image_url: '' }) : null)}
                          >
                            Remove
                          </Button>
                          <Label htmlFor="featured_image_change" className="flex-1">
                            <Button variant="outline" size="sm" className="w-full">
                              <Upload className="h-4 w-4 mr-2" />
                              Change Featured Image
                            </Button>
                            <input
                              id="featured_image_change"
                              type="file"
                              accept="image/*"
                              onChange={handleImageUpload}
                              className="hidden"
                            />
                          </Label>
                        </div>
                      </div>
                    ) : (
                      <Label htmlFor="featured_image_add">
                        <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center hover:bg-muted/25 cursor-pointer transition-colors">
                          <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">Add New Featured Image</p>
                          <p className="text-xs text-muted-foreground mt-1">Upload a cover image with full object cover</p>
                        </div>
                        <input
                          id="featured_image_add"
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
                  <CardContent className="space-y-3">
                    <div className="flex gap-2">
                      <Input
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
                        placeholder="Add new category"
                        onKeyPress={(e) => e.key === 'Enter' && handleAddCategory()}
                      />
                      <Button size="sm" onClick={handleAddCategory}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      {postData.categories.map((category) => (
                        <Badge key={category} variant="secondary" className="flex items-center gap-1">
                          {category}
                          <X 
                            className="h-3 w-3 cursor-pointer" 
                            onClick={() => handleRemoveCategory(category)}
                          />
                        </Badge>
                      ))}
                    </div>
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

                {/* Delete Post */}
                <Card className="border-red-200">
                  <CardHeader>
                    <CardTitle className="text-red-600 flex items-center gap-2">
                      <Trash2 className="h-5 w-5" />
                      Danger Zone
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Button variant="destructive" onClick={handleDelete}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Post
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="seo">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  SEO & Meta Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="seo_title">SEO Title</Label>
                      <Input
                        id="seo_title"
                        value={postData.seo_title || ''}
                        onChange={(e) => setPostData(prev => prev ? ({ ...prev, seo_title: e.target.value }) : null)}
                        placeholder="SEO title for search engines"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        {(postData.seo_title || '').length}/60 characters
                        {(postData.seo_title || '').length > 60 && (
                          <span className="text-red-500 ml-2">Too long</span>
                        )}
                      </p>
                    </div>
                    
                    <div>
                      <Label htmlFor="seo_description">SEO Description</Label>
                      <Textarea
                        id="seo_description"
                        value={postData.seo_description || ''}
                        onChange={(e) => setPostData(prev => prev ? ({ ...prev, seo_description: e.target.value }) : null)}
                        placeholder="Meta description for search engines"
                        rows={4}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        {(postData.seo_description || '').length}/160 characters
                        {(postData.seo_description || '').length > 160 && (
                          <span className="text-red-500 ml-2">Too long</span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="bg-muted/50 p-4 rounded-lg">
                    <h3 className="font-semibold mb-3">Search Preview</h3>
                    <div className="space-y-2">
                      <div className="text-blue-600 text-lg font-medium leading-tight">
                        {(postData.seo_title || postData.title || 'Your post title')}
                      </div>
                      <div className="text-green-600 text-sm">
                        yourdomain.com/blog/{postData.slug || 'your-post-slug'}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {(postData.seo_description || postData.excerpt || 'Your post description will appear here...')}
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="font-semibold mb-4">SEO Score</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${
                        postData.title.length > 0 && postData.title.length <= 60 ? 'bg-green-500' : 'bg-red-500'
                      }`} />
                      <span className="text-sm">Title Length</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${
                        (postData.seo_description || '').length > 0 && (postData.seo_description || '').length <= 160 ? 'bg-green-500' : 'bg-red-500'
                      }`} />
                      <span className="text-sm">Description Length</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${
                        postData.featured_image_url ? 'bg-green-500' : 'bg-orange-500'
                      }`} />
                      <span className="text-sm">Featured Image</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${
                        postData.categories.length > 0 ? 'bg-green-500' : 'bg-orange-500'
                      }`} />
                      <span className="text-sm">Categories</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="cta">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  Call-to-Action Management
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Add Call-to-Action buttons to engage your readers and drive conversions
                </p>
              </CardHeader>
              <CardContent>
                {/* Add CTA Section */}
                <div className="mb-6 border p-4 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50">
                  <h3 className="font-semibold mb-3 text-blue-900">Add Call-to-Action</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="cta-title">CTA Title</Label>
                      <Input
                        id="cta-title"
                        value={ctaData.title}
                        onChange={(e) => setCtaData(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Ready to explore this destination?"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="cta-button-text">Button Text</Label>
                      <Input
                        id="cta-button-text"
                        value={ctaData.buttonText}
                        onChange={(e) => setCtaData(prev => ({ ...prev, buttonText: e.target.value }))}
                        placeholder="Book Your Trip"
                        className="mt-1"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="cta-description">Description</Label>
                      <Textarea
                        id="cta-description"
                        value={ctaData.description}
                        onChange={(e) => setCtaData(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Join thousands of travelers who have discovered amazing experiences..."
                        rows={2}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="cta-link">Button Link</Label>
                      <Input
                        id="cta-link"
                        value={ctaData.link}
                        onChange={(e) => setCtaData(prev => ({ ...prev, link: e.target.value }))}
                        placeholder="https://example.com/book"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="cta-position">Insert Position</Label>
                      <Select 
                        value={ctaData.position}
                        onValueChange={(value) => setCtaData(prev => ({ ...prev, position: value }))}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Choose position" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="after-intro">After Introduction</SelectItem>
                          <SelectItem value="mid-content">Middle of Content</SelectItem>
                          <SelectItem value="before-conclusion">Before Conclusion</SelectItem>
                          <SelectItem value="end-content">End of Content</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex justify-end mt-4">
                    <Button 
                      className="bg-blue-600 hover:bg-blue-700"
                      onClick={handleAddCTA}
                      disabled={!ctaData.title || !ctaData.buttonText}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add CTA
                    </Button>
                  </div>
                </div>

                {/* Current CTAs Preview */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Current CTAs</h3>
                  
                  {currentCtas && currentCtas.length > 0 ? (
                    <div className="space-y-4">
                      {currentCtas.map((cta, index) => (
                        <Card key={cta.id} className="border-l-4 border-l-purple-500">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                                  CTA: {cta.title}
                                </Badge>
                                <span className="text-sm text-muted-foreground">
                                  Position {cta.position}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={async () => {
                                    const newPos = Math.max(1, cta.position - 1)
                                    try {
                                      await fetch(`/api/admin/ctas/${cta.id}`, {
                                        method: 'PUT',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ position: newPos })
                                      })
                                      fetchCtas() // Refresh data
                                    } catch {}
                                  }}
                                >
                                  ↑
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={async () => {
                                    const newPos = cta.position + 1
                                    try {
                                      await fetch(`/api/admin/ctas/${cta.id}`, {
                                        method: 'PUT',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ position: newPos })
                                      })
                                      fetchCtas() // Refresh data
                                    } catch {}
                                  }}
                                >
                                  ↓
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={async () => {
                                    if (!confirm('Delete this CTA?')) return
                                    try {
                                      await fetch(`/api/admin/ctas/${cta.id}`, { method: 'DELETE' })
                                      fetchCtas() // Refresh data
                                      toast.success('CTA deleted')
                                    } catch (err) {
                                      console.error(err)
                                      toast.error('Failed to delete CTA')
                                    }
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                            
                            <div className="text-sm text-muted-foreground mb-2">
                              <strong>Button:</strong> {cta.button_text}
                            </div>
                            <div className="text-sm text-muted-foreground mb-2">
                              <strong>Link:</strong> {cta.button_link}
                            </div>
                            {cta.description && (
                              <div className="text-sm text-muted-foreground">
                                <strong>Description:</strong> {cta.description}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                      <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No CTAs added yet</p>
                      <p className="text-sm">Add call-to-action buttons to engage your readers and drive conversions</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="internal-links">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LinkIcon className="h-5 w-5" />
                  Internal Links for this Post
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Manage internal links specific to this post. These links will be available for inclusion in the content sections.
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Add New Internal Link Form */}
                <div className="border p-4 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50">
                  <h3 className="font-semibold mb-3 text-blue-900">Add New Internal Link</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="link-title">Link Title *</Label>
                      <Input
                        id="link-title"
                        value={newInternalLink.title}
                        onChange={(e) => setNewInternalLink(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="e.g., Ultimate Guide to Paris"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="link-url">URL *</Label>
                      <Input
                        id="link-url"
                        value={newInternalLink.url}
                        onChange={(e) => setNewInternalLink(prev => ({ ...prev, url: e.target.value }))}
                        placeholder="e.g., /blog/paris-travel-guide or https://external.com"
                        className="mt-1"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="link-description">Description *</Label>
                      <Textarea
                        id="link-description"
                        value={newInternalLink.description}
                        onChange={(e) => setNewInternalLink(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Brief description of the linked content..."
                        rows={3}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="link-category">Category</Label>
                      <Select 
                        value={newInternalLink.category}
                        onValueChange={(value) => setNewInternalLink(prev => ({ ...prev, category: value }))}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {LINK_CATEGORIES.map(category => (
                            <SelectItem key={category} value={category}>{category}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="link-display-order">Display Order (1-10)</Label>
                      <Input
                        id="link-display-order"
                        type="number"
                        min="1"
                        max="10"
                        value={newInternalLink.display_order}
                        onChange={(e) => setNewInternalLink(prev => ({ ...prev, display_order: parseInt(e.target.value) || 1 }))}
                        className="mt-1"
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 mt-4">
                    <Switch 
                      checked={newInternalLink.is_published} 
                      onCheckedChange={(checked) => setNewInternalLink(prev => ({ ...prev, is_published: checked }))}
                    />
                    <Label>Published Link</Label>
                  </div>

                  <div className="flex justify-end mt-4">
                    <Button 
                      className="bg-blue-600 hover:bg-blue-700"
                      onClick={handleAddInternalLink}
                      disabled={!newInternalLink.title.trim() || !newInternalLink.description.trim() || !newInternalLink.url.trim()}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Internal Link
                    </Button>
                  </div>
                </div>

                {/* Current Internal Links */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Current Internal Links ({postData.internal_links.length})</h3>
                  
                  {postData.internal_links.length > 0 ? (
                    <div className="space-y-4">
                      {postData.internal_links.map((link) => (
                        <Card key={link.id} className="border-l-4 border-l-blue-500">
                          <CardContent className="p-4">
                            {editingLinkId === link.id ? (
                              // Edit Form
                              <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <Label htmlFor={`edit-title-${link.id}`}>Title *</Label>
                                    <Input
                                      id={`edit-title-${link.id}`}
                                      value={editLinkForm.title}
                                      onChange={(e) => setEditLinkForm(prev => ({ ...prev, title: e.target.value }))}
                                      placeholder="Link title"
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor={`edit-url-${link.id}`}>URL *</Label>
                                    <Input
                                      id={`edit-url-${link.id}`}
                                      value={editLinkForm.url}
                                      onChange={(e) => setEditLinkForm(prev => ({ ...prev, url: e.target.value }))}
                                      placeholder="URL"
                                    />
                                  </div>
                                  <div className="md:col-span-2">
                                    <Label htmlFor={`edit-description-${link.id}`}>Description *</Label>
                                    <Textarea
                                      id={`edit-description-${link.id}`}
                                      value={editLinkForm.description}
                                      onChange={(e) => setEditLinkForm(prev => ({ ...prev, description: e.target.value }))}
                                      placeholder="Link description"
                                      rows={3}
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor={`edit-category-${link.id}`}>Category</Label>
                                    <Select 
                                      value={editLinkForm.category}
                                      onValueChange={(value) => setEditLinkForm(prev => ({ ...prev, category: value }))}
                                    >
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select category" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {LINK_CATEGORIES.map(category => (
                                          <SelectItem key={category} value={category}>{category}</SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div>
                                    <Label htmlFor={`edit-order-${link.id}`}>Display Order</Label>
                                    <Input
                                      id={`edit-order-${link.id}`}
                                      type="number"
                                      min="1"
                                      max="10"
                                      value={editLinkForm.display_order}
                                      onChange={(e) => setEditLinkForm(prev => ({ ...prev, display_order: parseInt(e.target.value) || 1 }))}
                                    />
                                  </div>
                                </div>
                                
                                <div className="flex items-center space-x-2">
                                  <Switch 
                                    checked={editLinkForm.is_published} 
                                    onCheckedChange={(checked) => setEditLinkForm(prev => ({ ...prev, is_published: checked }))}
                                  />
                                  <Label>Published Link</Label>
                                </div>

                                <div className="flex gap-2">
                                  <Button onClick={handleUpdateInternalLink}>
                                    <Save className="h-4 w-4 mr-2" />
                                    Save Changes
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    onClick={() => setEditingLinkId(null)}
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              // Display Mode
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-2">
                                    <h4 className="font-semibold text-gray-900">{link.title}</h4>
                                    <Badge variant={link.is_published ? "default" : "secondary"}>
                                      {link.is_published ? 'Published' : 'Draft'}
                                    </Badge>
                                    <Badge variant="outline">
                                      Order: {link.display_order}
                                    </Badge>
                                    <Badge variant="outline">
                                      {link.category}
                                    </Badge>
                                  </div>
                                  <p className="text-gray-600 mb-2 text-sm">{link.description}</p>
                                  <div className="flex items-center gap-2">
                                    <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">
                                      {link.url}
                                    </code>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => window.open(link.url.startsWith('http') ? link.url : `${window.location.origin}${link.url}`, '_blank')}
                                      className="p-0 h-auto"
                                    >
                                      <ExternalLink className="h-4 w-4 text-blue-600" />
                                    </Button>
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => handleEditInternalLink(link)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => handleDeleteInternalLink(link.id)}
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                      <LinkIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No internal links added yet</p>
                      <p className="text-sm">Add internal links to help readers discover related content</p>
                    </div>
                  )}
                </div>

                {/* Usage Instructions */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 mb-2">How to Use Internal Links</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Internal links help readers discover related content on your site</li>
                    <li>• Use descriptive titles that match the target page content</li>
                    <li>• Higher display order (1-10) means higher priority in display</li>
                    <li>• These links are specific to this post and saved with the post data</li>
                    <li>• Links can be internal (/blog/...) or external (https://...)</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="faqs">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HelpCircle className="h-5 w-5" />
                  Frequently Asked Questions
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Manage FAQs for this post. FAQs will automatically generate schema markup for better SEO.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* FAQ List */}
                {postData.faqs.length > 0 ? (
                  <div className="space-y-4">
                    {postData.faqs.map((faq, index) => (
                      <Card key={faq.id} className="border-l-4 border-l-blue-500">
                        <CardContent className="p-4">
                          <div className="space-y-3">
                            <div>
                              <Label htmlFor={`faq-question-${index}`}>Question</Label>
                              <Input
                                id={`faq-question-${index}`}
                                value={faq.question}
                                onChange={(e) => {
                                  const newFaqs = [...postData.faqs]
                                  newFaqs[index].question = e.target.value
                                  setPostData(prev => prev ? ({ ...prev, faqs: newFaqs }) : null)
                                }}
                                placeholder="Enter the question..."
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <Label htmlFor={`faq-answer-${index}`}>Answer</Label>
                              <textarea
                                id={`faq-answer-${index}`}
                                value={faq.answer}
                                onChange={(e) => {
                                  const newFaqs = [...postData.faqs]
                                  newFaqs[index].answer = e.target.value
                                  setPostData(prev => prev ? ({ ...prev, faqs: newFaqs }) : null)
                                }}
                                placeholder="Enter the answer..."
                                className="mt-1 w-full px-3 py-2 border border-input rounded-md resize-vertical min-h-[80px]"
                                rows={3}
                              />
                            </div>
                            <div className="flex justify-end">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const newFaqs = postData.faqs.filter((_, i) => i !== index)
                                  setPostData(prev => prev ? ({ ...prev, faqs: newFaqs }) : null)
                                }}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Remove FAQ
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                    <HelpCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No FAQs added yet</p>
                    <p className="text-sm">Add frequently asked questions to help your readers</p>
                  </div>
                )}

                {/* Add FAQ Button */}
                <Button
                  onClick={() => {
                    const newFaq: FAQ = {
                      id: `faq-${Date.now()}`,
                      question: '',
                      answer: ''
                    }
                    setPostData(prev => prev ? ({ ...prev, faqs: [...prev.faqs, newFaq] }) : null)
                  }}
                  className="w-full"
                  variant="outline"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add New FAQ
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="translations">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Languages className="h-5 w-5" />
                  Translations
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Manage translations of this post in different languages. Each translation maintains its own URL structure.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {loadingTranslations ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : translations.length > 0 ? (
                  <div className="space-y-4">
                    {translations.map((translation) => {
                      const languageMap: { [key: string]: { name: string, flag: string } } = {
                        'fr': { name: 'French', flag: '🇫🇷' },
                        'it': { name: 'Italian', flag: '🇮🇹' },
                        'de': { name: 'German', flag: '🇩🇪' },
                        'es': { name: 'Spanish', flag: '🇪🇸' }
                      }
                      
                      const language = languageMap[translation.language_code] || { name: translation.language_code, flag: '🏳️' }
                      
                      return (
                        <div key={translation.id} className="border rounded-lg p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-xl">{language.flag}</span>
                              <div>
                                <h4 className="font-semibold">{language.name}</h4>
                                <p className="text-sm text-muted-foreground">
                                  Status: {translation.translation_status}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  // Open translation editor - we'll implement this next
                                  window.open(`/admin/posts/translations/${translation.id}/edit`, '_blank')
                                }}
                              >
                                <Edit className="h-4 w-4 mr-1" />
                                Edit
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  // View translated post with correct URL structure
                                  const slug = translation.translated_slug
                                  const slugParts = slug.split('/')
                                  let viewUrl = ''
                                  
                                  if (slugParts.length >= 2) {
                                    // Has country: thailand/post-name -> /blog/thailand/fr/post-name
                                    const country = slugParts[0]
                                    const postSlug = slugParts.slice(1).join('/')
                                    viewUrl = `/blog/${country}/${translation.language_code}/${postSlug}`
                                  } else {
                                    // No country: post-name -> /blog/post-name/fr
                                    viewUrl = `/blog/${slug}/${translation.language_code}`
                                  }
                                  
                                  window.open(viewUrl, '_blank')
                                }}
                              >
                                <ExternalLink className="h-4 w-4 mr-1" />
                                View
                              </Button>
                            </div>
                          </div>
                          
                          <div className="space-y-2 text-sm">
                            <div>
                              <strong>Title:</strong> {translation.translated_title}
                            </div>
                            <div>
                              <strong>Excerpt:</strong> {translation.translated_excerpt?.substring(0, 100)}...
                            </div>
                            <div>
                              <strong>URL:</strong> 
                              <code className="ml-1 bg-gray-100 px-1 rounded">
                                /blog/{translation.translated_slug.includes('/') ? translation.translated_slug.replace(/\/([^\/]+)$/, `/${translation.language_code}/$1`) : `${translation.translated_slug}/${translation.language_code}`}
                              </code>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Created: {format(new Date(translation.created_at), 'MMM dd, yyyy')} | 
                              Updated: {format(new Date(translation.updated_at), 'MMM dd, yyyy')}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Languages className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-medium mb-2">No Translations Yet</h3>
                    <p className="text-sm mb-4">
                      This post hasn't been translated to other languages yet.
                    </p>
                    <p className="text-xs">
                      To translate this post, go to the Posts list and click the "Translate" button next to this post.
                    </p>
                  </div>
                )}

                {/* Translation Info */}
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-2">Translation Information</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Translations are created using AI and may need manual review</li>
                    <li>• Each translation gets its own URL: /blog/existing-country/language-code/slug or /blog/slug/language-code</li>
                    <li>• Bi-directional hreflang tags are automatically added for SEO</li>
                    <li>• You can edit translated content independently</li>
                    <li>• Supported languages: French (fr), Italian (it), German (de), Spanish (es)</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Post Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="template_enabled"
                    checked={postData.template_enabled}
                    onCheckedChange={(checked) => setPostData(prev => prev ? ({ ...prev, template_enabled: checked }) : null)}
                  />
                  <Label htmlFor="template_enabled">Enable Template System</Label>
                </div>

                {postData.template_enabled && (
                  <div>
                    <Label htmlFor="template_type">Template Type</Label>
                    <Select 
                      value={postData.template_type || ''} 
                      onValueChange={(value) => setPostData(prev => prev ? ({ ...prev, template_type: value }) : null)}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select template" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="travel_guide">Travel Guide</SelectItem>
                        <SelectItem value="blog_post">Blog Post</SelectItem>
                        <SelectItem value="review">Review</SelectItem>
                        <SelectItem value="listicle">Listicle</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <Separator />

                <div>
                  <h3 className="font-semibold mb-4">Post Statistics</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Created:</span>
                      <div>{format(new Date(postData.created_at), 'MMM d, yyyy at HH:mm')}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Last Modified:</span>
                      <div>{format(new Date(postData.updated_at), 'MMM d, yyyy at HH:mm')}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Content Length:</span>
                      <div>{postData.content.length} characters</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Sections:</span>
                      <div>{postData.sections?.length || 0} sections</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AuthWrapper>
  )
}
