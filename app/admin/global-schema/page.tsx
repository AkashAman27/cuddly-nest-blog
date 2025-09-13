'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Save, RefreshCw, Code, Globe, Eye, CheckCircle, AlertTriangle, Copy, Download, Upload } from 'lucide-react'
import { StructuredDataEditor } from '@/components/admin/StructuredDataEditor'
import Link from 'next/link'

interface HomepageSchema {
  id: string
  page_section: string
  custom_schema: any
  enabled: boolean
  created_at: string
  updated_at: string
}

const HOMEPAGE_SECTIONS = [
  { 
    key: 'global', 
    name: 'Global Organization', 
    description: 'Site-wide organization and business data',
    type: 'Organization',
    template: {
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": "CuddlyNest",
      "url": "https://cuddlynest.com",
      "description": "Discover unique stays and travel experiences worldwide",
      "sameAs": [
        "https://www.facebook.com/cuddlynest",
        "https://www.instagram.com/cuddlynest",
        "https://twitter.com/cuddlynest"
      ],
      "contactPoint": {
        "@type": "ContactPoint",
        "contactType": "customer service",
        "email": "hello@cuddlynest.com"
      }
    }
  },
  { 
    key: 'hero', 
    name: 'Hero Website', 
    description: 'Schema for the homepage hero section',
    type: 'WebSite',
    template: {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": "CuddlyNest",
      "url": "https://cuddlynest.com",
      "description": "Discover unique stays and travel experiences",
      "potentialAction": {
        "@type": "SearchAction",
        "target": "https://cuddlynest.com/search?q={search_term_string}",
        "query-input": "required name=search_term_string"
      }
    }
  },
  { 
    key: 'featured', 
    name: 'Featured Content', 
    description: 'Schema for featured tours and destinations',
    type: 'TravelAgency',
    template: {
      "@context": "https://schema.org",
      "@type": "TravelAgency",
      "name": "CuddlyNest",
      "description": "Premium travel experiences and accommodations",
      "hasOfferCatalog": {
        "@type": "OfferCatalog",
        "name": "Travel Experiences",
        "itemListElement": []
      }
    }
  },
  { 
    key: 'breadcrumb', 
    name: 'Breadcrumb Navigation', 
    description: 'Schema for site navigation breadcrumbs',
    type: 'BreadcrumbList',
    template: {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": "https://cuddlynest.com"
        }
      ]
    }
  },
  { 
    key: 'faq', 
    name: 'FAQ Schema', 
    description: 'Schema for frequently asked questions',
    type: 'FAQPage',
    template: {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": []
    }
  }
]

