'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { AuthWrapper } from '@/components/admin/AuthWrapper'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { 
  Search, 
  Languages, 
  Edit, 
  Eye, 
  RefreshCw,
  Clock,
  CheckCircle,
  AlertTriangle,
  XCircle,
  ExternalLink,
  Calendar,
  Trash2,
  AlertCircle
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'
import { toast } from 'sonner'

interface Translation {
  id: string
  original_post_id: string | null
  old_original_post_id?: string
  needs_migration?: boolean
  language_code: string
  translated_title: string
  translated_excerpt: string
  translated_slug: string
  translation_status: 'in_progress' | 'completed' | 'failed'
  created_at: string
  updated_at: string
  seo_data: {
    seo_title?: string
    seo_description?: string
  }
  original_post: {
    id: string
    title: string
    slug: string
    status: string
    author: {
      display_name: string
    }
  } | null
}

export default function TranslationsPage() {
  const [translations, setTranslations] = useState<Translation[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [languageFilter, setLanguageFilter] = useState<string>('all')
  const [selectedTranslations, setSelectedTranslations] = useState<string[]>([])
  const [deleting, setDeleting] = useState<string | null>(null)

  // Language mappings
  const languageMap: { [key: string]: { name: string, flag: string } } = {
    'fr': { name: 'French', flag: '🇫🇷' },
    'it': { name: 'Italian', flag: '🇮🇹' },
    'de': { name: 'German', flag: '🇩🇪' },
    'es': { name: 'Spanish', flag: '🇪🇸' }
  }

  const statusMap = {
    'in_progress': { label: 'In Progress', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
    'completed': { label: 'Completed', color: 'bg-green-100 text-green-800', icon: CheckCircle },
    'failed': { label: 'Failed', color: 'bg-red-100 text-red-800', icon: XCircle }
  }

  const fetchTranslations = async () => {
    try {
      setLoading(true)
      
      // Fetch translations with left join to handle migration scenario
      const { data, error } = await supabase
        .from('post_translations')
        .select(`
          *,
          original_post:cuddly_nest_modern_post(
            id,
            title,
            slug,
            status,
            author:modern_authors(display_name)
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      setTranslations(data || [])
    } catch (error) {
      console.error('Error fetching translations:', error)
      toast.error('Failed to load translations')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTranslations()
    
    // Set up real-time subscription for translation status updates
    const channel = supabase
      .channel('translations_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'post_translations'
      }, (payload) => {
        console.log('Translation status changed:', payload)
        
        if (payload.eventType === 'UPDATE' && payload.new.translation_status === 'completed') {
          toast.success(`Translation completed: ${payload.new.translated_title || 'Untitled'} (${payload.new.language_code})`)
        } else if (payload.eventType === 'UPDATE' && payload.new.translation_status === 'failed') {
          toast.error(`Translation failed: ${payload.new.translated_title || 'Untitled'} (${payload.new.language_code})`)
        }
        
        // Refresh the translations list
        fetchTranslations()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  // Filter translations
  const filteredTranslations = translations.filter(translation => {
    const matchesSearch = searchQuery === '' || 
      translation.translated_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (translation.original_post?.title || '').toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || translation.translation_status === statusFilter
    const matchesLanguage = languageFilter === 'all' || translation.language_code === languageFilter
    
    return matchesSearch && matchesStatus && matchesLanguage
  })

  // Calculate stats
  const stats = {
    total: translations.length,
    completed: translations.filter(t => t.translation_status === 'completed').length,
    in_progress: translations.filter(t => t.translation_status === 'in_progress').length,
    failed: translations.filter(t => t.translation_status === 'failed').length
  }

  const handleDeleteTranslation = async (translationId: string, title: string) => {
    if (!confirm(`Are you sure you want to delete the translation: "${title}"?`)) {
      return
    }

    try {
      setDeleting(translationId)
      
      const response = await fetch('/api/admin/delete-translation', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          translationId
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete translation')
      }

      toast.success(`Translation "${title}" deleted successfully`)
      fetchTranslations() // Refresh the list
    } catch (error) {
      console.error('Error deleting translation:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to delete translation')
    } finally {
      setDeleting(null)
    }
  }

  const handleBulkDelete = async () => {
    if (selectedTranslations.length === 0) {
      toast.error('No translations selected')
      return
    }

    if (!confirm(`Are you sure you want to delete ${selectedTranslations.length} selected translation(s)?`)) {
      return
    }

    try {
      setDeleting('bulk')
      
      // Delete each selected translation
      const deletePromises = selectedTranslations.map(translationId =>
        fetch('/api/admin/delete-translation', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            translationId
          })
        })
      )

      const responses = await Promise.all(deletePromises)
      
      // Check for any failures
      const failures = responses.filter(response => !response.ok)
      
      if (failures.length > 0) {
        throw new Error(`Failed to delete ${failures.length} translations`)
      }

      toast.success(`Successfully deleted ${selectedTranslations.length} translation(s)`)
      setSelectedTranslations([])
      fetchTranslations() // Refresh the list
    } catch (error) {
      console.error('Error in bulk delete:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to delete selected translations')
    } finally {
      setDeleting(null)
    }
  }

  const handleDeleteAll = async () => {
    if (!confirm('Are you sure you want to delete ALL translations? This action cannot be undone!')) {
      return
    }

    if (!confirm('This will permanently delete ALL translation data. Are you absolutely sure?')) {
      return
    }

    try {
      setDeleting('all')
      
      const response = await fetch('/api/admin/delete-translation', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          deleteAll: true
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete all translations')
      }

      toast.success(`All translations deleted successfully (${result.deletedCount} total)`)
      setSelectedTranslations([])
      fetchTranslations() // Refresh the list
    } catch (error) {
      console.error('Error deleting all translations:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to delete all translations')
    } finally {
      setDeleting(null)
    }
  }

  const getTranslationUrl = (translation: Translation) => {
    const slug = translation.translated_slug
    const slugParts = slug.split('/')
    
    if (slugParts.length >= 2) {
      // Has country: thailand/post-name -> /blog/thailand/fr/post-name
      const country = slugParts[0]
      const postSlug = slugParts.slice(1).join('/')
      return `/blog/${country}/${translation.language_code}/${postSlug}`
    } else {
      // No country: post-name -> /blog/post-name/fr
      return `/blog/${slug}/${translation.language_code}`
    }
  }

  if (loading) {
    return (
      <AuthWrapper>
        <div className="container mx-auto p-6">
          <div className="flex items-center justify-center min-h-[400px]">
            <RefreshCw className="h-8 w-8 animate-spin" />
          </div>
        </div>
      </AuthWrapper>
    )
  }

  return (
    <AuthWrapper>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Languages className="h-8 w-8" />
              Translations
            </h1>
            <p className="text-muted-foreground">Manage post translations and monitor progress</p>
          </div>
          <div className="flex gap-2">
            {selectedTranslations.length > 0 && (
              <Button 
                onClick={handleBulkDelete} 
                variant="destructive"
                disabled={deleting === 'bulk'}
              >
                {deleting === 'bulk' ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-2" />
                )}
                Delete Selected ({selectedTranslations.length})
              </Button>
            )}
            {stats.total > 0 && (
              <Button 
                onClick={handleDeleteAll} 
                variant="destructive"
                disabled={deleting === 'all'}
              >
                {deleting === 'all' ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <AlertCircle className="h-4 w-4 mr-2" />
                )}
                Delete All
              </Button>
            )}
            <Button onClick={fetchTranslations} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Translations</CardTitle>
              <Languages className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.in_progress}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Failed</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search translations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={languageFilter} onValueChange={setLanguageFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filter by language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Languages</SelectItem>
                  <SelectItem value="fr">🇫🇷 French</SelectItem>
                  <SelectItem value="it">🇮🇹 Italian</SelectItem>
                  <SelectItem value="de">🇩🇪 German</SelectItem>
                  <SelectItem value="es">🇪🇸 Spanish</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Translations Table */}
        <Card>
          <CardHeader>
            <CardTitle>
              Translation History ({filteredTranslations.length} of {translations.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredTranslations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Languages className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg">No translations found</p>
                <p className="text-sm">Start by translating a post from the Posts page</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <input
                        type="checkbox"
                        className="rounded"
                        checked={selectedTranslations.length === filteredTranslations.length}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedTranslations(filteredTranslations.map(t => t.id))
                          } else {
                            setSelectedTranslations([])
                          }
                        }}
                      />
                    </TableHead>
                    <TableHead>Original Post</TableHead>
                    <TableHead>Translation</TableHead>
                    <TableHead>Language</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Updated</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTranslations.map((translation) => {
                    const language = languageMap[translation.language_code]
                    const status = statusMap[translation.translation_status]
                    const StatusIcon = status.icon
                    
                    return (
                      <TableRow key={translation.id}>
                        <TableCell>
                          <input
                            type="checkbox"
                            className="rounded"
                            checked={selectedTranslations.includes(translation.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedTranslations([...selectedTranslations, translation.id])
                              } else {
                                setSelectedTranslations(selectedTranslations.filter(id => id !== translation.id))
                              }
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <div>
                            {translation.original_post ? (
                              <>
                                <div className="font-medium">{translation.original_post.title}</div>
                                <div className="text-sm text-muted-foreground">
                                  by {translation.original_post.author?.display_name || 'Unknown'}
                                </div>
                              </>
                            ) : (
                              <>
                                <div className="font-medium text-amber-600">[NEEDS MIGRATION]</div>
                                <div className="text-sm text-muted-foreground">
                                  Original post reference lost
                                </div>
                              </>
                            )}
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {translation.translated_title || 'Translating...'}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {translation.translated_slug}
                            </div>
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{language?.flag || '🏳️'}</span>
                            <span className="font-medium">
                              {language?.name || translation.language_code}
                            </span>
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <Badge className={status.color}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {status.label}
                          </Badge>
                        </TableCell>
                        
                        <TableCell className="text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(translation.created_at), 'MMM dd, yyyy')}
                          </div>
                        </TableCell>
                        
                        <TableCell className="text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {format(new Date(translation.updated_at), 'MMM dd, HH:mm')}
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {translation.translation_status === 'completed' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => window.open(getTranslationUrl(translation), '_blank')}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </Button>
                            )}
                            
                            <Button size="sm" variant="outline" asChild>
                              <Link href={`/admin/posts/translations/${translation.id}/edit`}>
                                <Edit className="h-4 w-4 mr-1" />
                                Edit
                              </Link>
                            </Button>
                            
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteTranslation(translation.id, translation.translated_title)}
                              disabled={deleting === translation.id}
                            >
                              {deleting === translation.id ? (
                                <RefreshCw className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AuthWrapper>
  )
}