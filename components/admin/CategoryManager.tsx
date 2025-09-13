'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  Plus, 
  X, 
  Tag, 
  AlertTriangle,
  Check,
  Loader2
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface Category {
  id: string
  name: string
  slug: string
  description?: string
  color?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

interface CategoryManagerProps {
  postId?: string
  selectedCategoryIds?: string[]
  onCategoryChange?: (categoryIds: string[]) => void
  showTitle?: boolean
}

export function CategoryManager({ 
  postId, 
  selectedCategoryIds = [], 
  onCategoryChange,
  showTitle = true 
}: CategoryManagerProps) {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedIds, setSelectedIds] = useState<string[]>(selectedCategoryIds)
  const [showNewCategoryDialog, setShowNewCategoryDialog] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategoryDescription, setNewCategoryDescription] = useState('')
  const [newCategoryColor, setNewCategoryColor] = useState('#6B46C1')
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Fetch all categories
  useEffect(() => {
    fetchCategories()
  }, [])

  // Update selected categories when prop changes
  useEffect(() => {
    setSelectedIds(selectedCategoryIds)
  }, [JSON.stringify(selectedCategoryIds)])

  const fetchCategories = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch categories from the existing modern_categories table
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('modern_categories')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true })

      if (categoriesError) throw categoriesError

      // Format categories for the component
      const formattedCategories = (categoriesData || []).map(cat => ({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        description: cat.description || '',
        color: cat.color || '#6B46C1',
        is_active: cat.is_active,
        created_at: cat.created_at,
        updated_at: cat.updated_at,
      }))

      setCategories(formattedCategories)
    } catch (error) {
      console.error('Error fetching categories:', error)
      setError('Failed to load categories')
    } finally {
      setLoading(false)
    }
  }

  const createCategory = async () => {
    if (!newCategoryName.trim()) {
      setError('Category name is required')
      return
    }

    try {
      setIsCreating(true)
      setError(null)

      const slug = newCategoryName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')

      const { data, error } = await supabase
        .from('modern_categories')
        .insert({
          name: newCategoryName.trim(),
          slug,
          description: newCategoryDescription.trim(),
          color: newCategoryColor,
          is_active: true,
        })
        .select()
        .single()

      if (error) throw error

      // Add to local state
      const newCategory: Category = {
        id: data.id,
        name: data.name,
        slug: data.slug,
        description: data.description || '',
        color: data.color || '#6B46C1',
        is_active: data.is_active,
        created_at: data.created_at,
        updated_at: data.updated_at,
      }

      setCategories(prev => [...prev, newCategory].sort((a, b) => a.name.localeCompare(b.name)))
      setSuccess('Category created successfully!')
      setShowNewCategoryDialog(false)
      setNewCategoryName('')
      setNewCategoryDescription('')
      setNewCategoryColor('#6B46C1')

      // Auto-select the new category
      const updatedSelectedIds = [...selectedIds, data.id]
      setSelectedIds(updatedSelectedIds)
      onCategoryChange?.(updatedSelectedIds)
      
    } catch (error) {
      console.error('Error creating category:', error)
      setError('Failed to create category')
    } finally {
      setIsCreating(false)
    }
  }

  const toggleCategory = (categoryId: string) => {
    const updatedSelectedIds = selectedIds.includes(categoryId)
      ? selectedIds.filter(id => id !== categoryId)
      : [...selectedIds, categoryId]
    
    setSelectedIds(updatedSelectedIds)
    onCategoryChange?.(updatedSelectedIds)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-6">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2">Loading categories...</span>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {showTitle && (
        <div className="flex items-center justify-between">
          <Label className="text-gray-700 font-medium flex items-center gap-2">
            <Tag className="w-4 h-4" />
            Categories
          </Label>
          <Dialog open={showNewCategoryDialog} onOpenChange={setShowNewCategoryDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                New Category
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Category</DialogTitle>
                <DialogDescription>
                  Add a new category for organizing blog posts.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Category Name</Label>
                  <Input
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="e.g., Travel Tips, Destinations"
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label>Description (Optional)</Label>
                  <Textarea
                    value={newCategoryDescription}
                    onChange={(e) => setNewCategoryDescription(e.target.value)}
                    placeholder="Brief description of this category"
                    className="mt-2"
                    rows={3}
                  />
                </div>
                <div>
                  <Label>Color</Label>
                  <div className="flex items-center gap-2 mt-2">
                    <Input
                      type="color"
                      value={newCategoryColor}
                      onChange={(e) => setNewCategoryColor(e.target.value)}
                      className="w-12 h-10 p-1 border rounded"
                    />
                    <Input
                      value={newCategoryColor}
                      onChange={(e) => setNewCategoryColor(e.target.value)}
                      placeholder="#6B46C1"
                      className="flex-1"
                    />
                  </div>
                </div>
                <div className="flex gap-2 pt-4">
                  <Button 
                    onClick={createCategory} 
                    disabled={isCreating || !newCategoryName.trim()}
                    className="flex-1"
                  >
                    {isCreating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-2" />
                        Create Category
                      </>
                    )}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowNewCategoryDialog(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <Check className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-3">
        {categories.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Tag className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No categories found</p>
            <p className="text-sm">Create your first category to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-60 overflow-y-auto">
            {categories.map((category) => (
              <div
                key={category.id}
                className={`
                  flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all
                  ${selectedIds.includes(category.id)
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }
                `}
                onClick={() => toggleCategory(category.id)}
              >
                <Checkbox
                  checked={selectedIds.includes(category.id)}
                  onChange={() => toggleCategory(category.id)}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: category.color }}
                    />
                    <span className="font-medium text-sm truncate">
                      {category.name}
                    </span>
                  </div>
                  {category.description && (
                    <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                      {category.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedIds.length > 0 && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-blue-900">
              Selected Categories ({selectedIds.length})
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedIds([])
                onCategoryChange?.([])
              }}
            >
              Clear All
            </Button>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {selectedIds.map((id) => {
              const category = categories.find(cat => cat.id === id)
              if (!category) return null
              
              return (
                <Badge key={id} variant="secondary" className="flex items-center gap-1">
                  <div 
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: category.color }}
                  />
                  {category.name}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleCategory(id)
                    }}
                    className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}