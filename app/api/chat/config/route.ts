import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { siteConfigOperations } from '@/lib/supabase'
import { SessionService, CookieService, getSecurityHeaders } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const cookieStore = cookies()
    const sessionCookie = cookieStore.get('site_session')
    const session = CookieService.parseSessionFromCookie(sessionCookie?.value)

    if (!SessionService.isValidSession(session)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401, headers: getSecurityHeaders() }
      )
    }

    // Get site configuration to check if LLM API is configured
    const siteConfig = await siteConfigOperations.getConfig()

    const configured = !!(
      siteConfig?.llm_api_key &&
      siteConfig?.llm_provider &&
      siteConfig?.chat_enabled
    )

    return NextResponse.json(
      {
        configured,
        provider: configured ? siteConfig.llm_provider : null,
        chatEnabled: siteConfig?.chat_enabled ?? false
      },
      { status: 200, headers: getSecurityHeaders() }
    )

  } catch (error) {
    console.error('Chat config check error:', error)
    return NextResponse.json(
      { error: 'Failed to check chat configuration' },
      { status: 500, headers: getSecurityHeaders() }
    )
  }
}
