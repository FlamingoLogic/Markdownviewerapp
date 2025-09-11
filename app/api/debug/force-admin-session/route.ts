import { NextRequest, NextResponse } from 'next/server'
import { CookieService, SessionService, getSecurityHeaders } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    console.log('=== FORCE ADMIN SESSION DEBUG ===')
    
    // Create an admin session
    const adminSession = SessionService.createSession(true)
    const sessionCookie = CookieService.createAdminSessionCookie(adminSession)
    
    console.log('Created admin session:', adminSession)
    console.log('Session cookie:', sessionCookie)

    const response = NextResponse.json(
      {
        success: true,
        message: 'Admin session created and set!',
        session: adminSession,
        instructions: 'Admin session cookie has been set. You should now be able to use the admin panel.'
      },
      { 
        status: 200,
        headers: getSecurityHeaders()
      }
    )

    // Set the admin session cookie
    response.cookies.set(sessionCookie)
    
    return response
  } catch (error) {
    console.error('Force admin session error:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to create admin session', 
        error: (error as Error).message 
      },
      { 
        status: 500,
        headers: getSecurityHeaders()
      }
    )
  }
}
