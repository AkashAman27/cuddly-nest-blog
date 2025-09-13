'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Plus, Trash2, MapPin, Clock, HelpCircle, 
  Code, Save, RotateCcw, AlertTriangle, CheckCircle 
} from 'lucide-react'
import { generateTravelGuideSchema, TravelGuideSchemaData } from '@/lib/seo/travelGuideSchema'

interface TravelGuideSchemaEditorProps {
  postData: {
    id: string
    title: string
    slug: string
    excerpt?: string
    content?: string
    destination?: string
    faq_items?: Array<{ question: string; answer: string }>
    itinerary_days?: Array<{ day: number; title: string; description: string; activities?: string[] }>
    read_time_minutes?: number
    published_at?: string
    updated_at?: string
    author?: { display_name: string }
    featured_image?: string
    focus_keyword?: string
    tags?: string[]
  }
  onSave: (data: {
    destination?: string
    faq_items?: Array<{ question: string; answer: string }>
    itinerary_days?: Array<{ day: number; title: string; description: string; activities?: string[] }>
    read_time_minutes?: number
  }) => void
  readonly?: boolean
}

export function TravelGuideSchemaEditor({ postData, onSave, readonly = false }: TravelGuideSchemaEditorProps) {
  const [destination, setDestination] = useState(postData.destination || '')
  const [readTime, setReadTime] = useState(postData.read_time_minutes || 0)
  const [faqItems, setFaqItems] = useState(postData.faq_items || [])
  const [itineraryDays, setItineraryDays] = useState(postData.itinerary_days || [])
  const [previewSchemas, setPreviewSchemas] = useState<any[]>([])

  // Generate preview schemas whenever data changes
  useEffect(() => {
    try {
      const travelGuideData: TravelGuideSchemaData = {
        id: postData.id,
        title: postData.title,
        slug: postData.slug,
        excerpt: postData.excerpt,
        content: postData.content || '',
        author_name: postData.author?.display_name || 'CuddlyNest Team',
        destination: destination,
        published_at: postData.published_at || new Date().toISOString(),
        updated_at: postData.updated_at,
        read_time_minutes: readTime,
        featured_image: postData.featured_image,
        focus_keyword: postData.focus_keyword,
        tags: postData.tags,
        faq_items: faqItems.length > 0 ? faqItems : undefined,
        itinerary_days: itineraryDays.length > 0 ? itineraryDays : undefined
      }

      const schemas = generateTravelGuideSchema(travelGuideData)
      setPreviewSchemas(schemas)
    } catch (error) {
      console.error('Error generating travel guide schema preview:', error)
      setPreviewSchemas([])
    }
  }, [destination, readTime, faqItems, itineraryDays, postData])

  const handleSave = () => {
    onSave({
      destination: destination.trim() || undefined,
      faq_items: faqItems.length > 0 ? faqItems : undefined,
      itinerary_days: itineraryDays.length > 0 ? itineraryDays : undefined,
      read_time_minutes: readTime > 0 ? readTime : undefined
    })
  }

  const handleReset = () => {
    setDestination(postData.destination || '')
    setReadTime(postData.read_time_minutes || 0)
    setFaqItems(postData.faq_items || [])
    setItineraryDays(postData.itinerary_days || [])
  }

  const addFaqItem = () => {
    setFaqItems([...faqItems, { question: '', answer: '' }])
  }

  const updateFaqItem = (index: number, field: 'question' | 'answer', value: string) => {
    const updated = [...faqItems]
    updated[index][field] = value
    setFaqItems(updated)
  }

  const removeFaqItem = (index: number) => {
    setFaqItems(faqItems.filter((_, i) => i !== index))
  }

  const addItineraryDay = () => {
    const newDay = {
      day: itineraryDays.length + 1,
      title: '',
      description: '',
      activities: []
    }
    setItineraryDays([...itineraryDays, newDay])
  }

  const updateItineraryDay = (index: number, field: keyof typeof itineraryDays[0], value: any) => {
    const updated = [...itineraryDays]
    updated[index] = { ...updated[index], [field]: value }
    setItineraryDays(updated)
  }

  const removeItineraryDay = (index: number) => {
    const updated = itineraryDays.filter((_, i) => i !== index)
    // Renumber the days
    updated.forEach((day, i) => {
      day.day = i + 1
    })
    setItineraryDays(updated)
  }

  const addActivity = (dayIndex: number) => {
    const updated = [...itineraryDays]
    updated[dayIndex].activities = [...(updated[dayIndex].activities || []), '']
    setItineraryDays(updated)
  }

  const updateActivity = (dayIndex: number, activityIndex: number, value: string) => {
    const updated = [...itineraryDays]
    if (!updated[dayIndex].activities) updated[dayIndex].activities = []
    updated[dayIndex].activities![activityIndex] = value
    setItineraryDays(updated)
  }

  const removeActivity = (dayIndex: number, activityIndex: number) => {
    const updated = [...itineraryDays]
    updated[dayIndex].activities = updated[dayIndex].activities?.filter((_, i) => i !== activityIndex) || []
    setItineraryDays(updated)
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Travel Guide Schema Configuration
          <Badge variant="secondary">Advanced SEO</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="faq">FAQ Section</TabsTrigger>
            <TabsTrigger value="itinerary">Itinerary</TabsTrigger>
            <TabsTrigger value="preview">Schema Preview</TabsTrigger>
          </TabsList>

          {/* Basic Information Tab */}
          <TabsContent value="basic" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="destination">
                  <MapPin className="inline h-4 w-4 mr-1" />
                  Destination
                </Label>
                <Input
                  id="destination"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="e.g., Paris, France"
                  disabled={readonly}
                />
                <p className="text-xs text-gray-600">
                  The main destination or location this travel guide covers
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="readTime">
                  <Clock className="inline h-4 w-4 mr-1" />
                  Reading Time (minutes)
                </Label>
                <Input
                  id="readTime"
                  type="number"
                  value={readTime}
                  onChange={(e) => setReadTime(parseInt(e.target.value) || 0)}
                  placeholder="5"
                  min="0"
                  max="300"
                  disabled={readonly}
                />
                <p className="text-xs text-gray-600">
                  Estimated reading time for this travel guide
                </p>
              </div>
            </div>
          </TabsContent>

          {/* FAQ Section Tab */}
          <TabsContent value="faq" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold flex items-center gap-2">
                  <HelpCircle className="h-4 w-4" />
                  Frequently Asked Questions
                </h3>
                <p className="text-sm text-gray-600">Add FAQ items to generate FAQ schema markup</p>
              </div>
              {!readonly && (
                <Button onClick={addFaqItem} size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Add FAQ
                </Button>
              )}
            </div>

            {faqItems.length === 0 ? (
              <Alert>
                <HelpCircle className="h-4 w-4" />
                <AlertDescription>
                  No FAQ items added. FAQ schema will help your travel guide appear in FAQ rich results.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-4">
                {faqItems.map((faq, index) => (
                  <Card key={index}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <Badge variant="outline">FAQ #{index + 1}</Badge>
                        {!readonly && (
                          <Button
                            onClick={() => removeFaqItem(index)}
                            size="sm"
                            variant="outline"
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      <div className="space-y-3">
                        <div>
                          <Label>Question</Label>
                          <Input
                            value={faq.question}
                            onChange={(e) => updateFaqItem(index, 'question', e.target.value)}
                            placeholder="What is the best time to visit...?"
                            disabled={readonly}
                          />
                        </div>
                        <div>
                          <Label>Answer</Label>
                          <Textarea
                            value={faq.answer}
                            onChange={(e) => updateFaqItem(index, 'answer', e.target.value)}
                            placeholder="The best time to visit is..."
                            rows={3}
                            disabled={readonly}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Itinerary Tab */}
          <TabsContent value="itinerary" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Travel Itinerary</h3>
                <p className="text-sm text-gray-600">Create a day-by-day itinerary for rich travel guide schema</p>
              </div>
              {!readonly && (
                <Button onClick={addItineraryDay} size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Day
                </Button>
              )}
            </div>

            {itineraryDays.length === 0 ? (
              <Alert>
                <MapPin className="h-4 w-4" />
                <AlertDescription>
                  No itinerary days added. Itinerary schema helps create rich travel guide results.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-4">
                {itineraryDays.map((day, dayIndex) => (
                  <Card key={dayIndex}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <Badge variant="outline">Day {day.day}</Badge>
                        {!readonly && (
                          <Button
                            onClick={() => removeItineraryDay(dayIndex)}
                            size="sm"
                            variant="outline"
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      <div className="space-y-3">
                        <div>
                          <Label>Day Title</Label>
                          <Input
                            value={day.title}
                            onChange={(e) => updateItineraryDay(dayIndex, 'title', e.target.value)}
                            placeholder="e.g., Exploring Downtown"
                            disabled={readonly}
                          />
                        </div>
                        <div>
                          <Label>Description</Label>
                          <Textarea
                            value={day.description}
                            onChange={(e) => updateItineraryDay(dayIndex, 'description', e.target.value)}
                            placeholder="Describe what travelers will do on this day..."
                            rows={2}
                            disabled={readonly}
                          />
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <Label>Activities</Label>
                            {!readonly && (
                              <Button
                                onClick={() => addActivity(dayIndex)}
                                size="sm"
                                variant="outline"
                              >
                                <Plus className="h-3 w-3 mr-1" />
                                Add Activity
                              </Button>
                            )}
                          </div>
                          <div className="space-y-2">
                            {(day.activities || []).map((activity, activityIndex) => (
                              <div key={activityIndex} className="flex gap-2">
                                <Input
                                  value={activity}
                                  onChange={(e) => updateActivity(dayIndex, activityIndex, e.target.value)}
                                  placeholder="e.g., Visit the Louvre Museum"
                                  disabled={readonly}
                                />
                                {!readonly && (
                                  <Button
                                    onClick={() => removeActivity(dayIndex, activityIndex)}
                                    size="sm"
                                    variant="outline"
                                    className="text-red-600"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Schema Preview Tab */}
          <TabsContent value="preview" className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Code className="h-4 w-4" />
              <h3 className="font-semibold">Generated Schema Preview</h3>
              {previewSchemas.length > 0 && (
                <Badge className="bg-green-200 text-green-800">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  {previewSchemas.length} Schema{previewSchemas.length > 1 ? 's' : ''}
                </Badge>
              )}
            </div>

            {previewSchemas.length === 0 ? (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  No schema generated. Add destination, FAQ items, or itinerary to generate travel guide schema.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-4">
                {previewSchemas.map((schema, index) => (
                  <Card key={index}>
                    <CardHeader>
                      <CardTitle className="text-sm">
                        Schema #{index + 1}: {schema['@type']}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-auto">
                        <pre className="text-xs text-gray-700">
                          {JSON.stringify(schema, null, 2)}
                        </pre>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Action Buttons */}
        {!readonly && (
          <div className="flex gap-2 pt-4">
            <Button onClick={handleSave} className="flex-1">
              <Save className="h-4 w-4 mr-2" />
              Save Travel Guide Data
            </Button>
            <Button variant="outline" onClick={handleReset}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}