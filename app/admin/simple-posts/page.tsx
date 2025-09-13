'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { AuthWrapper } from '@/components/admin/AuthWrapper'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Trash2, Edit, Plus, Save, Eye } from 'lucide-react'

interface SimplifiedPost {
  id: string
  title: string
  slug: string
  content?: string
  excerpt?: string
  featured_image_url?: string
  status: 'draft' | 'published' | 'archived'
  published_at?: string
  created_at: string
  updated_at: string
  author?: {
    display_name: string
  }
}

interface Author {
  id: string
  display_name: string
}

export default function SimplePostsPage() {
  const [posts, setPosts] = useState<SimplifiedPost[]>([])
  const [authors, setAuthors] = useState<Author[]>([])
  const [loading, setLoading] = useState(true)
  const [editingPost, setEditingPost] = useState<SimplifiedPost | null>(null)
  const [showNewForm, setShowNewForm] = useState(false)

  // New/Edit form state
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    content: '',
    excerpt: '',
    featured_image_url: '',
    status: 'draft' as const,
    author_id: ''
  })

  useEffect(() => {
    fetchPosts()
    fetchAuthors()
  }, [])

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('cuddly_nest_modern_post')
        .select(`
          *,
          author:modern_authors(display_name)
        `)
        .order('updated_at', { ascending: false })
        .limit(50)

      if (error) {
        console.error('Error fetching posts:', error)
        return
      }

      setPosts(data || [])
    } catch (error) {
      console.error('Exception fetching posts:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAuthors = async () => {
    try {
      const { data, error } = await supabase
        .from('modern_authors')
        .select('id, display_name')
        .order('display_name')

      if (error) {
        console.error('Error fetching authors:', error)
        return
      }

      setAuthors(data || [])
    } catch (error) {
      console.error('Exception fetching authors:', error)
    }
  }

  const handleCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title || !formData.slug || !formData.author_id) {
      alert('Please fill in all required fields')
      return
    }

    try {
      const postData = {
        ...formData,
        published_at: formData.status === 'published' ? new Date().toISOString() : null,
        updated_at: new Date().toISOString()
      }

      let result
      if (editingPost) {
        // Update existing post
        result = await supabase
          .from('cuddly_nest_modern_post')
          .update(postData)
          .eq('id', editingPost.id)
      } else {
        // Create new post
        result = await supabase
          .from('cuddly_nest_modern_post')
          .insert([postData])
      }

      if (result.error) {
        console.error('Error saving post:', result.error)
        alert('Error saving post: ' + result.error.message)
        return
      }

      alert(editingPost ? 'Post updated successfully!' : 'Post created successfully!')
      
      // Reset form and refresh
      setFormData({
        title: '',
        slug: '',
        content: '',
        excerpt: '',
        featured_image_url: '',
        status: 'draft',
        author_id: ''
      })
      setEditingPost(null)
      setShowNewForm(false)
      fetchPosts()
    } catch (error) {
      console.error('Exception saving post:', error)
      alert('Error saving post')
    }
  }

  const handleEdit = (post: SimplifiedPost) => {
    setEditingPost(post)
    setFormData({
      title: post.title,
      slug: post.slug,
      content: post.content || '',
      excerpt: post.excerpt || '',
      featured_image_url: post.featured_image_url || '',
      status: post.status,
      author_id: '' // Will be set when authors load
    })
    setShowNewForm(true)
  }

  const handleDelete = async (post: SimplifiedPost) => {
    if (!confirm(`Are you sure you want to delete "${post.title}"?`)) {
      return
    }

    try {
      const { error } = await supabase
        .from('cuddly_nest_modern_post')
        .delete()
        .eq('id', post.id)

      if (error) {
        console.error('Error deleting post:', error)
        alert('Error deleting post: ' + error.message)
        return
      }

      alert('Post deleted successfully!')
      fetchPosts()
    } catch (error) {
      console.error('Exception deleting post:', error)
      alert('Error deleting post')
    }
  }

  const generateSlugFromTitle = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .trim()
  }

  if (loading) {
    return (
      <AuthWrapper>
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-lg">Loading posts...</div>
          </div>
        </div>
      </AuthWrapper>
    )
  }

  return (
    <AuthWrapper>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Simplified Blog Posts</h1>
            <p className="text-gray-600">Manage posts in the new simplified structure</p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => {
                setShowNewForm(true)
                setEditingPost(null)
                setFormData({
                  title: '',
                  slug: '',
                  content: '',
                  excerpt: '',
                  featured_image_url: '',
                  status: 'draft',
                  author_id: ''
                })
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              New Post
            </Button>
            <Button variant="outline" asChild>
              <Link href="/admin">
                Back to Admin
              </Link>
            </Button>
          </div>
        </div>

        <Tabs defaultValue="list" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="list">Posts List</TabsTrigger>
            {showNewForm && (
              <TabsTrigger value="form">
                {editingPost ? 'Edit Post' : 'New Post'}
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="list">
            <Card>
              <CardHeader>
                <CardTitle>All Posts ({posts.length})</CardTitle>
                <CardDescription>
                  Posts from the cuddly_nest_modern_post table
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {posts.map((post) => (
                    <div
                      key={post.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:shadow-sm"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-lg">{post.title}</h3>
                          <Badge variant={post.status === 'published' ? 'default' : 'secondary'}>
                            {post.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">/{post.slug}</p>
                        {post.excerpt && (
                          <p className="text-sm text-gray-700 mb-2">{post.excerpt.substring(0, 150)}...</p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>By {post.author?.display_name || 'Unknown'}</span>
                          <span>Updated {new Date(post.updated_at).toLocaleDateString()}</span>
                          {post.published_at && (
                            <span>Published {new Date(post.published_at).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {post.status === 'published' && (
                          <Button size="sm" variant="outline" asChild>
                            <Link href={`/blog/${post.slug}`} target="_blank">
                              <Eye className="w-4 h-4" />
                            </Link>
                          </Button>
                        )}
                        <Button size="sm" variant="outline" onClick={() => handleEdit(post)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(post)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {posts.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No posts found. Create your first post!
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {showNewForm && (
            <TabsContent value="form">
              <Card>
                <CardHeader>
                  <CardTitle>{editingPost ? 'Edit Post' : 'Create New Post'}</CardTitle>
                  <CardDescription>
                    {editingPost ? 'Update the existing post' : 'Add a new post to the simplified blog structure'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCreateOrUpdate} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="title">Title *</Label>
                        <Input
                          id="title"
                          value={formData.title}
                          onChange={(e) => {
                            const title = e.target.value
                            setFormData({
                              ...formData,
                              title,
                              slug: formData.slug || generateSlugFromTitle(title)
                            })
                          }}
                          placeholder="Enter post title"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="slug">Slug *</Label>
                        <Input
                          id="slug"
                          value={formData.slug}
                          onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                          placeholder="post-url-slug"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="status">Status</Label>
                        <Select
                          value={formData.status}
                          onValueChange={(value: 'draft' | 'published' | 'archived') =>
                            setFormData({ ...formData, status: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="published">Published</SelectItem>
                            <SelectItem value="archived">Archived</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="author">Author *</Label>
                        <Select
                          value={formData.author_id}
                          onValueChange={(value) => setFormData({ ...formData, author_id: value })}
                        >
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
                    </div>

                    <div>
                      <Label htmlFor="featured_image_url">Featured Image URL</Label>
                      <Input
                        id="featured_image_url"
                        value={formData.featured_image_url}
                        onChange={(e) => setFormData({ ...formData, featured_image_url: e.target.value })}
                        placeholder="https://example.com/image.jpg"
                        type="url"
                      />
                    </div>

                    <div>
                      <Label htmlFor="excerpt">Excerpt</Label>
                      <Textarea
                        id="excerpt"
                        value={formData.excerpt}
                        onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                        placeholder="Brief description of the post"
                        rows={3}
                      />
                    </div>

                    <div>
                      <Label htmlFor="content">Content</Label>
                      <Textarea
                        id="content"
                        value={formData.content}
                        onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                        placeholder="Write your post content here (HTML supported)"
                        rows={15}
                        className="font-mono text-sm"
                      />
                    </div>

                    <div className="flex gap-4">
                      <Button type="submit">
                        <Save className="w-4 h-4 mr-2" />
                        {editingPost ? 'Update Post' : 'Create Post'}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setShowNewForm(false)
                          setEditingPost(null)
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </AuthWrapper>
  )
}