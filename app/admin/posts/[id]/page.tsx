'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { AuthWrapper } from '@/components/admin/AuthWrapper'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowLeft,
  Edit,
  Eye,
  Calendar,
  User,
  Tag,
  FolderOpen,
  Globe,
  Clock,
  FileText
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'

interface PostData {
  id: string
  title: string
  slug: string
  excerpt: string
  content: string
  status: 'draft' | 'published'
  featured_image_url: string
  author_id: string
  seo_title: string
  seo_description: string
  categories: string[]
  tags: string[]
  created_at: string
  updated_at: string
  published_at: string | null
  template_enabled: boolean
  template_type: string
  author?: {
    id: string
    display_name: string
    email: string
  }
}

export default function ViewPostPage() {
  const router = useRouter()
  const params = useParams()
  const postId = params.id as string
  
  const [loading, setLoading] = useState(true)
  const [post, setPost] = useState<PostData | null>(null)

  useEffect(() => {
    if (postId) {
      fetchPost()
    }
  }, [postId])

  const fetchPost = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('cuddly_nest_modern_post')
        .select(`
          *,
          author:authors(id, display_name, email)
        `)
        .eq('id', postId)
        .single()

      if (error) throw error
      if (!data) {
        router.push('/admin/posts')
        return
      }

      setPost({
        ...data,
        categories: data.categories || [],
        tags: data.tags || []
      })
    } catch (error) {
      console.error('Error fetching post:', error)
      router.push('/admin/posts')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <AuthWrapper>
        <div className="container mx-auto p-6 max-w-4xl">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="space-y-4">
              <div className="h-6 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </AuthWrapper>
    )
  }

  if (!post) {
    return (
      <AuthWrapper>
        <div className="container mx-auto p-6 max-w-4xl">
          <div className="text-center py-12">
            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
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
      <div className="container mx-auto p-6 max-w-4xl">
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
              <h1 className="text-3xl font-bold">{post.title}</h1>
              <p className="text-muted-foreground">/{post.slug}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
              <Link href={`/blog/${post.slug}`} target="_blank">
                <Eye className="h-4 w-4 mr-2" />
                View Live
              </Link>
            </Button>
            <Button asChild>
              <Link href={`/admin/posts/${post.id}/edit`}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Post
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Post Content */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Content</CardTitle>
                  <Badge variant={post.status === 'published' ? 'default' : 'secondary'}>
                    {post.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {post.featured_image_url && (
                  <img
                    src={post.featured_image_url}
                    alt={post.title}
                    className="w-full h-64 object-cover rounded-lg mb-6"
                  />
                )}
                
                {post.excerpt && (
                  <div className="mb-6 p-4 bg-muted rounded-lg">
                    <h3 className="font-semibold mb-2">Excerpt</h3>
                    <p className="text-muted-foreground italic">{post.excerpt}</p>
                  </div>
                )}

                <div className="prose max-w-none dark:prose-invert">
                  <div dangerouslySetInnerHTML={{ __html: post.content }} />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status & Meta */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Publication Info
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Status</span>
                  <div className="mt-1">
                    <Badge variant={post.status === 'published' ? 'default' : 'secondary'}>
                      {post.status}
                    </Badge>
                  </div>
                </div>

                <div>
                  <span className="text-sm font-medium text-muted-foreground">Author</span>
                  <div className="mt-1 flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>{post.author?.display_name || 'Unknown'}</span>
                  </div>
                </div>

                <div>
                  <span className="text-sm font-medium text-muted-foreground">Created</span>
                  <div className="mt-1 flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{format(new Date(post.created_at), 'MMM d, yyyy at HH:mm')}</span>
                  </div>
                </div>

                <div>
                  <span className="text-sm font-medium text-muted-foreground">Last Modified</span>
                  <div className="mt-1 flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{format(new Date(post.updated_at), 'MMM d, yyyy at HH:mm')}</span>
                  </div>
                </div>

                {post.status === 'published' && post.published_at && (
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Published</span>
                    <div className="mt-1 flex items-center gap-2">
                      <Globe className="h-4 w-4 text-green-600" />
                      <span className="text-sm">{format(new Date(post.published_at), 'MMM d, yyyy at HH:mm')}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Categories */}
            {post.categories.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FolderOpen className="h-5 w-5" />
                    Categories
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {post.categories.map((category) => (
                      <Badge key={category} variant="secondary">
                        {category}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Tags */}
            {post.tags.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Tag className="h-5 w-5" />
                    Tags
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {post.tags.map((tag) => (
                      <Badge key={tag} variant="outline">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* SEO Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  SEO Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <span className="text-sm font-medium text-muted-foreground">SEO Title</span>
                  <p className="mt-1 text-sm">{post.seo_title || post.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {(post.seo_title || post.title).length}/60 characters
                  </p>
                </div>

                <div>
                  <span className="text-sm font-medium text-muted-foreground">SEO Description</span>
                  <p className="mt-1 text-sm">{post.seo_description || post.excerpt || 'No description'}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {(post.seo_description || post.excerpt || '').length}/160 characters
                  </p>
                </div>

                {/* SEO Preview */}
                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2 text-sm">Search Preview</h4>
                  <div className="space-y-1">
                    <div className="text-blue-600 text-sm font-medium line-clamp-2">
                      {post.seo_title || post.title}
                    </div>
                    <div className="text-green-600 text-xs">
                      yourdomain.com/blog/{post.slug}
                    </div>
                    <div className="text-sm text-muted-foreground line-clamp-2">
                      {post.seo_description || post.excerpt || 'No description available'}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Template Info */}
            {post.template_enabled && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Template Settings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Template Enabled:</span>
                      <Badge variant="outline">Yes</Badge>
                    </div>
                    {post.template_type && (
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Template Type:</span>
                        <Badge variant="outline">{post.template_type}</Badge>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </AuthWrapper>
  )
}