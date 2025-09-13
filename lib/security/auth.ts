/**
 * Authentication and Authorization Utilities
 * Provides secure authentication for admin routes
 */

import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { errors } from './errorHandler'

// Initialize Supabase client for auth verification
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export interface User {
  id: string
  email: string
  role: string
  permissions: string[]
}

export interface AuthContext {
  user: User
  token: string
}

/**
 * Extract JWT token from request headers
 */
function extractToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization')
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7)
  }
  
  // Also check cookies for browser requests
  const tokenCookie = request.cookies.get('sb-access-token')
  if (tokenCookie) {
    return tokenCookie.value
  }
  
  return null
}

/**
 * Verify JWT token and extract user information
 */
async function verifyToken(token: string): Promise<User | null> {
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token)
    
    if (error || !user) {
      return null
    }
    
    // Get user role and permissions from user metadata or a separate table
    const role = user.user_metadata?.role || user.app_metadata?.role || 'user'
    const permissions = user.user_metadata?.permissions || user.app_metadata?.permissions || []
    
    return {
      id: user.id,
      email: user.email || '',
      role,
      permissions: Array.isArray(permissions) ? permissions : []
    }
  } catch (error) {
    console.error('Token verification error:', error)
    return null
  }
}

/**
 * Middleware to require authentication
 */
export async function requireAuth(request: NextRequest): Promise<AuthContext> {
  const token = extractToken(request)
  
  if (!token) {
    throw errors.unauthorized('Authentication token required')
  }
  
  const user = await verifyToken(token)
  
  if (!user) {
    throw errors.unauthorized('Invalid or expired token')
  }
  
  return { user, token }
}

/**
 * Middleware to require admin role
 */
export async function requireAdmin(request: NextRequest): Promise<AuthContext> {
  const authContext = await requireAuth(request)
  
  if (authContext.user.role !== 'admin' && authContext.user.role !== 'superadmin') {
    throw errors.forbidden('Admin access required')
  }
  
  return authContext
}

/**
 * Middleware to require specific permission
 */
export async function requirePermission(request: NextRequest, permission: string): Promise<AuthContext> {
  const authContext = await requireAuth(request)
  
  // Superadmin has all permissions
  if (authContext.user.role === 'superadmin') {
    return authContext
  }
  
  // Check if user has the specific permission
  if (!authContext.user.permissions.includes(permission)) {
    throw errors.forbidden(`Permission '${permission}' required`)
  }
  
  return authContext
}

/**
 * Check if user has permission without throwing
 */
export function hasPermission(user: User, permission: string): boolean {
  if (user.role === 'superadmin') {
    return true
  }
  
  return user.permissions.includes(permission)
}

/**
 * Get current user from request (returns null if not authenticated)
 */
export async function getCurrentUser(request: NextRequest): Promise<User | null> {
  try {
    const authContext = await requireAuth(request)
    return authContext.user
  } catch {
    return null
  }
}

/**
 * Simple session management for browser requests
 */
export class SessionManager {
  private static readonly COOKIE_NAME = 'admin-session'
  private static readonly COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
  
  static createSession(token: string) {
    return {
      name: this.COOKIE_NAME,
      value: token,
      ...this.COOKIE_OPTIONS
    }
  }
  
  static clearSession() {
    return {
      name: this.COOKIE_NAME,
      value: '',
      ...this.COOKIE_OPTIONS,
      maxAge: 0
    }
  }
}

// Predefined permissions
export const permissions = {
  // Content management
  CREATE_POST: 'posts:create',
  EDIT_POST: 'posts:edit',
  DELETE_POST: 'posts:delete',
  PUBLISH_POST: 'posts:publish',
  
  // Category management
  MANAGE_CATEGORIES: 'categories:manage',
  
  // User management
  MANAGE_USERS: 'users:manage',
  VIEW_USERS: 'users:view',
  
  // Translation management
  MANAGE_TRANSLATIONS: 'translations:manage',
  
  // System administration
  SYSTEM_ADMIN: 'system:admin',
  VIEW_ANALYTICS: 'analytics:view',
  
  // File management
  UPLOAD_FILES: 'files:upload',
  DELETE_FILES: 'files:delete'
} as const

export type Permission = typeof permissions[keyof typeof permissions]

/**
 * Rate limiting by user ID
 */
export function getUserRateLimitKey(user: User, endpoint: string): string {
  return `user:${user.id}:${endpoint}`
}