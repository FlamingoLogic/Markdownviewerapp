import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Get all environment variable names (but not values for security)
    const allEnvVars = Object.keys(process.env).sort()
    
    // Look for anything that might be Supabase-related
    const supabaseRelated = allEnvVars.filter(key => 
      key.toLowerCase().includes('supabase') || 
      key.includes('SUPABASE') ||
      key.includes('supabase')
    )
    
    // Look for anything that might be service role related  
    const serviceRoleRelated = allEnvVars.filter(key =>
      key.toLowerCase().includes('service') ||
      key.toLowerCase().includes('role') ||
      key.toLowerCase().includes('admin')
    )
    
    console.log('All environment variables:', allEnvVars)
    console.log('Supabase-related vars:', supabaseRelated)
    console.log('Service/role-related vars:', serviceRoleRelated)
    
    return NextResponse.json({
      success: true,
      totalEnvVars: allEnvVars.length,
      allEnvVarNames: allEnvVars,
      supabaseRelated,
      serviceRoleRelated,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('All env debug error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}