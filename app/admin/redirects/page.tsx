'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Trash2, Plus, Edit, Save, X, ExternalLink, Upload, Download, BarChart3, AlertTriangle, Search } from 'lucide-react'
import Link from 'next/link'

interface SlugRedirect {
  id: string
  old_slug: string
  new_slug: string
  content_type: string
  content_id: string
  created_at: string
  permanent: boolean
}

interface ContentItem {
  id: string
  title: string
  slug: string
}

export default function RedirectsManagement() {
  const [redirects, setRedirects] = useState<SlugRedirect[]>([])
  const [filteredRedirects, setFilteredRedirects] = useState<SlugRedirect[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [showBulkImport, setShowBulkImport] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [bulkImportText, setBulkImportText] = useState('')
  
  const [newRedirect, setNewRedirect] = useState({
    old_slug: '',
    new_slug: '',
    content_type: 'modern_posts',
    content_id: '',
    permanent: true
  })

  const [editForm, setEditForm] = useState({
    old_slug: '',
    new_slug: '',
    content_type: '',
    permanent: true
  })

  const [contentOptions, setContentOptions] = useState<{
    modern_posts: ContentItem[]
  }>({
    modern_posts: []
  })

  useEffect(() => {
    fetchRedirects()
    fetchContentOptions()
  }, [])

  useEffect(() => {
    // Filter redirects based on search query
    if (searchQuery.trim()) {
      const filtered = redirects.filter(redirect =>
        redirect.old_slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
        redirect.new_slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
        redirect.content_type.toLowerCase().includes(searchQuery.toLowerCase())
      )
      setFilteredRedirects(filtered)
    } else {
      setFilteredRedirects(redirects)
    }
  }, [redirects, searchQuery])

  async function fetchRedirects() {
    const { data, error } = await supabase
      .from('slug_redirects')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching redirects:', error)
    } else {
      setRedirects(data || [])
    }
    setLoading(false)
  }

  async function fetchContentOptions() {
    try {
      // Fetch blog posts
      const { data: blogPosts } = await supabase
        .from('cuddly_nest_modern_post')
        .select('id, title, slug')
        .eq('status', 'published')
        .order('title')

      setContentOptions({
        modern_posts: blogPosts || []
      })
    } catch (error) {
      console.error('Error fetching content options:', error)
    }
  }

  async function saveRedirect() {
    setSaving(true)

    try {
      const { error } = await supabase
        .from('slug_redirects')
        .insert([{
          old_slug: newRedirect.old_slug,
          new_slug: newRedirect.new_slug,
          content_type: newRedirect.content_type,
          content_id: newRedirect.content_id,
          permanent: newRedirect.permanent
        }])

      if (error) throw error

      setNewRedirect({
        old_slug: '',
        new_slug: '',
        content_type: 'modern_posts',
        content_id: '',
        permanent: true
      })
      setShowAddForm(false)
      await fetchRedirects()
    } catch (error) {
      console.error('Error saving redirect:', error)
      alert('Error saving redirect. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  async function updateRedirect(id: string) {
    setSaving(true)

    try {
      const { error } = await supabase
        .from('slug_redirects')
        .update({
          old_slug: editForm.old_slug,
          new_slug: editForm.new_slug,
          permanent: editForm.permanent
        })
        .eq('id', id)

      if (error) throw error

      setEditingId(null)
      await fetchRedirects()
    } catch (error) {
      console.error('Error updating redirect:', error)
      alert('Error updating redirect. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  async function deleteRedirect(id: string) {
    if (!confirm('Are you sure you want to delete this redirect?')) return

    try {
      const { error } = await supabase
        .from('slug_redirects')
        .delete()
        .eq('id', id)

      if (error) throw error
      await fetchRedirects()
    } catch (error) {
      console.error('Error deleting redirect:', error)
      alert('Error deleting redirect. Please try again.')
    }
  }

  function startEditing(redirect: SlugRedirect) {
    setEditingId(redirect.id)
    setEditForm({
      old_slug: redirect.old_slug,
      new_slug: redirect.new_slug,
      content_type: redirect.content_type,
      permanent: redirect.permanent
    })
  }

  function getContentTitle(contentId: string, contentType: string) {
    const items = contentOptions[contentType as keyof typeof contentOptions] || []
    const item = items.find(i => i.id === contentId)
    return item?.title || 'Unknown Content'
  }

  async function bulkImportRedirects() {
    if (!bulkImportText.trim()) return

    setSaving(true)
    try {
      const lines = bulkImportText.trim().split('\n')
      const redirectsToImport = []

      for (const line of lines) {
        const [oldSlug, newSlug, permanent] = line.split(',').map(s => s.trim())
        if (oldSlug && newSlug) {
          redirectsToImport.push({
            old_slug: oldSlug,
            new_slug: newSlug,
            content_type: 'modern_posts',
            content_id: '', // Will need to be filled manually
            permanent: permanent?.toLowerCase() === 'true' || permanent === '301'
          })
        }
      }

      if (redirectsToImport.length > 0) {
        const { error } = await supabase
          .from('slug_redirects')
          .insert(redirectsToImport)

        if (error) throw error

        setBulkImportText('')
        setShowBulkImport(false)
        await fetchRedirects()
        alert(`Successfully imported ${redirectsToImport.length} redirects`)
      }
    } catch (error) {
      console.error('Error importing redirects:', error)
      alert('Error importing redirects. Please check the format and try again.')
    } finally {
      setSaving(false)
    }
  }

  function exportRedirects() {
    const csvContent = redirects.map(redirect => 
      `${redirect.old_slug},${redirect.new_slug},${redirect.permanent}`
    ).join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.style.display = 'none'
    a.href = url
    a.download = 'redirects.csv'
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }

  if (loading) {
    return <div className="text-center py-8">Loading redirects...</div>
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">URL Redirects</h1>
          <p className="text-muted-foreground">Manage URL redirects and slug changes</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowBulkImport(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Bulk Import
          </Button>
          <Button variant="outline" onClick={exportRedirects}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button onClick={() => setShowAddForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Redirect
          </Button>
        </div>
      </div>

      {/* Search and Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Total Redirects</p>
                  <p className="text-2xl font-bold">{redirects.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="text-sm text-gray-600">Permanent (301)</p>
                  <p className="text-2xl font-bold">{redirects.filter(r => r.permanent).length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <ExternalLink className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">Temporary (302)</p>
                  <p className="text-2xl font-bold">{redirects.filter(r => !r.permanent).length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search redirects..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>
        </div>

      {/* Bulk Import Dialog */}
      {showBulkImport && (
        <Card>
            <CardHeader>
              <CardTitle>Bulk Import Redirects</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Import multiple redirects using CSV format: <code>old_slug,new_slug,permanent</code>
              </p>
              <Textarea
                placeholder={`old-post-url,new-post-url,true
another-old-url,another-new-url,false
outdated-page,updated-page,true`}
                value={bulkImportText}
                onChange={(e) => setBulkImportText(e.target.value)}
                rows={6}
                className="mb-4"
              />
              <div className="flex space-x-2">
                <Button onClick={bulkImportRedirects} disabled={saving || !bulkImportText.trim()}>
                  <Upload className="h-4 w-4 mr-2" />
                  {saving ? 'Importing...' : 'Import Redirects'}
                </Button>
                <Button variant="outline" onClick={() => setShowBulkImport(false)}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

      {/* Add New Redirect Form */}
      {showAddForm && (
        <Card>
            <CardHeader>
              <CardTitle>Create New Redirect</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="old-slug">Old Slug *</Label>
                  <Input
                    id="old-slug"
                    value={newRedirect.old_slug}
                    onChange={(e) => setNewRedirect(prev => ({ ...prev, old_slug: e.target.value }))}
                    placeholder="e.g., old-blog-post"
                  />
                </div>
                <div>
                  <Label htmlFor="new-slug">New Slug *</Label>
                  <Input
                    id="new-slug"
                    value={newRedirect.new_slug}
                    onChange={(e) => setNewRedirect(prev => ({ ...prev, new_slug: e.target.value }))}
                    placeholder="e.g., new-blog-post"
                  />
                </div>
                <div>
                  <Label htmlFor="content-type">Content Type *</Label>
                  <Select value={newRedirect.content_type} onValueChange={(value) => setNewRedirect(prev => ({ ...prev, content_type: value, content_id: '' }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="modern_posts">Blog Posts</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="content-item">Content Item *</Label>
                  <Select value={newRedirect.content_id} onValueChange={(value) => setNewRedirect(prev => ({ ...prev, content_id: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select content item" />
                    </SelectTrigger>
                    <SelectContent>
                      {contentOptions[newRedirect.content_type as keyof typeof contentOptions]?.map(item => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.title} ({item.slug})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex items-center space-x-2 mt-4">
                <Switch 
                  checked={newRedirect.permanent} 
                  onCheckedChange={(checked) => setNewRedirect(prev => ({ ...prev, permanent: checked }))}
                />
                <Label>Permanent Redirect (301)</Label>
              </div>

              <div className="flex space-x-2 mt-6">
                <Button onClick={saveRedirect} disabled={saving || !newRedirect.old_slug || !newRedirect.new_slug || !newRedirect.content_id}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Redirect'}
                </Button>
                <Button variant="outline" onClick={() => setShowAddForm(false)}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

      {/* Redirects List */}
      <Card>
          <CardHeader>
            <CardTitle>
              Existing Redirects ({filteredRedirects.length}
              {searchQuery && ` of ${redirects.length}`})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredRedirects.length === 0 ? (
              <p className="text-gray-600 text-center py-8">
                {searchQuery ? 'No redirects match your search.' : 'No redirects found. Create your first redirect above.'}
              </p>
            ) : (
              <div className="space-y-4">
                {filteredRedirects.map((redirect) => (
                  <div key={redirect.id} className="border rounded-lg p-4">
                    {editingId === redirect.id ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor={`edit-old-slug-${redirect.id}`}>Old Slug</Label>
                            <Input
                              id={`edit-old-slug-${redirect.id}`}
                              value={editForm.old_slug}
                              onChange={(e) => setEditForm(prev => ({ ...prev, old_slug: e.target.value }))}
                            />
                          </div>
                          <div>
                            <Label htmlFor={`edit-new-slug-${redirect.id}`}>New Slug</Label>
                            <Input
                              id={`edit-new-slug-${redirect.id}`}
                              value={editForm.new_slug}
                              onChange={(e) => setEditForm(prev => ({ ...prev, new_slug: e.target.value }))}
                            />
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Switch 
                            checked={editForm.permanent} 
                            onCheckedChange={(checked) => setEditForm(prev => ({ ...prev, permanent: checked }))}
                          />
                          <Label>Permanent Redirect (301)</Label>
                        </div>

                        <div className="flex space-x-2">
                          <Button onClick={() => updateRedirect(redirect.id)} disabled={saving}>
                            <Save className="h-4 w-4 mr-2" />
                            {saving ? 'Saving...' : 'Save'}
                          </Button>
                          <Button variant="outline" onClick={() => setEditingId(null)}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-4 mb-2">
                            <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                              /{redirect.old_slug}
                            </span>
                            <span className="text-gray-500">→</span>
                            <span className="font-mono text-sm bg-green-100 px-2 py-1 rounded">
                              /{redirect.new_slug}
                            </span>
                            <Badge variant={redirect.permanent ? "default" : "secondary"}>
                              {redirect.permanent ? '301' : '302'}
                            </Badge>
                          </div>
                          <div className="text-sm text-gray-600">
                            <span className="capitalize">{redirect.content_type.replace('_', ' ')}</span>: {getContentTitle(redirect.content_id, redirect.content_type)}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            Created: {new Date(redirect.created_at).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm" onClick={() => startEditing(redirect)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => deleteRedirect(redirect.id)} className="text-red-600">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
        </CardContent>
      </Card>
    </div>
  )
}