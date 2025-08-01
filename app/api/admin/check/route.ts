import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { SessionService } from '@/lib/auth'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const adminSessionCookie = cookieStore.get('admin-session')

    if (!adminSessionCookie) {
      return NextResponse.json(
        { authenticated: false },
        { status: 401 }
      )
    }

    // Decode and validate the session
    try {
      const sessionData = JSON.parse(Buffer.from(adminSessionCookie.value, 'base64').toString())
      const isValid = SessionService.isAdminSession(sessionData)
      
      return NextResponse.json(
        { authenticated: isValid },
        { status: isValid ? 200 : 401 }
      )
    } catch (decodeError) {
      // Invalid session format
      return NextResponse.json(
        { authenticated: false },
        { status: 401 }
      )
    }
  } catch (error) {
    console.error('Admin check error:', error)
    return NextResponse.json(
      { authenticated: false },
      { status: 500 }
    )
  }
}