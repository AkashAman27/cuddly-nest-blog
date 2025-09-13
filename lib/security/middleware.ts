/**
 * Security Middleware for API Routes
 * Provides a unified way to apply security measures to API endpoints
 */

import { NextRequest, NextResponse } from 'next/server'
import { createErrorResponse, SecureError } from './errorHandler'
import { requireAuth, requireAdmin, requirePermission, Permission, AuthContext } from './auth'
import { validateAndSanitize, ValidationSchema } from './validation'
import { checkRateLimit, RateLimitConfig, createRateLimitResponse } from './rateLimiting'

export interface MiddlewareOptions {
  auth?: 'required' | 'admin' | Permission
  rateLimit?: RateLimitConfig
  validation?: {
    body?: ValidationSchema
    query?: ValidationSchema
  }
  cors?: {
    origins?: string[]
    methods?: string[]
    headers?: string[]
  }
}

export interface SecureRouteContext {
  request: NextRequest
  auth?: AuthContext
  body?: any
  query?: any
}

export type SecureRouteHandler = (
  context: SecureRouteContext
) => Promise<NextResponse> | NextResponse

/**
 * Create a secure API route with middleware
 */
export function createSecureRoute(
  handler: SecureRouteHandler,
  options: MiddlewareOptions = {}
) {
  return async (request: NextRequest, routeContext?: any): Promise<NextResponse> => {
    try {
      let auth: AuthContext | undefined
      let body: any
      let query: any

      // Extract query parameters
      const url = new URL(request.url)
      query = Object.fromEntries(url.searchParams.entries())

      // Parse body for POST/PUT/PATCH requests
      if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
        const contentType = request.headers.get('content-type')
        if (contentType?.includes('application/json')) {
          try {
            body = await request.json()
          } catch (error) {
            throw new SecureError('Invalid JSON in request body', 400, 'INVALID_JSON')
          }
        } else if (contentType?.includes('application/x-www-form-urlencoded')) {
          const formData = await request.formData()
          body = Object.fromEntries(formData.entries())
        }
      }

      // Rate limiting
      if (options.rateLimit) {
        const rateLimitResult = checkRateLimit(request, options.rateLimit)
        if (!rateLimitResult.allowed) {
          return NextResponse.json(
            createRateLimitResponse(rateLimitResult, options.rateLimit.message),
            { 
              status: 429,
              headers: {
                'X-RateLimit-Remaining': rateLimitResult.remainingRequests.toString(),
                'X-RateLimit-Reset': Math.ceil(rateLimitResult.resetTime / 1000).toString()
              }
            }
          )
        }
      }

      // Authentication
      if (options.auth) {
        if (options.auth === 'required') {
          auth = await requireAuth(request)
        } else if (options.auth === 'admin') {
          auth = await requireAdmin(request)
        } else {
          auth = await requirePermission(request, options.auth)
        }
      }

      // Input validation
      if (options.validation) {
        if (options.validation.body && body) {
          body = validateAndSanitize(body, options.validation.body)
        }
        if (options.validation.query && query) {
          query = validateAndSanitize(query, options.validation.query)
        }
      }

      // CORS handling
      if (options.cors) {
        const origin = request.headers.get('origin')
        const allowedOrigins = options.cors.origins || []
        
        if (origin && allowedOrigins.length > 0 && !allowedOrigins.includes(origin)) {
          throw new SecureError('CORS policy violation', 403, 'CORS_ERROR')
        }
      }

      // Call the actual handler
      const response = await handler({
        request,
        auth,
        body,
        query,
        ...routeContext
      })

      // Add CORS headers if configured
      if (options.cors) {
        const corsHeaders: Record<string, string> = {}
        
        if (options.cors.origins) {
          corsHeaders['Access-Control-Allow-Origin'] = options.cors.origins.join(', ')
        }
        if (options.cors.methods) {
          corsHeaders['Access-Control-Allow-Methods'] = options.cors.methods.join(', ')
        }
        if (options.cors.headers) {
          corsHeaders['Access-Control-Allow-Headers'] = options.cors.headers.join(', ')
        }

        // Add CORS headers to response
        Object.entries(corsHeaders).forEach(([key, value]) => {
          response.headers.set(key, value)
        })
      }

      return response

    } catch (error) {
      const { response, statusCode } = createErrorResponse(error)
      return NextResponse.json(response, { status: statusCode })
    }
  }
}

/**
 * Predefined middleware configurations
 */
export const middlewarePresets = {
  // Public API endpoints
  public: {
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 100
    }
  } as MiddlewareOptions,

  // Admin-only endpoints
  admin: {
    auth: 'admin' as const,
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 50
    }
  } as MiddlewareOptions,

  // Search endpoints
  search: {
    rateLimit: {
      windowMs: 1 * 60 * 1000, // 1 minute
      maxRequests: 10
    },
    validation: {
      query: {
        q: { field: 'q', type: 'string' as const, maxLength: 200 },
        limit: { field: 'limit', type: 'number' as const, min: 1, max: 50 }
      }
    }
  } as MiddlewareOptions,

  // Content management
  content: {
    auth: 'admin' as const,
    rateLimit: {
      windowMs: 5 * 60 * 1000, // 5 minutes
      maxRequests: 20
    }
  } as MiddlewareOptions,

  // Translation endpoints
  translation: {
    auth: 'admin' as const,
    rateLimit: {
      windowMs: 60 * 60 * 1000, // 1 hour
      maxRequests: 10
    }
  } as MiddlewareOptions
}

/**
 * Helper to create method-specific handlers
 */
export function createMethodHandlers(handlers: {
  GET?: SecureRouteHandler
  POST?: SecureRouteHandler
  PUT?: SecureRouteHandler
  PATCH?: SecureRouteHandler
  DELETE?: SecureRouteHandler
}, options: MiddlewareOptions = {}) {
  return createSecureRoute(async (context) => {
    const method = context.request.method
    const handler = handlers[method as keyof typeof handlers]
    
    if (!handler) {
      throw new SecureError(`Method ${method} not allowed`, 405, 'METHOD_NOT_ALLOWED')
    }
    
    return handler(context)
  }, options)
}