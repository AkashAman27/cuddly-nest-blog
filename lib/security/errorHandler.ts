/**
 * Centralized Error Handling Utility
 * Provides secure error responses that don't leak sensitive information
 */

export interface ErrorResponse {
  error: string
  code?: string
  timestamp: string
  requestId?: string
}

export interface ValidationError {
  field: string
  message: string
  code: string
}

export class SecureError extends Error {
  public readonly statusCode: number
  public readonly code: string
  public readonly userMessage: string
  public readonly validationErrors?: ValidationError[]

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_ERROR',
    userMessage?: string,
    validationErrors?: ValidationError[]
  ) {
    super(message)
    this.name = 'SecureError'
    this.statusCode = statusCode
    this.code = code
    this.userMessage = userMessage || this.getDefaultUserMessage(statusCode)
    this.validationErrors = validationErrors
  }

  private getDefaultUserMessage(statusCode: number): string {
    switch (statusCode) {
      case 400:
        return 'Invalid request. Please check your input and try again.'
      case 401:
        return 'Authentication required.'
      case 403:
        return 'Access denied.'
      case 404:
        return 'Resource not found.'
      case 429:
        return 'Too many requests. Please try again later.'
      case 500:
      default:
        return 'Something went wrong. Please try again later.'
    }
  }
}

export function createErrorResponse(
  error: unknown,
  isDevelopment: boolean = process.env.NODE_ENV === 'development'
): { response: ErrorResponse; statusCode: number } {
  const timestamp = new Date().toISOString()
  const requestId = generateRequestId()

  // Log the full error for debugging
  console.error('Error occurred:', {
    error,
    timestamp,
    requestId,
    stack: error instanceof Error ? error.stack : undefined
  })

  if (error instanceof SecureError) {
    return {
      response: {
        error: error.userMessage,
        code: error.code,
        timestamp,
        requestId,
        ...(error.validationErrors && { validationErrors: error.validationErrors })
      },
      statusCode: error.statusCode
    }
  }

  // Handle known error types
  if (error && typeof error === 'object' && 'code' in error) {
    const typedError = error as { code: string; message?: string }
    
    // Supabase error handling
    if (typedError.code === 'PGRST116') {
      return {
        response: {
          error: 'Resource not found',
          code: 'NOT_FOUND',
          timestamp,
          requestId
        },
        statusCode: 404
      }
    }
    
    if (typedError.code?.startsWith('23')) { // PostgreSQL constraint violations
      return {
        response: {
          error: 'Data validation failed',
          code: 'VALIDATION_ERROR',
          timestamp,
          requestId
        },
        statusCode: 400
      }
    }
  }

  // Generic error handling
  return {
    response: {
      error: isDevelopment 
        ? (error instanceof Error ? error.message : 'Unknown error')
        : 'Internal server error',
      code: 'INTERNAL_ERROR',
      timestamp,
      requestId
    },
    statusCode: 500
  }
}

export function generateRequestId(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15)
}

// Common error creators
export const errors = {
  badRequest: (message: string = 'Bad request', validationErrors?: ValidationError[]) =>
    new SecureError(message, 400, 'BAD_REQUEST', undefined, validationErrors),
    
  unauthorized: (message: string = 'Unauthorized') =>
    new SecureError(message, 401, 'UNAUTHORIZED'),
    
  forbidden: (message: string = 'Access denied') =>
    new SecureError(message, 403, 'FORBIDDEN'),
    
  notFound: (resource: string = 'Resource') =>
    new SecureError(`${resource} not found`, 404, 'NOT_FOUND'),
    
  conflict: (message: string = 'Conflict') =>
    new SecureError(message, 409, 'CONFLICT'),
    
  tooManyRequests: (message: string = 'Rate limit exceeded') =>
    new SecureError(message, 429, 'RATE_LIMIT_EXCEEDED'),
    
  internal: (message: string = 'Internal server error') =>
    new SecureError(message, 500, 'INTERNAL_ERROR')
}