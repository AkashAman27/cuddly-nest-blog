'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { 
  Search, 
  Trash2, 
  Eye, 
  Edit,
  AlertTriangle,
  FileText,
  Calendar,
  Clock,
  ArrowLeft,
  RefreshCw,
  Settings
} from 'lucide-react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

interface ModernPost {
  id: string
  title: string
  slug: string
  status: 'draft' | 'published'
  excerpt?: string
  created_at: string
  updated_at: string
  template_enabled?: boolean
  template_type?: string
  author?: {
    display_name: string
  }
}

export default function ManageArticlesPage() {
  const [posts, setPosts] = useState<ModernPost[]>([])
  const [filteredPosts, setFilteredPosts] = useState<ModernPost[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [postToDelete, setPostToDelete] = useState<ModernPost | null>(null)
  const [deleteConfirmation, setDeleteConfirmation] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadPosts()
  }, [])

  useEffect(() => {
    filterPosts()
  }, [posts, searchQuery, statusFilter])

  const loadPosts = async () => {
    try {
      console.log('Starting to load posts...')
      
      /* 
       * IMPORTANT: Supabase has default limits that can cause posts to not appear
       * in the admin interface. We explicitly set a high limit and check counts
       * to ensure content managers can see ALL posts for deletion/management.
       * 
       * Previous issue: Posts existed in DB but weren't loaded due to implicit limits,
       * causing search to return 0 results even though posts existed.
       */
      
      // First, get the total count to ensure we're not hitting limits
      const { count: totalCount, error: countError } = await supabase
        .from('cuddly_nest_modern_post')
        .select('*', { count: 'exact', head: true })
      
      if (countError) {
        console.error('Error getting total count:', countError)
      } else {
        console.log('Total posts in database:', totalCount)
      }
      
      const { data, error } = await supabase
        .from('cuddly_nest_modern_post')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(5000) // High limit - will implement pagination if this becomes insufficient

      console.log('Supabase query result:', { 
        dataLength: data?.length, 
        error: error,
        samplePosts: data?.slice(0, 3).map(post => ({
          id: post.id,
          title: post.title,
          slug: post.slug,
          status: post.status
        })) || []
      })
      
      // Check for posts with "akash" in title
      const akashPosts = data?.filter(post => 
        post.title.toLowerCase().includes('akash') ||
        post.slug.toLowerCase().includes('akash')
      ) || []
      console.log('Posts containing "akash":', akashPosts.length, akashPosts.map(p => p.title))
      
      // Additional debugging: Check for specific IDs we know exist
      const specificIds = [
        'ff281c7f-ae94-40fa-b56c-138fbca6d314', // Akash Aman Test
        'c3d4e000-d973-4e73-a93c-fb686116308b', // Akash Aman
        '9e3c9641-35aa-4b39-8618-86b31e7a5616'  // Akash Aman 2603
      ]
      const foundSpecificPosts = data?.filter(post => specificIds.includes(post.id)) || []
      console.log('Specific Akash posts found:', foundSpecificPosts.length, foundSpecificPosts.map(p => ({ id: p.id, title: p.title })))

      if (error) {
        console.error('Supabase error details:', error)
        throw error
      }
      
      const postsData = data || []
      console.log(`Successfully loaded ${postsData.length} posts`)
      
      // Warning system for content management team
      if (totalCount && postsData.length < totalCount) {
        console.warn(`⚠️ WARNING: Only loaded ${postsData.length} out of ${totalCount} total posts!`)
        console.warn('Some posts may not be visible in the admin interface.')
        
        // Show alert to content team if significant posts are missing
        if (totalCount - postsData.length > 50) {
          alert(`⚠️ WARNING: This interface is only showing ${postsData.length} out of ${totalCount} total posts. Some posts may not be visible for management. Please contact technical support.`)
        }
      } else if (totalCount) {
        console.log(`✅ All ${totalCount} posts loaded successfully`)
      }
      
      setPosts(postsData)
    } catch (error) {
      console.error('Error loading posts:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      setError(`Failed to load posts: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }

  const filterPosts = () => {
    let filtered = posts
    
    console.log('🔍 Filtering posts:', {
      totalPosts: posts.length,
      searchQuery,
      statusFilter,
      sampleTitles: posts.slice(0, 5).map(p => p.title)
    })

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(post => post.status === statusFilter)
      console.log(`Status filter "${statusFilter}": ${filtered.length} posts`)
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      console.log(`Searching for: "${query}"`)
      
      const beforeSearch = filtered.length
      filtered = filtered.filter(post => {
        const titleMatch = post.title.toLowerCase().includes(query)
        const slugMatch = post.slug.toLowerCase().includes(query)
        const excerptMatch = post.excerpt?.toLowerCase().includes(query)
        const idMatch = post.id.toLowerCase().includes(query)
        const authorMatch = (post.author?.display_name || '').toLowerCase().includes(query)
        
        const matches = titleMatch || slugMatch || excerptMatch || idMatch || authorMatch
        
        if (matches) {
          console.log(`✅ Match found: "${post.title}" (slug: ${post.slug})`, {
            titleMatch,
            slugMatch,
            excerptMatch,
            idMatch,
            authorMatch
          })
        }
        
        return matches
      })
      
      console.log(`Search results: ${beforeSearch} → ${filtered.length} posts`)
    }

    setFilteredPosts(filtered)
  }

  const handleDeleteClick = (post: ModernPost) => {
    setPostToDelete(post)
    setDeleteConfirmation('')
    setShowDeleteModal(true)
  }

  const handleDeleteConfirm = async () => {
    if (!postToDelete || deleteConfirmation !== 'DELETE') return

    setIsDeleting(true)
    try {
      // First, delete all associated sections
      const { error: sectionsError } = await supabase
        .from('modern_post_sections')
        .delete()
        .eq('post_id', postToDelete.id)

      if (sectionsError) {
        console.error('Error deleting sections:', sectionsError)
        // Continue anyway, as sections might not exist
      }

      // Delete translations if they exist
      const { error: translationsError } = await supabase
        .from('post_translations')
        .delete()
        .eq('original_post_id', postToDelete.id)

      if (translationsError) {
        console.error('Error deleting translations:', translationsError)
        // Continue anyway
      }

      // Delete the main post
      const { error: postError } = await supabase
        .from('cuddly_nest_modern_post')
        .delete()
        .eq('id', postToDelete.id)

      if (postError) throw postError

      // Update local state
      setPosts(posts.filter(p => p.id !== postToDelete.id))
      setShowDeleteModal(false)
      setPostToDelete(null)
      setDeleteConfirmation('')

      alert(`Article "${postToDelete.title}" has been permanently deleted.`)
    } catch (error) {
      console.error('Error deleting post:', error)
      alert('Failed to delete the article. Please try again.')
    } finally {
      setIsDeleting(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800'
      case 'draft':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading articles...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-8 w-8 mx-auto mb-4 text-red-600" />
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => {
            setError(null)
            loadPosts()
          }}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin" className="text-blue-600 hover:text-blue-800">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Admin
                </Button>
              </Link>
              <Link href="/admin/template-control" className="text-green-600 hover:text-green-800">
                <Button variant="outline" size="sm" className="border-green-200">
                  <Settings className="w-4 h-4 mr-2" />
                  Template Control
                </Button>
              </Link>
              <div className="flex items-center gap-2">
                <FileText className="w-6 h-6 text-blue-600" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Manage Published Articles</h1>
                  <p className="text-gray-600">Delete and manage your travel guide articles</p>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={async () => {
                  console.log('🔄 Force reloading posts...')
                  setLoading(true)
                  setPosts([])
                  setFilteredPosts([])
                  
                  // Add small delay to ensure state is cleared
                  await new Promise(resolve => setTimeout(resolve, 100))
                  await loadPosts()
                }} 
                variant="outline"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Force Refresh
              </Button>
              <Button 
                onClick={() => {
                  console.log('🐛 DEBUG INFO:', {
                    totalPostsLoaded: posts.length,
                    currentSearchQuery: searchQuery,
                    filteredPostsCount: filteredPosts.length,
                    postsWithAkash: posts.filter(p => p.title.toLowerCase().includes('akash')).length,
                    sampleTitles: posts.slice(0, 10).map(p => p.title),
                    akashPosts: posts.filter(p => p.title.toLowerCase().includes('akash')).map(p => ({
                      id: p.id,
                      title: p.title,
                      slug: p.slug
                    }))
                  })
                  alert(`Debug info logged to console. Found ${posts.filter(p => p.title.toLowerCase().includes('akash')).length} posts with "akash"`)
                }}
                variant="outline"
                className="bg-red-50 hover:bg-red-100"
              >
                🐛 Debug
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Filters and Search */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by title, slug, excerpt, ID, or author name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                {(['all', 'published', 'draft'] as const).map((status) => (
                  <Button
                    key={status}
                    variant={statusFilter === status ? 'default' : 'outline'}
                    onClick={() => setStatusFilter(status)}
                    className="capitalize"
                  >
                    {status}
                    {status !== 'all' && (
                      <Badge variant="secondary" className="ml-2">
                        {posts.filter(p => p.status === status).length}
                      </Badge>
                    )}
                  </Button>
                ))}
                <Button
                  onClick={() => {
                    console.log('Clearing search and showing all posts')
                    setSearchQuery('')
                    setStatusFilter('all')
                  }}
                  variant="outline"
                  className="bg-green-50 hover:bg-green-100"
                >
                  Clear All
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Total Articles</p>
                  <p className="text-2xl font-bold">{posts.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Eye className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">Published</p>
                  <p className="text-2xl font-bold">{posts.filter(p => p.status === 'published').length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Edit className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="text-sm text-gray-600">Drafts</p>
                  <p className="text-2xl font-bold">{posts.filter(p => p.status === 'draft').length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Search className="h-5 w-5 text-gray-600" />
                <div>
                  <p className="text-sm text-gray-600">Filtered Results</p>
                  <p className="text-2xl font-bold">{filteredPosts.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Articles List */}
        <Card>
          <CardHeader>
            <CardTitle>
              Articles ({filteredPosts.length})
              {searchQuery && ` matching "${searchQuery}"`}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredPosts.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-semibold mb-2">No articles found</h3>
                <p>
                  {searchQuery || statusFilter !== 'all' 
                    ? 'Try adjusting your search or filter criteria.' 
                    : 'No articles have been created yet.'}
                </p>
                {searchQuery && (
                  <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded text-sm">
                    <p className="font-semibold text-yellow-800">Debug Info:</p>
                    <p>Total posts loaded: {posts.length}</p>
                    <p>Search query: "{searchQuery}"</p>
                    <p>Posts with "akash": {posts.filter(p => p.title.toLowerCase().includes('akash')).length}</p>
                    <Button 
                      onClick={() => {
                        console.log('Sample posts:', posts.slice(0, 5).map(p => ({ title: p.title, id: p.id })))
                        console.log('Akash posts:', posts.filter(p => p.title.toLowerCase().includes('akash')))
                      }}
                      variant="outline"
                      size="sm"
                      className="mt-2"
                    >
                      Log Debug Info
                    </Button>
                    <Button 
                      onClick={async () => {
                        console.log('🔍 Direct DB query for Akash posts...')
                        try {
                          const { data, error } = await supabase
                            .from('cuddly_nest_modern_post')
                            .select('id, title, slug, status')
                            .or('title.ilike.%akash%,slug.ilike.%akash%')
                            .limit(10)
                          
                          if (error) {
                            console.error('Direct query error:', error)
                          } else {
                            console.log('Direct query results:', data)
                            alert(`Direct DB query found ${data?.length || 0} posts with "akash"`)
                          }
                        } catch (err) {
                          console.error('Direct query exception:', err)
                        }
                      }}
                      variant="outline"
                      size="sm"
                      className="mt-2 ml-2"
                    >
                      Direct DB Query
                    </Button>
                    <Button 
                      onClick={async () => {
                        console.log('🚀 Loading Akash posts directly...')
                        try {
                          const { data, error } = await supabase
                            .from('cuddly_nest_modern_post')
                            .select('*')
                            .or('title.ilike.%akash%,slug.ilike.%akash%')
                          
                          if (error) {
                            console.error('Error loading akash posts:', error)
                          } else if (data && data.length > 0) {
                            console.log('Found akash posts:', data)
                            // Add these posts to the existing posts array if not already present
                            const newPosts = [...posts]
                            data.forEach(akashPost => {
                              if (!newPosts.find(p => p.id === akashPost.id)) {
                                newPosts.push(akashPost)
                              }
                            })
                            setPosts(newPosts)
                            alert(`Added ${data.length} Akash posts to the list. Try searching again!`)
                          } else {
                            alert('No Akash posts found in database')
                          }
                        } catch (err) {
                          console.error('Error:', err)
                        }
                      }}
                      variant="outline"
                      size="sm"
                      className="mt-2 ml-2 bg-blue-50 hover:bg-blue-100"
                    >
                      Inject Akash Posts
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredPosts.map((post) => (
                  <div key={post.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">
                            {post.title}
                          </h3>
                          <Badge className={getStatusColor(post.status)}>
                            {post.status}
                          </Badge>
                        </div>
                        
                        <div className="text-sm text-gray-600 mb-2 space-y-1">
                          <p>Slug: <code className="bg-gray-100 px-2 py-1 rounded text-xs">{post.slug}</code></p>
                          <p>ID: <code className="bg-blue-50 px-2 py-1 rounded text-xs text-blue-700">{post.id}</code></p>
                        </div>
                        
                        {post.excerpt && (
                          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                            {post.excerpt}
                          </p>
                        )}
                        
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>Created: {new Date(post.created_at).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>Updated: {new Date(post.updated_at).toLocaleDateString()}</span>
                          </div>
                          {post.author?.display_name && (
                            <span>By: {post.author?.display_name}</span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 ml-4">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => window.open(`/blog/${post.slug}`, '_blank')}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => window.open(`/admin?edit=${post.id}`, '_blank')}
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDeleteClick(post)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Safety Tips */}
        <Card className="mt-6 bg-yellow-50 border-yellow-200">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-yellow-900 mb-2">⚠️ Article Deletion Safety</h3>
                <ul className="text-sm text-yellow-800 space-y-1">
                  <li>• Deleting an article will permanently remove it from your website</li>
                  <li>• All sections, translations, and associated data will be deleted</li>
                  <li>• You must type "DELETE" exactly to confirm deletion</li>
                  <li>• This action cannot be undone - make sure you have backups if needed</li>
                  <li>• Consider changing status to "draft" instead of deleting if you're unsure</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Modal */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Confirm Article Deletion
            </DialogTitle>
            <DialogDescription>
              This action will permanently delete the article and all associated data.
            </DialogDescription>
          </DialogHeader>
          
          {postToDelete && (
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="font-semibold text-red-900 mb-2">Article to be deleted:</h4>
                <p className="text-red-800 font-medium">"{postToDelete.title}"</p>
                <p className="text-red-700 text-sm mt-1">Slug: {postToDelete.slug}</p>
                <p className="text-red-700 text-sm">Status: {postToDelete.status}</p>
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Type <strong>DELETE</strong> to confirm:
                </label>
                <Input
                  value={deleteConfirmation}
                  onChange={(e) => setDeleteConfirmation(e.target.value)}
                  placeholder="Type DELETE to confirm"
                  className={`${
                    deleteConfirmation === 'DELETE' 
                      ? 'border-red-500 bg-red-50' 
                      : 'border-gray-300'
                  }`}
                />
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowDeleteModal(false)
                    setPostToDelete(null)
                    setDeleteConfirmation('')
                  }}
                  disabled={isDeleting}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteConfirm}
                  disabled={deleteConfirmation !== 'DELETE' || isDeleting}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {isDeleting ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Permanently Delete Article
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}