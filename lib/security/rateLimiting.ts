/**
 * Rate Limiting Utilities
 * Simple in-memory rate limiting for API endpoints
 */

interface RateLimitStore {
  [key: string]: {
    requests: number
    resetTime: number
  }
}

const store: RateLimitStore = {}

export interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Maximum requests per window
  keyGenerator?: (req: any) => string // Function to generate unique key
  skipSuccessfulRequests?: boolean
  message?: string
}

export interface RateLimitResult {
  allowed: boolean
  remainingRequests: number
  resetTime: number
  totalRequests: number
}

const defaultConfig: Partial<RateLimitConfig> = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100,
  keyGenerator: (req) => getClientIP(req) || 'unknown',
  message: 'Too many requests. Please try again later.'
}

export function createRateLimit(config: Partial<RateLimitConfig> = {}): RateLimitConfig {
  return { ...defaultConfig, ...config } as RateLimitConfig
}

export function checkRateLimit(
  request: Request,
  config: RateLimitConfig
): RateLimitResult {
  const key = config.keyGenerator ? config.keyGenerator(request) : getClientIP(request) || 'unknown'
  const now = Date.now()
  
  // Clean up expired entries periodically
  if (Math.random() < 0.01) { // 1% chance to clean up
    cleanupExpiredEntries(now)
  }
  
  // Get or create entry
  let entry = store[key]
  
  if (!entry || now >= entry.resetTime) {
    entry = {
      requests: 0,
      resetTime: now + config.windowMs
    }
    store[key] = entry
  }
  
  // Increment request count
  entry.requests++
  
  const allowed = entry.requests <= config.maxRequests
  const remainingRequests = Math.max(0, config.maxRequests - entry.requests)
  
  return {
    allowed,
    remainingRequests,
    resetTime: entry.resetTime,
    totalRequests: entry.requests
  }
}

function cleanupExpiredEntries(now: number) {
  Object.keys(store).forEach(key => {
    if (store[key].resetTime <= now) {
      delete store[key]
    }
  })
}

function getClientIP(request: any): string | null {
  // Try various headers for client IP
  const headers = request.headers
  
  if (typeof headers.get === 'function') {
    return (
      headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      headers.get('x-real-ip') ||
      headers.get('cf-connecting-ip') ||
      headers.get('x-client-ip') ||
      null
    )
  }
  
  return null
}

// Predefined rate limit configs
export const rateLimits = {
  // General API endpoints
  api: createRateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100
  }),
  
  // Admin endpoints (stricter)
  admin: createRateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 50
  }),
  
  // Authentication endpoints (very strict)
  auth: createRateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5
  }),
  
  // Search endpoints
  search: createRateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    maxRequests: 10
  }),
  
  // Translation endpoints (expensive operations)
  translation: createRateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 20
  })
}

export function createRateLimitResponse(result: RateLimitResult, message?: string) {
  return {
    error: message || 'Too many requests',
    code: 'RATE_LIMIT_EXCEEDED',
    retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000),
    limit: {
      remaining: result.remainingRequests,
      resetTime: result.resetTime
    }
  }
}