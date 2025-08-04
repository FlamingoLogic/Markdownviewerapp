import { NextRequest, NextResponse } from 'next/server'
import { PasswordService } from '@/lib/auth'
import { siteConfigOperations } from '@/lib/supabase'
import { getSecurityHeaders } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Deep database investigation
    console.log('=== DATABASE INVESTIGATION ===')
    
    // 1. Get current config multiple times to check consistency
    const config1 = await siteConfigOperations.getConfig()
    await new Promise(resolve => setTimeout(resolve, 1000)) // Wait 1 second
    const config2 = await siteConfigOperations.getConfig()
    
    // 2. Try to update with a test value and immediately read back
    const testHash = await PasswordService.hash('TEST_PASSWORD_123')
    console.log('Generated test hash:', testHash)
    
    const updateResult = await siteConfigOperations.updateConfig({
      admin_password_hash: testHash,
      updated_at: new Date().toISOString()
    })
    console.log('Update result:', updateResult)
    
    // 3. Read back immediately after update
    const configAfterUpdate = await siteConfigOperations.getConfig()
    console.log('Config after update:', configAfterUpdate?.admin_password_hash)
    
    // 4. Check if the test hash persisted
    const testPersisted = configAfterUpdate?.admin_password_hash === testHash
    console.log('Test hash persisted:', testPersisted)
    
    // 5. Try to verify the stored hash
    let verificationResult = null
    if (configAfterUpdate?.admin_password_hash) {
      try {
        verificationResult = await PasswordService.verify('TEST_PASSWORD_123', configAfterUpdate.admin_password_hash)
      } catch (e) {
        verificationResult = `Error: ${(e as Error).message}`
      }
    }

    return NextResponse.json(
      {
        success: true,
        investigation: {
          configConsistency: {
            config1Id: config1?.id,
            config2Id: config2?.id,
            sameConfig: config1?.id === config2?.id,
            config1Hash: config1?.admin_password_hash?.substring(0, 20) + '...',
            config2Hash: config2?.admin_password_hash?.substring(0, 20) + '...',
            hashesMatch: config1?.admin_password_hash === config2?.admin_password_hash
          },
          updateTest: {
            testHashGenerated: testHash.substring(0, 20) + '...',
            updateSucceeded: updateResult,
            configAfterUpdate: configAfterUpdate?.admin_password_hash?.substring(0, 20) + '...',
            testPersisted: testPersisted,
            verificationResult: verificationResult
          },
          rawData: {
            fullConfig1: config1,
            fullConfig2: config2,
            fullConfigAfterUpdate: configAfterUpdate
          }
        },
        timestamp: new Date().toISOString()
      },
      { status: 200, headers: getSecurityHeaders() }
    )
  } catch (error) {
    console.error('Database investigation error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error during database investigation', error: (error as Error).message },
      { status: 500, headers: getSecurityHeaders() }
    )
  }
}