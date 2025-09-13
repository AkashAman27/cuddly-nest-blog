'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { 
  Settings,
  FileText,
  ArrowLeft,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Search
} from 'lucide-react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

interface PostTemplateInfo {
  id: string
  title: string
  slug: string
  template_enabled: boolean
  template_type: string
  status: 'draft' | 'published'
  created_at: string
}

export default function TemplateControlPage() {
  const [posts, setPosts] = useState<PostTemplateInfo[]>([])
  const [filteredPosts, setFilteredPosts] = useState<PostTemplateInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [bulkUpdating, setBulkUpdating] = useState(false)
  const [templateStats, setTemplateStats] = useState({
    total: 0,
    template_enabled: 0,
    sections_enabled: 0
  })
  const [showBulkModal, setShowBulkModal] = useState(false)
  const [bulkAction, setBulkAction] = useState<'enable' | 'disable' | null>(null)

  useEffect(() => {
    loadPosts()
  }, [])

  useEffect(() => {
    const filtered = posts.filter(post =>
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.slug.toLowerCase().includes(searchQuery.toLowerCase())
    )
    setFilteredPosts(filtered)
  }, [searchQuery, posts])

  async function loadPosts() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('cuddly_nest_modern_post')
        .select(`
          id,
          title,
          slug,
          template_enabled,
          template_type,
          status,
          created_at
        `)
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(500)

      if (error) throw error

      setPosts(data || [])
      
      // Calculate stats
      const stats = {
        total: data?.length || 0,
        template_enabled: data?.filter(p => p.template_enabled)?.length || 0,
        sections_enabled: data?.filter(p => !p.template_enabled)?.length || 0
      }
      setTemplateStats(stats)
      
    } catch (error) {
      console.error('Error loading posts:', error)
    } finally {
      setLoading(false)
    }
  }

  async function updatePostTemplate(postId: string, enabled: boolean) {
    try {
      const { error } = await supabase
        .from('cuddly_nest_modern_post')
        .update({ 
          template_enabled: enabled,
          template_type: enabled ? 'article_template' : 'sections'
        })
        .eq('id', postId)

      if (error) throw error

      // Update local state
      setPosts(posts.map(post => 
        post.id === postId 
          ? { ...post, template_enabled: enabled, template_type: enabled ? 'article_template' : 'sections' }
          : post
      ))
      
      // Update stats
      const newStats = {
        total: posts.length,
        template_enabled: posts.filter(p => p.id === postId ? enabled : p.template_enabled).length,
        sections_enabled: posts.filter(p => p.id === postId ? !enabled : !p.template_enabled).length
      }
      setTemplateStats(newStats)
      
    } catch (error) {
      console.error('Error updating post template:', error)
    }
  }

  async function bulkUpdateTemplates(enable: boolean) {
    try {
      setBulkUpdating(true)
      
      const { error } = await supabase
        .from('cuddly_nest_modern_post')
        .update({ 
          template_enabled: enable,
          template_type: enable ? 'article_template' : 'sections'
        })
        .eq('status', 'published')

      if (error) throw error

      // Reload posts to get updated data
      await loadPosts()
      setShowBulkModal(false)
      setBulkAction(null)
      
    } catch (error) {
      console.error('Error bulk updating templates:', error)
    } finally {
      setBulkUpdating(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center space-x-3">
            <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
            <span className="text-lg text-gray-600">Loading template settings...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <Link href="/admin">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Admin
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Template Control</h1>
            <p className="text-gray-600 mt-1">Manage blog post templates and rendering systems</p>
          </div>
        </div>
      </div>

      {/* Template Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Published Posts</p>
                <p className="text-2xl font-bold text-gray-900">{templateStats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Using New Template</p>
                <p className="text-2xl font-bold text-gray-900">{templateStats.template_enabled}</p>
                <p className="text-xs text-gray-500">
                  {Math.round((templateStats.template_enabled / templateStats.total) * 100)}% of posts
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Settings className="h-8 w-8 text-gray-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Using Sections</p>
                <p className="text-2xl font-bold text-gray-900">{templateStats.sections_enabled}</p>
                <p className="text-xs text-gray-500">
                  {Math.round((templateStats.sections_enabled / templateStats.total) * 100)}% of posts
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bulk Actions */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Bulk Template Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <Button 
              onClick={() => { setBulkAction('enable'); setShowBulkModal(true) }}
              className="bg-green-600 hover:bg-green-700"
              disabled={bulkUpdating}
            >
              Enable Template for All Posts
            </Button>
            <Button 
              variant="outline"
              onClick={() => { setBulkAction('disable'); setShowBulkModal(true) }}
              disabled={bulkUpdating}
            >
              Disable Template for All Posts
            </Button>
            <Button 
              variant="outline"
              onClick={loadPosts}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Search and Posts List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Individual Post Controls</CardTitle>
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search posts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {filteredPosts.map((post) => (
              <div
                key={post.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 mb-1">{post.title}</h3>
                  <p className="text-sm text-gray-500">
                    /{post.slug} • Created {formatDate(post.created_at)}
                  </p>
                </div>
                
                <div className="flex items-center space-x-4">
                  <Badge variant={post.template_enabled ? "default" : "secondary"}>
                    {post.template_enabled ? "New Template" : "Sections"}
                  </Badge>
                  
                  <div className="flex items-center space-x-2">
                    <label htmlFor={`template-${post.id}`} className="text-sm text-gray-600">
                      Enable Template
                    </label>
                    <Switch
                      id={`template-${post.id}`}
                      checked={post.template_enabled}
                      onCheckedChange={(checked) => updatePostTemplate(post.id, checked)}
                    />
                  </div>
                  
                  <Link href={`/blog/${post.slug}`} target="_blank">
                    <Button variant="outline" size="sm">
                      View
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
            
            {filteredPosts.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No posts found matching your search.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Bulk Action Confirmation Modal */}
      <Dialog open={showBulkModal} onOpenChange={setShowBulkModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Bulk Action</DialogTitle>
            <DialogDescription>
              {bulkAction === 'enable' ? (
                <div className="space-y-2">
                  <p>Are you sure you want to enable the new article template for ALL {templateStats.total} published posts?</p>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                    <div className="flex items-start">
                      <AlertTriangle className="h-5 w-5 text-yellow-400 mr-2 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium text-yellow-800">This action will:</p>
                        <ul className="list-disc list-inside text-yellow-700 mt-1 space-y-1">
                          <li>Switch all posts to use the new blog article template</li>
                          <li>Generate automatic content, FAQs, and categories for each post</li>
                          <li>Override the current section-based rendering</li>
                          <li>This change can be reverted, but may affect user experience</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <p>Are you sure you want to disable the new template for ALL posts and revert to sections?</p>
                  <p className="text-sm text-gray-600">Posts will go back to using their individual section configurations.</p>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="flex space-x-2 justify-end mt-4">
            <Button
              variant="outline"
              onClick={() => setShowBulkModal(false)}
              disabled={bulkUpdating}
            >
              Cancel
            </Button>
            <Button
              onClick={() => bulkUpdateTemplates(bulkAction === 'enable')}
              disabled={bulkUpdating}
              variant={bulkAction === 'enable' ? "default" : "destructive"}
            >
              {bulkUpdating ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                `Confirm ${bulkAction === 'enable' ? 'Enable' : 'Disable'}`
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}