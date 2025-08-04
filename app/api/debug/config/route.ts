import { NextRequest, NextResponse } from 'next/server'
import { siteConfigOperations } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    console.log('Debug: Checking Supabase environment variables...')
    
    const envStatus = {
      NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || 'not set',
      isPlaceholder: process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://placeholder.supabase.co'
    }
    
    console.log('Environment status:', envStatus)
    
    // Test getting config
    console.log('Debug: Testing getConfig...')
    const config = await siteConfigOperations.getConfig()
    console.log('Current config:', config)
    
    // Test Supabase connection
    const { createClient } = await import('@supabase/supabase-js')
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-service-key'
    
    console.log('Testing Supabase connection...')
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
    
    try {
      const { data: tables, error: tablesError } = await supabaseAdmin
        .from('site_configs')
        .select('count')
        .limit(1)
      
      console.log('Supabase connection test:', { success: !tablesError, error: tablesError })
    } catch (connectionError) {
      console.log('Supabase connection error:', connectionError)
    }
    
    return NextResponse.json({
      success: true,
      environment: envStatus,
      currentConfig: config,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('Debug endpoint error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}