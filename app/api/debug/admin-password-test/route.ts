import { NextRequest, NextResponse } from 'next/server'
import { PasswordService } from '@/lib/auth'
import { siteConfigOperations } from '@/lib/supabase'
import { getSecurityHeaders } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const siteConfig = await siteConfigOperations.getConfig()
    if (!siteConfig) {
      return NextResponse.json(
        { success: false, error: 'Site not configured' },
        { status: 500, headers: getSecurityHeaders() }
      )
    }

    // Test the expected admin password
    const testPassword = 'TempAdmin2024!'
    const isValid = await PasswordService.verify(testPassword, siteConfig.admin_password_hash)
    
    // Also test creating a fresh hash for comparison
    const freshHash = await PasswordService.hash(testPassword)
    const freshHashValid = await PasswordService.verify(testPassword, freshHash)

    return NextResponse.json(
      {
        success: true,
        testPassword: testPassword,
        storedAdminHash: siteConfig.admin_password_hash,
        isValidAdminPassword: isValid,
        freshAdminHash: freshHash,
        freshHashValid: freshHashValid,
        hashMatch: siteConfig.admin_password_hash === freshHash,
        // Also include site password for comparison
        storedSiteHash: siteConfig.site_password_hash,
        timestamp: new Date().toISOString()
      },
      { status: 200, headers: getSecurityHeaders() }
    )
  } catch (error) {
    console.error('Debug admin password test error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error during admin password test', error: (error as Error).message },
      { status: 500, headers: getSecurityHeaders() }
    )
  }
}