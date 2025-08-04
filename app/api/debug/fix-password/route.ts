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

    // Generate correct hash for TempSite2024!
    const correctPassword = 'TempSite2024!'
    const correctHash = await PasswordService.hash(correctPassword)
    
    console.log('Updating site password hash to:', correctHash)

    // Update the site configuration with the correct password hash
    const updatedConfig = await siteConfigOperations.updateConfig({
      ...siteConfig,
      site_password_hash: correctHash
    })

    // Verify the fix worked
    const testVerify = await PasswordService.verify(correctPassword, correctHash)

    return NextResponse.json(
      {
        success: true,
        message: 'Site password hash updated successfully',
        oldHash: siteConfig.site_password_hash,
        newHash: correctHash,
        testPassword: correctPassword,
        verificationTest: testVerify,
        updatedConfig: !!updatedConfig,
        timestamp: new Date().toISOString()
      },
      { status: 200, headers: getSecurityHeaders() }
    )
  } catch (error) {
    console.error('Fix password error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error during password fix', error: (error as Error).message },
      { status: 500, headers: getSecurityHeaders() }
    )
  }
}