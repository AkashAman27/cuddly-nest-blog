'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { 
  Save, 
  Upload, 
  Eye, 
  Settings, 
  Image as ImageIcon, 
  Type, 
  Star,
  Plus,
  X,
  Key,
  TestTube,
  CheckCircle,
  AlertTriangle
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface HomepageSettings {
  hero_title: { text: string; highlight: string }
  hero_subtitle: { text: string }
  hero_badge: { text: string }
  hero_background: { url: string; alt: string }
  logo_url: { url: string; alt: string }
  blog_logo_url: { url: string; alt: string }
  stats: { guides: string; destinations: string; for_text: string }
  featured_posts: { post_ids: string[] }
}

interface Post {
  id: string
  title: string
  slug: string
  excerpt: string
  status: string
}

export default function HomepageAdmin() {
  const [settings, setSettings] = useState<HomepageSettings | null>(null)
  const [availablePosts, setAvailablePosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [apiKey, setApiKey] = useState('')
  const [apiKeyStatus, setApiKeyStatus] = useState<'none' | 'set' | 'testing' | 'valid' | 'invalid'>('none')

  useEffect(() => {
    loadSettings()
    loadPosts()
    loadApiKey()
  }, [])

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('homepage_settings')
        .select('key, value')

      if (error) throw error

      const settingsObj: any = {}
      data?.forEach(item => {
        settingsObj[item.key] = item.value
      })

      setSettings(settingsObj)
    } catch (error) {
      console.error('Error loading settings:', error)
      setMessage({ type: 'error', text: 'Failed to load homepage settings' })
    } finally {
      setLoading(false)
    }
  }

  const loadPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('cuddly_nest_modern_post')
        .select('id, title, slug, excerpt, status')
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      setAvailablePosts(data || [])
    } catch (error) {
      console.error('Error loading posts:', error)
    }
  }

  const loadApiKey = async () => {
    try {
      const { data, error } = await supabase
        .from('api_keys')
        .select('key_value')
        .eq('service', 'google_translate')
        .eq('is_active', true)
        .single()

      if (!error && data) {
        setApiKey('••••••••') // Show masked key
        setApiKeyStatus('set')
      }
    } catch (error) {
      // API key not set, which is fine
      setApiKeyStatus('none')
    }
  }

  const saveSettings = async () => {
    if (!settings) return

    setSaving(true)
    setMessage(null)

    try {
      const updates = Object.entries(settings).map(([key, value]) => ({
        key,
        value,
        updated_at: new Date().toISOString()
      }))

      for (const update of updates) {
        const { error } = await supabase
          .from('homepage_settings')
          .upsert(update, { onConflict: 'key' })

        if (error) throw error
      }

      setMessage({ type: 'success', text: 'Homepage settings saved successfully!' })
    } catch (error) {
      console.error('Error saving settings:', error)
      setMessage({ type: 'error', text: 'Failed to save settings' })
    } finally {
      setSaving(false)
    }
  }

  const saveApiKey = async () => {
    if (!apiKey || apiKey === '••••••••') return

    setApiKeyStatus('testing')
    
    try {
      // Test the API key first
      const testResponse = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId: 'test',
          targetLanguage: 'es',
          testMode: true,
          apiKey: apiKey
        })
      })

      const testResult = await testResponse.json()
      
      if (testResult.success) {
        // Save the API key - first deactivate any existing keys, then insert new one
        await supabase
          .from('api_keys')
          .update({ is_active: false })
          .eq('service', 'google_translate')
        
        const { error } = await supabase
          .from('api_keys')
          .insert({
            service: 'google_translate',
            key_value: apiKey,
            is_active: true,
            updated_at: new Date().toISOString()
          })

        if (error) throw error

        setApiKeyStatus('valid')
        setMessage({ type: 'success', text: 'API key saved and tested successfully!' })
        setApiKey('••••••••')
      } else {
        setApiKeyStatus('invalid')
        setMessage({ type: 'error', text: 'Invalid API key. Please check and try again.' })
      }
    } catch (error) {
      console.error('Error saving API key:', error)
      setApiKeyStatus('invalid')
      setMessage({ type: 'error', text: 'Failed to save API key' })
    }
  }

  const updateSetting = (key: keyof HomepageSettings, value: any) => {
    if (!settings) return
    setSettings({ ...settings, [key]: value })
  }

  const addFeaturedPost = (postId: string) => {
    if (!settings) return
    const currentPosts = settings.featured_posts.post_ids
    if (!currentPosts.includes(postId)) {
      updateSetting('featured_posts', { post_ids: [...currentPosts, postId] })
    }
  }

  const removeFeaturedPost = (postId: string) => {
    if (!settings) return
    const currentPosts = settings.featured_posts.post_ids
    updateSetting('featured_posts', { post_ids: currentPosts.filter(id => id !== postId) })
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Loading homepage settings...</p>
        </div>
      </div>
    )
  }

  if (!settings) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>Failed to load homepage settings</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Homepage</h1>
          <p className="text-muted-foreground">Customize your homepage content, logo, and settings</p>
        </div>
        <Button onClick={saveSettings} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      {message && (
        <Alert variant={message.type === 'error' ? 'destructive' : 'default'} className="mb-6">
          {message.type === 'success' ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <AlertTriangle className="h-4 w-4" />
          )}
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* API Key Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Google Translate API Key
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>API Key</Label>
              <div className="flex gap-2">
                <Input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter Google Translate API key"
                  className="flex-1"
                />
                <Button 
                  onClick={saveApiKey}
                  disabled={!apiKey || apiKey === '••••••••' || apiKeyStatus === 'testing'}
                  className="min-w-24"
                >
                  {apiKeyStatus === 'testing' ? (
                    <TestTube className="h-4 w-4 animate-pulse" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Status:</span>
              <Badge variant={
                apiKeyStatus === 'valid' ? 'default' : 
                apiKeyStatus === 'invalid' ? 'destructive' : 
                apiKeyStatus === 'set' ? 'outline' : 'secondary'
              }>
                {apiKeyStatus === 'valid' && '✅ Valid'}
                {apiKeyStatus === 'invalid' && '❌ Invalid'}
                {apiKeyStatus === 'set' && '🔑 Set'}
                {apiKeyStatus === 'testing' && '🧪 Testing...'}
                {apiKeyStatus === 'none' && '⚪ Not Set'}
              </Badge>
            </div>
            
            <p className="text-xs text-gray-500">
              Once set, the API key will be used automatically for all translations without asking again.
            </p>
          </CardContent>
        </Card>

        {/* Logo & Branding */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Logo & Branding
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              {/* Homepage Logo (Dark Backgrounds) */}
              <div className="space-y-4">
                <div>
                  <Label className="text-base font-semibold">Homepage Logo (Dark Backgrounds)</Label>
                  <p className="text-sm text-gray-600 mb-3">This logo appears on the homepage hero section with dark backgrounds. Usually white or light colored.</p>
                </div>
                <div>
                  <Label>Logo URL</Label>
                  <Input
                    value={settings.logo_url.url}
                    onChange={(e) => updateSetting('logo_url', { ...settings.logo_url, url: e.target.value })}
                    placeholder="/cuddlynest-logo-white.png"
                  />
                </div>
                <div>
                  <Label>Logo Alt Text</Label>
                  <Input
                    value={settings.logo_url.alt}
                    onChange={(e) => updateSetting('logo_url', { ...settings.logo_url, alt: e.target.value })}
                    placeholder="CuddlyNest"
                  />
                </div>
                <div className="p-4 bg-gray-900 rounded-lg">
                  <p className="text-sm text-white mb-2">Preview on dark background:</p>
                  <img 
                    src={settings.logo_url.url} 
                    alt={settings.logo_url.alt}
                    className="h-12 object-contain"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.src = '/placeholder.svg?height=48&width=120&text=White+Logo'
                    }}
                  />
                </div>
              </div>

              {/* Blog Logo (Light Backgrounds) */}
              <div className="space-y-4">
                <div>
                  <Label className="text-base font-semibold">Blog Logo (Light Backgrounds)</Label>
                  <p className="text-sm text-gray-600 mb-3">This logo appears on blog pages and other light backgrounds. Usually dark colored or pink.</p>
                </div>
                <div>
                  <Label>Blog Logo URL</Label>
                  <Input
                    value={settings.blog_logo_url?.url || ''}
                    onChange={(e) => updateSetting('blog_logo_url', { ...settings.blog_logo_url, url: e.target.value })}
                    placeholder="/cuddlynest-logo-pink.png"
                  />
                </div>
                <div>
                  <Label>Blog Logo Alt Text</Label>
                  <Input
                    value={settings.blog_logo_url?.alt || ''}
                    onChange={(e) => updateSetting('blog_logo_url', { ...settings.blog_logo_url, alt: e.target.value })}
                    placeholder="CuddlyNest"
                  />
                </div>
                <div className="p-4 bg-white border-2 border-gray-200 rounded-lg">
                  <p className="text-sm text-gray-600 mb-2">Preview on light background:</p>
                  <img 
                    src={settings.blog_logo_url?.url || settings.logo_url.url} 
                    alt={settings.blog_logo_url?.alt || settings.logo_url.alt}
                    className="h-12 object-contain"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.src = '/placeholder.svg?height=48&width=120&text=Pink+Logo'
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">💡 Logo Usage Tips</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• <strong>Homepage Logo:</strong> Use white/light colored logos for the hero section with dark backgrounds</li>
                <li>• <strong>Blog Logo:</strong> Use dark/colored logos for blog pages with light backgrounds</li>
                <li>• Both logos should be the same design but different colors for optimal contrast</li>
                <li>• Recommended formats: PNG with transparent background, SVG preferred</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Hero Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Type className="h-5 w-5" />
              Hero Section
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Badge Text</Label>
              <Input
                value={settings.hero_badge.text}
                onChange={(e) => updateSetting('hero_badge', { text: e.target.value })}
                placeholder="✨ Your AI-powered travel companion"
              />
            </div>
            
            <div>
              <Label>Main Title</Label>
              <Input
                value={settings.hero_title.text}
                onChange={(e) => updateSetting('hero_title', { ...settings.hero_title, text: e.target.value })}
                placeholder="Travel like you've never traveled"
              />
            </div>
            
            <div>
              <Label>Highlighted Text (from title)</Label>
              <Input
                value={settings.hero_title.highlight}
                onChange={(e) => updateSetting('hero_title', { ...settings.hero_title, highlight: e.target.value })}
                placeholder="never traveled"
              />
            </div>
            
            <div>
              <Label>Subtitle</Label>
              <Textarea
                value={settings.hero_subtitle.text}
                onChange={(e) => updateSetting('hero_subtitle', { text: e.target.value })}
                placeholder="Discover amazing destinations with our curated collection..."
                rows={3}
              />
            </div>
            
            <div>
              <Label>Background Image URL</Label>
              <Input
                value={settings.hero_background.url}
                onChange={(e) => updateSetting('hero_background', { ...settings.hero_background, url: e.target.value })}
                placeholder="/hero-image.jpg"
              />
            </div>
          </CardContent>
        </Card>

        {/* Statistics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Statistics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Travel Guides Count</Label>
              <Input
                value={settings.stats.guides}
                onChange={(e) => updateSetting('stats', { ...settings.stats, guides: e.target.value })}
                placeholder="1565+"
              />
            </div>
            
            <div>
              <Label>Destinations Count</Label>
              <Input
                value={settings.stats.destinations}
                onChange={(e) => updateSetting('stats', { ...settings.stats, destinations: e.target.value })}
                placeholder="200+"
              />
            </div>
            
            <div>
              <Label>For Text</Label>
              <Input
                value={settings.stats.for_text}
                onChange={(e) => updateSetting('stats', { ...settings.stats, for_text: e.target.value })}
                placeholder="For every traveler"
              />
            </div>
          </CardContent>
        </Card>

        {/* Featured Posts */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              Featured Posts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label>Select posts to feature on homepage</Label>
                <div className="mt-2 grid gap-2 max-h-60 overflow-y-auto">
                  {availablePosts.map(post => (
                    <div key={post.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium">{post.title}</h4>
                        <p className="text-sm text-gray-600 line-clamp-1">{post.excerpt}</p>
                      </div>
                      <Button
                        size="sm"
                        variant={settings.featured_posts.post_ids.includes(post.id) ? 'destructive' : 'outline'}
                        onClick={() => settings.featured_posts.post_ids.includes(post.id) 
                          ? removeFeaturedPost(post.id)
                          : addFeaturedPost(post.id)
                        }
                      >
                        {settings.featured_posts.post_ids.includes(post.id) ? (
                          <X className="h-4 w-4" />
                        ) : (
                          <Plus className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <p className="text-sm text-gray-600 mb-2">Currently featured ({settings.featured_posts.post_ids.length}):</p>
                <div className="flex flex-wrap gap-2">
                  {settings.featured_posts.post_ids.map(postId => {
                    const post = availablePosts.find(p => p.id === postId)
                    return post ? (
                      <Badge key={postId} variant="outline" className="gap-1">
                        {post.title}
                        <X 
                          className="h-3 w-3 cursor-pointer" 
                          onClick={() => removeFeaturedPost(postId)}
                        />
                      </Badge>
                    ) : null
                  })}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4 mt-8">
        <Button 
          onClick={saveSettings}
          disabled={saving}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          {saving ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Save All Settings
        </Button>
        
        <Button variant="outline" onClick={() => window.open('/', '_blank')}>
          <Eye className="h-4 w-4 mr-2" />
          Preview Homepage
        </Button>
      </div>
    </div>
  )
}