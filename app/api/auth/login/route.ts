import { NextRequest, NextResponse } from 'next/server'
import { 
  PasswordService, 
  authRateLimiter, 
  SessionService, 
  CookieService,
  getClientIP,
  InputValidator,
  AuthErrors,
  getSecurityHeaders
} from '@/lib/auth'
import { siteConfigOperations } from '@/lib/supabase'
import { logError } from '@/lib/error-tracking'

export async function POST(request: NextRequest) {
  const clientIP = getClientIP({ 
    headers: Object.fromEntries(request.headers.entries()),
    connection: { remoteAddress: request.ip || 'unknown' }
  } as any)

  try {
    // Check rate limiting
    const rateLimitResult = authRateLimiter.checkRateLimit(clientIP)
    
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          error: AuthErrors.RATE_LIMITED.code,
          message: AuthErrors.RATE_LIMITED.message,
          resetTime: rateLimitResult.resetTime
        },
        { 
          status: 429,
          headers: {
            ...getSecurityHeaders(),
            'Retry-After': String(Math.ceil((rateLimitResult.resetTime! - Date.now()) / 1000))
          }
        }
      )
    }

    // Parse request body
    const body = await request.json()
    const { password } = body

    // Validate input
    if (!password || typeof password !== 'string') {
      return NextResponse.json(
        {
          error: AuthErrors.VALIDATION_ERROR.code,
          message: 'Password is required'
        },
        { 
          status: 400,
          headers: getSecurityHeaders()
        }
      )
    }

    // Validate password format
    const validation = InputValidator.validatePassword(password)
    if (!validation.isValid) {
      return NextResponse.json(
        {
          error: AuthErrors.VALIDATION_ERROR.code,
          message: validation.errors[0]
        },
        { 
          status: 400,
          headers: getSecurityHeaders()
        }
      )
    }

    // Get site configuration
    const siteConfig = await siteConfigOperations.getConfig()
    if (!siteConfig) {
      logError(new Error('Site configuration not found'), {
        additionalData: { context: 'login', clientIP }
      })
      
      return NextResponse.json(
        {
          error: 'CONFIGURATION_ERROR',
          message: 'Site not configured'
        },
        { 
          status: 500,
          headers: getSecurityHeaders()
        }
      )
    }

    // Verify password
    const isValidPassword = await PasswordService.verify(password, siteConfig.site_password_hash)
    
    if (!isValidPassword) {
      logError(new Error('Invalid login attempt'), {
        additionalData: { 
          context: 'login', 
          clientIP,
          remainingAttempts: rateLimitResult.remainingAttempts
        }
      })

      return NextResponse.json(
        {
          error: AuthErrors.INVALID_CREDENTIALS.code,
          message: AuthErrors.INVALID_CREDENTIALS.message,
          remainingAttempts: rateLimitResult.remainingAttempts
        },
        { 
          status: 401,
          headers: getSecurityHeaders()
        }
      )
    }

    // Reset rate limiting on successful login
    authRateLimiter.reset(clientIP)

    // Create session
    const session = SessionService.createSession(false) // false = not admin
    const sessionCookie = CookieService.createSiteSessionCookie(session)

    // Create response
    const response = NextResponse.json(
      {
        success: true,
        message: 'Login successful',
        expiresAt: session.expiresAt
      },
      { 
        status: 200,
        headers: getSecurityHeaders()
      }
    )

    // Set session cookie
    response.cookies.set(
      sessionCookie.name,
      sessionCookie.value,
      sessionCookie.options
    )

    return response

  } catch (error) {
    logError(error as Error, {
      additionalData: { context: 'login', clientIP }
    })

    return NextResponse.json(
      {
        error: 'INTERNAL_ERROR',
        message: 'Login failed due to server error'
      },
      { 
        status: 500,
        headers: getSecurityHeaders()
      }
    )
  }
}

// Handle unsupported methods
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { 
      status: 405,
      headers: {
        ...getSecurityHeaders(),
        'Allow': 'POST'
      }
    }
  )
}