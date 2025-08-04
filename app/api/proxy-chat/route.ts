import { NextRequest, NextResponse } from 'next/server'
import { getSecurityHeaders } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const targetUrl = url.searchParams.get('url')

    if (!targetUrl) {
      return NextResponse.json(
        { error: 'Missing url parameter' },
        { status: 400, headers: getSecurityHeaders() }
      )
    }

    // Validate that it's a reasonable URL
    try {
      new URL(targetUrl)
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL provided' },
        { status: 400, headers: getSecurityHeaders() }
      )
    }

    // Fetch the content from the HTTP service
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ChatProxy/1.0)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const content = await response.text()

    // Return the content with proper headers
    return new NextResponse(content, {
      status: 200,
      headers: {
        'Content-Type': response.headers.get('content-type') || 'text/html',
        'X-Frame-Options': 'SAMEORIGIN',
        'Content-Security-Policy': "frame-ancestors 'self';",
        ...getSecurityHeaders()
      }
    })
  } catch (error) {
    console.error('Chat proxy error:', error)
    return NextResponse.json(
      { error: 'Failed to proxy chat service', details: (error as Error).message },
      { status: 500, headers: getSecurityHeaders() }
    )
  }
}