'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Tag, 
  Eye,
  EyeOff,
  Star,
  Search,
  Filter,
  MoreHorizontal,
  AlertTriangle,
  Check,
  Loader2,
  Globe,
  Lock,
  FileText,
  BarChart3,
  Settings
} from 'lucide-react'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ModernCategory, getAdminCategories, createCategory, updateCategory, deleteCategory } from '@/lib/supabase'

interface CategoryFormData {
  name: string
  description: string
  seo_title: string
  seo_description: string
  meta_keywords: string
  og_title: string
  og_description: string
  og_image: string
  custom_content: string
  color: string
  featured_image: string
  parent_category_id: string | null
  is_published: boolean
  is_featured: boolean
  visibility: 'public' | 'private' | 'draft'
  sort_order: number
}

const initialFormData: CategoryFormData = {
  name: '',
  description: '',
  seo_title: '',
  seo_description: '',
  meta_keywords: '',
  og_title: '',
  og_description: '',
  og_image: '',
  custom_content: '',
  color: '#6B46C1',
  featured_image: '',
  parent_category_id: null,
  is_published: false,
  is_featured: false,
  visibility: 'draft',
  sort_order: 0
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<ModernCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'published' | 'draft'>('all')
  const [showDialog, setShowDialog] = useState(false)
  const [editingCategory, setEditingCategory] = useState<ModernCategory | null>(null)
  const [formData, setFormData] = useState<CategoryFormData>(initialFormData)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Fetch categories
  useEffect(() => {
    fetchCategories()
  }, [])

  // Clear success/error messages after 5 seconds
  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess(null)
        setError(null)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [success, error])

  const fetchCategories = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getAdminCategories()
      setCategories(data)
    } catch (err) {
      console.error('Error fetching categories:', err)
      setError('Failed to load categories')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCategory = () => {
    setEditingCategory(null)
    setFormData(initialFormData)
    setShowDialog(true)
  }

  const handleEditCategory = (category: ModernCategory) => {
    setEditingCategory(category)
    setFormData({
      name: category.name,
      description: category.description || '',
      seo_title: category.seo_title || '',
      seo_description: category.seo_description || '',
      meta_keywords: category.meta_keywords || '',
      og_title: category.og_title || '',
      og_description: category.og_description || '',
      og_image: category.og_image || '',
      custom_content: category.custom_content || '',
      color: category.color || '#6B46C1',
      featured_image: category.featured_image || '',
      parent_category_id: category.parent_category_id || null,
      is_published: category.is_published,
      is_featured: category.is_featured || false,
      visibility: category.visibility || 'draft',
      sort_order: category.sort_order || 0
    })
    setShowDialog(true)
  }

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      setError('Category name is required')
      return
    }

    try {
      setIsSubmitting(true)
      setError(null)

      const categoryData = {
        ...formData,
        parent_category_id: formData.parent_category_id === '' ? null : formData.parent_category_id
      }

      let result
      if (editingCategory) {
        result = await updateCategory(editingCategory.id, categoryData)
      } else {
        result = await createCategory(categoryData)
      }

      if (result.success) {
        setSuccess(editingCategory ? 'Category updated successfully!' : 'Category created successfully!')
        setShowDialog(false)
        fetchCategories()
      } else {
        setError(result.error || 'Failed to save category')
      }
    } catch (err) {
      console.error('Error saving category:', err)
      setError('Failed to save category')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteCategory = async (category: ModernCategory) => {
    if (!confirm(`Are you sure you want to delete "${category.name}"? This action cannot be undone.`)) {
      return
    }

    try {
      const result = await deleteCategory(category.id)
      if (result.success) {
        setSuccess('Category deleted successfully!')
        fetchCategories()
      } else {
        setError(result.error || 'Failed to delete category')
      }
    } catch (err) {
      console.error('Error deleting category:', err)
      setError('Failed to delete category')
    }
  }

  const handleTogglePublished = async (category: ModernCategory) => {
    try {
      const result = await updateCategory(category.id, {
        is_published: !category.is_published,
        published_at: !category.is_published ? new Date().toISOString() : null
      })
      
      if (result.success) {
        setSuccess(`Category ${!category.is_published ? 'published' : 'unpublished'} successfully!`)
        fetchCategories()
      } else {
        setError(result.error || 'Failed to update category')
      }
    } catch (err) {
      console.error('Error updating category:', err)
      setError('Failed to update category')
    }
  }

  const handleToggleFeatured = async (category: ModernCategory) => {
    try {
      const result = await updateCategory(category.id, {
        is_featured: !category.is_featured
      })
      
      if (result.success) {
        setSuccess(`Category ${!category.is_featured ? 'featured' : 'unfeatured'} successfully!`)
        fetchCategories()
      } else {
        setError(result.error || 'Failed to update category')
      }
    } catch (err) {
      console.error('Error updating category:', err)
      setError('Failed to update category')
    }
  }

  // Filter categories based on search and status
  const filteredCategories = categories.filter(category => {
    const matchesSearch = category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (category.description || '').toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus = filterStatus === 'all' ||
                         (filterStatus === 'published' && category.is_published) ||
                         (filterStatus === 'draft' && !category.is_published)
    
    return matchesSearch && matchesStatus
  })

  const getVisibilityIcon = (visibility: string) => {
    switch (visibility) {
      case 'public': return <Globe className="w-4 h-4" />
      case 'private': return <Lock className="w-4 h-4" />
      default: return <FileText className="w-4 h-4" />
    }
  }

  const getStatusBadge = (category: ModernCategory) => {
    if (category.is_published) {
      return <Badge variant="default" className="bg-green-500">Published</Badge>
    } else {
      return <Badge variant="secondary">Draft</Badge>
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2 text-lg">Loading categories...</span>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Tag className="h-8 w-8 text-blue-600" />
            Category Management
          </h1>
          <p className="text-gray-600 mt-2">
            Organize your travel content with SEO-optimized categories
          </p>
        </div>
        <Button onClick={handleCreateCategory} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          New Category
        </Button>
      </div>

      {/* Success/Error Alerts */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mb-6 border-green-500 bg-green-50">
          <Check className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      {/* Filters and Search */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search categories..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterStatus} onValueChange={(value: 'all' | 'published' | 'draft') => setFilterStatus(value)}>
              <SelectTrigger className="w-full lg:w-48">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredCategories.map((category) => (
          <Card key={category.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div 
                    className="w-4 h-4 rounded-full flex-shrink-0"
                    style={{ backgroundColor: category.color }}
                  />
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-lg truncate">{category.name}</CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      {getStatusBadge(category)}
                      {category.is_featured && (
                        <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                          <Star className="w-3 h-3 mr-1" />
                          Featured
                        </Badge>
                      )}
                      {getVisibilityIcon(category.visibility || 'draft')}
                    </div>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleEditCategory(category)}>
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleTogglePublished(category)}>
                      {category.is_published ? (
                        <>
                          <EyeOff className="w-4 h-4 mr-2" />
                          Unpublish
                        </>
                      ) : (
                        <>
                          <Eye className="w-4 h-4 mr-2" />
                          Publish
                        </>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleToggleFeatured(category)}>
                      <Star className="w-4 h-4 mr-2" />
                      {category.is_featured ? 'Unfeature' : 'Feature'}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => handleDeleteCategory(category)}
                      className="text-red-600"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent>
              {category.description && (
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {category.description}
                </p>
              )}
              <div className="flex items-center justify-between text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <BarChart3 className="w-4 h-4" />
                  {category.post_count || 0} posts
                </div>
                <div>
                  {category.updated_at && new Date(category.updated_at).toLocaleDateString()}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredCategories.length === 0 && (
        <div className="text-center py-12">
          <Tag className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No categories found</h3>
          <p className="text-gray-600 mb-4">
            {searchQuery || filterStatus !== 'all' 
              ? 'Try adjusting your search or filters' 
              : 'Get started by creating your first category'
            }
          </p>
          {!searchQuery && filterStatus === 'all' && (
            <Button onClick={handleCreateCategory}>
              <Plus className="w-4 h-4 mr-2" />
              Create Category
            </Button>
          )}
        </div>
      )}

      {/* Category Form Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Tag className="w-5 h-5" />
              {editingCategory ? 'Edit Category' : 'Create New Category'}
            </DialogTitle>
            <DialogDescription>
              {editingCategory ? 'Update category details and SEO settings.' : 'Create a new category to organize your travel content.'}
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="seo">SEO Settings</TabsTrigger>
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Category Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Destinations, Travel Tips"
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="color">Color</Label>
                  <div className="flex items-center gap-2 mt-2">
                    <Input
                      type="color"
                      value={formData.color}
                      onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                      className="w-16 h-10 p-1 border rounded"
                    />
                    <Input
                      value={formData.color}
                      onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                      placeholder="#6B46C1"
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of this category"
                  className="mt-2"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="parent_category">Parent Category (Optional)</Label>
                  <Select 
                    value={formData.parent_category_id || ''} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, parent_category_id: value || null }))}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Select parent category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No parent category</SelectItem>
                      {categories
                        .filter(cat => cat.id !== editingCategory?.id)
                        .map(cat => (
                          <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                        ))
                      }
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="sort_order">Sort Order</Label>
                  <Input
                    id="sort_order"
                    type="number"
                    value={formData.sort_order}
                    onChange={(e) => setFormData(prev => ({ ...prev, sort_order: parseInt(e.target.value) || 0 }))}
                    placeholder="0"
                    className="mt-2"
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="seo" className="space-y-4">
              <div>
                <Label htmlFor="seo_title">SEO Title</Label>
                <Input
                  id="seo_title"
                  value={formData.seo_title}
                  onChange={(e) => setFormData(prev => ({ ...prev, seo_title: e.target.value }))}
                  placeholder="SEO optimized title"
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="seo_description">SEO Description</Label>
                <Textarea
                  id="seo_description"
                  value={formData.seo_description}
                  onChange={(e) => setFormData(prev => ({ ...prev, seo_description: e.target.value }))}
                  placeholder="SEO meta description"
                  className="mt-2"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="meta_keywords">Meta Keywords</Label>
                <Input
                  id="meta_keywords"
                  value={formData.meta_keywords}
                  onChange={(e) => setFormData(prev => ({ ...prev, meta_keywords: e.target.value }))}
                  placeholder="travel, destinations, tips (comma separated)"
                  className="mt-2"
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="og_title">Open Graph Title</Label>
                  <Input
                    id="og_title"
                    value={formData.og_title}
                    onChange={(e) => setFormData(prev => ({ ...prev, og_title: e.target.value }))}
                    placeholder="Social media title"
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="og_image">Open Graph Image URL</Label>
                  <Input
                    id="og_image"
                    value={formData.og_image}
                    onChange={(e) => setFormData(prev => ({ ...prev, og_image: e.target.value }))}
                    placeholder="https://example.com/image.jpg"
                    className="mt-2"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="og_description">Open Graph Description</Label>
                <Textarea
                  id="og_description"
                  value={formData.og_description}
                  onChange={(e) => setFormData(prev => ({ ...prev, og_description: e.target.value }))}
                  placeholder="Social media description"
                  className="mt-2"
                  rows={3}
                />
              </div>
            </TabsContent>

            <TabsContent value="content" className="space-y-4">
              <div>
                <Label htmlFor="featured_image">Featured Image URL</Label>
                <Input
                  id="featured_image"
                  value={formData.featured_image}
                  onChange={(e) => setFormData(prev => ({ ...prev, featured_image: e.target.value }))}
                  placeholder="https://example.com/featured-image.jpg"
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="custom_content">Custom Content (HTML)</Label>
                <Textarea
                  id="custom_content"
                  value={formData.custom_content}
                  onChange={(e) => setFormData(prev => ({ ...prev, custom_content: e.target.value }))}
                  placeholder="Rich HTML content for category landing page"
                  className="mt-2 font-mono text-sm"
                  rows={8}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Add custom HTML content that will appear on the category landing page
                </p>
              </div>
            </TabsContent>

            <TabsContent value="settings" className="space-y-6">
              <div>
                <Label>Visibility</Label>
                <Select 
                  value={formData.visibility} 
                  onValueChange={(value: 'public' | 'private' | 'draft') => setFormData(prev => ({ ...prev, visibility: value }))}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Public - Visible to everyone</SelectItem>
                    <SelectItem value="private">Private - Restricted access</SelectItem>
                    <SelectItem value="draft">Draft - Not visible on frontend</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Published</Label>
                  <p className="text-sm text-gray-500">Make this category visible on the website</p>
                </div>
                <Switch
                  checked={formData.is_published}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_published: checked }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Featured</Label>
                  <p className="text-sm text-gray-500">Show this category in featured sections</p>
                </div>
                <Switch
                  checked={formData.is_featured}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_featured: checked }))}
                />
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex gap-2 pt-6 border-t">
            <Button 
              onClick={handleSubmit}
              disabled={isSubmitting || !formData.name.trim()}
              className="flex-1"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {editingCategory ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                <>
                  {editingCategory ? 'Update Category' : 'Create Category'}
                </>
              )}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setShowDialog(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}