'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { 
  Save, 
  RefreshCw, 
  Plus, 
  Edit, 
  Trash2, 
  ExternalLink, 
  Search, 
  Download, 
  Upload, 
  CheckCircle, 
  AlertTriangle,
  Link as LinkIcon,
  X,
  Copy,
  Globe
} from 'lucide-react'
import Link from 'next/link'

interface InternalLink {
  id: string
  title: string
  description: string
  url: string
  category: string
  is_published: boolean
  display_order: number
  created_at: string
  updated_at: string
}

const LINK_CATEGORIES = [
  'Destinations',
  'Travel Guides', 
  'Experiences',
  'Hotels',
  'Activities',
  'Food & Dining',
  'Transportation',
  'Tips & Advice',
  'Other'
]

export default function InternalLinksManagement() {
  // This page is deprecated - internal links are now managed per-post
  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card className="border-orange-200 bg-orange-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-800">
            <AlertTriangle className="h-5 w-5" />
            Page Deprecated
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-orange-700">
              This global internal links management page has been deprecated. Internal links are now managed individually for each post.
            </p>
            <div className="space-y-2">
              <p className="text-sm text-orange-600 font-medium">New workflow:</p>
              <ol className="text-sm text-orange-700 space-y-1 list-decimal list-inside">
                <li>Go to the post you want to edit</li>
                <li>Navigate to the "Internal Links" tab</li>
                <li>Add, edit, or remove internal links specific to that post</li>
                <li>Save the post to store the internal links</li>
              </ol>
            </div>
            <div className="flex gap-4 pt-4">
              <Button asChild>
                <Link href="/admin/posts">
                  <Edit className="h-4 w-4 mr-2" />
                  Go to Posts
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/admin">
                  <Globe className="h-4 w-4 mr-2" />
                  Admin Dashboard
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Legacy functionality for reference */}
      <Card className="opacity-60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-500">
            <LinkIcon className="h-5 w-5" />
            Legacy Global Internal Links (Read-Only)
          </CardTitle>
          <p className="text-sm text-gray-500">
            This section shows the old global links for reference only. These are no longer actively used.
          </p>
        </CardHeader>
        <CardContent>
          <LegacyInternalLinksView />
        </CardContent>
      </Card>
    </div>
  )
}

function LegacyInternalLinksView() {
  const [links, setLinks] = useState<InternalLink[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLinks()
  }, [])

  const fetchLinks = async () => {
    try {
      const { data, error } = await supabase
        .from('internal_links')
        .select('*')
        .order('display_order', { ascending: false })

      if (error) {
        console.error('Error fetching links:', error)
        setLinks([])
      } else {
        setLinks(data || [])
      }
    } catch (error) {
      console.error('Fetch error:', error)
      setLinks([])
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Statistics */}
      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center gap-2 text-sm">
          <LinkIcon className="h-4 w-4 text-blue-600" />
          <span>Total: {links.length}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <span>Published: {links.filter(l => l.is_published).length}</span>
        </div>
      </div>

      {/* Links List (Read-Only) */}
      {links.length > 0 ? (
        <div className="space-y-3">
          {links.slice(0, 10).map((link) => (
            <div key={link.id} className="border rounded-lg p-3 bg-gray-50">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-gray-700 text-sm">{link.title}</h4>
                    <Badge variant={link.is_published ? "default" : "secondary"} className="text-xs">
                      {link.is_published ? 'Published' : 'Draft'}
                    </Badge>
                  </div>
                  <p className="text-gray-500 text-xs mb-1">{link.description}</p>
                  <code className="text-xs bg-gray-200 px-1 rounded font-mono text-gray-600">
                    {link.url}
                  </code>
                </div>
              </div>
            </div>
          ))}
          {links.length > 10 && (
            <p className="text-xs text-gray-500 text-center">
              ... and {links.length - 10} more links
            </p>
          )}
        </div>
      ) : (
        <p className="text-gray-500 text-center py-4 text-sm">No legacy links found</p>
      )}
    </div>
  )
}