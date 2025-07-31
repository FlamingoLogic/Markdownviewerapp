import { NextRequest, NextResponse } from 'next/server'
import { CookieService, getSecurityHeaders } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    // Create response
    const response = NextResponse.json(
      {
        success: true,
        message: 'Logged out successfully'
      },
      { 
        status: 200,
        headers: getSecurityHeaders()
      }
    )

    // Clear session cookies
    const siteLogoutCookie = CookieService.createLogoutCookie('site_session')
    const adminLogoutCookie = CookieService.createLogoutCookie('admin_session')

    response.cookies.set(
      siteLogoutCookie.name,
      siteLogoutCookie.value,
      siteLogoutCookie.options
    )

    response.cookies.set(
      adminLogoutCookie.name,
      adminLogoutCookie.value,
      adminLogoutCookie.options
    )

    return response

  } catch (error) {
    console.error('Logout error:', error)
    
    return NextResponse.json(
      { 
        error: 'LOGOUT_FAILED',
        message: 'Failed to logout' 
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