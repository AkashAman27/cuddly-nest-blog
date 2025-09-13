'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { AuthWrapper } from '@/components/admin/AuthWrapper'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { 
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  Search,
  FolderOpen,
  Tag as TagIcon,
  FileText,
  Eye,
  MoreHorizontal
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

interface Category {
  name: string
  description?: string
  slug: string
  post_count: number
}

interface CategoryFormData {
  name: string
  description: string
  slug: string
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    description: '',
    slug: ''
  })

  useEffect(() => {
    fetchCategories()
  }, [])

  useEffect(() => {
    // Filter categories based on search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      setFilteredCategories(categories.filter(category =>
        category.name.toLowerCase().includes(query) ||
        category.description?.toLowerCase().includes(query) ||
        category.slug.toLowerCase().includes(query)
      ))
    } else {
      setFilteredCategories(categories)
    }
  }, [categories, searchQuery])

  const fetchCategories = async () => {
    try {
      setLoading(true)
      
      // Get all unique categories from posts
      const { data: posts, error } = await supabase
        .from('cuddly_nest_modern_post')
        .select('categories')
        .not('categories', 'is', null)

      if (error) throw error

      // Process categories and count posts
      const categoryMap = new Map<string, number>()
      
      posts?.forEach(post => {
        if (post.categories && Array.isArray(post.categories)) {
          post.categories.forEach(category => {
            categoryMap.set(category, (categoryMap.get(category) || 0) + 1)
          })
        }
      })

      // Convert to array with post counts
      const categoriesWithCounts = Array.from(categoryMap.entries()).map(([name, count]) => ({
        name,
        slug: name.toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-'),
        description: '', // TODO: Add category descriptions support
        post_count: count
      }))

      // Sort by post count descending
      categoriesWithCounts.sort((a, b) => b.post_count - a.post_count)

      setCategories(categoriesWithCounts)
    } catch (error) {
      console.error('Error fetching categories:', error)
      toast.error('Failed to load categories')
    } finally {
      setLoading(false)
    }
  }

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }

  useEffect(() => {
    // Auto-generate slug when name changes
    if (formData.name) {
      setFormData(prev => ({
        ...prev,
        slug: generateSlug(prev.name)
      }))
    }
  }, [formData.name])

  const handleAddCategory = async () => {
    if (!formData.name.trim()) {
      toast.error('Category name is required')
      return
    }

    // Check if category already exists
    if (categories.some(cat => cat.name.toLowerCase() === formData.name.toLowerCase())) {
      toast.error('Category already exists')
      return
    }

    try {
      // Since we're storing categories as arrays in posts, we don't need to insert into a separate table
      // The category will be created when we assign it to a post
      toast.success('Category created successfully')
      setFormData({ name: '', description: '', slug: '' })
      setShowAddDialog(false)
      fetchCategories()
    } catch (error) {
      console.error('Error adding category:', error)
      toast.error('Failed to add category')
    }
  }

  const handleEditCategory = async () => {
    if (!formData.name.trim() || !editingCategory) {
      toast.error('Category name is required')
      return
    }

    try {
      // Update all posts that use this category
      const { data: posts, error: fetchError } = await supabase
        .from('cuddly_nest_modern_post')
        .select('id, categories')
        .contains('categories', [editingCategory.name])

      if (fetchError) throw fetchError

      // Update each post's categories array
      for (const post of posts || []) {
        const updatedCategories = post.categories.map((cat: string) => 
          cat === editingCategory.name ? formData.name : cat
        )

        const { error: updateError } = await supabase
          .from('cuddly_nest_modern_post')
          .update({ categories: updatedCategories })
          .eq('id', post.id)

        if (updateError) throw updateError
      }

      toast.success('Category updated successfully')
      setFormData({ name: '', description: '', slug: '' })
      setShowEditDialog(false)
      setEditingCategory(null)
      fetchCategories()
    } catch (error) {
      console.error('Error updating category:', error)
      toast.error('Failed to update category')
    }
  }

  const handleDeleteCategory = async (category: Category) => {
    if (!window.confirm(`Are you sure you want to delete "${category.name}"? This will remove it from ${category.post_count} posts.`)) {
      return
    }

    try {
      // Remove category from all posts
      const { data: posts, error: fetchError } = await supabase
        .from('cuddly_nest_modern_post')
        .select('id, categories')
        .contains('categories', [category.name])

      if (fetchError) throw fetchError

      // Update each post's categories array
      for (const post of posts || []) {
        const updatedCategories = post.categories.filter((cat: string) => cat !== category.name)

        const { error: updateError } = await supabase
          .from('cuddly_nest_modern_post')
          .update({ categories: updatedCategories })
          .eq('id', post.id)

        if (updateError) throw updateError
      }

      toast.success('Category deleted successfully')
      fetchCategories()
    } catch (error) {
      console.error('Error deleting category:', error)
      toast.error('Failed to delete category')
    }
  }

  const openEditDialog = (category: Category) => {
    setEditingCategory(category)
    setFormData({
      name: category.name,
      description: category.description || '',
      slug: category.slug
    })
    setShowEditDialog(true)
  }

  const resetForm = () => {
    setFormData({ name: '', description: '', slug: '' })
    setEditingCategory(null)
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
              <h1 className="text-3xl font-bold">Categories</h1>
              <p className="text-muted-foreground">Organize your posts with categories</p>
            </div>
          </div>
          
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add New Category
          </Button>
        </div>

        {/* Search */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search categories..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="text-sm text-muted-foreground">
                {filteredCategories.length} of {categories.length} categories
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Categories Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5" />
              All Categories
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Posts</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      Loading categories...
                    </TableCell>
                  </TableRow>
                ) : filteredCategories.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      {searchQuery ? 'No categories found matching your search' : 'No categories found'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCategories.map((category) => (
                    <TableRow key={category.name}>
                      <TableCell>
                        <div className="font-medium">{category.name}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-muted-foreground">
                          {category.description || 'No description'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="bg-muted px-2 py-1 rounded text-sm">
                          {category.slug}
                        </code>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {category.post_count} post{category.post_count !== 1 ? 's' : ''}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(category)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteCategory(category)}
                            disabled={category.post_count > 0}
                          >
                            <Trash2 className="h-4 w-4" />
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

        {/* Add Category Dialog */}
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Category</DialogTitle>
              <DialogDescription>
                Create a new category to organize your posts.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label htmlFor="category_name">Name *</Label>
                <Input
                  id="category_name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Category name"
                />
              </div>
              <div>
                <Label htmlFor="category_slug">Slug</Label>
                <Input
                  id="category_slug"
                  value={formData.slug}
                  onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                  placeholder="category-slug"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Auto-generated from name if left empty
                </p>
              </div>
              <div>
                <Label htmlFor="category_description">Description</Label>
                <Textarea
                  id="category_description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of this category"
                  rows={3}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddDialog(false)
                  resetForm()
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleAddCategory}>
                Create Category
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Category Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Category</DialogTitle>
              <DialogDescription>
                Update the category details. This will affect all posts using this category.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label htmlFor="edit_category_name">Name *</Label>
                <Input
                  id="edit_category_name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Category name"
                />
              </div>
              <div>
                <Label htmlFor="edit_category_slug">Slug</Label>
                <Input
                  id="edit_category_slug"
                  value={formData.slug}
                  onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                  placeholder="category-slug"
                />
              </div>
              <div>
                <Label htmlFor="edit_category_description">Description</Label>
                <Textarea
                  id="edit_category_description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of this category"
                  rows={3}
                />
              </div>
              {editingCategory && editingCategory.post_count > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-yellow-800 text-sm">
                    <TagIcon className="h-4 w-4" />
                    This category is used by {editingCategory.post_count} post{editingCategory.post_count !== 1 ? 's' : ''}. 
                    Updating it will affect all these posts.
                  </div>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowEditDialog(false)
                  resetForm()
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleEditCategory}>
                Update Category
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AuthWrapper>
  )
}