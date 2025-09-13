'use client'

import { useState } from 'react'
import { AuthWrapper } from '@/components/admin/AuthWrapper'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Rocket, 
  CheckCircle, 
  AlertTriangle, 
  Info,
  Target,
  Zap,
  RefreshCw
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

export default function MigrationPage() {
  const [migrationStatus, setMigrationStatus] = useState<'idle' | 'running' | 'completed' | 'error'>('idle')
  const [testPosts, setTestPosts] = useState<any[]>([])
  const [migrationLog, setMigrationLog] = useState<string[]>([])

  const addToLog = (message: string) => {
    setMigrationLog(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  const enableUniversalTemplate = async () => {
    setMigrationStatus('running')
    setMigrationLog([])
    addToLog('🚀 Starting Blog Template Unification')

    try {
      // Step 1: Find test post
      addToLog('🔍 Finding test post...')
      const { data: testPost, error: findError } = await supabase
        .from('cuddly_nest_modern_post')
        .select('id, title, slug, template_enabled')
        .eq('title', 'This is the title. This is the URL.')
        .single()

      let targetPost = testPost
      if (findError || !testPost) {
        addToLog('⚠️ Specific test post not found, using most recent post')
        
        const { data: recentPost, error: recentError } = await supabase
          .from('cuddly_nest_modern_post')
          .select('id, title, slug, template_enabled')
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        if (recentError) throw recentError
        targetPost = recentPost
      }

      // Step 2: Enable universal template
      addToLog(`📝 Enabling universal template for: "${targetPost.title}"`)
      
      const { error: updateError } = await supabase
        .from('cuddly_nest_modern_post')
        .update({ 
          template_enabled: true,
          // Add a comment to track migration
          seo_description: targetPost.seo_description + ' [MIGRATED_TO_UNIVERSAL_TEMPLATE]'
        })
        .eq('id', targetPost.id)

      if (updateError) throw updateError

      // Step 3: Validate
      addToLog('✅ Universal template enabled successfully!')
      addToLog(`🔗 Test URL: /blog/${targetPost.slug}`)
      
      setTestPosts([targetPost])
      setMigrationStatus('completed')
      
      toast.success('Universal template enabled! Visit the test post to see changes.')

    } catch (error) {
      console.error('Migration error:', error)
      addToLog(`❌ Error: ${error.message}`)
      setMigrationStatus('error')
      toast.error('Migration failed. Check the log for details.')
    }
  }

  const rollbackMigration = async () => {
    if (testPosts.length === 0) {
      toast.error('No test posts to rollback')
      return
    }

    try {
      addToLog('🔄 Rolling back migration...')
      
      for (const post of testPosts) {
        const { error } = await supabase
          .from('cuddly_nest_modern_post')
          .update({ template_enabled: false })
          .eq('id', post.id)

        if (error) throw error
        addToLog(`✅ Rolled back: ${post.title}`)
      }

      setMigrationStatus('idle')
      setTestPosts([])
      toast.success('Migration rolled back successfully')

    } catch (error) {
      addToLog(`❌ Rollback error: ${error.message}`)
      toast.error('Rollback failed')
    }
  }

  return (
    <AuthWrapper>
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="flex items-center gap-3 mb-6">
          <Rocket className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold">Blog Template Unification</h1>
            <p className="text-gray-600">Migrate posts to the universal template system</p>
          </div>
        </div>

        {/* Migration Overview */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              Migration Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">Phase 1</div>
                <div className="text-sm text-gray-600">Template Enhancement</div>
                <Badge variant="secondary" className="mt-2">✅ Completed</Badge>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">Phase 2</div>
                <div className="text-sm text-gray-600">Gradual Migration</div>
                <Badge variant="outline" className="mt-2">🔄 In Progress</Badge>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-400">Phase 3</div>
                <div className="text-sm text-gray-600">Code Cleanup</div>
                <Badge variant="outline" className="mt-2">⏳ Pending</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Migration Benefits */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              What This Does
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-green-700 mb-2">✅ Benefits</h3>
                <ul className="space-y-1 text-sm">
                  <li>• Unified user experience across all posts</li>
                  <li>• Simplified codebase maintenance</li>
                  <li>• Better performance with single template</li>
                  <li>• Enhanced mobile responsiveness</li>
                  <li>• Consistent SEO optimization</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-blue-700 mb-2">🚀 Enhanced Features</h3>
                <ul className="space-y-1 text-sm">
                  <li>• Hotel listings integration</li>
                  <li>• Interactive itinerary sections</li>
                  <li>• Budget breakdown displays</li>
                  <li>• Travel tips organization</li>
                  <li>• Dynamic content components</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Migration Controls */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Migration Controls
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 mb-4">
              <Button 
                onClick={enableUniversalTemplate}
                disabled={migrationStatus === 'running'}
                className="flex items-center gap-2"
              >
                {migrationStatus === 'running' ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Migrating...
                  </>
                ) : (
                  <>
                    <Rocket className="h-4 w-4" />
                    Enable Universal Template
                  </>
                )}
              </Button>

              {testPosts.length > 0 && (
                <Button 
                  variant="outline" 
                  onClick={rollbackMigration}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Rollback
                </Button>
              )}
            </div>

            {migrationStatus === 'completed' && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Universal template enabled successfully! Visit your test post to see the new unified design.
                </AlertDescription>
              </Alert>
            )}

            {migrationStatus === 'error' && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Migration failed. Check the log below for details and try again.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Test Posts */}
        {testPosts.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Test Posts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {testPosts.map(post => (
                  <div key={post.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div>
                      <div className="font-medium">{post.title}</div>
                      <div className="text-sm text-gray-600">/blog/{post.slug}</div>
                    </div>
                    <Badge variant="secondary">Universal Template</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Migration Log */}
        {migrationLog.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Migration Log</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm max-h-64 overflow-y-auto">
                {migrationLog.map((log, index) => (
                  <div key={index}>{log}</div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AuthWrapper>
  )
}