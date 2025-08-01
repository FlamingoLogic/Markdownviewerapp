import { NextRequest, NextResponse } from 'next/server'
import { AuthManager } from '@/lib/auth'
import { siteConfigOperations } from '@/lib/supabase'
import bcrypt from 'bcryptjs'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json()

    if (!password) {
      return NextResponse.json(
        { message: 'Password is required' },
        { status: 400 }
      )
    }

    // Get site configuration to access admin password hash
    const config = await siteConfigOperations.getConfig()
    if (!config) {
      return NextResponse.json(
        { message: 'Site configuration not found' },
        { status: 500 }
      )
    }

    // Verify admin password
    const isValidPassword = await bcrypt.compare(password, config.admin_password_hash)
    if (!isValidPassword) {
      return NextResponse.json(
        { message: 'Invalid admin password' },
        { status: 401 }
      )
    }

    // Create admin session
    const sessionToken = AuthManager.generateSessionToken()
    const response = NextResponse.json(
      { message: 'Admin login successful' },
      { status: 200 }
    )

    // Set admin session cookie
    response.cookies.set('admin-session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/'
    })

    return response
  } catch (error) {
    console.error('Admin login error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}