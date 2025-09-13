'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Save, 
  Eye, 
  Plus, 
  Trash2, 
  GripVertical, 
  Settings,
  FileText,
  Image as ImageIcon,
  Link as LinkIcon,
  Quote,
  List,
  Table,
  MapPin,
  Star,
  Clock,
  DollarSign,
  ArrowLeft,
  Sparkles
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'

// Types for the unified editor
interface UnifiedSection {
  id: string
  template_id: string
  template_name: string
  position: number
  is_active: boolean
  data: Record<string, any>
  editMode?: boolean
  hasUnsavedChanges?: boolean
}

interface ModernPost {
  id: string
  title: string
  slug: string
  excerpt: string
  meta_description: string
  status: string
  is_featured: boolean
  created_at: string
  updated_at: string
}

// Template configurations
const SECTION_TEMPLATES = [
  {
    id: '12345678-1234-4321-8765-123456789abc',
    name: 'HTML Hero Section',
    icon: ImageIcon,
    category: 'Hero',
    description: 'Modern hero with title, description, and background image'
  },
  {
    id: '23456789-2345-4321-8765-123456789bcd',
    name: 'Table of Contents',
    icon: List,
    category: 'Navigation',
    description: 'Auto-generated navigation for your guide'
  },
  {
    id: '34567890-3456-4321-8765-123456789cde',
    name: 'Why Choose',
    icon: Star,
    category: 'Content',
    description: 'Highlight what makes this destination special'
  },
  {
    id: '45678901-4567-4321-8765-123456789def',
    name: 'Tip Boxes',
    icon: Quote,
    category: 'Content',
    description: 'Pro tips and insider secrets'
  },
  {
    id: '56789012-5678-4321-8765-123456789ef0',
    name: 'Budget Timeline',
    icon: DollarSign,
    category: 'Planning',
    description: 'Budget breakdown and timeline'
  },
  {
    id: '5251d41a-d7f8-44b6-bfaf-636d50c859b1',
    name: 'Comparison Table',
    icon: Table,
    category: 'Content',
    description: 'Compare options side by side'
  },
  {
    id: '8642ef7e-6198-4cd4-b0f9-8ba6bb868951',
    name: 'HTML Content Container',
    icon: FileText,
    category: 'Content',
    description: 'Rich content with full HTML support'
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440000',
    name: 'Rich Text Editor',
    icon: FileText,
    category: 'Content',
    description: 'WYSIWYG editor for content'
  },
  {
    id: '710f8880-c86d-4353-b16f-474c74debd31',
    name: 'FAQ Section',
    icon: Quote,
    category: 'Content',
    description: 'Frequently asked questions'
  },
  {
    id: 'c2caf0b9-68b6-48c1-999c-4cc48bd12242',
    name: 'Internal Links',
    icon: LinkIcon,
    category: 'Navigation',
    description: 'Related articles and guides'
  }
]

