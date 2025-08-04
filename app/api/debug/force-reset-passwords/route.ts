import { NextRequest, NextResponse } from 'next/server'
import { PasswordService } from '@/lib/auth'
import { siteConfigOperations } from '@/lib/supabase'
import { getSecurityHeaders } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Generate correct hashes for both passwords
    const sitePassword = 'TempSite2024!'
    const adminPassword = 'TempAdmin2024!'
    
    const siteHash = await PasswordService.hash(sitePassword)
    const adminHash = await PasswordService.hash(adminPassword)
    
    console.log('Force resetting both passwords:')
    console.log('Site password hash:', siteHash)
    console.log('Admin password hash:', adminHash)

    // Get current config
    const currentConfig = await siteConfigOperations.getConfig()
    if (!currentConfig) {
      return NextResponse.json(
        { success: false, error: 'Site not configured' },
        { status: 500, headers: getSecurityHeaders() }
      )
    }

    // Force update both password hashes
    const updatedConfig = await siteConfigOperations.updateConfig({
      ...currentConfig,
      site_password_hash: siteHash,
      admin_password_hash: adminHash,
      updated_at: new Date().toISOString()
    })

    // Verify both passwords work
    const siteVerify = await PasswordService.verify(sitePassword, siteHash)
    const adminVerify = await PasswordService.verify(adminPassword, adminHash)

    // Get the config again to confirm persistence
    const verifyConfig = await siteConfigOperations.getConfig()

    return NextResponse.json(
      {
        success: true,
        message: 'BOTH passwords forcefully reset and verified',
        passwords: {
          site: {
            password: sitePassword,
            oldHash: currentConfig.site_password_hash,
            newHash: siteHash,
            verification: siteVerify,
            persisted: verifyConfig?.site_password_hash === siteHash
          },
          admin: {
            password: adminPassword,
            oldHash: currentConfig.admin_password_hash,
            newHash: adminHash,
            verification: adminVerify,
            persisted: verifyConfig?.admin_password_hash === adminHash
          }
        },
        configUpdated: !!updatedConfig,
        configPersisted: !!verifyConfig,
        timestamp: new Date().toISOString()
      },
      { status: 200, headers: getSecurityHeaders() }
    )
  } catch (error) {
    console.error('Force password reset error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error during force password reset', error: (error as Error).message },
      { status: 500, headers: getSecurityHeaders() }
    )
  }
}