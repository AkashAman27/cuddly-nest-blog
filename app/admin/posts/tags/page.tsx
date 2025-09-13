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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { 
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  Search,
  Tag,
  Hash,
  FileText,
  TrendingUp,
  MoreHorizontal
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

interface TagItem {
  name: string
  description?: string
  slug: string
  post_count: number
  color?: string
}

interface TagFormData {
  name: string
  description: string
  slug: string
  color: string
}

export default function TagsPage() {
  const [tags, setTags] = useState<TagItem[]>([])
  const [filteredTags, setFilteredTags] = useState<TagItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editingTag, setEditingTag] = useState<TagItem | null>(null)
  const [formData, setFormData] = useState<TagFormData>({
    name: '',
    description: '',
    slug: '',
    color: '#3b82f6'
  })

  const tagColors = [
    '#3b82f6', // blue
    '#ef4444', // red
    '#10b981', // green
    '#f59e0b', // yellow
    '#8b5cf6', // purple
    '#f97316', // orange
    '#06b6d4', // cyan
    '#84cc16', // lime
    '#ec4899', // pink
    '#6b7280'  // gray
  ]

  useEffect(() => {
    fetchTags()
  }, [])

  useEffect(() => {
    // Filter tags based on search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      setFilteredTags(tags.filter(tag =>
        tag.name.toLowerCase().includes(query) ||
        tag.description?.toLowerCase().includes(query) ||
        tag.slug.toLowerCase().includes(query)
      ))
    } else {
      setFilteredTags(tags)
    }
  }, [tags, searchQuery])

  const fetchTags = async () => {
    try {
      setLoading(true)
      
      // Get all unique tags from posts
      const { data: posts, error } = await supabase
        .from('cuddly_nest_modern_post')
        .select('tags')
        .not('tags', 'is', null)

      if (error) throw error

      // Process tags and count posts
      const tagMap = new Map<string, number>()
      
      posts?.forEach(post => {
        if (post.tags && Array.isArray(post.tags)) {
          post.tags.forEach(tag => {
            tagMap.set(tag, (tagMap.get(tag) || 0) + 1)
          })
        }
      })

      // Convert to array with post counts and assign colors
      const tagsWithCounts = Array.from(tagMap.entries()).map(([name, count], index) => ({
        name,
        slug: name.toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-'),
        description: '', // TODO: Add tag descriptions support
        post_count: count,
        color: tagColors[index % tagColors.length]
      }))

      // Sort by post count descending
      tagsWithCounts.sort((a, b) => b.post_count - a.post_count)

      setTags(tagsWithCounts)
    } catch (error) {
      console.error('Error fetching tags:', error)
      toast.error('Failed to load tags')
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

  const handleAddTag = async () => {
    if (!formData.name.trim()) {
      toast.error('Tag name is required')
      return
    }

    // Check if tag already exists
    if (tags.some(tag => tag.name.toLowerCase() === formData.name.toLowerCase())) {
      toast.error('Tag already exists')
      return
    }

    try {
      // Since we're storing tags as arrays in posts, we don't need to insert into a separate table
      // The tag will be created when we assign it to a post
      toast.success('Tag created successfully')
      setFormData({ name: '', description: '', slug: '', color: '#3b82f6' })
      setShowAddDialog(false)
      fetchTags()
    } catch (error) {
      console.error('Error adding tag:', error)
      toast.error('Failed to add tag')
    }
  }

  const handleEditTag = async () => {
    if (!formData.name.trim() || !editingTag) {
      toast.error('Tag name is required')
      return
    }

    try {
      // Update all posts that use this tag
      const { data: posts, error: fetchError } = await supabase
        .from('cuddly_nest_modern_post')
        .select('id, tags')
        .contains('tags', [editingTag.name])

      if (fetchError) throw fetchError

      // Update each post's tags array
      for (const post of posts || []) {
        const updatedTags = post.tags.map((tag: string) => 
          tag === editingTag.name ? formData.name : tag
        )

        const { error: updateError } = await supabase
          .from('cuddly_nest_modern_post')
          .update({ tags: updatedTags })
          .eq('id', post.id)

        if (updateError) throw updateError
      }

      toast.success('Tag updated successfully')
      setFormData({ name: '', description: '', slug: '', color: '#3b82f6' })
      setShowEditDialog(false)
      setEditingTag(null)
      fetchTags()
    } catch (error) {
      console.error('Error updating tag:', error)
      toast.error('Failed to update tag')
    }
  }

  const handleDeleteTag = async (tag: TagItem) => {
    if (!window.confirm(`Are you sure you want to delete "${tag.name}"? This will remove it from ${tag.post_count} posts.`)) {
      return
    }

    try {
      // Remove tag from all posts
      const { data: posts, error: fetchError } = await supabase
        .from('cuddly_nest_modern_post')
        .select('id, tags')
        .contains('tags', [tag.name])

      if (fetchError) throw fetchError

      // Update each post's tags array
      for (const post of posts || []) {
        const updatedTags = post.tags.filter((t: string) => t !== tag.name)

        const { error: updateError } = await supabase
          .from('cuddly_nest_modern_post')
          .update({ tags: updatedTags })
          .eq('id', post.id)

        if (updateError) throw updateError
      }

      toast.success('Tag deleted successfully')
      fetchTags()
    } catch (error) {
      console.error('Error deleting tag:', error)
      toast.error('Failed to delete tag')
    }
  }

  const openEditDialog = (tag: TagItem) => {
    setEditingTag(tag)
    setFormData({
      name: tag.name,
      description: tag.description || '',
      slug: tag.slug,
      color: tag.color || '#3b82f6'
    })
    setShowEditDialog(true)
  }

  const resetForm = () => {
    setFormData({ name: '', description: '', slug: '', color: '#3b82f6' })
    setEditingTag(null)
  }

  const getMostUsedTags = () => {
    return tags.slice(0, 10)
  }

  const getTotalPostsWithTags = () => {
    return tags.reduce((sum, tag) => sum + tag.post_count, 0)
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
              <h1 className="text-3xl font-bold">Tags</h1>
              <p className="text-muted-foreground">Manage post tags and keywords</p>
            </div>
          </div>
          
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add New Tag
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Tag className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{tags.length}</p>
                  <p className="text-muted-foreground text-sm">Total Tags</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <FileText className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{getTotalPostsWithTags()}</p>
                  <p className="text-muted-foreground text-sm">Tagged Posts</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {tags.length > 0 ? Math.round(getTotalPostsWithTags() / tags.length) : 0}
                  </p>
                  <p className="text-muted-foreground text-sm">Avg Posts/Tag</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Popular Tags */}
        {tags.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Most Popular Tags
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {getMostUsedTags().map((tag) => (
                  <Badge
                    key={tag.name}
                    variant="secondary"
                    className="flex items-center gap-1 px-3 py-1"
                    style={{ backgroundColor: `${tag.color}15`, color: tag.color, borderColor: `${tag.color}30` }}
                  >
                    <Hash className="h-3 w-3" />
                    {tag.name}
                    <span className="ml-1 text-xs opacity-70">
                      {tag.post_count}
                    </span>
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tags..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="text-sm text-muted-foreground">
                {filteredTags.length} of {tags.length} tags
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tags Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5" />
              All Tags
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
                  <TableHead>Color</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      Loading tags...
                    </TableCell>
                  </TableRow>
                ) : filteredTags.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      {searchQuery ? 'No tags found matching your search' : 'No tags found'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTags.map((tag) => (
                    <TableRow key={tag.name}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Hash className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{tag.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-muted-foreground">
                          {tag.description || 'No description'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="bg-muted px-2 py-1 rounded text-sm">
                          {tag.slug}
                        </code>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {tag.post_count} post{tag.post_count !== 1 ? 's' : ''}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-4 h-4 rounded-full border"
                            style={{ backgroundColor: tag.color }}
                          />
                          <code className="text-xs text-muted-foreground">
                            {tag.color}
                          </code>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(tag)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteTag(tag)}
                            disabled={tag.post_count > 0}
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

        {/* Add Tag Dialog */}
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Tag</DialogTitle>
              <DialogDescription>
                Create a new tag to label and organize your posts.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label htmlFor="tag_name">Name *</Label>
                <Input
                  id="tag_name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Tag name"
                />
              </div>
              <div>
                <Label htmlFor="tag_slug">Slug</Label>
                <Input
                  id="tag_slug"
                  value={formData.slug}
                  onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                  placeholder="tag-slug"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Auto-generated from name if left empty
                </p>
              </div>
              <div>
                <Label htmlFor="tag_description">Description</Label>
                <Textarea
                  id="tag_description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of this tag"
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="tag_color">Color</Label>
                <div className="flex items-center gap-3 mt-2">
                  <Input
                    id="tag_color"
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                    className="w-16 h-10"
                  />
                  <div className="flex flex-wrap gap-2">
                    {tagColors.map((color) => (
                      <button
                        key={color}
                        type="button"
                        className="w-6 h-6 rounded-full border-2 border-white shadow-sm hover:scale-110 transition-transform"
                        style={{ backgroundColor: color }}
                        onClick={() => setFormData(prev => ({ ...prev, color }))}
                      />
                    ))}
                  </div>
                </div>
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
              <Button onClick={handleAddTag}>
                Create Tag
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Tag Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Tag</DialogTitle>
              <DialogDescription>
                Update the tag details. This will affect all posts using this tag.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label htmlFor="edit_tag_name">Name *</Label>
                <Input
                  id="edit_tag_name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Tag name"
                />
              </div>
              <div>
                <Label htmlFor="edit_tag_slug">Slug</Label>
                <Input
                  id="edit_tag_slug"
                  value={formData.slug}
                  onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                  placeholder="tag-slug"
                />
              </div>
              <div>
                <Label htmlFor="edit_tag_description">Description</Label>
                <Textarea
                  id="edit_tag_description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of this tag"
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="edit_tag_color">Color</Label>
                <div className="flex items-center gap-3 mt-2">
                  <Input
                    id="edit_tag_color"
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                    className="w-16 h-10"
                  />
                  <div className="flex flex-wrap gap-2">
                    {tagColors.map((color) => (
                      <button
                        key={color}
                        type="button"
                        className="w-6 h-6 rounded-full border-2 border-white shadow-sm hover:scale-110 transition-transform"
                        style={{ backgroundColor: color }}
                        onClick={() => setFormData(prev => ({ ...prev, color }))}
                      />
                    ))}
                  </div>
                </div>
              </div>
              {editingTag && editingTag.post_count > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-yellow-800 text-sm">
                    <Hash className="h-4 w-4" />
                    This tag is used by {editingTag.post_count} post{editingTag.post_count !== 1 ? 's' : ''}. 
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
              <Button onClick={handleEditTag}>
                Update Tag
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AuthWrapper>
  )
}