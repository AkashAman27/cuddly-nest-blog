'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { User, LogIn, AlertTriangle, Eye, EyeOff } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface AuthWrapperProps {
  children: React.ReactNode
}

interface UserProfile {
  id: string
  email: string
  username: string
  role: 'admin' | 'moderator' | 'user'
}

export function AuthWrapper({ children }: AuthWrapperProps) {
  const [user, setUser] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoggingIn, setIsLoggingIn] = useState(false)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      setLoading(true)
      
      // Get current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) {
        console.error('Session error:', sessionError)
        setUser(null)
        setUserProfile(null)
        return
      }

      if (session?.user) {
        setUser(session.user)
        
        // Get user profile
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()

        if (profileError) {
          console.error('Profile error:', profileError)
          setAuthError('User profile not found. Please contact administrator.')
          return
        }

        if (profile && (profile.role === 'admin' || profile.role === 'moderator' || profile.role === 'super_admin')) {
          setUserProfile(profile)
          setAuthError(null)
        } else {
          setAuthError('Access denied. Admin, moderator, or super admin privileges required.')
          await supabase.auth.signOut()
        }
      } else {
        setUser(null)
        setUserProfile(null)
      }
    } catch (error) {
      console.error('Auth check error:', error)
      setAuthError('Authentication error occurred.')
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoggingIn(true)
    setAuthError(null)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password
      })

      if (error) {
        setAuthError(error.message)
        return
      }

      if (data.user) {
        // Check if user has admin/moderator privileges
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', data.user.id)
          .single()

        if (profileError || !profile) {
          setAuthError('User profile not found. Please contact administrator.')
          await supabase.auth.signOut()
          return
        }

        if (profile.role !== 'admin' && profile.role !== 'moderator' && profile.role !== 'super_admin') {
          setAuthError('Access denied. Admin, moderator, or super admin privileges required.')
          await supabase.auth.signOut()
          return
        }

        setUser(data.user)
        setUserProfile(profile)
        setEmail('')
        setPassword('')
      }
    } catch (error) {
      console.error('Login error:', error)
      setAuthError('Login failed. Please try again.')
    } finally {
      setIsLoggingIn(false)
    }
  }

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error('Logout error:', error)
    } else {
      setUser(null)
      setUserProfile(null)
      setAuthError(null)
    }
  }

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    )
  }

  // Show login form if not authenticated
  if (!user || !userProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 bg-blue-100 rounded-full w-fit">
              <User className="h-6 w-6 text-blue-600" />
            </div>
            <CardTitle className="text-2xl">Admin Login</CardTitle>
            <p className="text-gray-600">Sign in to access the CMS admin panel</p>
          </CardHeader>
          <CardContent>
            {authError && (
              <Alert variant="destructive" className="mb-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{authError}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  required
                  disabled={isLoggingIn}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Password</label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    disabled={isLoggingIn}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-auto p-1"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoggingIn}
              >
                {isLoggingIn ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Signing in...
                  </>
                ) : (
                  <>
                    <LogIn className="h-4 w-4 mr-2" />
                    Sign In
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-gray-600">
              <p className="text-xs">Contact administrator to reset password</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show authenticated content with logout button
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar with user info and logout */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold">CMS Admin Panel</h1>
            <div className="flex items-center gap-2 bg-blue-50 px-3 py-1 rounded-full">
              <User className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">
                {userProfile.username}
              </span>
              <span className="text-xs bg-blue-200 text-blue-800 px-2 py-0.5 rounded-full capitalize">
                {userProfile.role}
              </span>
            </div>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </div>
      
      {/* Main content */}
      <div className="p-6">
        {children}
      </div>
    </div>
  )
}