import { NextRequest, NextResponse } from 'next/server'
import { getSecurityHeaders } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const githubToken = process.env.GITHUB_TOKEN || process.env.NEXT_PUBLIC_GITHUB_TOKEN
    
    return NextResponse.json(
      {
        success: true,
        hasGithubToken: !!githubToken,
        tokenLength: githubToken ? githubToken.length : 0,
        tokenPrefix: githubToken ? githubToken.substring(0, 10) + '...' : 'none',
        envVars: {
          GITHUB_TOKEN: !!process.env.GITHUB_TOKEN,
          NEXT_PUBLIC_GITHUB_TOKEN: !!process.env.NEXT_PUBLIC_GITHUB_TOKEN
        }
      },
      { 
        status: 200,
        headers: getSecurityHeaders()
      }
    )
  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: (error as Error).message 
      },
      { 
        status: 500,
        headers: getSecurityHeaders()
      }
    )
  }
}
