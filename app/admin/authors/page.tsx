'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Plus, Edit2, Trash2, Save, X, User, Mail, Hash } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { AvatarUpload } from '@/components/avatar-upload'

interface Author {
  id: string
  display_name: string
  first_name?: string
  last_name?: string
  email?: string
  username?: string
  bio: string
  avatar_url: string
  role?: string
  social_links?: any
  is_active?: boolean
  slug?: string
  created_at?: string
  updated_at?: string
}

export default function AuthorsManagement() {
  const [authors, setAuthors] = useState<Author[]>([])
  const [editingAuthor, setEditingAuthor] = useState<Author | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [loading, setLoading] = useState(true)


  const loadAuthors = async () => {
    try {
      const { data, error } = await supabase
        .from('modern_authors')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error loading authors:', error)
        setAuthors([])
      } else {
        setAuthors(data || [])
      }
    } catch (error) {
      console.error('Error loading authors:', error)
      setAuthors([])
    } finally {
      setLoading(false)
    }
  }


  useEffect(() => {
    loadAuthors()
  }, [])

  const saveAuthor = async (author: Author) => {
    try {
      const { data, error } = await supabase
        .from('modern_authors')
        .upsert([{
          id: author.id,
          display_name: author.display_name,
          first_name: author.first_name,
          last_name: author.last_name,
          email: author.email,
          username: author.username,
          bio: author.bio,
          avatar_url: author.avatar_url,
          role: author.role,
          social_links: author.social_links,
          is_active: author.is_active,
          slug: author.slug,
          updated_at: new Date().toISOString()
        }])
        .select()

      if (error) {
        console.error('Error saving author:', error)
        alert('Failed to save author. Please try again.')
        return
      }
      
      // Update local state for immediate UI feedback
      setAuthors(prev => 
        prev.find(a => a.id === author.id) 
          ? prev.map(a => a.id === author.id ? author : a)
          : [...prev, author]
      )
      
    } catch (error) {
      console.error('Error:', error)
      alert('Failed to save author. Please check your connection.')
    }
  }

  const deleteAuthor = async (authorId: string) => {
    try {
      const { error } = await supabase
        .from('modern_authors')
        .delete()
        .eq('id', authorId)

      if (error) {
        console.error('Error deleting author:', error)
        alert('Failed to delete author. Please try again.')
        return
      }
      
      setAuthors(prev => prev.filter(a => a.id !== authorId))
    } catch (error) {
      console.error('Error:', error)
      alert('Failed to delete author. Please check your connection.')
    }
  }

  const handleSave = (author: Author) => {
    saveAuthor(author)
    setEditingAuthor(null)
    setIsCreating(false)
  }

  const generateAuthorId = (name: string) => {
    return name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')
  }

  const AuthorForm = ({ author, onSave, onCancel }: {
    author: Author
    onSave: (author: Author) => void
    onCancel: () => void
  }) => {
    const [formData, setFormData] = useState(author)

    const updateField = (field: keyof Author, value: any) => {
      setFormData(prev => ({ ...prev, [field]: value }))
    }


    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{author.id ? 'Edit Author' : 'Create New Author'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Display Name</Label>
              <Input
                value={formData.display_name}
                onChange={(e) => {
                  updateField('display_name', e.target.value)
                  if (!author.id) {
                    updateField('id', generateAuthorId(e.target.value))
                  }
                }}
                placeholder="John Doe"
              />
            </div>
            <div>
              <Label>Username</Label>
              <Input
                value={formData.username}
                onChange={(e) => updateField('username', e.target.value)}
                placeholder="john-doe"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>First Name</Label>
              <Input
                value={formData.first_name}
                onChange={(e) => updateField('first_name', e.target.value)}
                placeholder="John"
              />
            </div>
            <div>
              <Label>Last Name</Label>
              <Input
                value={formData.last_name}
                onChange={(e) => updateField('last_name', e.target.value)}
                placeholder="Doe"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => updateField('email', e.target.value)}
                placeholder="john@example.com"
              />
            </div>
            <div>
              <Label>Role</Label>
              <Input
                value={formData.role}
                onChange={(e) => updateField('role', e.target.value)}
                placeholder="author"
              />
            </div>
          </div>

          <div>
            <Label>Author Avatar</Label>
            <AvatarUpload
              currentAvatarUrl={formData.avatar_url}
              authorName={formData.display_name || 'New Author'}
              onAvatarChange={(newAvatarUrl) => updateField('avatar_url', newAvatarUrl)}
            />
          </div>

          <div>
            <Label>Bio</Label>
            <Textarea
              value={formData.bio}
              onChange={(e) => updateField('bio', e.target.value)}
              rows={4}
              placeholder="Brief author biography..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Slug</Label>
              <Input
                value={formData.slug}
                onChange={(e) => updateField('slug', e.target.value)}
                placeholder="john-doe"
              />
            </div>
            <div className="flex items-center gap-2">
              <Label>Active</Label>
              <input
                type="checkbox"
                checked={formData.is_active || true}
                onChange={(e) => updateField('is_active', e.target.checked)}
              />
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button onClick={() => onSave(formData)}>
              <Save className="w-4 h-4 mr-2" />
              Save Author
            </Button>
            <Button variant="outline" onClick={onCancel}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Loading Authors...</h1>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Authors Management</h1>
          <p className="text-gray-600 mt-2">Manage your blog authors and their profiles</p>
        </div>
        <Button onClick={() => setIsCreating(true)} disabled={isCreating || editingAuthor !== null}>
          <Plus className="w-4 h-4 mr-2" />
          Add New Author
        </Button>
      </div>

      {isCreating && (
        <AuthorForm
          author={{
            id: '',
            display_name: '',
            first_name: '',
            last_name: '',
            email: '',
            username: '',
            bio: '',
            avatar_url: '/placeholder.svg',
            role: 'author',
            is_active: true,
            slug: ''
          }}
          onSave={handleSave}
          onCancel={() => setIsCreating(false)}
        />
      )}

      {editingAuthor && (
        <AuthorForm
          author={editingAuthor}
          onSave={handleSave}
          onCancel={() => setEditingAuthor(null)}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {authors.map((author) => (
          <Card key={author.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <Avatar className="w-16 h-16">
                  <AvatarImage src={author.avatar_url} alt={author.display_name} />
                  <AvatarFallback>
                    {author.display_name ? 
                      author.display_name.split(' ').map(n => n[0]).join('') : 
                      (author.first_name && author.last_name ? 
                        (author.first_name[0] + author.last_name[0]) : 
                        '??'
                      )
                    }
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h3 className="text-xl font-bold">{author.display_name}</h3>
                      {author.role && <Badge className="text-xs">{author.role}</Badge>}
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => setEditingAuthor(author)}
                        disabled={editingAuthor !== null || isCreating}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => deleteAuthor(author.id)}
                        disabled={editingAuthor !== null || isCreating}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{author.bio}</p>
                  
                  <div className="flex flex-wrap gap-2 text-xs mb-3">
                    {author.username && (
                      <div className="flex items-center gap-1 bg-purple-100 rounded-full px-2 py-1">
                        <User className="w-3 h-3" />
                        <span>@{author.username}</span>
                      </div>
                    )}
                    {author.email && (
                      <div className="flex items-center gap-1 bg-purple-100 rounded-full px-2 py-1">
                        <Mail className="w-3 h-3" />
                        <span>{author.email}</span>
                      </div>
                    )}
                    {author.slug && (
                      <div className="flex items-center gap-1 bg-purple-100 rounded-full px-2 py-1">
                        <Hash className="w-3 h-3" />
                        <span>{author.slug}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap gap-1">
                    {author.first_name && author.last_name && (
                      <Badge variant="outline" className="text-xs">
                        {author.first_name} {author.last_name}
                      </Badge>
                    )}
                    {author.is_active !== undefined && (
                      <Badge variant={author.is_active ? "default" : "secondary"} className="text-xs">
                        {author.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {authors.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <h3 className="text-xl font-semibold mb-2">No Authors Found</h3>
            <p className="text-gray-600 mb-4">Get started by adding your first author</p>
            <Button onClick={() => setIsCreating(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add First Author
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}