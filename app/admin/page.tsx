'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Home,
  BookOpen,
  User,
  Tag,
  Link as LinkIcon,
  ArrowRight,
  Bot,
  Globe,
  ImageIcon,
  Languages,
  BarChart,
  TrendingUp,
  FileText,
  Activity,
  Clock,
  Eye,
  Plus,
  Settings
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface DashboardStats {
  totalPosts: number
  publishedPosts: number
  draftPosts: number
  totalAuthors: number
  recentPosts: Array<{
    id: string
    title: string
    slug: string
    status: string
    created_at: string
  }>
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalPosts: 0,
    publishedPosts: 0,
    draftPosts: 0,
    totalAuthors: 0,
    recentPosts: []
  })
  const [loading, setLoading] = useState(true)

  const adminSections = [
    {
      id: 'posts',
      title: 'Posts',
      description: 'Create and manage blog posts',
      icon: BookOpen,
      href: '/admin/posts',
      color: 'bg-blue-500',
      stats: `${stats.totalPosts} total`
    },
    {
      id: 'authors',
      title: 'Authors',
      description: 'Manage author profiles and permissions',
      icon: User,
      href: '/admin/authors',
      color: 'bg-green-500',
      stats: `${stats.totalAuthors} authors`
    },
    {
      id: 'categories',
      title: 'Categories',
      description: 'Organize content with categories',
      icon: Tag,
      href: '/admin/categories',
      color: 'bg-purple-500',
      stats: 'Organize content'
    },
    {
      id: 'internal-links',
      title: 'Internal Links',
      description: 'Manage internal linking system',
      icon: LinkIcon,
      href: '/admin/internal-links',
      color: 'bg-indigo-500',
      stats: 'SEO optimization'
    },
    {
      id: 'url-redirects',
      title: 'URL Redirects',
      description: 'Configure URL redirects and aliases',
      icon: ArrowRight,
      href: '/admin/redirects',
      color: 'bg-orange-500',
      stats: 'URL management'
    },
    {
      id: 'robots-txt',
      title: 'Robots.txt',
      description: 'Configure search engine crawling',
      icon: Bot,
      href: '/admin/robots',
      color: 'bg-gray-500',
      stats: 'SEO control'
    },
    {
      id: 'homepage',
      title: 'Homepage',
      description: 'Customize homepage layout and content',
      icon: Globe,
      href: '/admin/homepage',
      color: 'bg-cyan-500',
      stats: 'Site front page'
    },
    {
      id: 'image-generator',
      title: 'AI Image Generator',
      description: 'Generate images with AI for your posts',
      icon: ImageIcon,
      href: '/admin/image-generator',
      color: 'bg-pink-500',
      stats: 'AI powered'
    },
    {
      id: 'translations',
      title: 'Translations',
      description: 'Manage multi-language content',
      icon: Languages,
      href: '/admin/translations',
      color: 'bg-emerald-500',
      stats: 'Multi-language'
    }
  ]

  useEffect(() => {
    loadDashboardStats()
  }, [])

  const loadDashboardStats = async () => {
    try {
      setLoading(true)
      
      // Get total post count
      const { count: totalPostsCount, error: totalCountError } = await supabase
        .from('cuddly_nest_modern_post')
        .select('*', { count: 'exact', head: true })
      
      if (totalCountError) throw totalCountError

      // Get published post count
      const { count: publishedCount, error: publishedCountError } = await supabase
        .from('cuddly_nest_modern_post')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'published')
      
      if (publishedCountError) throw publishedCountError

      // Get draft post count
      const { count: draftCount, error: draftCountError } = await supabase
        .from('cuddly_nest_modern_post')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'draft')
      
      if (draftCountError) throw draftCountError

      // Get recent posts (limited to 5 for display)
      const { data: recentPosts, error: recentPostsError } = await supabase
        .from('cuddly_nest_modern_post')
        .select('id, title, slug, status, created_at')
        .order('created_at', { ascending: false })
        .limit(5)
      
      if (recentPostsError) throw recentPostsError

      // Get author count
      const { count: authorsCount, error: authorsError } = await supabase
        .from('modern_authors')
        .select('*', { count: 'exact', head: true })
      
      if (authorsError) throw authorsError

      setStats({
        totalPosts: totalPostsCount || 0,
        publishedPosts: publishedCount || 0,
        draftPosts: draftCount || 0,
        totalAuthors: authorsCount || 0,
        recentPosts: recentPosts || []
      })
    } catch (error) {
      console.error('Error loading dashboard stats:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Welcome to your CuddlyNest CMS dashboard</p>
        </div>
        <Button asChild>
          <Link href="/admin/posts/new">
            <Plus className="h-4 w-4 mr-2" />
            New Post
          </Link>
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">Total Posts</h3>
                <p className="text-2xl font-bold text-gray-900">{loading ? '...' : stats.totalPosts}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Eye className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">Published</h3>
                <p className="text-2xl font-bold text-gray-900">{loading ? '...' : stats.publishedPosts}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">Draft Posts</h3>
                <p className="text-2xl font-bold text-gray-900">{loading ? '...' : stats.draftPosts}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <User className="h-6 w-6 text-purple-600" />
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">Authors</h3>
                <p className="text-2xl font-bold text-gray-900">{loading ? '...' : stats.totalAuthors}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {adminSections.map((section) => {
              const Icon = section.icon
              return (
                <Link
                  key={section.id}
                  href={section.href}
                  className="group block p-4 border border-gray-200 rounded-lg hover:border-gray-300 hover:shadow-sm transition-all"
                >
                  <div className="flex items-start space-x-3">
                    <div className={`flex-shrink-0 w-10 h-10 ${section.color} rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform`}>
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 group-hover:text-gray-700">
                        {section.title}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {section.description}
                      </p>
                      <p className="text-xs text-gray-400 mt-2">
                        {section.stats}
                      </p>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recent Posts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Recent Posts
              </CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/admin/posts">
                  View All
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : stats.recentPosts.length > 0 ? (
              <div className="space-y-4">
                {stats.recentPosts.map((post) => (
                  <div key={post.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:bg-gray-50">
                    <div className="flex-1">
                      <Link 
                        href={`/admin/posts/${post.id}/edit`}
                        className="font-medium text-gray-900 hover:text-blue-600"
                      >
                        {post.title}
                      </Link>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge 
                          variant={post.status === 'published' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {post.status}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {new Date(post.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/blog/${post.slug}`} target="_blank">
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No posts found</p>
                <Button asChild className="mt-4" variant="outline">
                  <Link href="/admin/posts/new">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Post
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* System Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              System Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">Enhanced Admin Dashboard</span>
                </div>
                <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                  Active
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">Internal Linking System</span>
                </div>
                <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                  Active
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">URL Management</span>
                </div>
                <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                  Active
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-gray-700">Multi-language Translation</span>
                </div>
                <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                  Ready
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">Global Schema Management</span>
                </div>
                <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                  Active
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}