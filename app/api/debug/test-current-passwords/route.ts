import { NextRequest, NextResponse } from 'next/server'
import { PasswordService } from '@/lib/auth'
import { siteConfigOperations } from '@/lib/supabase'
import { getSecurityHeaders } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Get current config
    const config = await siteConfigOperations.getConfig()
    if (!config) {
      return NextResponse.json(
        { success: false, error: 'No configuration found' },
        { status: 500, headers: getSecurityHeaders() }
      )
    }

    // Test both default passwords against current hashes
    const sitePassword = 'TempSite2024!'
    const adminPassword = 'TempAdmin2024!'
    
    let siteTest = null
    let adminTest = null
    
    // Test site password
    if (config.site_password_hash) {
      try {
        siteTest = await PasswordService.verify(sitePassword, config.site_password_hash)
      } catch (e) {
        siteTest = `Error: ${(e as Error).message}`
      }
    }
    
    // Test admin password  
    if (config.admin_password_hash) {
      try {
        adminTest = await PasswordService.verify(adminPassword, config.admin_password_hash)
      } catch (e) {
        adminTest = `Error: ${(e as Error).message}`
      }
    }

    return NextResponse.json(
      {
        success: true,
        currentHashes: {
          site: {
            exists: !!config.site_password_hash,
            hash: config.site_password_hash?.substring(0, 20) + '...' || 'EMPTY',
            testPassword: sitePassword,
            passwordWorks: siteTest
          },
          admin: {
            exists: !!config.admin_password_hash,
            hash: config.admin_password_hash?.substring(0, 20) + '...' || 'EMPTY', 
            testPassword: adminPassword,
            passwordWorks: adminTest
          }
        },
        recommendations: {
          siteLogin: siteTest === true ? "✅ TempSite2024! should work" : "❌ TempSite2024! will fail",
          adminLogin: adminTest === true ? "✅ TempAdmin2024! should work" : "❌ TempAdmin2024! will fail"
        },
        timestamp: new Date().toISOString()
      },
      { status: 200, headers: getSecurityHeaders() }
    )
  } catch (error) {
    console.error('Test current passwords error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error during password test', error: (error as Error).message },
      { status: 500, headers: getSecurityHeaders() }
    )
  }
}