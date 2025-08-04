import { NextRequest, NextResponse } from 'next/server'
import { getSecurityHeaders } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const testUrl = url.searchParams.get('url') || 'http://16.176.163.234:7681/'

    // Test if the URL is accessible
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

    let fetchResult: any = {}
    try {
      const response = await fetch(testUrl, {
        method: 'HEAD',
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; DebugBot/1.0)'
        }
      })
      
      fetchResult = {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        accessible: response.ok
      }
    } catch (fetchError) {
      fetchResult = {
        accessible: false,
        error: (fetchError as Error).message,
        errorType: (fetchError as Error).name
      }
    } finally {
      clearTimeout(timeoutId)
    }

    // Check for common iframe blocking headers
    const xFrameOptions = fetchResult.headers?.['x-frame-options']
    const csp = fetchResult.headers?.['content-security-policy']
    
    const analysis = {
      url: testUrl,
      isHttps: testUrl.startsWith('https://'),
      mixedContent: testUrl.startsWith('http://') && request.headers.get('host')?.includes('amplifyapp.com'),
      xFrameBlocked: xFrameOptions === 'DENY' || xFrameOptions === 'SAMEORIGIN',
      cspBlocked: csp?.includes('frame-ancestors') && !csp.includes("'self'"),
      networkAccessible: fetchResult.accessible,
      recommendations: []
    }

    // Generate recommendations
    if (analysis.mixedContent) {
      analysis.recommendations.push('Change URL to HTTPS to avoid mixed content blocking')
    }
    if (analysis.xFrameBlocked) {
      analysis.recommendations.push('Target server blocks iframe embedding with X-Frame-Options')
    }
    if (analysis.cspBlocked) {
      analysis.recommendations.push('Target server blocks iframe embedding with Content-Security-Policy')
    }
    if (!analysis.networkAccessible) {
      analysis.recommendations.push('Target server is not accessible or responding')
    }
    if (analysis.recommendations.length === 0) {
      analysis.recommendations.push('URL should work in iframe - check browser console for errors')
    }

    return NextResponse.json(
      {
        success: true,
        analysis: analysis,
        fetchResult: fetchResult,
        timestamp: new Date().toISOString()
      },
      { status: 200, headers: getSecurityHeaders() }
    )
  } catch (error) {
    console.error('Debug iframe test error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error during iframe test', error: (error as Error).message },
      { status: 500, headers: getSecurityHeaders() }
    )
  }
}