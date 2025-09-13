/**
 * Input Validation Utilities
 * Provides secure validation for API inputs
 */

import { errors, ValidationError } from './errorHandler'

export interface ValidationRule {
  field: string
  required?: boolean
  type?: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'email' | 'url' | 'uuid'
  minLength?: number
  maxLength?: number
  min?: number
  max?: number
  pattern?: RegExp
  allowedValues?: (string | number)[]
  custom?: (value: any) => boolean | string
}

export interface ValidationSchema {
  [key: string]: ValidationRule | ValidationRule[]
}

export function validateInput(data: any, schema: ValidationSchema): { isValid: boolean; errors: ValidationError[] } {
  const validationErrors: ValidationError[] = []

  for (const [fieldName, rules] of Object.entries(schema)) {
    const fieldRules = Array.isArray(rules) ? rules : [rules]
    const value = data[fieldName]

    for (const rule of fieldRules) {
      const fieldError = validateField(fieldName, value, rule)
      if (fieldError) {
        validationErrors.push(fieldError)
      }
    }
  }

  return {
    isValid: validationErrors.length === 0,
    errors: validationErrors
  }
}

function validateField(fieldName: string, value: any, rule: ValidationRule): ValidationError | null {
  // Check required
  if (rule.required && (value === undefined || value === null || value === '')) {
    return {
      field: fieldName,
      message: `${fieldName} is required`,
      code: 'REQUIRED'
    }
  }

  // Skip further validation if value is not provided and not required
  if (!rule.required && (value === undefined || value === null || value === '')) {
    return null
  }

  // Type validation
  if (rule.type) {
    const typeError = validateType(fieldName, value, rule.type)
    if (typeError) return typeError
  }

  // String validations
  if (typeof value === 'string') {
    if (rule.minLength !== undefined && value.length < rule.minLength) {
      return {
        field: fieldName,
        message: `${fieldName} must be at least ${rule.minLength} characters`,
        code: 'MIN_LENGTH'
      }
    }

    if (rule.maxLength !== undefined && value.length > rule.maxLength) {
      return {
        field: fieldName,
        message: `${fieldName} must not exceed ${rule.maxLength} characters`,
        code: 'MAX_LENGTH'
      }
    }

    if (rule.pattern && !rule.pattern.test(value)) {
      return {
        field: fieldName,
        message: `${fieldName} format is invalid`,
        code: 'INVALID_FORMAT'
      }
    }
  }

  // Number validations
  if (typeof value === 'number') {
    if (rule.min !== undefined && value < rule.min) {
      return {
        field: fieldName,
        message: `${fieldName} must be at least ${rule.min}`,
        code: 'MIN_VALUE'
      }
    }

    if (rule.max !== undefined && value > rule.max) {
      return {
        field: fieldName,
        message: `${fieldName} must not exceed ${rule.max}`,
        code: 'MAX_VALUE'
      }
    }
  }

  // Array validations
  if (Array.isArray(value)) {
    if (rule.minLength !== undefined && value.length < rule.minLength) {
      return {
        field: fieldName,
        message: `${fieldName} must have at least ${rule.minLength} items`,
        code: 'MIN_ITEMS'
      }
    }

    if (rule.maxLength !== undefined && value.length > rule.maxLength) {
      return {
        field: fieldName,
        message: `${fieldName} must not have more than ${rule.maxLength} items`,
        code: 'MAX_ITEMS'
      }
    }
  }

  // Allowed values
  if (rule.allowedValues && !rule.allowedValues.includes(value)) {
    return {
      field: fieldName,
      message: `${fieldName} must be one of: ${rule.allowedValues.join(', ')}`,
      code: 'INVALID_VALUE'
    }
  }

  // Custom validation
  if (rule.custom) {
    const customResult = rule.custom(value)
    if (customResult !== true) {
      return {
        field: fieldName,
        message: typeof customResult === 'string' ? customResult : `${fieldName} is invalid`,
        code: 'CUSTOM_VALIDATION'
      }
    }
  }

  return null
}

