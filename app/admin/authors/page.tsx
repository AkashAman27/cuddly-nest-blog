'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Plus, Edit2, Trash2, Save, X, MapPin, Calendar, Users } from 'lucide-react'
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
  original_wp_id?: number
  created_at?: string
  updated_at?: string
  // Legacy fields for compatibility
  title?: string
  countries_explored?: string
  expert_since?: string
  followers?: string
  badges?: string[]
}

export default function AuthorsManagement() {
  const [authors, setAuthors] = useState<Author[]>([])
  const [editingAuthor, setEditingAuthor] = useState<Author | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [loading, setLoading] = useState(true)

  const defaultAuthors: Author[] = [
    {
      id: 'sarah-johnson',
      display_name: 'Sarah Johnson',
      title: 'Travel Expert',
      bio: "Your friendly neighborhood travel obsessive who's been exploring the world for 10+ years. I'm all about finding those hidden gems and sharing the real tea on destinations - no sugar-coating, just honest vibes.",
      avatar_url: '/placeholder.svg',
      countries_explored: '50+ countries explored',
      expert_since: 'Expert since 2014',
      followers: '1M+ fellow travelers',
      badges: ['Adventure seeker', 'Food lover', 'Culture enthusiast']
    },
    {
      id: 'marco-rossi',
      display_name: 'Marco Rossi',
      title: 'Local Culture Specialist',
      bio: 'Born and raised in Rome, I spend my time uncovering the authentic experiences that make each destination unique. From secret family recipes to hidden historical gems.',
      avatar_url: '/placeholder.svg',
      countries_explored: '30+ regions explored',
      expert_since: 'Expert since 2018',
      followers: '500K+ culture enthusiasts',
      badges: ['Local insider', 'History buff', 'Foodie guide']
    },
    {
      id: 'elena-santos',
      display_name: 'Elena Santos',
      title: 'Adventure Travel Guide',
      bio: 'Adrenaline junkie turned travel writer. I specialize in off-the-beaten-path adventures and sustainable travel practices that respect local communities.',
      avatar_url: '/placeholder.svg',
      countries_explored: '40+ countries explored',
      expert_since: 'Expert since 2016',
      followers: '750K+ adventure seekers',
      badges: ['Adventure expert', 'Eco traveler', 'Mountain guide']
    },
    {
      id: 'david-chen',
      name: 'David Chen',
      title: 'Luxury Travel Curator',
      bio: 'Former hospitality executive with a passion for creating unforgettable luxury experiences. I know the best hotels, restaurants, and exclusive experiences worldwide.',
      avatar_url: '/placeholder.svg',
      countries_explored: '60+ destinations curated',
      expert_since: 'Expert since 2012',
      followers: '300K+ luxury travelers',
      badges: ['Luxury specialist', 'Hotel insider', 'Fine dining expert']
    },
    {
      id: 'anna-mueller',
      name: 'Anna Mueller',
      title: 'Budget Travel Expert',
      bio: 'Proving that amazing travel experiences don\'t have to break the bank. I\'ve mastered the art of traveling smart, not expensive.',
      avatar_url: '/placeholder.svg',
      countries_explored: '45+ countries on a budget',
      expert_since: 'Expert since 2017',
      followers: '800K+ budget travelers',
      badges: ['Budget master', 'Deal finder', 'Backpacker pro']
    }
  ]

  const loadAuthors = async () => {
    try {
      // Use modern_authors table - more secure approach
      const { data, error } = await supabase
        .from('modern_authors')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error loading authors:', error)
        // Fallback to check authors table if modern_authors doesn't exist
        const { data: legacyData, error: legacyError } = await supabase
          .from('authors')
          .select('*')
          .order('created_at', { ascending: false })
          
        if (legacyError) {
          setAuthors(defaultAuthors)
        } else {
          setAuthors(legacyData || defaultAuthors)
        }
      } else if (!data || data.length === 0) {
        await seedDefaultAuthors()
        setAuthors(defaultAuthors)
      } else {
        setAuthors(data)
      }
    } catch (error) {
      console.error('Error:', error)
      setAuthors(defaultAuthors)
    } finally {
      setLoading(false)
    }
  }

  // REMOVED DANGEROUS SQL INJECTION VULNERABILITY
  // Table creation should be done through proper migrations, not RPC calls

  const seedDefaultAuthors = async () => {
    try {
      // Try modern_authors first
      const { error } = await supabase
        .from('modern_authors')
        .insert(defaultAuthors.map(author => ({
          ...author,
          display_name: author.display_name,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })))
      
      if (error) {
        // Fallback to authors table if modern_authors doesn't exist
        const { error: legacyError } = await supabase
          .from('authors')
          .insert(defaultAuthors.map(author => ({
            ...author,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })))
          
        if (legacyError) {
          console.log('Could not seed default authors:', legacyError)
        }
      }
    } catch (error) {
      console.log('Could not seed default authors:', error)
    }
  }

  useEffect(() => {
    loadAuthors()
  }, [])

  const saveAuthor = async (author: Author) => {
    try {
      // Try modern_authors first
      const { data, error } = await supabase
        .from('modern_authors')
        .upsert([{
          id: author.id,
          display_name: author.display_name,
          title: author.title,
          bio: author.bio,
          avatar_url: author.avatar_url,
          countries_explored: author.countries_explored,
          expert_since: author.expert_since,
          followers: author.followers,
          badges: author.badges,
          updated_at: new Date().toISOString()
        }])
        .select()

      if (error) {
        // Fallback to legacy authors table
        const { error: legacyError } = await supabase
          .from('authors')
          .upsert([{
            id: author.id,
            display_name: author.display_name,
            title: author.title,
            bio: author.bio,
            avatar_url: author.avatar_url,
            countries_explored: author.countries_explored,
            expert_since: author.expert_since,
            followers: author.followers,
            badges: author.badges,
            updated_at: new Date().toISOString()
          }])
          .select()
          
        if (legacyError) {
          console.error('Error saving author:', legacyError)
          alert('Note: Changes saved locally only. Database connection needed for permanent storage.')
        }
      }
      
      // Always update local state for immediate UI feedback
      setAuthors(prev => 
        prev.find(a => a.id === author.id) 
          ? prev.map(a => a.id === author.id ? author : a)
          : [...prev, author]
      )
      
    } catch (error) {
      console.error('Error:', error)
      alert('Note: Changes saved locally only. Database connection needed for permanent storage.')
      
      // Update local state as fallback
      setAuthors(prev => 
        prev.find(a => a.id === author.id) 
          ? prev.map(a => a.id === author.id ? author : a)
          : [...prev, author]
      )
    }
  }

  const deleteAuthor = async (authorId: string) => {
    try {
      // Try modern_authors first
      const { error } = await supabase
        .from('modern_authors')
        .delete()
        .eq('id', authorId)

      if (error) {
        // Fallback to legacy authors table
        const { error: legacyError } = await supabase
          .from('authors')
          .delete()
          .eq('id', authorId)
          
        if (legacyError) {
          console.error('Error deleting author:', legacyError)
        }
      }
      
      setAuthors(prev => prev.filter(a => a.id !== authorId))
    } catch (error) {
      console.error('Error:', error)
      setAuthors(prev => prev.filter(a => a.id !== authorId))
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
    const [formData, setFormData] = useState({
      ...author,
      badges: author.badges || []
    })

    const updateField = (field: keyof Author, value: any) => {
      setFormData(prev => ({ ...prev, [field]: value }))
    }

    const updateBadges = (badgeString: string) => {
      const badges = badgeString.split(',').map(b => b.trim()).filter(b => b)
      setFormData(prev => ({ ...prev, badges }))
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
                placeholder="Sarah Johnson"
              />
            </div>
            <div>
              <Label>Title</Label>
              <Input
                value={formData.title}
                onChange={(e) => updateField('title', e.target.value)}
                placeholder="Travel Expert"
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Countries Explored</Label>
              <Input
                value={formData.countries_explored}
                onChange={(e) => updateField('countries_explored', e.target.value)}
                placeholder="50+ countries explored"
              />
            </div>
            <div>
              <Label>Expert Since</Label>
              <Input
                value={formData.expert_since}
                onChange={(e) => updateField('expert_since', e.target.value)}
                placeholder="Expert since 2014"
              />
            </div>
            <div>
              <Label>Followers</Label>
              <Input
                value={formData.followers}
                onChange={(e) => updateField('followers', e.target.value)}
                placeholder="1M+ fellow travelers"
              />
            </div>
          </div>

          <div>
            <Label>Badges (comma-separated)</Label>
            <Input
              value={formData.badges ? formData.badges.join(', ') : ''}
              onChange={(e) => updateBadges(e.target.value)}
              placeholder="Adventure seeker, Food lover, Culture enthusiast"
            />
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
            name: '',
            title: '',
            bio: '',
            avatar_url: '/placeholder.svg',
            countries_explored: '',
            expert_since: '',
            followers: '',
            badges: []
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
                      {author.title && <Badge className="text-xs">{author.title}</Badge>}
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
                    {author.countries_explored && (
                      <div className="flex items-center gap-1 bg-purple-100 rounded-full px-2 py-1">
                        <MapPin className="w-3 h-3" />
                        <span>{author.countries_explored}</span>
                      </div>
                    )}
                    {author.expert_since && (
                      <div className="flex items-center gap-1 bg-purple-100 rounded-full px-2 py-1">
                        <Calendar className="w-3 h-3" />
                        <span>{author.expert_since}</span>
                      </div>
                    )}
                    {author.followers && (
                      <div className="flex items-center gap-1 bg-purple-100 rounded-full px-2 py-1">
                        <Users className="w-3 h-3" />
                        <span>{author.followers}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap gap-1">
                    {author.badges && author.badges.map((badge, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {badge}
                      </Badge>
                    ))}
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