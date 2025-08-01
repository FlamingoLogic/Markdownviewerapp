import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { CookieService, SessionService } from '@/lib/auth'
import { getSecurityHeaders } from '@/lib/auth'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const sessionCookie = cookieStore.get('site_session')
    
    const session = CookieService.parseSessionFromCookie(sessionCookie?.value)
    const isAuthenticated = SessionService.isValidSession(session)

    return NextResponse.json(
      { 
        isAuthenticated,
        expiresAt: session?.expiresAt 
      },
      { 
        status: 200,
        headers: getSecurityHeaders()
      }
    )
  } catch (error) {
    console.error('Auth check error:', error)
    
    return NextResponse.json(
      { 
        isAuthenticated: false,
        error: 'Failed to check authentication' 
      },
      { 
        status: 500,
        headers: getSecurityHeaders()
      }
    )
  }
}