function validateType(fieldName: string, value: any, type: string): ValidationError | null {
  switch (type) {
    case 'string':
      if (typeof value !== 'string') {
        return {
          field: fieldName,
          message: `${fieldName} must be a string`,
          code: 'INVALID_TYPE'
        }
      }
      break
    
    case 'number':
      if (typeof value !== 'number' || isNaN(value)) {
        return {
          field: fieldName,
          message: `${fieldName} must be a number`,
          code: 'INVALID_TYPE'
        }
      }
      break
    
    case 'boolean':
      if (typeof value !== 'boolean') {
        return {
          field: fieldName,
          message: `${fieldName} must be a boolean`,
          code: 'INVALID_TYPE'
        }
      }
      break
    
    case 'array':
      if (!Array.isArray(value)) {
        return {
          field: fieldName,
          message: `${fieldName} must be an array`,
          code: 'INVALID_TYPE'
        }
      }
      break
    
    case 'object':
      if (typeof value !== 'object' || Array.isArray(value) || value === null) {
        return {
          field: fieldName,
          message: `${fieldName} must be an object`,
          code: 'INVALID_TYPE'
        }
      }
      break
    
    case 'email':
      if (typeof value !== 'string' || !isValidEmail(value)) {
        return {
          field: fieldName,
          message: `${fieldName} must be a valid email address`,
          code: 'INVALID_EMAIL'
        }
      }
      break
    
    case 'url':
      if (typeof value !== 'string' || !isValidUrl(value)) {
        return {
          field: fieldName,
          message: `${fieldName} must be a valid URL`,
          code: 'INVALID_URL'
        }
      }
      break
    
    case 'uuid':
      if (typeof value !== 'string' || !isValidUuid(value)) {
        return {
          field: fieldName,
          message: `${fieldName} must be a valid UUID`,
          code: 'INVALID_UUID'
        }
      }
      break
  }
  
  return null
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

function isValidUuid(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}

// Common validation schemas
export const commonSchemas = {
  blogPost: {
    title: { field: 'title', required: true, type: 'string' as const, minLength: 1, maxLength: 200 },
    slug: { field: 'slug', required: true, type: 'string' as const, pattern: /^[a-z0-9-]+$/, maxLength: 100 },
    content: { field: 'content', type: 'string' as const, maxLength: 100000 },
    excerpt: { field: 'excerpt', type: 'string' as const, maxLength: 500 },
    status: { field: 'status', type: 'string' as const, allowedValues: ['draft', 'published', 'archived'] },
    author_id: { field: 'author_id', required: true, type: 'uuid' as const }
  },
  
  category: {
    name: { field: 'name', required: true, type: 'string' as const, minLength: 1, maxLength: 100 },
    slug: { field: 'slug', required: true, type: 'string' as const, pattern: /^[a-z0-9-]+$/, maxLength: 100 },
    description: { field: 'description', type: 'string' as const, maxLength: 500 }
  },
  
  pagination: {
    page: { field: 'page', type: 'number' as const, min: 1, max: 1000 },
    limit: { field: 'limit', type: 'number' as const, min: 1, max: 100 }
  }
}

// Sanitization utilities
export function sanitizeInput(input: any): any {
  if (typeof input === 'string') {
    // Remove null bytes and control characters except allowed ones
    return input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
  }
  
  if (Array.isArray(input)) {
    return input.map(sanitizeInput)
  }
  
  if (input && typeof input === 'object') {
    const sanitized: any = {}
    for (const [key, value] of Object.entries(input)) {
      sanitized[key] = sanitizeInput(value)
    }
    return sanitized
  }
  
  return input
}

export function validateAndSanitize(data: any, schema: ValidationSchema) {
  const sanitized = sanitizeInput(data)
  const validation = validateInput(sanitized, schema)
  
  if (!validation.isValid) {
    throw errors.badRequest('Validation failed', validation.errors)
  }
  
  return sanitized
}