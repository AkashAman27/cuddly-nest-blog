'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { 
  Languages, 
  Globe, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  ExternalLink,
  Settings,
  Loader2,
  Edit,
  Trash2,
  RefreshCw,
  Search,
  Filter,
  Download,
  Upload
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { getSupportedLanguages } from '@/lib/constants/supportedLanguages'

interface BulkTranslation {
  id: string
  original_post_id: string
  original_post_title: string
  original_post_slug: string
  language_code: string
  translated_title: string
  translated_slug: string
  translation_status: 'pending' | 'translating' | 'completed' | 'failed'
  translated_at?: string
  created_at: string
  updated_at: string
  sectionsCount: number
  language: {
    code: string
    name: string
    native_name: string
    flag_emoji: string
  }
}

interface BulkTranslationManagerProps {
  onTranslationEdit: (translationId: string) => void
}

export function BulkTranslationManager({ onTranslationEdit }: BulkTranslationManagerProps) {
  const [translations, setTranslations] = useState<BulkTranslation[]>([])
  const [filteredTranslations, setFilteredTranslations] = useState<BulkTranslation[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [languageFilter, setLanguageFilter] = useState<string>('all')
  const [selectedTranslations, setSelectedTranslations] = useState<string[]>([])
  const [bulkOperating, setBulkOperating] = useState(false)
  const [bulkProgress, setBulkProgress] = useState({
    total: 0,
    processed: 0,
    successful: 0,
    failed: 0,
    current: '',
    isRunning: false
  })
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const supportedLanguages = getSupportedLanguages()

  useEffect(() => {
    fetchAllTranslations()
  }, [])

  useEffect(() => {
    filterTranslations()
  }, [translations, searchQuery, statusFilter, languageFilter])

  const fetchAllTranslations = async () => {
    try {
      setLoading(true)
      setError(null)

      // Get all translations with post information
      const { data: translationsData, error: translationsError } = await supabase
        .from('post_translations')
        .select(`
          *,
          language:languages!post_translations_language_code_fkey(*),
          original_post:modern_posts!post_translations_original_post_id_fkey(
            title,
            slug
          )
        `)
        .order('updated_at', { ascending: false })

      if (translationsError) throw translationsError

      // Get section counts for each translation
      const translationsWithCounts = await Promise.all(
        (translationsData || []).map(async (translation) => {
          const { count } = await supabase
            .from('translated_sections')
            .select('*', { count: 'exact', head: true })
            .eq('translation_id', translation.id)

          return {
            ...translation,
            original_post_title: translation.original_post?.title || 'Unknown',
            original_post_slug: translation.original_post?.slug || 'unknown',
            sectionsCount: count || 0
          }
        })
      )

      setTranslations(translationsWithCounts as BulkTranslation[])
    } catch (error) {
      console.error('Error fetching translations:', error)
      setError('Failed to load translations')
    } finally {
      setLoading(false)
    }
  }

  const filterTranslations = () => {
    let filtered = [...translations]

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(t => 
        t.original_post_title.toLowerCase().includes(query) ||
        t.translated_title.toLowerCase().includes(query) ||
        t.original_post_slug.toLowerCase().includes(query) ||
        t.translated_slug.toLowerCase().includes(query)
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(t => t.translation_status === statusFilter)
    }

    // Language filter
    if (languageFilter !== 'all') {
      filtered = filtered.filter(t => t.language_code === languageFilter)
    }

    setFilteredTranslations(filtered)
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedTranslations(filteredTranslations.map(t => t.id))
    } else {
      setSelectedTranslations([])
    }
  }

  const handleSelectTranslation = (translationId: string, checked: boolean) => {
    if (checked) {
      setSelectedTranslations([...selectedTranslations, translationId])
    } else {
      setSelectedTranslations(selectedTranslations.filter(id => id !== translationId))
    }
  }

  const bulkDeleteTranslations = async () => {
    if (selectedTranslations.length === 0) return

    if (!confirm(`Are you sure you want to delete ${selectedTranslations.length} translation(s)? This action cannot be undone.`)) {
      return
    }

    try {
      setBulkOperating(true)
      setError(null)

      // Delete translated sections first
      const { error: sectionsError } = await supabase
        .from('translated_sections')
        .delete()
        .in('translation_id', selectedTranslations)

      if (sectionsError) throw sectionsError

      // Delete translations
      const { error: translationsError } = await supabase
        .from('post_translations')
        .delete()
        .in('id', selectedTranslations)

      if (translationsError) throw translationsError

      // Refresh data
      await fetchAllTranslations()
      setSelectedTranslations([])
      
    } catch (error) {
      console.error('Error bulk deleting translations:', error)
      setError('Failed to delete translations')
    } finally {
      setBulkOperating(false)
    }
  }

  const bulkRetranslateAll = async () => {
    if (selectedTranslations.length === 0) {
      setError('Please select translations to re-translate')
      return
    }

    if (!confirm(`Are you sure you want to re-translate ${selectedTranslations.length} translation(s)? This will overwrite existing translations using the enhanced translation system.`)) {
      return
    }

    try {
      setBulkProgress({
        total: selectedTranslations.length,
        processed: 0,
        successful: 0,
        failed: 0,
        current: '',
        isRunning: true
      })
      setError(null)
      setSuccess(null)

      const selectedData = translations.filter(t => selectedTranslations.includes(t.id))
      
      for (let i = 0; i < selectedData.length; i++) {
        const translation = selectedData[i]
        
        setBulkProgress(prev => ({
          ...prev,
          current: `${translation.language.native_name}: ${translation.original_post_title}`,
          processed: i
        }))

        try {
          console.log(`🔄 Re-translating ${translation.id} (${translation.language_code}): ${translation.original_post_title}`)
          
          const response = await fetch('/api/translate', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              postId: translation.original_post_id,
              targetLanguage: translation.language_code,
              forceCompleteTranslation: true,
              bulkMode: true
            })
          })

          const result = await response.json()
          
          if (result.success) {
            console.log(`✅ Successfully re-translated ${translation.id}`)
            setBulkProgress(prev => ({
              ...prev,
              successful: prev.successful + 1
            }))
          } else {
            console.error(`❌ Failed to re-translate ${translation.id}:`, result.error)
            setBulkProgress(prev => ({
              ...prev,
              failed: prev.failed + 1
            }))
          }
        } catch (error) {
          console.error(`❌ Exception re-translating ${translation.id}:`, error)
          setBulkProgress(prev => ({
            ...prev,
            failed: prev.failed + 1
          }))
        }
        
        // Small delay to avoid overwhelming the API
        if (i < selectedData.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      }

      setBulkProgress(prev => ({
        ...prev,
        processed: selectedData.length,
        current: 'Complete',
        isRunning: false
      }))

      // Refresh the translations list
      await fetchAllTranslations()
      setSelectedTranslations([])
      
      const { successful, failed } = bulkProgress
      if (failed === 0) {
        setSuccess(`Successfully re-translated all ${successful} translations!`)
      } else {
        setSuccess(`Re-translation completed: ${successful} successful, ${failed} failed`)
      }
      
    } catch (error) {
      console.error('Error in bulk re-translation:', error)
      setError('Failed to complete bulk re-translation')
      setBulkProgress(prev => ({ ...prev, isRunning: false }))
    }
  }

  const exportTranslations = () => {
    const selectedData = filteredTranslations.filter(t => 
      selectedTranslations.length === 0 || selectedTranslations.includes(t.id)
    )

    const csvData = selectedData.map(t => ({
      'Original Title': t.original_post_title,
      'Original Slug': t.original_post_slug,
      'Language': t.language.native_name,
      'Language Code': t.language_code,
      'Translated Title': t.translated_title,
      'Translated Slug': t.translated_slug,
      'Status': t.translation_status,
      'Sections Count': t.sectionsCount,
      'Created': new Date(t.created_at).toLocaleDateString(),
      'Updated': new Date(t.updated_at).toLocaleDateString()
    }))

    // Convert to CSV
    const headers = Object.keys(csvData[0] || {})
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => headers.map(header => `"${row[header as keyof typeof row]}"`).join(','))
    ].join('\n')

    // Download
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `translations-export-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'translating':
        return <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
      case 'failed':
        return <AlertTriangle className="h-4 w-4 text-red-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-300'
      case 'translating':
        return 'bg-blue-100 text-blue-800 border-blue-300'
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-300'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading translations...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Statistics Dashboard - Moved to Top */}
      {translations.length > 0 && (
        <Card className="bg-white border border-black/8 shadow-sm hover:shadow-lg transition-all duration-200">
          <CardHeader className="bg-gradient-to-r from-[#5d2de6]/5 to-[#fb3aa2]/5 border-b border-black/5">
            <CardTitle className="text-lg font-medium text-[#0e0e0e] flex items-center gap-2">
              <div className="w-6 h-6 bg-[#5d2de6]/15 rounded-md flex items-center justify-center">
                <Languages className="w-4 h-4 text-[#5d2de6]" />
              </div>
              Translation Dashboard
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-[#05381A]/15 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <CheckCircle className="h-8 w-8 text-[#05381A]" />
                </div>
                <div className="text-3xl font-bold text-[#05381A] mb-1">
                  {translations.filter(t => t.translation_status === 'completed').length}
                </div>
                <div className="text-sm text-[#262626]/70 font-medium">Completed</div>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-[#5d2de6]/15 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Loader2 className="h-8 w-8 text-[#5d2de6]" />
                </div>
                <div className="text-3xl font-bold text-[#5d2de6] mb-1">
                  {translations.filter(t => t.translation_status === 'translating').length}
                </div>
                <div className="text-sm text-[#262626]/70 font-medium">In Progress</div>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                </div>
                <div className="text-3xl font-bold text-red-600 mb-1">
                  {translations.filter(t => t.translation_status === 'failed').length}
                </div>
                <div className="text-sm text-[#262626]/70 font-medium">Failed</div>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-[#fb3aa2]/15 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Globe className="h-8 w-8 text-[#fb3aa2]" />
                </div>
                <div className="text-3xl font-bold text-[#fb3aa2] mb-1">
                  {[...new Set(translations.map(t => t.language_code))].length}
                </div>
                <div className="text-sm text-[#262626]/70 font-medium">Languages</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="bg-white border border-black/8 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[#0e0e0e]">
            <Languages className="h-5 w-5 text-[#5d2de6]" />
            Bulk Translation Management
            <Badge className="bg-[#5d2de6]/15 text-[#5d2de6] border-[#5d2de6]/25">{translations.length} total</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">{success}</AlertDescription>
            </Alert>
          )}

          {/* Bulk Progress Indicator */}
          {bulkProgress.isRunning && (
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
                  <h3 className="font-semibold text-blue-900">Bulk Re-translation in Progress</h3>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-blue-800">
                    <span>Progress: {bulkProgress.processed} of {bulkProgress.total}</span>
                    <span>{Math.round((bulkProgress.processed / bulkProgress.total) * 100)}%</span>
                  </div>
                  
                  <div className="w-full bg-blue-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(bulkProgress.processed / bulkProgress.total) * 100}%` }}
                    ></div>
                  </div>
                  
                  <div className="flex justify-between text-xs text-blue-700">
                    <span>✅ Successful: {bulkProgress.successful}</span>
                    <span>❌ Failed: {bulkProgress.failed}</span>
                  </div>
                  
                  {bulkProgress.current && (
                    <p className="text-sm text-blue-800 font-medium mt-2">
                      Currently processing: {bulkProgress.current}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Filters and Search */}
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by title or slug..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="translating">Translating</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>

            <Select value={languageFilter} onValueChange={setLanguageFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Languages</SelectItem>
                {supportedLanguages.map(lang => (
                  <SelectItem key={lang.code} value={lang.code}>
                    {lang.flag_emoji} {lang.native_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button onClick={fetchAllTranslations} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>

          {/* Bulk Actions */}
          {filteredTranslations.length > 0 && (
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Checkbox
                  checked={selectedTranslations.length === filteredTranslations.length}
                  onCheckedChange={handleSelectAll}
                />
                <span className="text-sm text-gray-600">
                  {selectedTranslations.length > 0 
                    ? `${selectedTranslations.length} selected`
                    : `${filteredTranslations.length} translations`
                  }
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <Button 
                  onClick={exportTranslations}
                  variant="outline" 
                  size="sm"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
                
                {selectedTranslations.length > 0 && (
                  <>
                    <Button
                      onClick={bulkRetranslateAll}
                      disabled={bulkProgress.isRunning}
                      variant="default"
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <RefreshCw className={`h-4 w-4 mr-2 ${bulkProgress.isRunning ? 'animate-spin' : ''}`} />
                      {bulkProgress.isRunning ? 'Re-translating...' : `Re-translate (${selectedTranslations.length})`}
                    </Button>
                    
                    <Button
                      onClick={bulkDeleteTranslations}
                      disabled={bulkOperating || bulkProgress.isRunning}
                      variant="destructive"
                      size="sm"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      {bulkOperating ? 'Deleting...' : `Delete (${selectedTranslations.length})`}
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Translations List */}
          <div className="space-y-3">
            {filteredTranslations.length === 0 ? (
              <div className="text-center py-12">
                <Languages className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {searchQuery || statusFilter !== 'all' || languageFilter !== 'all' 
                    ? 'No translations match your filters' 
                    : 'No translations found'
                  }
                </h3>
                <p className="text-gray-600">
                  {searchQuery || statusFilter !== 'all' || languageFilter !== 'all'
                    ? 'Try adjusting your search criteria'
                    : 'Create translations from individual posts to see them here'
                  }
                </p>
              </div>
            ) : (
              filteredTranslations.map((translation) => (
                <Card key={translation.id} className="hover:bg-gray-50 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={selectedTranslations.includes(translation.id)}
                        onCheckedChange={(checked) => 
                          handleSelectTranslation(translation.id, checked as boolean)
                        }
                      />
                      
                      <span className="text-lg">{translation.language.flag_emoji}</span>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-gray-900">
                            {translation.translated_title}
                          </h4>
                          <Badge className={getStatusColor(translation.translation_status)}>
                            {getStatusIcon(translation.translation_status)}
                            <span className="ml-1 capitalize">{translation.translation_status}</span>
                          </Badge>
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-1">
                          Original: {translation.original_post_title}
                        </p>
                        
                        <div className="text-xs text-gray-500">
                          {translation.language.native_name} • 
                          {translation.sectionsCount} sections • 
                          Updated: {new Date(translation.updated_at).toLocaleDateString()}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {translation.translation_status === 'completed' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(
                              `/blog/${translation.original_post_slug}/${translation.language_code}`, 
                              '_blank'
                            )}
                          >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            View
                          </Button>
                        )}
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onTranslationEdit(translation.id)}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Summary Statistics */}
          {translations.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {translations.filter(t => t.translation_status === 'completed').length}
                </div>
                <div className="text-sm text-gray-600">Completed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {translations.filter(t => t.translation_status === 'translating').length}
                </div>
                <div className="text-sm text-gray-600">In Progress</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {translations.filter(t => t.translation_status === 'failed').length}
                </div>
                <div className="text-sm text-gray-600">Failed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-600">
                  {[...new Set(translations.map(t => t.language_code))].length}
                </div>
                <div className="text-sm text-gray-600">Languages</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}