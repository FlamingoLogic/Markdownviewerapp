import { NextRequest } from 'next/server'
import crypto from 'crypto'

/**
 * CSRF Protection utilities
 * Implements double-submit cookie pattern for CSRF protection
 */

const CSRF_TOKEN_LENGTH = 32
const CSRF_COOKIE_NAME = 'csrf-token'
const CSRF_HEADER_NAME = 'x-csrf-token'

export class CSRFProtection {
  /**
   * Generate a cryptographically secure CSRF token
   */
  static generateToken(): string {
    return crypto.randomBytes(CSRF_TOKEN_LENGTH).toString('hex')
  }

  /**
   * Validate CSRF token from request
   */
  static validateToken(request: NextRequest): boolean {
    try {
      // Get token from header
      const headerToken = request.headers.get(CSRF_HEADER_NAME)
      
      // Get token from cookie
      const cookieToken = request.cookies.get(CSRF_COOKIE_NAME)?.value
      
      // Both tokens must exist and match
      if (!headerToken || !cookieToken) {
        return false
      }
      
      // Use timing-safe comparison to prevent timing attacks
      return crypto.timingSafeEqual(
        Buffer.from(headerToken, 'hex'),
        Buffer.from(cookieToken, 'hex')
      )
    } catch (error) {
      console.error('CSRF validation error:', error)
      return false
    }
  }

  /**
   * Check if request method requires CSRF protection
   */
  static requiresProtection(method: string): boolean {
    const protectedMethods = ['POST', 'PUT', 'PATCH', 'DELETE']
    return protectedMethods.includes(method.toUpperCase())
  }

  /**
   * Get CSRF cookie options
   */
  static getCookieOptions() {
    return {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict' as const,
      maxAge: 60 * 60, // 1 hour
      path: '/',
    }
  }
}

/**
 * Middleware to add CSRF protection to admin endpoints
 */
export function withCSRFProtection<T extends any[]>(
  handler: (request: NextRequest, ...args: T) => Promise<Response>
) {
  return async (request: NextRequest, ...args: T): Promise<Response> => {
    // Only protect state-changing methods
    if (CSRFProtection.requiresProtection(request.method)) {
      if (!CSRFProtection.validateToken(request)) {
        return new Response(
          JSON.stringify({
            error: 'CSRF_TOKEN_INVALID',
            message: 'CSRF token validation failed'
          }),
          {
            status: 403,
            headers: {
              'Content-Type': 'application/json',
            }
          }
        )
      }
    }

    return handler(request, ...args)
  }
}
