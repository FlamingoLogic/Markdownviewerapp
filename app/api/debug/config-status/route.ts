import { NextRequest, NextResponse } from 'next/server'
import { siteConfigOperations } from '@/lib/supabase'
import { getSecurityHeaders } from '@/lib/auth'
import { withDebugSecurity } from '@/lib/debug-security'

export const dynamic = 'force-dynamic'

async function handler(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

    // Get site configuration
    const siteConfig = await siteConfigOperations.getConfig()

    return NextResponse.json(
      {
        success: true,
        debug: {
          supabaseUrl: supabaseUrl,
          supabaseAnonKey: supabaseAnonKey ? 'SET' : 'NOT_SET',
          isPlaceholder: supabaseUrl === 'https://placeholder.supabase.co',
          configLoaded: !!siteConfig,
          configTitle: siteConfig?.title || 'No title',
          configPasswordHash: siteConfig?.site_password_hash ? 'SET' : 'NOT_SET'
        },
        timestamp: new Date().toISOString()
      },
      { status: 200, headers: getSecurityHeaders() }
    )
  } catch (error) {
    console.error('Debug config status error:', error)
    return NextResponse.json(
      {
        success: false,
        error: (error as Error).message,
        timestamp: new Date().toISOString()
      },
      { status: 500, headers: getSecurityHeaders() }
    )
  }
}

export const GET = withDebugSecurity(handler)
