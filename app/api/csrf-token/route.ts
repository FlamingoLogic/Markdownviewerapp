import { NextRequest, NextResponse } from 'next/server'
import { CSRFProtection } from '@/lib/csrf-protection'
import { getSecurityHeaders } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Generate a new CSRF token
    const token = CSRFProtection.generateToken()
    
    // Create response with token
    const response = NextResponse.json(
      { 
        csrfToken: token,
        message: 'CSRF token generated successfully'
      },
      { 
        status: 200,
        headers: getSecurityHeaders()
      }
    )

    // Set CSRF token as HttpOnly cookie
    response.cookies.set(
      'csrf-token',
      token,
      CSRFProtection.getCookieOptions()
    )

    return response
  } catch (error) {
    console.error('CSRF token generation error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to generate CSRF token',
        message: 'Internal server error'
      },
      { 
        status: 500,
        headers: getSecurityHeaders()
      }
    )
  }
}
