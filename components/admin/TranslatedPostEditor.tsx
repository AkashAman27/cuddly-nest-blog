'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Languages, 
  Globe, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  ExternalLink,
  Settings,
  Edit,
  Save,
  Eye,
  RefreshCw,
  FileText,
  Trash2
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { SectionEditor } from './section-editor'

interface TranslatedPost {
  id: string
  original_post_id: string
  language_code: string
  translated_title: string
  translated_slug: string
  translated_excerpt?: string
  translated_content?: string
  translated_seo_title?: string
  translated_seo_description?: string
  translated_seo_keywords?: string
  translation_status: 'pending' | 'translating' | 'completed' | 'failed'
  translated_at?: string
  created_at: string
  updated_at: string
  language: {
    code: string
    name: string
    native_name: string
    flag_emoji: string
  }
  translated_sections?: TranslatedSection[]
}

interface TranslatedSection {
  id: string
  translation_id: string
  original_section_id: string
  translated_data: any
  position: number
  created_at: string
  updated_at: string
}

interface TranslatedPostEditorProps {
  translationId: string
  onClose: () => void
}

export function TranslatedPostEditor({ translationId, onClose }: TranslatedPostEditorProps) {
  const [translatedPost, setTranslatedPost] = useState<TranslatedPost | null>(null)
  const [translatedSections, setTranslatedSections] = useState<TranslatedSection[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editingSection, setEditingSection] = useState<TranslatedSection | null>(null)
  const [showSectionEditor, setShowSectionEditor] = useState(false)

  useEffect(() => {
    fetchTranslatedPost()
  }, [translationId])

  const fetchTranslatedPost = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch the translated post
      const { data: postData, error: postError } = await supabase
        .from('post_translations')
        .select(`
          *,
          language:languages!post_translations_language_code_fkey(*)
        `)
        .eq('id', translationId)
        .single()

      if (postError) throw postError

      // Fetch translated sections
      const { data: sectionsData, error: sectionsError } = await supabase
        .from('translated_sections')
        .select('*')
        .eq('translation_id', translationId)
        .order('position', { ascending: true })

      if (sectionsError) throw sectionsError

      setTranslatedPost(postData)
      setTranslatedSections(sectionsData || [])
    } catch (error) {
      console.error('Error fetching translated post:', error)
      setError('Failed to load translated post')
    } finally {
      setLoading(false)
    }
  }

  const savePostDetails = async () => {
    if (!translatedPost) return

    try {
      setSaving(true)
      setError(null)

      const { error } = await supabase
        .from('post_translations')
        .update({
          translated_title: translatedPost.translated_title,
          translated_slug: translatedPost.translated_slug,
          translated_excerpt: translatedPost.translated_excerpt,
          translated_seo_title: translatedPost.translated_seo_title,
          translated_seo_description: translatedPost.translated_seo_description,
          translated_seo_keywords: translatedPost.translated_seo_keywords,
          updated_at: new Date().toISOString()
        })
        .eq('id', translationId)

      if (error) throw error

      alert('Translation updated successfully!')
    } catch (error) {
      console.error('Error saving translation:', error)
      setError('Failed to save translation')
    } finally {
      setSaving(false)
    }
  }

  const deleteTranslation = async () => {
    if (!confirm('Are you sure you want to delete this translation? This action cannot be undone.')) {
      return
    }

    try {
      setError(null)

      // Delete translated sections first
      const { error: sectionsError } = await supabase
        .from('translated_sections')
        .delete()
        .eq('translation_id', translationId)

      if (sectionsError) throw sectionsError

      // Delete the translation
      const { error: translationError } = await supabase
        .from('post_translations')
        .delete()
        .eq('id', translationId)

      if (translationError) throw translationError

      alert('Translation deleted successfully!')
      onClose()
    } catch (error) {
      console.error('Error deleting translation:', error)
      setError('Failed to delete translation')
    }
  }

  const saveSection = async (section: TranslatedSection) => {
    try {
      const { error } = await supabase
        .from('translated_sections')
        .update({
          translated_data: section.translated_data,
          updated_at: new Date().toISOString()
        })
        .eq('id', section.id)

      if (error) throw error

      // Refresh sections
      await fetchTranslatedPost()
      setShowSectionEditor(false)
      setEditingSection(null)
      
      alert('Section updated successfully!')
    } catch (error) {
      console.error('Error saving section:', error)
      setError('Failed to save section')
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading translated post...</p>
        </CardContent>
      </Card>
    )
  }

  if (!translatedPost) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Translation Not Found</h3>
          <p className="text-gray-600 mb-6">The requested translation could not be found.</p>
          <Button onClick={onClose} variant="outline">
            Go Back
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button onClick={onClose} variant="outline">
            ← Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <span className="text-lg">{translatedPost.language.flag_emoji}</span>
              {translatedPost.translated_title}
            </h1>
            <p className="text-gray-600">
              {translatedPost.language.native_name} ({translatedPost.language.name}) Translation
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge 
            variant={translatedPost.translation_status === 'completed' ? 'default' : 'secondary'}
            className="capitalize"
          >
            {translatedPost.translation_status}
          </Badge>
          {translatedPost.translation_status === 'completed' && (
            <Button
              onClick={() => window.open(`/blog/${translatedPost.translated_slug}`, '_blank')}
              variant="outline"
              size="sm"
            >
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </Button>
          )}
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="details" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="details">Post Details</TabsTrigger>
          <TabsTrigger value="sections">Sections ({translatedSections.length})</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Post Details Tab */}
        <TabsContent value="details" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Translation Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-700 font-medium">Translated Title</Label>
                  <Input
                    value={translatedPost.translated_title || ''}
                    onChange={(e) => setTranslatedPost({
                      ...translatedPost,
                      translated_title: e.target.value
                    })}
                    placeholder="Translated title"
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label className="text-gray-700 font-medium">Translated Slug</Label>
                  <Input
                    value={translatedPost.translated_slug || ''}
                    onChange={(e) => setTranslatedPost({
                      ...translatedPost,
                      translated_slug: e.target.value
                    })}
                    placeholder="translated-slug"
                    className="mt-2"
                  />
                </div>
              </div>

              <div>
                <Label className="text-gray-700 font-medium">Translated Excerpt</Label>
                <textarea
                  className="w-full h-20 mt-2 p-3 border border-gray-300 rounded-lg text-sm"
                  value={translatedPost.translated_excerpt || ''}
                  onChange={(e) => setTranslatedPost({
                    ...translatedPost,
                    translated_excerpt: e.target.value
                  })}
                  placeholder="Brief excerpt for the translated post..."
                />
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label className="text-gray-700 font-medium">SEO Title</Label>
                  <Input
                    value={translatedPost.translated_seo_title || ''}
                    onChange={(e) => setTranslatedPost({
                      ...translatedPost,
                      translated_seo_title: e.target.value
                    })}
                    placeholder="SEO title for search engines"
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label className="text-gray-700 font-medium">SEO Description</Label>
                  <textarea
                    className="w-full h-20 mt-2 p-3 border border-gray-300 rounded-lg text-sm"
                    value={translatedPost.translated_seo_description || ''}
                    onChange={(e) => setTranslatedPost({
                      ...translatedPost,
                      translated_seo_description: e.target.value
                    })}
                    placeholder="SEO meta description..."
                  />
                </div>
                <div>
                  <Label className="text-gray-700 font-medium">SEO Keywords</Label>
                  <Input
                    value={translatedPost.translated_seo_keywords || ''}
                    onChange={(e) => setTranslatedPost({
                      ...translatedPost,
                      translated_seo_keywords: e.target.value
                    })}
                    placeholder="keyword1, keyword2, keyword3"
                    className="mt-2"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={savePostDetails}
                  disabled={saving}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Translation'}
                </Button>
                
                <Button
                  onClick={() => window.open(`/blog/${translatedPost.translated_slug}`, '_blank')}
                  variant="outline"
                  disabled={translatedPost.translation_status !== 'completed'}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Preview
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sections Tab */}
        <TabsContent value="sections" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Languages className="w-5 h-5" />
                  Translated Sections ({translatedSections.length})
                </span>
                <Button
                  onClick={fetchTranslatedPost}
                  variant="outline"
                  size="sm"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {translatedSections.length === 0 ? (
                <div className="text-center py-12">
                  <Languages className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No translated sections</h3>
                  <p className="text-gray-600">This translation doesn't have any sections yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {translatedSections.map((section, index) => (
                    <Card key={section.id} className="border-l-4 border-l-blue-500">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">
                              Section {section.position + 1}
                            </h4>
                            <p className="text-sm text-gray-600">
                              ID: {section.original_section_id}
                            </p>
                            <p className="text-xs text-gray-500">
                              Updated: {new Date(section.updated_at).toLocaleString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingSection(section)
                                setShowSectionEditor(true)
                              }}
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Translation Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Translation Information</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Language:</span>
                      <p className="font-medium">{translatedPost.language.native_name}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Status:</span>
                      <p className="font-medium capitalize">{translatedPost.translation_status}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Created:</span>
                      <p className="font-medium">{new Date(translatedPost.created_at).toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Last Updated:</span>
                      <p className="font-medium">{new Date(translatedPost.updated_at).toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-medium text-red-900 mb-2">Danger Zone</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Permanently delete this translation. This action cannot be undone.
                  </p>
                  <Button
                    onClick={deleteTranslation}
                    variant="destructive"
                    size="sm"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Translation
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Section Editor Dialog */}
      {editingSection && (
        <SectionEditor
          section={{
            id: editingSection.id,
            template_id: 'translated-section', // Special handling for translated sections
            position: editingSection.position,
            data: editingSection.translated_data,
            is_active: true,
            mobile_hidden: false,
            tablet_hidden: false,
            created_at: editingSection.created_at,
            updated_at: editingSection.updated_at
          }}
          isOpen={showSectionEditor}
          onClose={() => {
            setShowSectionEditor(false)
            setEditingSection(null)
          }}
          onSave={async (section) => {
            const updatedSection = {
              ...editingSection,
              translated_data: section.data
            }
            await saveSection(updatedSection)
          }}
        />
      )}
    </div>
  )
}