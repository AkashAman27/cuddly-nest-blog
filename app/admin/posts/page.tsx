'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { AuthWrapper } from '@/components/admin/AuthWrapper'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Calendar,
  Clock,
  User,
  Filter,
  MoreHorizontal,
  Settings,
  Download,
  Upload,
  RefreshCw,
  Languages,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'
import { toast } from 'sonner'

interface ModernPost {
  id: string
  title: string
  slug: string
  status: 'draft' | 'published' | 'archived'
  excerpt?: string
  created_at: string
  updated_at: string
  published_at?: string
  author_id: string
  featured_image_url?: string
  template_enabled?: boolean
  template_type?: string
  seo_title?: string
  seo_description?: string
  author?: {
    id: string
    display_name: string
    email: string
  }
  sections_count?: number
  categories?: string[]
  tags?: string[]
}

export default function PostsPage() {
  const router = useRouter()
  const [posts, setPosts] = useState<ModernPost[]>([])
  const [filteredPosts, setFilteredPosts] = useState<ModernPost[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft' | 'archived' | 'trash'>('all')
  const [selectedPosts, setSelectedPosts] = useState<string[]>([])
  const [bulkAction, setBulkAction] = useState<string>('')
  const [currentPage, setCurrentPage] = useState(1)
  const [postsPerPage] = useState(20)
  const [sortField, setSortField] = useState<'title' | 'created_at' | 'updated_at' | 'status'>('updated_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [postToDelete, setPostToDelete] = useState<ModernPost | null>(null)
  const [quickEditPost, setQuickEditPost] = useState<ModernPost | null>(null)
  const [quickEditData, setQuickEditData] = useState({
    title: '',
    slug: '',
    status: '' as 'draft' | 'published' | 'archived'
  })
  const [isSaving, setIsSaving] = useState(false)
  
  // Translation state
  const [showTranslateDialog, setShowTranslateDialog] = useState(false)
  const [postToTranslate, setPostToTranslate] = useState<ModernPost | null>(null)
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([])
  const [isTranslating, setIsTranslating] = useState(false)
  
  // Available languages for translation
  const availableLanguages = [
    { code: 'fr', name: 'French', flag: '🇫🇷' },
    { code: 'it', name: 'Italian', flag: '🇮🇹' },
    { code: 'de', name: 'German', flag: '🇩🇪' },
    { code: 'es', name: 'Spanish', flag: '🇪🇸' }
  ]
  
  // Stats for filter counts
  const [postCounts, setPostCounts] = useState({
    all: 0,
    published: 0,
    draft: 0,
    archived: 0,
    trash: 0
  })

  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true)
      
      // Use API endpoint instead of direct Supabase calls
      const searchParams = new URLSearchParams({
        page: currentPage.toString(),
        limit: postsPerPage.toString(),
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(searchQuery.trim() && { search: searchQuery.trim() })
      })
      
      const response = await fetch(`/api/admin/posts?${searchParams}`)
      if (!response.ok) {
        throw new Error('Failed to fetch posts')
      }
      
      const data = await response.json()
      const postsData = data.posts || []

      setPosts(postsData)
      
      // Get actual counts for each status from separate API calls
      const [allCountResponse, publishedCountResponse, draftCountResponse, archivedCountResponse] = await Promise.all([
        fetch('/api/admin/posts?limit=1'),
        fetch('/api/admin/posts?limit=1&status=published'),
        fetch('/api/admin/posts?limit=1&status=draft'),
        fetch('/api/admin/posts?limit=1&status=archived')
      ])

      const [allCountData, publishedCountData, draftCountData, archivedCountData] = await Promise.all([
        allCountResponse.json(),
        publishedCountResponse.json(),
        draftCountResponse.json(),
        archivedCountResponse.json()
      ])
      
      // Use the actual totals from API pagination data
      const counts = {
        all: allCountData.pagination?.total || 0,
        published: publishedCountData.pagination?.total || 0,
        draft: draftCountData.pagination?.total || 0,
        archived: archivedCountData.pagination?.total || 0,
        trash: 0 // TODO: Add trash status support
      }
      setPostCounts(counts)
      
    } catch (error) {
      console.error('Error fetching posts:', error)
      alert('Failed to load posts')
    } finally {
      setLoading(false)
    }
  }, [currentPage, postsPerPage, statusFilter, searchQuery, sortField, sortOrder])

  useEffect(() => {
    fetchPosts()
  }, [fetchPosts])

  // Filter and search posts
  useEffect(() => {
    let filtered = posts

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(post => post.status === statusFilter)
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(post => 
        post.title.toLowerCase().includes(query) ||
        post.excerpt?.toLowerCase().includes(query) ||
        post.author?.display_name.toLowerCase().includes(query) ||
        post.slug.toLowerCase().includes(query)
      )
    }

    setFilteredPosts(filtered)
    setCurrentPage(1) // Reset to first page when filtering
  }, [posts, statusFilter, searchQuery])

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('desc')
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const currentPagePosts = getCurrentPagePosts().map(post => post.id)
      setSelectedPosts(currentPagePosts)
    } else {
      setSelectedPosts([])
    }
  }

  const handleSelectPost = (postId: string, checked: boolean) => {
    if (checked) {
      setSelectedPosts(prev => [...prev, postId])
    } else {
      setSelectedPosts(prev => prev.filter(id => id !== postId))
    }
  }

  const handleBulkAction = async () => {
    if (!bulkAction || selectedPosts.length === 0) return

    try {
      switch (bulkAction) {
        case 'delete':
          if (window.confirm(`Are you sure you want to delete ${selectedPosts.length} posts?`)) {
            const { error } = await supabase
              .from('cuddly_nest_modern_post')
              .delete()
              .in('id', selectedPosts)
            
            if (error) throw error
            alert(`${selectedPosts.length} posts deleted successfully`)
            fetchPosts()
            setSelectedPosts([])
          }
          break
        
        case 'publish':
          const { error: publishError } = await supabase
            .from('cuddly_nest_modern_post')
            .update({ 
              status: 'published',
              published_at: new Date().toISOString()
            })
            .in('id', selectedPosts)
          
          if (publishError) throw publishError
          alert(`${selectedPosts.length} posts published successfully`)
          fetchPosts()
          setSelectedPosts([])
          break
        
        case 'draft':
          const { error: draftError } = await supabase
            .from('cuddly_nest_modern_post')
            .update({ status: 'draft' })
            .in('id', selectedPosts)
          
          if (draftError) throw draftError
          alert(`${selectedPosts.length} posts moved to draft successfully`)
          fetchPosts()
          setSelectedPosts([])
          break
        
        case 'archive':
          const { error: archiveError } = await supabase
            .from('cuddly_nest_modern_post')
            .update({ status: 'archived' })
            .in('id', selectedPosts)
          
          if (archiveError) throw archiveError
          alert(`${selectedPosts.length} posts archived successfully`)
          fetchPosts()
          setSelectedPosts([])
          break
      }
    } catch (error) {
      console.error('Bulk action error:', error)
      alert('Failed to perform bulk action')
    }

    setBulkAction('')
  }

  const handleDeletePost = async (post: ModernPost) => {
    try {
      const { error } = await supabase
        .from('cuddly_nest_modern_post')
        .delete()
        .eq('id', post.id)
      
      if (error) throw error
      alert('Post deleted successfully')
      fetchPosts()
      setShowDeleteDialog(false)
      setPostToDelete(null)
    } catch (error) {
      console.error('Error deleting post:', error)
      alert('Failed to delete post')
    }
  }

  const handleQuickEditSave = async () => {
    if (!quickEditPost || isSaving) return

    // Validation
    const title = quickEditData.title.trim()
    const slug = quickEditData.slug.trim()
    
    if (!title) {
      alert('Title is required')
      return
    }
    
    if (!slug) {
      alert('Slug is required')
      return
    }

    // Validate slug format (basic URL-friendly check)
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      alert('Slug must be URL-friendly (lowercase letters, numbers, and hyphens only)')
      return
    }

    try {
      setIsSaving(true)
      
      const response = await fetch(`/api/admin/posts/${quickEditPost.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          slug,
          status: quickEditData.status,
          // Keep existing data
          excerpt: quickEditPost.excerpt || '',
          content: quickEditPost.content || '',
          featured_image_url: quickEditPost.featured_image_url,
          author_id: quickEditPost.author_id,
          seo_title: quickEditPost.seo_title,
          seo_description: quickEditPost.seo_description,
          categories: quickEditPost.categories || [],
          tags: quickEditPost.tags || [],
          template_enabled: quickEditPost.template_enabled || false,
          template_type: quickEditPost.template_type
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update post')
      }

      alert('Post updated successfully!')
      fetchPosts() // Refresh the posts list
      setQuickEditPost(null) // Close the dialog
      
    } catch (error) {
      console.error('Error updating post:', error)
      alert(error instanceof Error ? error.message : 'Failed to update post')
    } finally {
      setIsSaving(false)
    }
  }

  const handleTranslatePost = async () => {
    if (!postToTranslate || selectedLanguages.length === 0 || isTranslating) return

    setIsTranslating(true)
    
    try {
      const response = await fetch('/api/admin/translate-final', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          postId: postToTranslate.id,
          languages: selectedLanguages,
          regenerate: true // Always regenerate to ensure fresh translations
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to translate post')
      }

      // Count successful translations
      const successfulTranslations = result.results?.filter((r: any) => r.success)?.length || 0
      const failedTranslations = result.results?.filter((r: any) => !r.success)?.length || 0
      
      if (successfulTranslations > 0) {
        toast.success(`Post translated successfully into ${successfulTranslations} language(s)!`)
      }
      if (failedTranslations > 0) {
        toast.error(`${failedTranslations} translation(s) failed. Check the logs for details.`)
      }
      
      setShowTranslateDialog(false)
      setPostToTranslate(null)
      setSelectedLanguages([])
      
    } catch (error) {
      console.error('Error translating post:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to translate post')
    } finally {
      setIsTranslating(false)
    }
  }

  const toggleLanguageSelection = (languageCode: string) => {
    setSelectedLanguages(prev => 
      prev.includes(languageCode)
        ? prev.filter(code => code !== languageCode)
        : [...prev, languageCode]
    )
  }

  const getCurrentPagePosts = () => {
    const startIndex = (currentPage - 1) * postsPerPage
    const endIndex = startIndex + postsPerPage
    return filteredPosts.slice(startIndex, endIndex)
  }

  const totalPages = Math.ceil(filteredPosts.length / postsPerPage)
  const currentPagePosts = getCurrentPagePosts()

  return (
    <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Posts</h1>
            <p className="text-muted-foreground">Manage your blog posts</p>
          </div>
          <Button asChild>
            <Link href="/admin/posts/new">
              <Plus className="h-4 w-4 mr-2" />
              Add New Post
            </Link>
          </Button>
        </div>

        {/* Filter Tabs */}
        <Tabs value={statusFilter} onValueChange={(value) => setStatusFilter(value as any)}>
          <TabsList className="grid w-full max-w-2xl grid-cols-5">
            <TabsTrigger value="all">
              All ({postCounts.all})
            </TabsTrigger>
            <TabsTrigger value="published">
              Published ({postCounts.published})
            </TabsTrigger>
            <TabsTrigger value="draft">
              Draft ({postCounts.draft})
            </TabsTrigger>
            <TabsTrigger value="archived">
              Archived ({postCounts.archived})
            </TabsTrigger>
            <TabsTrigger value="trash">
              Trash ({postCounts.trash})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Search and Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-4 items-center flex-1">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search posts..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                {/* Bulk Actions */}
                {selectedPosts.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Select value={bulkAction} onValueChange={setBulkAction}>
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="Bulk Actions" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="publish">Publish</SelectItem>
                        <SelectItem value="draft">Move to Draft</SelectItem>
                        <SelectItem value="archive">Archive</SelectItem>
                        <SelectItem value="delete">Delete</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button onClick={handleBulkAction} variant="outline" size="sm">
                      Apply
                    </Button>
                  </div>
                )}
              </div>
              
              <Button
                variant="outline"
                onClick={() => fetchPosts()}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Posts Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedPosts.length === currentPagePosts.length && currentPagePosts.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('title')}>
                    <div className="flex items-center">
                      Title
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead>Author</TableHead>
                  <TableHead>Categories</TableHead>
                  <TableHead>Tags</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('created_at')}>
                    <div className="flex items-center">
                      Date
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead>SEO</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                      Loading posts...
                    </TableCell>
                  </TableRow>
                ) : currentPagePosts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      No posts found
                    </TableCell>
                  </TableRow>
                ) : (
                  currentPagePosts.map((post) => (
                    <TableRow key={post.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedPosts.includes(post.id)}
                          onCheckedChange={(checked) => handleSelectPost(post.id, checked as boolean)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium hover:text-blue-600">
                            <Link href={`/admin/posts/${post.id}/edit`}>
                              {post.title || 'Untitled'}
                            </Link>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            /{post.slug}
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <button 
                              onClick={() => {
                                setQuickEditPost(post)
                                setQuickEditData({
                                  title: post.title || '',
                                  slug: post.slug || '',
                                  status: post.status || 'draft'
                                })
                              }}
                              className="text-blue-600 hover:underline"
                            >
                              Quick Edit
                            </button>
                            <span className="text-muted-foreground">|</span>
                            <button 
                              onClick={() => {
                                setPostToTranslate(post)
                                setShowTranslateDialog(true)
                                setSelectedLanguages([])
                              }}
                              className="text-purple-600 hover:underline"
                            >
                              Translate
                            </button>
                            <span className="text-muted-foreground">|</span>
                            <button 
                              onClick={() => {
                                setPostToDelete(post)
                                setShowDeleteDialog(true)
                              }}
                              className="text-red-600 hover:underline"
                            >
                              Delete
                            </button>
                            <span className="text-muted-foreground">|</span>
                            <Link 
                              href={`/blog/${post.slug}`} 
                              target="_blank"
                              className="text-green-600 hover:underline"
                            >
                              View
                            </Link>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {post.author?.display_name || 'Unknown'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {post.categories?.map((category, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {category}
                            </Badge>
                          )) || <span className="text-muted-foreground text-sm">—</span>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {post.tags?.map((tag, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          )) || <span className="text-muted-foreground text-sm">—</span>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={
                            post.status === 'published' ? 'default' : 
                            post.status === 'archived' ? 'destructive' : 'secondary'
                          }
                          className="capitalize"
                        >
                          {post.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="text-sm">
                            {post.status === 'published' && post.published_at ? (
                              <div className="flex items-center gap-1 text-green-600">
                                <Calendar className="h-3 w-3" />
                                Published: {format(new Date(post.published_at), 'MMM d, yyyy')}
                              </div>
                            ) : (
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                Last modified: {format(new Date(post.updated_at), 'MMM d, yyyy')}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <div className={`w-2 h-2 rounded-full ${
                            post.seo_title && post.seo_description ? 'bg-green-500' : 'bg-orange-500'
                          }`} />
                          <span className="text-xs text-muted-foreground">
                            {post.seo_title && post.seo_description ? 'Good' : 'Needs work'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/admin/posts/${post.id}/edit`}>
                              <Edit className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/blog/${post.slug}`} target="_blank">
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Showing {((currentPage - 1) * postsPerPage) + 1} to {Math.min(currentPage * postsPerPage, filteredPosts.length)} of {filteredPosts.length} posts
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              
              {/* Page numbers */}
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum = i + 1
                  if (totalPages <= 5) {
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                      >
                        {pageNum}
                      </Button>
                    )
                  }
                  // Handle pagination for many pages
                  let pageToShow = pageNum
                  if (currentPage > 3) {
                    pageToShow = currentPage - 2 + i
                    if (pageToShow > totalPages) {
                      pageToShow = totalPages - 4 + i
                    }
                  }
                  
                  return (
                    <Button
                      key={pageToShow}
                      variant={currentPage === pageToShow ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setCurrentPage(pageToShow)}
                    >
                      {pageToShow}
                    </Button>
                  )
                })}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Post</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete "{postToDelete?.title}"? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={() => postToDelete && handleDeletePost(postToDelete)}
              >
                Delete
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Quick Edit Dialog */}
        {quickEditPost && (
          <Dialog open={!!quickEditPost} onOpenChange={() => !isSaving && setQuickEditPost(null)}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Quick Edit: {quickEditPost.title}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Title *</label>
                  <Input 
                    value={quickEditData.title}
                    onChange={(e) => setQuickEditData(prev => ({ ...prev, title: e.target.value }))}
                    className="mt-1"
                    placeholder="Enter post title..."
                    disabled={isSaving}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Slug *</label>
                  <Input 
                    value={quickEditData.slug}
                    onChange={(e) => {
                      // Auto-format slug as user types
                      const formattedSlug = e.target.value
                        .toLowerCase()
                        .replace(/[^a-z0-9\s-]/g, '')
                        .replace(/\s+/g, '-')
                        .replace(/-+/g, '-')
                        .replace(/^-|-$/g, '')
                      setQuickEditData(prev => ({ ...prev, slug: formattedSlug }))
                    }}
                    className="mt-1"
                    placeholder="url-friendly-slug"
                    disabled={isSaving}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    URL: /blog/{quickEditData.slug || 'your-slug-here'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">Status</label>
                  <Select 
                    value={quickEditData.status}
                    onValueChange={(value: 'draft' | 'published' | 'archived') => 
                      setQuickEditData(prev => ({ ...prev, status: value }))
                    }
                    disabled={isSaving}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setQuickEditPost(null)}
                    disabled={isSaving}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleQuickEditSave}
                    disabled={isSaving || !quickEditData.title.trim() || !quickEditData.slug.trim()}
                  >
                    {isSaving ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      'Update'
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Translation Dialog */}
        <Dialog open={showTranslateDialog} onOpenChange={setShowTranslateDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Languages className="h-5 w-5" />
                Translate Post
              </DialogTitle>
              <DialogDescription>
                Select the languages you want to translate "{postToTranslate?.title}" into.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-3">
                {availableLanguages.map((language) => (
                  <div key={language.code} className="flex items-center space-x-3">
                    <Checkbox
                      id={language.code}
                      checked={selectedLanguages.includes(language.code)}
                      onCheckedChange={() => toggleLanguageSelection(language.code)}
                      disabled={isTranslating}
                    />
                    <label 
                      htmlFor={language.code}
                      className="flex items-center gap-2 text-sm font-medium cursor-pointer"
                    >
                      <span className="text-lg">{language.flag}</span>
                      {language.name}
                    </label>
                  </div>
                ))}
              </div>
              
              {selectedLanguages.length > 0 && (
                <div className="p-3 bg-blue-50 rounded-md border border-blue-200">
                  <div className="text-sm text-blue-800">
                    <strong>Selected languages:</strong> {selectedLanguages.length}
                  </div>
                  <div className="text-xs text-blue-600 mt-1">
                    This will create new posts with URLs like:<br />
                    {selectedLanguages.map(lang => {
                      // Extract country from existing slug structure
                      const slug = postToTranslate?.slug || ''
                      const slugParts = slug.split('/')
                      let urlStructure = ''
                      
                      if (slugParts.length >= 2) {
                        // Has country: /thailand/post-name -> /thailand/fr/post-name
                        const country = slugParts[0]
                        const postSlug = slugParts.slice(1).join('/')
                        urlStructure = `/blog/${country}/${lang}/${postSlug}`
                      } else {
                        // No country: /post-name -> /post-name/${lang} (for posts without country)
                        urlStructure = `/blog/${slug}/${lang}`
                      }
                      
                      return (
                        <code key={lang} className="block">{urlStructure}</code>
                      )
                    })}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowTranslateDialog(false)
                    setPostToTranslate(null)
                    setSelectedLanguages([])
                  }}
                  disabled={isTranslating}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleTranslatePost}
                  disabled={isTranslating || selectedLanguages.length === 0}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {isTranslating ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Translating...
                    </>
                  ) : (
                    <>
                      <Languages className="h-4 w-4 mr-2" />
                      Translate ({selectedLanguages.length})
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
    </div>
  )
}