'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Code, AlertTriangle, CheckCircle, Eye, Save, RotateCcw } from 'lucide-react'
import { validateJSONLD, StructuredDataType, generateStructuredData } from '@/lib/structuredData'

interface StructuredDataEditorProps {
  initialData?: {
    structured_data_type?: string
    custom_json_ld?: string
    structured_data_enabled?: boolean
    schema_override_priority?: number
  }
  contentData: Record<string, any>
  onSave: (data: any) => void
  readonly?: boolean
}

const SCHEMA_TYPES: { value: StructuredDataType; label: string; description: string }[] = [
  { value: 'TouristAttraction', label: 'Tourist Attraction', description: 'For tours and attractions' },
  { value: 'LocalBusiness', label: 'Local Business', description: 'For business/company information' },
  { value: 'Product', label: 'Product', description: 'For tour packages and products' },
  { value: 'Event', label: 'Event', description: 'For scheduled tours and events' },
  { value: 'Article', label: 'Article', description: 'For articles and guides' },
  { value: 'BlogPosting', label: 'Blog Post', description: 'For blog posts and stories' },
  { value: 'TravelGuide', label: 'Travel Guide', description: 'For travel guides and itineraries' },
  { value: 'TouristDestination', label: 'Tourist Destination', description: 'For destination information' },
  { value: 'Organization', label: 'Organization', description: 'For company/organization data' },
  { value: 'WebSite', label: 'Website', description: 'For website-level schema' },
  { value: 'BreadcrumbList', label: 'Breadcrumbs', description: 'For navigation breadcrumbs' },
  { value: 'FAQPage', label: 'FAQ Page', description: 'For FAQ sections' },
  { value: 'Review', label: 'Review', description: 'For customer reviews' },
  { value: 'Offer', label: 'Offer', description: 'For pricing and offers' },
  { value: 'Service', label: 'Service', description: 'For service descriptions' }
]

