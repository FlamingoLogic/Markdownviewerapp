import { NextRequest, NextResponse } from 'next/server'
import { PasswordService } from '@/lib/auth'
import { createClient } from '@supabase/supabase-js'
import { getSecurityHeaders } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    console.log('=== AUTO PASSWORD RESTORE ===')
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || ''

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { success: false, error: 'Supabase credentials not available' },
        { status: 500, headers: getSecurityHeaders() }
      )
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Check current password state
    const { data: currentConfig, error: readError } = await supabaseAdmin
      .from('site_configs')
      .select('site_password_hash, admin_password_hash')
      .eq('id', 'main-config')
      .single()

    if (readError || !currentConfig) {
      return NextResponse.json(
        { success: false, error: 'Could not read current config' },
        { status: 500, headers: getSecurityHeaders() }
      )
    }

    const needsSiteRestore = !currentConfig.site_password_hash || currentConfig.site_password_hash.trim() === ''
    const needsAdminRestore = !currentConfig.admin_password_hash || currentConfig.admin_password_hash.trim() === ''

    if (!needsSiteRestore && !needsAdminRestore) {
      return NextResponse.json(
        {
          success: true,
          message: 'Passwords are already set correctly',
          status: {
            sitePassword: '✅ Has valid hash',
            adminPassword: '✅ Has valid hash'
          }
        },
        { status: 200, headers: getSecurityHeaders() }
      )
    }

    // Generate hashes only for missing passwords
    const updates: any = { updated_at: new Date().toISOString() }
    
    if (needsSiteRestore) {
      updates.site_password_hash = await PasswordService.hash('TempSite2024!')
    }
    
    if (needsAdminRestore) {
      updates.admin_password_hash = await PasswordService.hash('TempAdmin2024!')
    }

    // Update only the missing password hashes
    const { error: updateError } = await supabaseAdmin
      .from('site_configs')
      .update(updates)
      .eq('id', 'main-config')

    if (updateError) {
      throw new Error(`Update failed: ${updateError.message}`)
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Passwords automatically restored',
        restored: {
          sitePassword: needsSiteRestore ? '✅ Restored TempSite2024!' : '⚪ Was already set',
          adminPassword: needsAdminRestore ? '✅ Restored TempAdmin2024!' : '⚪ Was already set'
        },
        instructions: {
          siteLogin: 'Use TempSite2024! for site access',
          adminLogin: 'Use TempAdmin2024! for admin panel'
        }
      },
      { status: 200, headers: getSecurityHeaders() }
    )
  } catch (error) {
    console.error('Auto password restore error:', error)
    return NextResponse.json(
      { success: false, message: 'Auto password restore failed', error: (error as Error).message },
      { status: 500, headers: getSecurityHeaders() }
    )
  }
}