import { NextRequest, NextResponse } from 'next/server'
import { PasswordService } from '@/lib/auth'
import { siteConfigOperations } from '@/lib/supabase'
import { getSecurityHeaders } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { password, type } = await request.json() // type: 'site' or 'admin'
    
    console.log('=== LOGIN TEST DEBUG ===')
    console.log('Testing password type:', type)
    console.log('Password provided:', !!password)
    
    // Get current config
    const siteConfig = await siteConfigOperations.getConfig()
    if (!siteConfig) {
      return NextResponse.json(
        { success: false, error: 'Site not configured' },
        { status: 500, headers: getSecurityHeaders() }
      )
    }

    console.log('Config retrieved successfully')
    console.log('Site password hash exists:', !!siteConfig.site_password_hash)
    console.log('Admin password hash exists:', !!siteConfig.admin_password_hash)
    console.log('Site hash preview:', siteConfig.site_password_hash?.substring(0, 10) + '...')
    console.log('Admin hash preview:', siteConfig.admin_password_hash?.substring(0, 10) + '...')

    let targetHash = ''
    let hashType = ''
    
    if (type === 'admin') {
      targetHash = siteConfig.admin_password_hash
      hashType = 'admin_password_hash'
    } else {
      targetHash = siteConfig.site_password_hash  
      hashType = 'site_password_hash'
    }

    console.log(`Testing ${hashType}:`, targetHash?.substring(0, 10) + '...')

    if (!targetHash) {
      return NextResponse.json(
        {
          success: false,
          error: `No ${hashType} found in database`,
          details: {
            configExists: !!siteConfig,
            hashExists: !!targetHash,
            hashPreview: targetHash || 'EMPTY'
          }
        },
        { status: 400, headers: getSecurityHeaders() }
      )
    }

    // Test password verification
    let verificationResult = null
    let verificationError = null
    
    try {
      console.log('Starting password verification...')
      verificationResult = await PasswordService.verify(password, targetHash)
      console.log('Verification result:', verificationResult)
    } catch (error) {
      verificationError = (error as Error).message
      console.error('Verification error:', verificationError)
    }

    return NextResponse.json(
      {
        success: true,
        loginTest: {
          passwordType: type,
          passwordProvided: !!password,
          hashExists: !!targetHash,
          hashLength: targetHash?.length || 0,
          hashPreview: targetHash?.substring(0, 15) + '...',
          verificationResult: verificationResult,
          verificationError: verificationError,
          shouldWork: verificationResult === true,
          diagnosis: verificationResult === true ? 
            '✅ Password should work - login issue elsewhere' : 
            '❌ Password verification failed - hash or password incorrect'
        },
        timestamp: new Date().toISOString()
      },
      { status: 200, headers: getSecurityHeaders() }
    )
  } catch (error) {
    console.error('Login test error:', error)
    return NextResponse.json(
      { success: false, message: 'Login test failed', error: (error as Error).message },
      { status: 500, headers: getSecurityHeaders() }
    )
  }
}