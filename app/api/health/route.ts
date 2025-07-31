import { NextRequest, NextResponse } from 'next/server'
import { checkSupabaseHealth } from '@/lib/supabase'
import { HealthChecker } from '@/lib/error-tracking'
import { getSecurityHeaders } from '@/lib/auth'

// Add health checks
HealthChecker.addHealthCheck('supabase', async () => {
  return await checkSupabaseHealth()
})

HealthChecker.addHealthCheck('environment', async () => {
  const requiredEnvVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY'
  ]
  
  return requiredEnvVars.every(envVar => !!process.env[envVar])
})

HealthChecker.addHealthCheck('memory', async () => {
  if (typeof process !== 'undefined' && process.memoryUsage) {
    const usage = process.memoryUsage()
    const totalMB = usage.heapTotal / 1024 / 1024
    return totalMB < 512 // Less than 512MB heap usage
  }
  return true
})

export async function GET(request: NextRequest) {
  try {
    const startTime = Date.now()
    
    // Run all health checks
    const healthResult = await HealthChecker.runHealthChecks()
    
    const responseTime = Date.now() - startTime
    
    const healthData = {
      status: healthResult.status,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      responseTime: `${responseTime}ms`,
      checks: healthResult.checks,
      uptime: typeof process !== 'undefined' ? Math.floor(process.uptime()) : null
    }

    return NextResponse.json(
      healthData,
      { 
        status: healthResult.status === 'healthy' ? 200 : 503,
        headers: {
          ...getSecurityHeaders(),
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Content-Type': 'application/json'
        }
      }
    )

  } catch (error) {
    console.error('Health check error:', error)
    
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Health check failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { 
        status: 503,
        headers: {
          ...getSecurityHeaders(),
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Content-Type': 'application/json'
        }
      }
    )
  }
}

// Simple ping endpoint for basic uptime monitoring
export async function HEAD(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      ...getSecurityHeaders(),
      'Cache-Control': 'no-cache'
    }
  })
}