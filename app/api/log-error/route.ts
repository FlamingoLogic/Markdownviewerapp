import { NextRequest, NextResponse } from 'next/server'
import { getSecurityHeaders, getClientIP } from '@/lib/auth'
import { ErrorLog } from '@/lib/error-tracking'

export async function POST(request: NextRequest) {
  try {
    // Only allow error logging in production
    if (process.env.NODE_ENV !== 'production') {
      return NextResponse.json(
        { error: 'Error logging only available in production' },
        { 
          status: 403,
          headers: getSecurityHeaders()
        }
      )
    }

    const body = await request.json()
    const clientIP = getClientIP({
      headers: Object.fromEntries(request.headers.entries()),
      connection: { remoteAddress: request.ip || 'unknown' }
    } as any)

    // Validate error log structure
    const errorLog: ErrorLog = {
      id: body.id || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      message: body.message || 'Unknown error',
      stack: body.stack,
      level: body.level || 'error',
      context: {
        ...body.context,
        clientIP,
        timestamp: new Date().toISOString()
      },
      timestamp: body.timestamp || new Date().toISOString()
    }

    // Basic validation
    if (!errorLog.message || typeof errorLog.message !== 'string') {
      return NextResponse.json(
        { error: 'Invalid error message' },
        { 
          status: 400,
          headers: getSecurityHeaders()
        }
      )
    }

    // Log to console in production (can be extended to send to external services)
    console.error('Client Error Log:', {
      id: errorLog.id,
      message: errorLog.message,
      level: errorLog.level,
      context: errorLog.context,
      timestamp: errorLog.timestamp,
      stack: errorLog.stack
    })

    // Here you could send to external logging services like:
    // - Sentry
    // - LogRocket
    // - DataDog
    // - CloudWatch Logs
    // - Custom logging endpoint

    return NextResponse.json(
      { 
        success: true, 
        id: errorLog.id,
        message: 'Error logged successfully' 
      },
      { 
        status: 200,
        headers: getSecurityHeaders()
      }
    )

  } catch (error) {
    console.error('Error logging failed:', error)
    
    return NextResponse.json(
      { 
        error: 'LOGGING_FAILED',
        message: 'Failed to log error' 
      },
      { 
        status: 500,
        headers: getSecurityHeaders()
      }
    )
  }
}

// Handle unsupported methods
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { 
      status: 405,
      headers: {
        ...getSecurityHeaders(),
        'Allow': 'POST'
      }
    }
  )
}