export default function GlobalSchemaManagement() {
  const [schemas, setSchemas] = useState<Record<string, HomepageSchema>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState('')
  const [activeSection, setActiveSection] = useState('global')
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [showPreview, setShowPreview] = useState(false)
  const [previewData, setPreviewData] = useState('')

  useEffect(() => {
    fetchSchemas()
  }, [])

  const fetchSchemas = async () => {
    try {
      const { data, error } = await supabase
        .from('homepage_schemas')
        .select('*')

      if (error) {
        console.error('Error fetching schemas:', error)
        // Don't return early - set empty schemas map
      }

      const schemasMap: Record<string, HomepageSchema> = {}
      if (data && Array.isArray(data)) {
        data.forEach(schema => {
          schemasMap[schema.page_section] = schema
        })
      }

      setSchemas(schemasMap)
    } catch (error) {
      console.error('Error:', error)
      // Set empty schemas map on error
      setSchemas({})
    } finally {
      setLoading(false)
    }
  }

  const handleSchemaChange = (section: string, schemaJson: string | null) => {
    setSchemas(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        custom_schema: schemaJson ? JSON.parse(schemaJson) : null
      }
    }))
  }

  const validateJson = (jsonString: string): boolean => {
    try {
      JSON.parse(jsonString)
      return true
    } catch {
      return false
    }
  }

  const loadTemplate = (sectionKey: string) => {
    const section = HOMEPAGE_SECTIONS.find(s => s.key === sectionKey)
    if (section?.template) {
      setSchemas(prev => ({
        ...prev,
        [sectionKey]: {
          ...prev[sectionKey],
          custom_schema: section.template
        }
      }))
      setValidationErrors(prev => ({ ...prev, [sectionKey]: '' }))
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert('Copied to clipboard!')
  }

  const exportAllSchemas = () => {
    const exportData = Object.entries(schemas).reduce((acc, [key, schema]) => {
      if (schema.custom_schema) {
        acc[key] = schema.custom_schema
      }
      return acc
    }, {} as Record<string, any>)
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'homepage-schemas.json'
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }

  const previewCombinedSchema = () => {
    const allSchemas = Object.values(schemas)
      .filter(schema => schema.custom_schema)
      .map(schema => schema.custom_schema)
    
    setPreviewData(JSON.stringify(allSchemas, null, 2))
    setShowPreview(true)
  }

  const saveSchema = async (section: string) => {
    setSaving(section)
    try {
      const schema = schemas[section]
      
      // Validate JSON if custom_schema exists
      if (schema?.custom_schema) {
        const jsonString = typeof schema.custom_schema === 'string' ? schema.custom_schema : JSON.stringify(schema.custom_schema)
        if (!validateJson(jsonString)) {
          setValidationErrors(prev => ({ ...prev, [section]: 'Invalid JSON format' }))
          return
        }
        setValidationErrors(prev => ({ ...prev, [section]: '' }))
      }
      
      const upsertData = {
        page_section: section,
        custom_schema: schema?.custom_schema || null,
        enabled: true,
        updated_at: new Date().toISOString()
      }

      if (schema?.id) {
        // Update existing
        const { error } = await supabase
          .from('homepage_schemas')
          .update(upsertData)
          .eq('id', schema.id)

        if (error) throw error
      } else {
        // Insert new
        const { data, error } = await supabase
          .from('homepage_schemas')
          .insert({
            ...upsertData,
            created_at: new Date().toISOString()
          })
          .select()
          .single()

        if (error) throw error
        
        setSchemas(prev => ({
          ...prev,
          [section]: data
        }))
      }

      alert('Schema saved successfully!')
    } catch (error: any) {
      console.error('Error saving schema:', error)
      alert(`Error saving schema: ${error.message}`)
    } finally {
      setSaving('')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white border-b border-blue-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin" className="text-blue-600 hover:text-blue-800">
                <Button variant="outline" size="sm">
                  ← Back to Admin
                </Button>
              </Link>
              <div className="flex items-center gap-2">
                <Globe className="w-6 h-6 text-blue-600" />
                <h1 className="text-2xl font-bold text-blue-900">Advanced Homepage Schema Management</h1>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={previewCombinedSchema} variant="outline">
                <Eye className="h-4 w-4 mr-2" />
                Preview All
              </Button>
              <Button onClick={exportAllSchemas} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button onClick={fetchSchemas} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
          <p className="text-blue-600 mt-2">
            Manage custom JSON-LD structured data for different homepage sections
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">Active Schemas</p>
                  <p className="text-2xl font-bold">{Object.values(schemas).filter(s => s.custom_schema).length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Code className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Total Sections</p>
                  <p className="text-2xl font-bold">{HOMEPAGE_SECTIONS.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="text-sm text-gray-600">Validation Errors</p>
                  <p className="text-2xl font-bold">{Object.values(validationErrors).filter(Boolean).length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeSection} onValueChange={setActiveSection}>
          <TabsList className="grid w-full grid-cols-6">
            {HOMEPAGE_SECTIONS.map(section => (
              <TabsTrigger key={section.key} value={section.key} className="relative text-xs">
                {section.name}
                {schemas[section.key]?.custom_schema && (
                  <Badge variant="secondary" className="ml-1 h-3 w-3 p-0 text-xs">
                    ✓
                  </Badge>
                )}
              </TabsTrigger>
            ))}
          </TabsList>

          {HOMEPAGE_SECTIONS.map(section => (
            <TabsContent key={section.key} value={section.key} className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-semibold flex items-center gap-2">
                        <Code className="h-5 w-5" />
                        {section.name}
                        <Badge variant="outline">{section.type}</Badge>
                      </h2>
                      <p className="text-sm text-gray-600 mt-1">{section.description}</p>
                      {validationErrors[section.key] && (
                        <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                          <AlertTriangle className="h-4 w-4" />
                          {validationErrors[section.key]}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => loadTemplate(section.key)}
                        variant="outline"
                        size="sm"
                      >
                        Load Template
                      </Button>
                      {schemas[section.key]?.custom_schema && (
                        <Button
                          onClick={() => copyToClipboard(JSON.stringify(schemas[section.key].custom_schema, null, 2))}
                          variant="outline"
                          size="sm"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        onClick={() => saveSchema(section.key)}
                        disabled={saving === section.key}
                      >
                        <Save className="h-4 w-4 mr-2" />
                        {saving === section.key ? 'Saving...' : 'Save Schema'}
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <StructuredDataEditor
                    initialData={{
                      structured_data_enabled: true,
                      structured_data_type: 'Organization',
                      custom_json_ld: schemas[section.key]?.custom_schema ? 
                        JSON.stringify(schemas[section.key].custom_schema, null, 2) : 
                        null,
                      schema_override_priority: 2
                    }}
                    contentData={{
                      title: 'CuddlyNest',
                      description: 'Discover unique stays and travel experiences',
                      url: 'https://cuddlynest.com',
                      name: 'CuddlyNest',
                      site_name: 'CuddlyNest'
                    }}
                    onSave={(data) => {
                      if (data.custom_json_ld) {
                        handleSchemaChange(section.key, data.custom_json_ld)
                      }
                    }}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>

        <Card className="bg-blue-50 border-blue-200 mt-8">
          <CardContent className="p-6">
            <h3 className="font-semibold text-blue-900 mb-2">💡 Advanced Schema Management Tips</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• <strong>Global Organization:</strong> Business data that appears on all pages (contact info, social links)</li>
              <li>• <strong>Hero Website:</strong> Site search functionality and navigation schema</li>
              <li>• <strong>Featured Content:</strong> Travel agency and offer catalog schemas</li>
              <li>• <strong>Reviews & Ratings:</strong> Aggregate rating data for SEO enhancement</li>
              <li>• <strong>Breadcrumb Navigation:</strong> Site structure and navigation paths</li>
              <li>• <strong>FAQ Schema:</strong> Frequently asked questions for voice search optimization</li>
              <li>• Use templates as starting points and customize for your specific needs</li>
              <li>• Test your schemas with <a href="https://search.google.com/test/rich-results" target="_blank" rel="noopener" className="text-blue-600 hover:underline font-medium">Google's Rich Results Test</a></li>
              <li>• Preview and export functionality helps with debugging and backup</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-4xl max-h-[80vh] overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Combined Schema Preview</span>
                <Button 
                  onClick={() => setShowPreview(false)}
                  variant="outline"
                  size="sm"
                >
                  <X className="h-4 w-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-100 p-4 rounded-lg max-h-96 overflow-y-auto">
                <pre className="text-sm">
                  <code>{previewData}</code>
                </pre>
              </div>
              <div className="flex gap-2 mt-4">
                <Button 
                  onClick={() => copyToClipboard(previewData)}
                  variant="outline"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy to Clipboard
                </Button>
                <Button 
                  onClick={() => {
                    const blob = new Blob([previewData], { type: 'application/json' })
                    const url = window.URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = 'combined-schemas.json'
                    document.body.appendChild(a)
                    a.click()
                    window.URL.revokeObjectURL(url)
                    document.body.removeChild(a)
                  }}
                  variant="outline"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download JSON
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}