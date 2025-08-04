import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const envVars = {
      NEXT_PUBLIC_SUPABASE_URL: {
        exists: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        value: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'NOT_SET',
        length: process.env.NEXT_PUBLIC_SUPABASE_URL?.length || 0
      },
      NEXT_PUBLIC_SUPABASE_ANON_KEY: {
        exists: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        value: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'NOT_SET',
        length: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length || 0
      },
      SUPABASE_SERVICE_ROLE_KEY: {
        exists: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        value: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'NOT_SET',
        length: process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0,
        startsWithEyJ: process.env.SUPABASE_SERVICE_ROLE_KEY?.startsWith('eyJ') || false
      },
      NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY: {
        exists: !!process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY,
        value: process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'NOT_SET',
        length: process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY?.length || 0,
        startsWithEyJ: process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY?.startsWith('eyJ') || false
      }
    }
    
    // Log all environment variables for debugging
    console.log('All environment variables:', Object.keys(process.env))
    console.log('Supabase-related env vars:', Object.keys(process.env).filter(key => key.includes('SUPABASE')))
    
    return NextResponse.json({
      success: true,
      environment: envVars,
      allSupabaseEnvVars: Object.keys(process.env).filter(key => key.includes('SUPABASE')),
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('Env debug error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}