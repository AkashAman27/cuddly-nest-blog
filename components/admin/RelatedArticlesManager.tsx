'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { 
  Link as LinkIcon, 
  Plus, 
  Edit, 
  Trash2, 
  ExternalLink,
  Save,
  AlertTriangle,
  Image as ImageIcon
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface RelatedArticle {
  id?: string
  title: string
  description: string
  url: string
  imageUrl?: string
  category?: string
}

interface RelatedArticlesSectionData {
  title?: string
  articles: RelatedArticle[]
}

interface RelatedArticlesManagerProps {
  postId: string
  currentData?: RelatedArticlesSectionData
  onSave: (data: RelatedArticlesSectionData) => void
}

export function RelatedArticlesManager({ postId, currentData, onSave }: RelatedArticlesManagerProps) {
  const [articles, setArticles] = useState<RelatedArticle[]>(currentData?.articles || [])
  const [sectionTitle, setSectionTitle] = useState(currentData?.title || 'Related Articles')
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [allPosts, setAllPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state for editing
  const [formData, setFormData] = useState<RelatedArticle>({
    title: '',
    description: '',
    url: '',
    imageUrl: '',
    category: ''
  })

  useEffect(() => {
    fetchAllPosts()
  }, [])

  const fetchAllPosts = async () => {
    try {
      setLoading(true)
      
      // Fetch from modern_posts first
      const { data: modernPosts, error: modernError } = await supabase
        .from('cuddly_nest_modern_post')
        .select('id, title, slug, excerpt')
        .neq('id', postId) // Exclude current post
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(25)

      // Fetch from legacy posts table as fallback
      const { data: legacyPosts, error: legacyError } = await supabase
        .from('posts')
        .select('id, title, slug, excerpt, featured_image')
        .neq('id', postId) // Exclude current post
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(25)

      // Combine both results
      const allPosts = [
        ...(modernPosts || []),
        ...(legacyPosts || [])
      ]

      setAllPosts(allPosts)
    } catch (error) {
      console.error('Error fetching posts:', error)
      setError('Failed to load posts')
    } finally {
      setLoading(false)
    }
  }

  const handleAddArticle = () => {
    setFormData({
      title: '',
      description: '',
      url: '',
      imageUrl: '',
      category: ''
    })
    setEditingIndex(null)
    setShowAddDialog(true)
  }

  const handleEditArticle = (index: number) => {
    setFormData({ ...articles[index] })
    setEditingIndex(index)
    setShowAddDialog(true)
  }

  const handleDeleteArticle = (index: number) => {
    if (confirm('Are you sure you want to remove this related article?')) {
      const newArticles = articles.filter((_, i) => i !== index)
      setArticles(newArticles)
    }
  }

  const handleSaveArticle = () => {
    if (!formData.title || !formData.url) {
      setError('Title and URL are required')
      return
    }

    let newArticles
    if (editingIndex !== null) {
      // Edit existing article
      newArticles = articles.map((article, i) => 
        i === editingIndex ? { ...formData } : article
      )
    } else {
      // Add new article
      newArticles = [...articles, { ...formData, id: Date.now().toString() }]
    }

    setArticles(newArticles)
    setShowAddDialog(false)
    setError(null)
  }

  const handleSelectFromBlog = (post: any) => {
    setFormData({
      title: post.title,
      description: post.excerpt || 'Discover more about this destination...',
      url: `/blog/${post.slug}`,
      imageUrl: '', // Will be auto-fetched from hero section
      category: 'Travel Guide'
    })
  }

  const handleSaveAll = () => {
    const data: RelatedArticlesSectionData = {
      title: sectionTitle,
      articles: articles.slice(0, 3) // Limit to 3 articles
    }
    onSave(data)
  }

  return (
    <>
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LinkIcon className="h-5 w-5" />
            Related Articles Manager
            <Badge variant="outline">{articles.length}/3 Articles</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Section Title */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Section Title</label>
            <Input
              value={sectionTitle}
              onChange={(e) => setSectionTitle(e.target.value)}
              placeholder="e.g. Related Articles"
            />
          </div>

          {/* Current Articles */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Selected Articles ({articles.length}/3)</h3>
              <Button
                onClick={handleAddArticle}
                disabled={articles.length >= 3}
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Article
              </Button>
            </div>

            {articles.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No articles selected. Add up to 3 related articles.
              </div>
            )}

            <div className="space-y-3">
              {articles.map((article, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1">
                    {article.imageUrl && (
                      <div className="w-16 h-16 bg-gray-200 rounded overflow-hidden flex-shrink-0">
                        <img
                          src={article.imageUrl}
                          alt={article.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 truncate">
                        {article.title}
                      </div>
                      <div className="text-sm text-gray-600 line-clamp-2">
                        {article.description}
                      </div>
                      <div className="text-xs text-blue-600 mt-1">
                        {article.url}
                      </div>
                      {article.category && (
                        <Badge variant="outline" className="mt-1 text-xs">
                          {article.category}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditArticle(index)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteArticle(index)}
                      className="border-red-300 text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-4 border-t">
            <Button onClick={handleSaveAll}>
              <Save className="h-4 w-4 mr-2" />
              Save Related Articles
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingIndex !== null ? 'Edit' : 'Add'} Related Article
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Quick Select from Blog Posts */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Quick Select from Blog</label>
              <div className="max-h-40 overflow-y-auto border rounded p-2 space-y-1">
                {allPosts.map((post) => (
                  <div
                    key={post.id}
                    className="flex items-center justify-between p-2 hover:bg-gray-50 rounded cursor-pointer text-sm"
                    onClick={() => handleSelectFromBlog(post)}
                  >
                    <span className="truncate">{post.title}</span>
                    <Button variant="ghost" size="sm">
                      Select
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Manual Entry */}
            <div className="border-t pt-4 space-y-4">
              <label className="text-sm font-medium">Or Enter Manually</label>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Title *</label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Article title"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of the article"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">URL *</label>
                <Input
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  placeholder="/blog/article-slug or https://external-url.com"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Image URL</label>
                <Input
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Category</label>
                <Input
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="e.g. Travel Guide, Tips, etc."
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowAddDialog(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleSaveArticle}>
                <Save className="h-4 w-4 mr-2" />
                Save Article
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}