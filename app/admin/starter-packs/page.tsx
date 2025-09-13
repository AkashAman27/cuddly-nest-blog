'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Save,
  ArrowLeft,
  RefreshCw,
  Clock,
  DollarSign,
  Camera,
  Heart,
  Star,
  MapPin,
  Sparkles,
  AlertTriangle
} from 'lucide-react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

interface StartaPackData {
  section_id: string
  section_badge: string
  section_title: string
  section_description: string
  section_position: number
  highlights: Array<{
    id: string
    icon: string
    title: string
    value: string
    description: string
    order_index: number
  }>
  features: Array<{
    id: string
    title: string
    content: string
    order_index: number
  }>
}

interface ModernPost {
  id: string
  title: string
  slug: string
  status: 'draft' | 'published'
}

const ICON_OPTIONS = [
  { value: 'clock', label: 'Clock', icon: Clock },
  { value: 'dollar', label: 'Dollar', icon: DollarSign },
  { value: 'camera', label: 'Camera', icon: Camera },
  { value: 'heart', label: 'Heart', icon: Heart },
  { value: 'star', label: 'Star', icon: Star },
  { value: 'map', label: 'Map Pin', icon: MapPin },
  { value: 'sparkles', label: 'Sparkles', icon: Sparkles }
]

export default function StarterPacksManagement() {
  const [posts, setPosts] = useState<ModernPost[]>([])
  const [starterPacks, setStarterPacks] = useState<Record<string, StartaPackData>>({})
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPost, setSelectedPost] = useState<ModernPost | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  
  const [editForm, setEditForm] = useState({
    badge: '',
    title: '',
    description: '',
    position: 3,
    highlights: [
      { icon: 'clock', title: '', value: '', description: '', order_index: 0 },
      { icon: 'dollar', title: '', value: '', description: '', order_index: 1 },
      { icon: 'camera', title: '', value: '', description: '', order_index: 2 },
      { icon: 'heart', title: '', value: '', description: '', order_index: 3 }
    ],
    features: [
      { title: '', content: '', order_index: 0 },
      { title: '', content: '', order_index: 1 }
    ]
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      // Load all posts
      const { data: postsData, error: postsError } = await supabase
        .from('cuddly_nest_modern_post')
        .select('id, title, slug, status')
        .order('updated_at', { ascending: false })

      if (postsError) throw postsError

      setPosts(postsData || [])

      // Load all starter packs
      const starterPacksData: Record<string, StartaPackData> = {}
      
      for (const post of postsData || []) {
        const { data: starterPackData, error: spError } = await supabase
          .rpc('get_starter_pack_for_post', { post_id_param: post.id })

        if (spError) {
          console.error(`Error loading starter pack for ${post.title}:`, spError)
          continue
        }

        if (starterPackData && starterPackData.length > 0) {
          starterPacksData[post.id] = starterPackData[0]
        }
      }

      setStarterPacks(starterPacksData)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateOrEdit = (post: ModernPost) => {
    const existingData = starterPacks[post.id]
    
    if (existingData) {
      // Edit existing
      setEditForm({
        badge: existingData.section_badge,
        title: existingData.section_title,
        description: existingData.section_description,
        position: existingData.section_position,
        highlights: existingData.highlights.map(h => ({
          icon: h.icon,
          title: h.title,
          value: h.value,
          description: h.description,
          order_index: h.order_index
        })),
        features: existingData.features.map(f => ({
          title: f.title,
          content: f.content,
          order_index: f.order_index
        }))
      })
    } else {
      // Create new with defaults based on post title
      const postTitle = post.title.toLowerCase()
      let defaultBadge = '🌍 Your destination starter pack'
      let defaultTitle = `Why ${post.title.split(':')[0]} Hits Different`
      
      if (postTitle.includes('naples') || postTitle.includes('amalfi')) {
        defaultBadge = '🌊 Your Southern Italy starter pack'
      } else if (postTitle.includes('rome')) {
        defaultBadge = '🏛️ Your Rome starter pack'  
      } else if (postTitle.includes('venice')) {
        defaultBadge = '🚤 Your Venice starter pack'
      } else if (postTitle.includes('florence')) {
        defaultBadge = '🎨 Your Florence starter pack'
      } else if (postTitle.includes('paris')) {
        defaultBadge = '📍 Your Paris starter pack'
      }
      
      setEditForm({
        badge: defaultBadge,
        title: defaultTitle,
        description: "Every destination has its magic - from that first moment you arrive to your last sunset, every experience here feels like it's straight out of a dream. And honestly? The hype is real.",
        position: 3,
        highlights: [
          { icon: 'clock', title: 'Perfect Duration', value: '5-7 days', description: 'Just right to explore', order_index: 0 },
          { icon: 'dollar', title: 'Budget Range', value: '€80-200', description: 'Per day, your way', order_index: 1 },
          { icon: 'camera', title: 'Must-See Spots', value: '15+ places', description: 'Instagram-worthy moments', order_index: 2 },
          { icon: 'heart', title: 'Vibe Check', value: 'Pure magic', description: "You'll never want to leave", order_index: 3 }
        ],
        features: [
          { title: 'Culture that captivates', content: 'Rich history, vibrant traditions, and experiences that leave lasting impressions.', order_index: 0 },
          { title: 'Beauty that inspires', content: 'Stunning landscapes, architectural marvels, and moments that take your breath away.', order_index: 1 }
        ]
      })
    }
    
    setSelectedPost(post)
    setShowEditModal(true)
  }

  const handleSave = async () => {
    if (!selectedPost) return

    setSaving(true)
    try {
      const existingData = starterPacks[selectedPost.id]
      
      if (existingData) {
        // Update existing starter pack
        const { error } = await supabase
          .rpc('update_starter_pack_section', {
            starter_pack_id_param: existingData.section_id,
            badge_param: editForm.badge,
            title_param: editForm.title,
            description_param: editForm.description,
            position_param: editForm.position,
            highlights_param: JSON.stringify(editForm.highlights),
            features_param: JSON.stringify(editForm.features)
          })

        if (error) throw error
      } else {
        // Create new starter pack
        const { error } = await supabase
          .rpc('insert_starter_pack_section', {
            post_id_param: selectedPost.id,
            badge_param: editForm.badge,
            title_param: editForm.title,
            description_param: editForm.description,
            position_param: editForm.position,
            highlights_param: JSON.stringify(editForm.highlights),
            features_param: JSON.stringify(editForm.features)
          })

        if (error) throw error
      }

      // Reload data
      await loadData()
      setShowEditModal(false)
      setSelectedPost(null)
      
      alert('Starter pack saved successfully!')
    } catch (error) {
      console.error('Error saving starter pack:', error)
      alert('Error saving starter pack. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (postId: string) => {
    const starterPack = starterPacks[postId]
    if (!starterPack) return

    if (!confirm('Are you sure you want to delete this starter pack?')) return

    try {
      const { error } = await supabase
        .from('starter_pack_sections')
        .delete()
        .eq('id', starterPack.section_id)

      if (error) throw error

      await loadData()
      alert('Starter pack deleted successfully!')
    } catch (error) {
      console.error('Error deleting starter pack:', error)
      alert('Error deleting starter pack. Please try again.')
    }
  }

  const filteredPosts = posts.filter(post =>
    post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.slug.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading starter packs...</p>
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
              <div className="flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-blue-600" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Starter Pack Management</h1>
                  <p className="text-gray-600">Manage "Why destination hits different" sections</p>
                </div>
              </div>
            </div>
            <Button onClick={loadData} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Search */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search posts by title or slug..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Sparkles className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Total Posts</p>
                  <p className="text-2xl font-bold">{posts.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Star className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="text-sm text-gray-600">With Starter Packs</p>
                  <p className="text-2xl font-bold">{Object.keys(starterPacks).length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="text-sm text-gray-600">Missing Starter Packs</p>
                  <p className="text-2xl font-bold">{posts.length - Object.keys(starterPacks).length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Posts List */}
        <Card>
          <CardHeader>
            <CardTitle>
              Posts ({filteredPosts.length})
              {searchQuery && ` matching "${searchQuery}"`}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredPosts.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Sparkles className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-semibold mb-2">No posts found</h3>
                <p>
                  {searchQuery 
                    ? 'Try adjusting your search criteria.' 
                    : 'No posts have been created yet.'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredPosts.map((post) => {
                  const hasStarterPack = starterPacks[post.id]
                  return (
                    <div key={post.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">
                              {post.title}
                            </h3>
                            <Badge className={post.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                              {post.status}
                            </Badge>
                            {hasStarterPack ? (
                              <Badge className="bg-blue-100 text-blue-800">
                                <Star className="w-3 h-3 mr-1" />
                                Has Starter Pack
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-orange-600 border-orange-200">
                                <AlertTriangle className="w-3 h-3 mr-1" />
                                Missing Starter Pack
                              </Badge>
                            )}
                          </div>
                          
                          <p className="text-sm text-gray-600 mb-2">
                            Slug: <code className="bg-gray-100 px-2 py-1 rounded text-xs">{post.slug}</code>
                          </p>
                          
                          {hasStarterPack && (
                            <div className="text-sm text-gray-600">
                              <p><strong>Badge:</strong> {hasStarterPack.section_badge}</p>
                              <p><strong>Title:</strong> {hasStarterPack.section_title}</p>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2 ml-4">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleCreateOrEdit(post)}
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            {hasStarterPack ? 'Edit' : 'Create'}
                          </Button>
                          {hasStarterPack && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleDelete(post.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {starterPacks[selectedPost?.id || ''] ? 'Edit' : 'Create'} Starter Pack
            </DialogTitle>
            <DialogDescription>
              Manage the "Why destination hits different" section for: {selectedPost?.title}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Basic Information</h3>
              
              <div>
                <Label htmlFor="badge">Badge</Label>
                <Input
                  id="badge"
                  value={editForm.badge}
                  onChange={(e) => setEditForm(prev => ({ ...prev, badge: e.target.value }))}
                  placeholder="e.g., 🌊 Your Southern Italy starter pack"
                />
              </div>
              
              <div>
                <Label htmlFor="title">Section Title</Label>
                <Input
                  id="title"
                  value={editForm.title}
                  onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g., Why Naples & Amalfi Coast Hits Different"
                />
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={editForm.description}
                  onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief introduction paragraph..."
                  rows={3}
                />
              </div>
              
              <div>
                <Label htmlFor="position">Position (in post)</Label>
                <Input
                  id="position"
                  type="number"
                  min="0"
                  max="10"
                  value={editForm.position}
                  onChange={(e) => setEditForm(prev => ({ ...prev, position: parseInt(e.target.value) || 0 }))}
                />
              </div>
            </div>

            {/* Highlights */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Highlight Cards (4)</h3>
              {editForm.highlights.map((highlight, index) => (
                <Card key={index} className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Icon</Label>
                      <select
                        value={highlight.icon}
                        onChange={(e) => {
                          const newHighlights = [...editForm.highlights]
                          newHighlights[index].icon = e.target.value
                          setEditForm(prev => ({ ...prev, highlights: newHighlights }))
                        }}
                        className="w-full p-2 border border-gray-300 rounded-md"
                      >
                        {ICON_OPTIONS.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label>Title</Label>
                      <Input
                        value={highlight.title}
                        onChange={(e) => {
                          const newHighlights = [...editForm.highlights]
                          newHighlights[index].title = e.target.value
                          setEditForm(prev => ({ ...prev, highlights: newHighlights }))
                        }}
                        placeholder="e.g., Perfect Duration"
                      />
                    </div>
                    <div>
                      <Label>Value</Label>
                      <Input
                        value={highlight.value}
                        onChange={(e) => {
                          const newHighlights = [...editForm.highlights]
                          newHighlights[index].value = e.target.value
                          setEditForm(prev => ({ ...prev, highlights: newHighlights }))
                        }}
                        placeholder="e.g., 6-8 days"
                      />
                    </div>
                    <div>
                      <Label>Description</Label>
                      <Input
                        value={highlight.description}
                        onChange={(e) => {
                          const newHighlights = [...editForm.highlights]
                          newHighlights[index].description = e.target.value
                          setEditForm(prev => ({ ...prev, highlights: newHighlights }))
                        }}
                        placeholder="e.g., Coast and culture combined"
                      />
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Features */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Feature Sections (2)</h3>
              {editForm.features.map((feature, index) => (
                <Card key={index} className="p-4">
                  <div className="space-y-4">
                    <div>
                      <Label>Feature Title</Label>
                      <Input
                        value={feature.title}
                        onChange={(e) => {
                          const newFeatures = [...editForm.features]
                          newFeatures[index].title = e.target.value
                          setEditForm(prev => ({ ...prev, features: newFeatures }))
                        }}
                        placeholder="e.g., Coastline that redefines beautiful"
                      />
                    </div>
                    <div>
                      <Label>Feature Content</Label>
                      <Textarea
                        value={feature.content}
                        onChange={(e) => {
                          const newFeatures = [...editForm.features]
                          newFeatures[index].content = e.target.value
                          setEditForm(prev => ({ ...prev, features: newFeatures }))
                        }}
                        placeholder="Detailed description of this feature..."
                        rows={3}
                      />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
          
          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => {
                setShowEditModal(false)
                setSelectedPost(null)
              }}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || !editForm.badge || !editForm.title || !editForm.description}
            >
              {saving ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Starter Pack
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}