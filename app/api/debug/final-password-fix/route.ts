import { NextRequest, NextResponse } from 'next/server'
import { PasswordService } from '@/lib/auth'
import { createClient } from '@supabase/supabase-js'
import { getSecurityHeaders } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    console.log('=== FINAL PASSWORD FIX ===')
    
    // Use direct Supabase connection (we know this works!)
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

    // Generate correct hashes for BOTH passwords
    const sitePassword = 'TempSite2024!'
    const adminPassword = 'TempAdmin2024!'
    
    console.log('Generating correct password hashes...')
    const siteHash = await PasswordService.hash(sitePassword)
    const adminHash = await PasswordService.hash(adminPassword)
    
    console.log('Site hash generated:', siteHash.substring(0, 20) + '...')
    console.log('Admin hash generated:', adminHash.substring(0, 20) + '...')

    // Update BOTH passwords using direct Supabase (proven method)
    console.log('Updating passwords via direct Supabase...')
    const { data: updateData, error: updateError } = await supabaseAdmin
      .from('site_configs')
      .update({ 
        site_password_hash: siteHash,
        admin_password_hash: adminHash,
        updated_at: new Date().toISOString()
      })
      .eq('id', 'main-config')
      .select()

    console.log('Update result:', { data: updateData, error: updateError })

    if (updateError) {
      throw new Error(`Update failed: ${updateError.message}`)
    }

    // Verify BOTH passwords work by reading back and testing
    console.log('Verifying passwords...')
    const { data: verifyData, error: verifyError } = await supabaseAdmin
      .from('site_configs')
      .select('site_password_hash, admin_password_hash')
      .eq('id', 'main-config')
      .single()

    if (verifyError) {
      throw new Error(`Verification read failed: ${verifyError.message}`)
    }

    // Test both passwords work
    const siteVerification = await PasswordService.verify(sitePassword, verifyData.site_password_hash)
    const adminVerification = await PasswordService.verify(adminPassword, verifyData.admin_password_hash)

    console.log('Site password verification:', siteVerification)
    console.log('Admin password verification:', adminVerification)

    return NextResponse.json(
      {
        success: true,
        message: 'FINAL PASSWORD FIX COMPLETE - Both passwords set and verified!',
        results: {
          sitePassword: {
            password: sitePassword,
            hashGenerated: siteHash.substring(0, 20) + '...',
            storedCorrectly: verifyData.site_password_hash === siteHash,
            passwordWorks: siteVerification,
            status: siteVerification ? '✅ TempSite2024! READY' : '❌ Failed'
          },
          adminPassword: {
            password: adminPassword,
            hashGenerated: adminHash.substring(0, 20) + '...',
            storedCorrectly: verifyData.admin_password_hash === adminHash,
            passwordWorks: adminVerification,
            status: adminVerification ? '✅ TempAdmin2024! READY' : '❌ Failed'
          },
          databaseUpdate: {
            updateSucceeded: !updateError,
            affectedRows: updateData?.length || 0,
            verificationSucceeded: !verifyError
          }
        },
        instructions: {
          siteLogin: siteVerification ? 'Use TempSite2024! for site access' : 'Site login still broken',
          adminLogin: adminVerification ? 'Use TempAdmin2024! for admin panel' : 'Admin login still broken'
        },
        timestamp: new Date().toISOString()
      },
      { status: 200, headers: getSecurityHeaders() }
    )
  } catch (error) {
    console.error('Final password fix error:', error)
    return NextResponse.json(
      { success: false, message: 'Final password fix failed', error: (error as Error).message },
      { status: 500, headers: getSecurityHeaders() }
    )
  }
}