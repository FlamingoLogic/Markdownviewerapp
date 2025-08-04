import { NextRequest, NextResponse } from 'next/server'
import { AuthRateLimiter, getClientIP } from '@/lib/auth'
import { getSecurityHeaders } from '@/lib/auth'

export const dynamic = 'force-dynamic'

const authRateLimiter = new AuthRateLimiter()

export async function GET(request: NextRequest) {
  try {
    const clientIP = getClientIP({
      headers: Object.fromEntries(request.headers.entries()),
      connection: { remoteAddress: request.ip || 'unknown' }
    } as any)

    // Check current rate limit status
    const rateLimitResult = authRateLimiter.checkRateLimit(clientIP)
    
    const now = Date.now()
    let timeUntilReset = 0
    if (rateLimitResult.resetTime) {
      timeUntilReset = Math.max(0, rateLimitResult.resetTime - now)
    }

    return NextResponse.json(
      {
        success: true,
        rateLimitStatus: {
          clientIP: clientIP,
          allowed: rateLimitResult.allowed,
          remainingAttempts: rateLimitResult.remainingAttempts,
          resetTime: rateLimitResult.resetTime ? new Date(rateLimitResult.resetTime).toISOString() : null,
          timeUntilResetMinutes: Math.ceil(timeUntilReset / 60000),
          isRateLimited: !rateLimitResult.allowed,
          maxAttempts: 5,
          windowMinutes: 15
        },
        timestamp: new Date().toISOString()
      },
      { status: 200, headers: getSecurityHeaders() }
    )
  } catch (error) {
    console.error('Rate limit check error:', error)
    return NextResponse.json(
      { success: false, message: 'Rate limit check failed', error: (error as Error).message },
      { status: 500, headers: getSecurityHeaders() }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const clientIP = getClientIP({
      headers: Object.fromEntries(request.headers.entries()),
      connection: { remoteAddress: request.ip || 'unknown' }
    } as any)

    // Reset rate limiting for this IP
    authRateLimiter.reset(clientIP)

    return NextResponse.json(
      {
        success: true,
        message: 'Rate limit reset for IP: ' + clientIP,
        timestamp: new Date().toISOString()
      },
      { status: 200, headers: getSecurityHeaders() }
    )
  } catch (error) {
    console.error('Rate limit reset error:', error)
    return NextResponse.json(
      { success: false, message: 'Rate limit reset failed', error: (error as Error).message },
      { status: 500, headers: getSecurityHeaders() }
    )
  }
}