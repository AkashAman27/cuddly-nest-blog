'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Save, RotateCcw, Bot, CheckCircle, AlertTriangle, Globe } from 'lucide-react'
import Link from 'next/link'

interface RobotsConfig {
  id?: string
  content: string
  last_updated: string
  is_active: boolean
}

const DEFAULT_ROBOTS_CONTENT = `User-agent: *
Allow: /

# Sitemap
Sitemap: https://cuddlynest.com/sitemap.xml

# Disallow admin and private areas
Disallow: /admin/
Disallow: /api/
Disallow: /_next/
Disallow: /private/

# Allow specific bots
User-agent: Googlebot
Allow: /

User-agent: Bingbot
Allow: /

# Crawl delay (optional)
Crawl-delay: 1`

export default function RobotsManagement() {
  const [robotsConfig, setRobotsConfig] = useState<RobotsConfig | null>(null)
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [validation, setValidation] = useState<{ isValid: boolean; warnings: string[] }>({ isValid: true, warnings: [] })

  useEffect(() => {
    fetchRobotsConfig()
  }, [])

  useEffect(() => {
    validateRobotsContent(content)
  }, [content])

  const fetchRobotsConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('robots_config')
        .select('*')
        .eq('is_active', true)
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        console.error('Error fetching robots config:', error)
      }

      if (data) {
        setRobotsConfig(data)
        setContent(data.content)
      } else {
        // No config found, use default
        setContent(DEFAULT_ROBOTS_CONTENT)
      }
    } catch (error) {
      console.error('Error:', error)
      setContent(DEFAULT_ROBOTS_CONTENT)
    } finally {
      setLoading(false)
    }
  }

  const validateRobotsContent = (robotsContent: string) => {
    const warnings: string[] = []
    
    // Check for required elements
    if (!robotsContent.includes('User-agent:')) {
      warnings.push('Missing User-agent directive')
    }
    
    if (!robotsContent.includes('Sitemap:')) {
      warnings.push('Consider adding a Sitemap directive')
    }
    
    // Check for common issues
    if (robotsContent.includes('Disallow: /') && !robotsContent.includes('Allow:')) {
      warnings.push('You are blocking all bots - make sure this is intentional')
    }
    
    // Check for sensitive paths
    const sensitivePathsBlocked = ['/admin/', '/api/', '/_next/'].some(path => 
      robotsContent.includes(`Disallow: ${path}`)
    )
    
    if (!sensitivePathsBlocked) {
      warnings.push('Consider blocking sensitive paths like /admin/, /api/, /_next/')
    }

    setValidation({
      isValid: warnings.length === 0 || warnings.every(w => w.includes('Consider')),
      warnings
    })
  }

  const saveRobotsConfig = async () => {
    setSaving(true)
    
    try {
      const configData = {
        content: content.trim(),
        last_updated: new Date().toISOString(),
        is_active: true
      }

      if (robotsConfig?.id) {
        // Update existing
        const { error } = await supabase
          .from('robots_config')
          .update(configData)
          .eq('id', robotsConfig.id)

        if (error) throw error
      } else {
        // Insert new
        const { data, error } = await supabase
          .from('robots_config')
          .insert(configData)
          .select()
          .single()

        if (error) throw error
        setRobotsConfig(data)
      }

      alert('Robots.txt configuration saved successfully!')
    } catch (error: any) {
      console.error('Error saving robots config:', error)
      alert(`Error saving configuration: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  const resetToDefault = () => {
    if (confirm('Are you sure you want to reset to the default robots.txt configuration?')) {
      setContent(DEFAULT_ROBOTS_CONTENT)
    }
  }

  const previewUrl = typeof window !== 'undefined' ? `${window.location.origin}/robots.txt` : '/robots.txt'

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Bot className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Robots.txt</h1>
          <p className="text-muted-foreground">Configure how search engines crawl your website</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => window.open(previewUrl, '_blank')}
            variant="outline"
          >
            <Globe className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button onClick={resetToDefault} variant="outline">
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset to Default
          </Button>
        </div>
      </div>

      {/* Status and Validation */}
      <div className="flex gap-4">
            {validation.isValid ? (
              <Alert className="flex-1">
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Robots.txt configuration looks good!
                </AlertDescription>
              </Alert>
            ) : (
              <Alert variant="destructive" className="flex-1">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Configuration issues detected. Please review warnings below.
                </AlertDescription>
              </Alert> 
            )}

            {robotsConfig && (
              <Card className="w-64">
                <CardContent className="p-4">
                  <div className="text-sm">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="secondary">Active</Badge>
                    </div>
                    <p className="text-gray-600">
                      Last updated: {new Date(robotsConfig.last_updated).toLocaleDateString()}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

      {/* Warnings */}
      {validation.warnings.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Validation Warnings</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm space-y-1">
                  {validation.warnings.map((warning, index) => (
                    <li key={index} className="flex items-center gap-2 text-amber-700">
                      <AlertTriangle className="h-3 w-3" />
                      {warning}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

      {/* Editor */}
      <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Robots.txt Content</span>
                <Button onClick={saveRobotsConfig} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Configuration'}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Enter robots.txt content..."
                rows={20}
                className="font-mono text-sm"
              />
              <p className="text-xs text-gray-600 mt-2">
                This content will be served at <code className="bg-gray-100 px-1 rounded">/robots.txt</code>
              </p>
            </CardContent>
          </Card>

      {/* Help */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-6">
          <h3 className="font-semibold text-blue-900 mb-2">Robots.txt Tips</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• <strong>User-agent:</strong> Specify which bots these rules apply to (* = all bots)</li>
            <li>• <strong>Disallow:</strong> Paths that bots should not crawl</li>
            <li>• <strong>Allow:</strong> Explicitly allow certain paths (overrides Disallow)</li>
            <li>• <strong>Sitemap:</strong> Tell bots where to find your sitemap</li>
            <li>• <strong>Crawl-delay:</strong> Minimum delay between requests (in seconds)</li>
            <li>• Test your robots.txt with <a href="https://www.google.com/webmasters/tools/robots-testing-tool" target="_blank" rel="noopener" className="text-blue-600 hover:underline font-medium">Google's Robots.txt Tester</a></li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}