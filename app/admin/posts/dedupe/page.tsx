'use client'

import { useEffect, useState } from 'react'
import { AuthWrapper } from '@/components/admin/AuthWrapper'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

interface DuplicateGroup {
  slug: string
  count: number
  items: { id: string; title: string; status: string; updated_at: string }[]
}

export default function DedupePostsPage() {
  const [loading, setLoading] = useState(true)
  const [groups, setGroups] = useState<DuplicateGroup[]>([])
  const [total, setTotal] = useState(0)
  const [cleaning, setCleaning] = useState(false)

  const load = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/posts/dedupe')
      const data = await res.json()
      setGroups(data.duplicateGroups || [])
      setTotal(data.total || 0)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleArchive = async () => {
    if (!confirm('Archive duplicates (keep most recently updated per slug)?')) return
    try {
      setCleaning(true)
      const res = await fetch('/api/admin/posts/dedupe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'archive' })
      })
      const data = await res.json()
      await load()
      alert(`Archived: ${data.archived || 0}`)
    } finally {
      setCleaning(false)
    }
  }

  return (
    <AuthWrapper>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Deduplicate Posts</h1>
            <p className="text-muted-foreground">Total posts: {total} • Duplicate slugs: {groups.length}</p>
          </div>
          <Button variant="outline" asChild>
            <Link href="/admin/posts">Back to Posts</Link>
          </Button>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Duplicate Groups</CardTitle>
            <Button onClick={handleArchive} disabled={cleaning || loading || groups.length === 0}>
              {cleaning ? 'Archiving…' : 'Archive Duplicates (Keep Newest)'}
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-10 text-center text-muted-foreground">Loading…</div>
            ) : groups.length === 0 ? (
              <div className="py-10 text-center text-muted-foreground">No duplicate slugs found 🎉</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Slug</TableHead>
                    <TableHead>Count</TableHead>
                    <TableHead>Posts</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {groups.map(g => (
                    <TableRow key={g.slug}>
                      <TableCell className="font-mono">{g.slug}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{g.count}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-2">
                          {g.items.map(item => (
                            <Link key={item.id} href={`/admin/posts/${item.id}/edit`} className="text-blue-600 hover:underline">
                              {item.title || '(untitled)'}
                              <span className="text-xs text-muted-foreground"> · {new Date(item.updated_at).toLocaleDateString()}</span>
                            </Link>
                          ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AuthWrapper>
  )
}

