import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getSecurityHeaders } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || ''

    console.log('=== DIRECT SUPABASE TEST ===')
    console.log('URL exists:', !!supabaseUrl)
    console.log('Service key exists:', !!supabaseServiceKey)
    console.log('Service key starts with eyJ:', supabaseServiceKey.startsWith('eyJ'))

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { success: false, error: 'Supabase credentials not available' },
        { status: 500, headers: getSecurityHeaders() }
      )
    }

    // Create direct admin client
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Test 1: Check if table exists and we can read from it
    console.log('Testing table access...')
    const { data: readData, error: readError } = await supabaseAdmin
      .from('site_configs')
      .select('*')
      .limit(5)

    console.log('Read result:', { data: readData, error: readError })

    // Test 2: Try a simple update on the main config
    console.log('Testing direct update...')
    const testValue = `TEST_${Date.now()}`
    const { data: updateData, error: updateError } = await supabaseAdmin
      .from('site_configs')
      .update({ 
        help_text: testValue,
        updated_at: new Date().toISOString()
      })
      .eq('id', 'main-config')
      .select()

    console.log('Update result:', { data: updateData, error: updateError })

    // Test 3: Read back to verify the update
    console.log('Reading back after update...')
    const { data: verifyData, error: verifyError } = await supabaseAdmin
      .from('site_configs')
      .select('help_text, updated_at')
      .eq('id', 'main-config')
      .single()

    console.log('Verify result:', { data: verifyData, error: verifyError })

    // Test 4: Try updating password fields specifically
    console.log('Testing password field update...')
    const testHash = `$2a$12$TEST.HASH.${Date.now()}`
    const { data: passwordUpdateData, error: passwordUpdateError } = await supabaseAdmin
      .from('site_configs')
      .update({ 
        admin_password_hash: testHash,
        updated_at: new Date().toISOString()
      })
      .eq('id', 'main-config')
      .select()

    console.log('Password update result:', { data: passwordUpdateData, error: passwordUpdateError })

    // Test 5: Read back password field
    const { data: passwordVerifyData, error: passwordVerifyError } = await supabaseAdmin
      .from('site_configs')
      .select('admin_password_hash')
      .eq('id', 'main-config')
      .single()

    console.log('Password verify result:', { data: passwordVerifyData, error: passwordVerifyError })

    return NextResponse.json(
      {
        success: true,
        directTests: {
          credentials: {
            urlExists: !!supabaseUrl,
            serviceKeyExists: !!supabaseServiceKey,
            serviceKeyValid: supabaseServiceKey.startsWith('eyJ'),
            urlValue: supabaseUrl,
            serviceKeyLength: supabaseServiceKey.length
          },
          readTest: {
            success: !readError,
            error: readError,
            recordCount: readData?.length || 0,
            firstRecord: readData?.[0]
          },
          updateTest: {
            testValue: testValue,
            success: !updateError,
            error: updateError,
            affectedRows: updateData?.length || 0,
            returnedData: updateData
          },
          verifyTest: {
            success: !verifyError,
            error: verifyError,
            helpTextMatches: verifyData?.help_text === testValue,
            retrievedValue: verifyData?.help_text
          },
          passwordTest: {
            testHash: testHash,
            updateSuccess: !passwordUpdateError,
            updateError: passwordUpdateError,
            passwordAffectedRows: passwordUpdateData?.length || 0,
            verifySuccess: !passwordVerifyError,
            verifyError: passwordVerifyError,
            passwordPersisted: passwordVerifyData?.admin_password_hash === testHash,
            retrievedHash: passwordVerifyData?.admin_password_hash
          }
        },
        timestamp: new Date().toISOString()
      },
      { status: 200, headers: getSecurityHeaders() }
    )
  } catch (error) {
    console.error('Direct Supabase test error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error during direct Supabase test', error: (error as Error).message },
      { status: 500, headers: getSecurityHeaders() }
    )
  }
}