export default function UnifiedTravelGuideEditor() {
  // Core state
  const [post, setPost] = useState<ModernPost | null>(null)
  const [sections, setSections] = useState<UnifiedSection[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('content')
  
  // Editor state
  const [selectedSection, setSelectedSection] = useState<string | null>(null)
  const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  // Load post data from URL params or create new
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const postId = urlParams.get('postId')
    
    if (postId) {
      loadPost(postId)
    } else {
      // Create new post mode
      setLoading(false)
    }
  }, [])

  const loadPost = async (postId: string) => {
    try {
      setLoading(true)
      
      // Load post details
      const { data: postData, error: postError } = await supabase
        .from('cuddly_nest_modern_post')
        .select('*')
        .eq('id', postId)
        .single()

      if (postError) throw postError

      // Load sections
      const { data: sectionsData, error: sectionsError } = await supabase
        .from('modern_post_sections')
        .select('*')
        .eq('post_id', postId)
        .order('position')

      if (sectionsError) throw sectionsError

      setPost(postData)
      setSections(sectionsData?.map(section => ({
        id: section.id,
        template_id: section.template_id,
        template_name: SECTION_TEMPLATES.find(t => t.id === section.template_id)?.name || 'Unknown',
        position: section.position,
        is_active: section.is_active,
        data: section.data || {}
      })) || [])

    } catch (error) {
      console.error('Error loading post:', error)
      alert('Failed to load post. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const updatePost = (updates: Partial<ModernPost>) => {
    if (!post) return
    setPost({ ...post, ...updates })
    setHasUnsavedChanges(true)
  }

  const addSection = (templateId: string) => {
    const template = SECTION_TEMPLATES.find(t => t.id === templateId)
    if (!template) return

    const newSection: UnifiedSection = {
      id: `new-${Date.now()}`,
      template_id: templateId,
      template_name: template.name,
      position: sections.length,
      is_active: true,
      data: getDefaultSectionData(templateId)
    }

    setSections([...sections, newSection])
    setSelectedSection(newSection.id)
    setHasUnsavedChanges(true)
  }

  const updateSection = (sectionId: string, updates: Partial<UnifiedSection>) => {
    setSections(sections.map(section => 
      section.id === sectionId ? { ...section, ...updates } : section
    ))
    setHasUnsavedChanges(true)
  }

  const deleteSection = (sectionId: string) => {
    setSections(sections.filter(section => section.id !== sectionId))
    if (selectedSection === sectionId) {
      setSelectedSection(null)
    }
    setHasUnsavedChanges(true)
  }

  const reorderSections = useCallback((result: any) => {
    if (!result.destination) return

    const items = Array.from(sections)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    // Update positions
    const updatedSections = items.map((item, index) => ({
      ...item,
      position: index
    }))

    setSections(updatedSections)
    setHasUnsavedChanges(true)
  }, [sections])

  const saveAll = async () => {
    if (!post) return

    try {
      setSaving(true)

      // Save post details
      const { error: postError } = await supabase
        .from('cuddly_nest_modern_post')
        .upsert({
          id: post.id,
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt,
          meta_description: post.meta_description,
          status: post.status,
          is_featured: post.is_featured,
          updated_at: new Date().toISOString()
        })

      if (postError) throw postError

      // Save sections
      for (const section of sections) {
        if (section.id.startsWith('new-')) {
          // Insert new section
          const { error } = await supabase
            .from('modern_post_sections')
            .insert({
              post_id: post.id,
              template_id: section.template_id,
              position: section.position,
              is_active: section.is_active,
              data: section.data
            })
          if (error) throw error
        } else {
          // Update existing section
          const { error } = await supabase
            .from('modern_post_sections')
            .update({
              template_id: section.template_id,
              position: section.position,
              is_active: section.is_active,
              data: section.data
            })
            .eq('id', section.id)
          if (error) throw error
        }
      }

      setHasUnsavedChanges(false)
      alert('Travel guide saved successfully!')
      
      // Reload to get fresh IDs
      await loadPost(post.id)
      
    } catch (error) {
      console.error('Error saving:', error)
      alert('Failed to save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const getDefaultSectionData = (templateId: string) => {
    const defaults: Record<string, any> = {
      '12345678-1234-4321-8765-123456789abc': { // HTML Hero
        title: 'Discover Amazing Destinations',
        subtitle: 'Your perfect travel guide awaits',
        backgroundImage: '',
        location: ''
      },
      '23456789-2345-4321-8765-123456789bcd': { // Table of Contents
        title: 'What you\'ll discover in this guide',
        description: 'Navigate through our comprehensive guide'
      },
      '34567890-3456-4321-8765-123456789cde': { // Why Choose
        title: 'Why choose this destination?',
        content: 'Add compelling reasons to visit this destination...'
      },
      '45678901-4567-4321-8765-123456789def': { // Tip Boxes
        title: 'Pro Tips & Insider Secrets',
        content: 'Share your best tips and secrets...'
      },
      '56789012-5678-4321-8765-123456789ef0': { // Budget Timeline
        title: 'Budget & Timeline Planner',
        content: 'Help travelers plan their budget and timeline...'
      },
      '5251d41a-d7f8-44b6-bfaf-636d50c859b1': { // Comparison Table
        title: 'Comparison Guide',
        content: 'Compare options to help travelers decide...'
      },
      '8642ef7e-6198-4cd4-b0f9-8ba6bb868951': { // HTML Content
        title: 'Content Section',
        content: '<p>Add your HTML content here...</p>'
      },
      '550e8400-e29b-41d4-a716-446655440000': { // Rich Text
        content: 'Start writing your travel guide content...'
      },
      '710f8880-c86d-4353-b16f-474c74debd31': { // FAQ
        faqs: [
          { question: 'Sample question?', answer: 'Sample answer...' }
        ]
      },
      'c2caf0b9-68b6-48c1-999c-4cc48bd12242': { // Internal Links
        title: 'Related Travel Guides',
        links: []
      }
    }
    return defaults[templateId] || {}
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading travel guide editor...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin?view=travel-guide">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Travel Guides
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {post?.title || 'New Travel Guide'}
              </h1>
              <p className="text-gray-600">Unified Travel Guide Editor</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {hasUnsavedChanges && (
              <Badge variant="outline" className="text-amber-600 border-amber-600">
                Unsaved Changes
              </Badge>
            )}
            
            <Button
              onClick={() => window.open(`/blog/${post?.slug}?preview=true`, '_blank')}
              variant="outline"
              disabled={!post}
            >
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </Button>
            
            <Button
              onClick={saveAll}
              disabled={saving || !hasUnsavedChanges}
              className="bg-gradient-to-r from-purple-600 to-blue-600 text-white"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Saving...' : 'Save All Changes'}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-73px)]">
        {/* Left Panel - Content Editor */}
        <div className="flex-1 overflow-y-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
            <div className="bg-white border-b border-gray-200 px-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="meta">Meta & SEO</TabsTrigger>
                <TabsTrigger value="content">Content Sections</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>
            </div>

            <div className="p-6">
              <TabsContent value="meta" className="mt-0 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Post Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Title</Label>
                        <Input
                          value={post?.title || ''}
                          onChange={(e) => updatePost({ title: e.target.value })}
                          placeholder="Enter travel guide title"
                        />
                      </div>
                      <div>
                        <Label>Slug</Label>
                        <Input
                          value={post?.slug || ''}
                          onChange={(e) => updatePost({ slug: e.target.value })}
                          placeholder="url-friendly-slug"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label>Excerpt</Label>
                      <Textarea
                        value={post?.excerpt || ''}
                        onChange={(e) => updatePost({ excerpt: e.target.value })}
                        placeholder="Brief description of your travel guide"
                        rows={3}
                      />
                    </div>
                    
                    <div>
                      <Label>Meta Description (SEO)</Label>
                      <Textarea
                        value={post?.meta_description || ''}
                        onChange={(e) => updatePost({ meta_description: e.target.value })}
                        placeholder="SEO meta description (150-160 characters)"
                        rows={2}
                      />
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={post?.is_featured || false}
                          onCheckedChange={(checked) => updatePost({ is_featured: checked })}
                        />
                        <Label>Featured Guide</Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Label>Status:</Label>
                        <select
                          value={post?.status || 'draft'}
                          onChange={(e) => updatePost({ status: e.target.value })}
                          className="border border-gray-300 rounded px-3 py-1"
                        >
                          <option value="draft">Draft</option>
                          <option value="published">Published</option>
                        </select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="content" className="mt-0 space-y-6">
                {/* Section Templates */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      Add New Section
                      <Badge variant="outline">{sections.length} sections</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                      {SECTION_TEMPLATES.map((template) => {
                        const Icon = template.icon
                        return (
                          <Button
                            key={template.id}
                            variant="outline"
                            onClick={() => addSection(template.id)}
                            className="h-auto p-4 flex flex-col items-center text-center hover:bg-gradient-to-r hover:from-purple-50 hover:to-blue-50 hover:border-purple-300"
                          >
                            <Icon className="w-6 h-6 mb-2 text-purple-600" />
                            <span className="font-medium text-sm">{template.name}</span>
                            <span className="text-xs text-gray-500 mt-1">{template.category}</span>
                          </Button>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* Sections List */}
                <Card>
                  <CardHeader>
                    <CardTitle>Content Sections</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {sections.length === 0 ? (
                      <div className="text-center py-8">
                        <Sparkles className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No sections yet</h3>
                        <p className="text-gray-600">Add your first section using the templates above</p>
                      </div>
                    ) : (
                      <DragDropContext onDragEnd={reorderSections}>
                        <Droppable droppableId="sections">
                          {(provided) => (
                            <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                              {sections.map((section, index) => (
                                <Draggable key={section.id} draggableId={section.id} index={index}>
                                  {(provided, snapshot) => (
                                    <div
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      className={`border rounded-lg p-4 bg-white ${
                                        snapshot.isDragging ? 'shadow-lg scale-105' : ''
                                      } ${
                                        selectedSection === section.id ? 'ring-2 ring-purple-500' : ''
                                      }`}
                                    >
                                      <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                          <div {...provided.dragHandleProps}>
                                            <GripVertical className="w-4 h-4 text-gray-400 cursor-grab" />
                                          </div>
                                          <div>
                                            <h4 className="font-medium">{section.template_name}</h4>
                                            <p className="text-sm text-gray-500">Position {section.position + 1}</p>
                                          </div>
                                        </div>
                                        
                                        <div className="flex items-center gap-2">
                                          <Switch
                                            checked={section.is_active}
                                            onCheckedChange={(checked) => 
                                              updateSection(section.id, { is_active: checked })
                                            }
                                          />
                                          <Button
                                            size="sm"
                                            variant={selectedSection === section.id ? "default" : "outline"}
                                            onClick={() => 
                                              setSelectedSection(selectedSection === section.id ? null : section.id)
                                            }
                                          >
                                            <Settings className="w-4 h-4 mr-2" />
                                            Edit
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => deleteSection(section.id)}
                                          >
                                            <Trash2 className="w-4 h-4" />
                                          </Button>
                                        </div>
                                      </div>
                                      
                                      {/* Section Editor */}
                                      {selectedSection === section.id && (
                                        <div className="border-t pt-4 mt-4">
                                          <SectionEditor
                                            section={section}
                                            onUpdate={(updates) => updateSection(section.id, updates)}
                                          />
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </Draggable>
                              ))}
                              {provided.placeholder}
                            </div>
                          )}
                        </Droppable>
                      </DragDropContext>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="settings" className="mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle>Advanced Settings</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <Label>Categories (coming soon)</Label>
                        <p className="text-sm text-gray-500">Category management will be available in the next update</p>
                      </div>
                      <div>
                        <Label>Tags (coming soon)</Label>
                        <p className="text-sm text-gray-500">Tag management will be available in the next update</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </div>
          </Tabs>
        </div>

        {/* Right Panel - Live Preview */}
        <div className="w-96 bg-white border-l border-gray-200 overflow-y-auto">
          <div className="p-4 border-b">
            <h3 className="font-semibold mb-3">Live Preview</h3>
            <div className="flex gap-2">
              {(['desktop', 'tablet', 'mobile'] as const).map((mode) => (
                <Button
                  key={mode}
                  size="sm"
                  variant={previewMode === mode ? "default" : "outline"}
                  onClick={() => setPreviewMode(mode)}
                  className="capitalize"
                >
                  {mode}
                </Button>
              ))}
            </div>
          </div>
          
          <div className="p-4">
            <div className={`border rounded-lg bg-gray-50 ${
              previewMode === 'mobile' ? 'max-w-sm' : 
              previewMode === 'tablet' ? 'max-w-md' : 'w-full'
            } mx-auto`}>
              <div className="aspect-[4/3] flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <Eye className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-sm">Preview will show here</p>
                  <p className="text-xs">({previewMode} view)</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Section Editor Component
function SectionEditor({ 
  section, 
  onUpdate 
}: { 
  section: UnifiedSection
  onUpdate: (updates: Partial<UnifiedSection>) => void 
}) {
  const updateData = (key: string, value: any) => {
    onUpdate({
      data: { ...section.data, [key]: value }
    })
  }

  // Render different editors based on template type
  switch (section.template_id) {
    case '12345678-1234-4321-8765-123456789abc': // HTML Hero
      return (
        <div className="space-y-4">
          <div>
            <Label>Hero Title</Label>
            <Input
              value={section.data.title || ''}
              onChange={(e) => updateData('title', e.target.value)}
              placeholder="Amazing destination title"
            />
          </div>
          <div>
            <Label>Subtitle</Label>
            <Input
              value={section.data.subtitle || ''}
              onChange={(e) => updateData('subtitle', e.target.value)}
              placeholder="Compelling description"
            />
          </div>
          <div>
            <Label>Background Image URL</Label>
            <Input
              value={section.data.backgroundImage || ''}
              onChange={(e) => updateData('backgroundImage', e.target.value)}
              placeholder="https://images.unsplash.com/..."
            />
          </div>
          <div>
            <Label>Location</Label>
            <Input
              value={section.data.location || ''}
              onChange={(e) => updateData('location', e.target.value)}
              placeholder="City, Country"
            />
          </div>
        </div>
      )

    case '550e8400-e29b-41d4-a716-446655440000': // Rich Text
    case '8642ef7e-6198-4cd4-b0f9-8ba6bb868951': // HTML Content
      return (
        <div className="space-y-4">
          {section.template_id === '8642ef7e-6198-4cd4-b0f9-8ba6bb868951' && (
            <div>
              <Label>Section Title</Label>
              <Input
                value={section.data.title || ''}
                onChange={(e) => updateData('title', e.target.value)}
                placeholder="Section title"
              />
            </div>
          )}
          <div>
            <Label>Content</Label>
            <Textarea
              value={section.data.content || ''}
              onChange={(e) => updateData('content', e.target.value)}
              placeholder="Write your travel guide content here..."
              rows={8}
              className="font-mono"
            />
          </div>
        </div>
      )

    case '710f8880-c86d-4353-b16f-474c74debd31': // FAQ
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>FAQ Items</Label>
            <Button
              size="sm"
              onClick={() => {
                const currentFaqs = section.data.faqs || []
                updateData('faqs', [
                  ...currentFaqs,
                  { question: '', answer: '' }
                ])
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add FAQ
            </Button>
          </div>
          
          {(section.data.faqs || []).map((faq: any, index: number) => (
            <div key={index} className="p-3 border rounded space-y-2">
              <Input
                value={faq.question || ''}
                onChange={(e) => {
                  const updatedFaqs = [...(section.data.faqs || [])]
                  updatedFaqs[index] = { ...faq, question: e.target.value }
                  updateData('faqs', updatedFaqs)
                }}
                placeholder="Question"
              />
              <Textarea
                value={faq.answer || ''}
                onChange={(e) => {
                  const updatedFaqs = [...(section.data.faqs || [])]
                  updatedFaqs[index] = { ...faq, answer: e.target.value }
                  updateData('faqs', updatedFaqs)
                }}
                placeholder="Answer"
                rows={3}
              />
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const updatedFaqs = (section.data.faqs || []).filter((_: any, i: number) => i !== index)
                  updateData('faqs', updatedFaqs)
                }}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Remove
              </Button>
            </div>
          ))}
        </div>
      )

    default:
      return (
        <div className="space-y-4">
          <div>
            <Label>Title</Label>
            <Input
              value={section.data.title || ''}
              onChange={(e) => updateData('title', e.target.value)}
              placeholder="Section title"
            />
          </div>
          <div>
            <Label>Content</Label>
            <Textarea
              value={section.data.content || ''}
              onChange={(e) => updateData('content', e.target.value)}
              placeholder="Add your content here..."
              rows={4}
            />
          </div>
        </div>
      )
  }
}