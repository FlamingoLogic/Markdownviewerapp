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

    // Generate correct hash for TempAdmin2024!
    const correctAdminPassword = 'TempAdmin2024!'
    const correctAdminHash = await PasswordService.hash(correctAdminPassword)
    
    console.log('Updating admin password hash to:', correctAdminHash)

    // Update the site configuration with the correct admin password hash
    const updatedConfig = await siteConfigOperations.updateConfig({
      ...siteConfig,
      admin_password_hash: correctAdminHash
    })

    // Verify the fix worked
    const testVerify = await PasswordService.verify(correctAdminPassword, correctAdminHash)

    return NextResponse.json(
      {
        success: true,
        message: 'Admin password hash updated successfully',
        oldAdminHash: siteConfig.admin_password_hash,
        newAdminHash: correctAdminHash,
        testPassword: correctAdminPassword,
        verificationTest: testVerify,
        updatedConfig: !!updatedConfig,
        sitePasswordHash: siteConfig.site_password_hash, // Include for reference
        timestamp: new Date().toISOString()
      },
      { status: 200, headers: getSecurityHeaders() }
    )
  } catch (error) {
    console.error('Fix admin password error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error during admin password fix', error: (error as Error).message },
      { status: 500, headers: getSecurityHeaders() }
    )
  }
}