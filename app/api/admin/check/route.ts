import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const adminSession = cookieStore.get('admin-session')

    if (!adminSession) {
      return NextResponse.json(
        { authenticated: false },
        { status: 401 }
      )
    }

    // For now, just check if the session cookie exists
    // In a more robust implementation, you could validate the session token
    return NextResponse.json(
      { authenticated: true },
      { status: 200 }
    )
  } catch (error) {
    console.error('Admin check error:', error)
    return NextResponse.json(
      { authenticated: false },
      { status: 500 }
    )
  }
}