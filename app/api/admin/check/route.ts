import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { CookieService, SessionService, getSecurityHeaders } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Check for admin session cookie
    const cookieStore = cookies()
    const adminSessionCookie = cookieStore.get('admin_session')
    const session = CookieService.parseSessionFromCookie(adminSessionCookie?.value)
    
    const isAuthenticated = SessionService.isAdminSession(session)
    
    return NextResponse.json(
      { isAuthenticated },
      { 
        status: 200,
        headers: getSecurityHeaders()
      }
    )
  } catch (error) {
    console.error('Admin check error:', error)
    return NextResponse.json(
      { isAuthenticated: false },
      { 
        status: 500,
        headers: getSecurityHeaders()
      }
    )
  }
}