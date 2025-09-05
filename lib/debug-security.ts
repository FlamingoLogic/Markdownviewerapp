import { NextRequest, NextResponse } from 'next/server'
import { getSecurityHeaders } from '@/lib/auth'

/**
 * Security middleware for debug endpoints
 * Prevents access to debug endpoints in production environment
 */
export function secureDebugEndpoint(request: NextRequest): NextResponse | null {
  // Block all debug endpoints in production
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { 
        error: 'Not Found',
        message: 'Debug endpoints are disabled in production for security'
      },
      { 
        status: 404,
        headers: getSecurityHeaders()
      }
    )
  }

  // In development, require admin authentication for sensitive debug endpoints
  const sensitiveEndpoints = [
    'admin-password-test',
    'password-test', 
    'all-env',
    'env',
    'force-reset-passwords',
    'fix-admin-password',
    'fix-password',
    'supabase-direct-test'
  ]

  const pathname = request.nextUrl.pathname
  const isSensitive = sensitiveEndpoints.some(endpoint => 
    pathname.includes(endpoint)
  )

  if (isSensitive) {
    // Check for debug authorization
    const debugAuth = request.headers.get('x-debug-auth') || 
                     request.nextUrl.searchParams.get('debug_auth')
    
    const validDebugAuth = process.env.DEBUG_AUTH_TOKEN || 'debug-dev-only-2024'
    
    if (debugAuth !== validDebugAuth) {
      return NextResponse.json(
        { 
          error: 'Unauthorized',
          message: 'Debug authentication required for sensitive endpoints'
        },
        { 
          status: 401,
          headers: getSecurityHeaders()
        }
      )
    }
  }

  return null // Allow request to proceed
}

/**
 * Wrapper function to easily secure debug endpoints
 */
export function withDebugSecurity<T extends any[]>(
  handler: (request: NextRequest, ...args: T) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    // Check security first
    const securityResponse = secureDebugEndpoint(request)
    if (securityResponse) {
      return securityResponse
    }

    // Proceed with original handler
    return handler(request, ...args)
  }
}
