import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getSecurityHeaders } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || ''

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Get current password state with timestamps
    const { data: config, error } = await supabaseAdmin
      .from('site_configs')
      .select('*')
      .eq('id', 'main-config')
      .single()

    if (error || !config) {
      return NextResponse.json(
        { success: false, error: 'Could not read config' },
        { status: 500, headers: getSecurityHeaders() }
      )
    }

    // Analyze password state
    const siteHashExists = config.site_password_hash && config.site_password_hash.trim() !== ''
    const adminHashExists = config.admin_password_hash && config.admin_password_hash.trim() !== ''
    
    const siteHashLength = config.site_password_hash?.length || 0
    const adminHashLength = config.admin_password_hash?.length || 0
    
    const lastUpdated = new Date(config.updated_at)
    const timeSinceUpdate = Date.now() - lastUpdated.getTime()
    const minutesSinceUpdate = Math.floor(timeSinceUpdate / 60000)

    return NextResponse.json(
      {
        success: true,
        monitoring: {
          timestamp: new Date().toISOString(),
          configId: config.id,
          lastUpdated: config.updated_at,
          minutesSinceLastUpdate: minutesSinceUpdate,
          passwordState: {
            site: {
              exists: siteHashExists,
              length: siteHashLength,
              preview: config.site_password_hash?.substring(0, 10) + '...' || 'EMPTY',
              status: siteHashExists ? '✅ HAS HASH' : '❌ MISSING'
            },
            admin: {
              exists: adminHashExists, 
              length: adminHashLength,
              preview: config.admin_password_hash?.substring(0, 10) + '...' || 'EMPTY',
              status: adminHashExists ? '✅ HAS HASH' : '❌ MISSING'
            }
          },
          summary: {
            bothPasswordsExist: siteHashExists && adminHashExists,
            anyPasswordMissing: !siteHashExists || !adminHashExists,
            recentlyUpdated: minutesSinceUpdate < 5
          },
          fullConfig: {
            title: config.title,
            iframe_url: config.iframe_url,
            updated_at: config.updated_at
          }
        }
      },
      { status: 200, headers: getSecurityHeaders() }
    )
  } catch (error) {
    console.error('Password monitor error:', error)
    return NextResponse.json(
      { success: false, message: 'Password monitoring failed', error: (error as Error).message },
      { status: 500, headers: getSecurityHeaders() }
    )
  }
}