export function StructuredDataEditor({ 
  initialData, 
  contentData, 
  onSave, 
  readonly = false 
}: StructuredDataEditorProps) {
  const [enabled, setEnabled] = useState(initialData?.structured_data_enabled ?? true)
  const [schemaType, setSchemaType] = useState<StructuredDataType>(
    (initialData?.structured_data_type as StructuredDataType) || 'BlogPosting'
  )
  const [customJsonLd, setCustomJsonLd] = useState(initialData?.custom_json_ld || '')
  const [priority, setPriority] = useState(initialData?.schema_override_priority || 0)
  const [validation, setValidation] = useState<{ isValid: boolean; error?: string; parsed?: any }>({ isValid: true })
  const [previewData, setPreviewData] = useState<any>(null)
  const [schemaMode, setSchemaMode] = useState<'auto' | 'custom'>('auto')

  // Validate JSON-LD when it changes
  useEffect(() => {
    if (customJsonLd.trim()) {
      const result = validateJSONLD(customJsonLd)
      setValidation(result)
    } else {
      setValidation({ isValid: true })
    }
  }, [customJsonLd])

  // Generate preview of automatic schema
  useEffect(() => {
    try {
      const generatedSchemas = generateStructuredData({
        type: schemaType,
        data: {
          title: contentData.title,
          description: contentData.excerpt || contentData.description,
          url: contentData.url || (contentData.slug ? `/blog/${contentData.slug}` : ''),
          published_at: contentData.published_at,
          updated_at: contentData.updated_at,
          author: contentData.author?.display_name || 'CuddlyNest Team',
          featured_image: contentData.featured_image,
          backgroundImage: contentData.backgroundImage,
          reading_time: contentData.reading_time,
          ...contentData
        }
      })
      
      setPreviewData(generatedSchemas[0] || null)
    } catch (error) {
      console.error('Error generating preview:', error)
      setPreviewData(null)
    }
  }, [schemaType, contentData])

  const handleSave = () => {
    if (!validation.isValid && customJsonLd.trim()) {
      return
    }

    onSave({
      structured_data_enabled: enabled,
      structured_data_type: schemaType,
      custom_json_ld: customJsonLd.trim() || null,
      schema_override_priority: priority
    })
  }

  const handleReset = () => {
    setEnabled(initialData?.structured_data_enabled ?? true)
    setSchemaType((initialData?.structured_data_type as StructuredDataType) || 'BlogPosting')
    setCustomJsonLd(initialData?.custom_json_ld || '')
    setPriority(initialData?.schema_override_priority || 0)
  }

  const handleUseAutoSchema = () => {
    if (previewData) {
      setCustomJsonLd(JSON.stringify(previewData, null, 2))
      setSchemaMode('custom')
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Code className="h-5 w-5" />
          Structured Data (Schema.org)
          <Badge variant="secondary">SEO</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Enable/Disable Toggle */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label>Enable Structured Data</Label>
            <p className="text-sm text-gray-600">Add schema.org markup to improve search visibility</p>
          </div>
          <Switch
            checked={enabled}
            onCheckedChange={setEnabled}
            disabled={readonly}
          />
        </div>

        {enabled && (
          <>
            {/* Schema Type Selection */}
            <div className="space-y-2">
              <Label>Schema Type</Label>
              <Select
                value={schemaType}
                onValueChange={(value) => setSchemaType(value as StructuredDataType)}
                disabled={readonly}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SCHEMA_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div>
                        <div className="font-medium">{type.label}</div>
                        <div className="text-xs text-gray-500">{type.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Schema Mode Tabs */}
            <Tabs value={schemaMode} onValueChange={(value) => setSchemaMode(value as 'auto' | 'custom')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="auto">Automatic Generation</TabsTrigger>
                <TabsTrigger value="custom">Custom JSON-LD</TabsTrigger>
              </TabsList>

              {/* Automatic Generation Tab */}
              <TabsContent value="auto" className="space-y-4">
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Schema will be automatically generated based on your content and the selected type.
                  </AlertDescription>
                </Alert>

                {/* Preview */}
                {previewData && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Generated Schema Preview</Label>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleUseAutoSchema}
                        disabled={readonly}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Edit as Custom
                      </Button>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-auto">
                      <pre className="text-xs text-gray-700">
                        {JSON.stringify(previewData, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* Custom JSON-LD Tab */}
              <TabsContent value="custom" className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Custom JSON-LD Schema</Label>
                    {validation.isValid ? (
                      <Badge className="bg-green-200 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Valid
                      </Badge>
                    ) : (
                      <Badge className="bg-red-200 text-red-800">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Invalid
                      </Badge>
                    )}
                  </div>
                  
                  <Textarea
                    value={customJsonLd}
                    onChange={(e) => setCustomJsonLd(e.target.value)}
                    placeholder="Enter custom JSON-LD schema..."
                    rows={12}
                    className="font-mono text-sm"
                    disabled={readonly}
                  />
                  
                  {!validation.isValid && validation.error && (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>{validation.error}</AlertDescription>
                    </Alert>
                  )}
                </div>

                {/* JSON-LD Tips */}
                <Alert>
                  <Code className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Tips:</strong> Use schema.org markup. Include @context and @type properties. 
                    Test your schema at <a href="https://search.google.com/test/rich-results" target="_blank" rel="noopener" className="text-blue-600 hover:underline">Google's Rich Results Test</a>.
                  </AlertDescription>
                </Alert>
              </TabsContent>
            </Tabs>

            {/* Priority Setting */}
            <div className="space-y-2">
              <Label>Schema Priority (Advanced)</Label>
              <Select
                value={priority.toString()}
                onValueChange={(value) => setPriority(parseInt(value))}
                disabled={readonly}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Normal (0)</SelectItem>
                  <SelectItem value="1">High (1)</SelectItem>
                  <SelectItem value="2">Critical (2)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-600">
                Higher priority schemas override lower priority ones when multiple schemas are present.
              </p>
            </div>

            {/* Action Buttons */}
            {!readonly && (
              <div className="flex gap-2 pt-4">
                <Button onClick={handleSave} className="flex-1">
                  <Save className="h-4 w-4 mr-2" />
                  Save Schema Settings
                </Button>
                <Button variant="outline" onClick={handleReset}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}