import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { GitHubService } from '@/lib/github'
import { siteConfigOperations } from '@/lib/supabase'
import { CookieService, SessionService, getSecurityHeaders } from '@/lib/auth'
import { logError, PerformanceMonitor } from '@/lib/error-tracking'

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const cookieStore = cookies()
    const sessionCookie = cookieStore.get('site_session')
    const session = CookieService.parseSessionFromCookie(sessionCookie?.value)
    
    if (!SessionService.isValidSession(session)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { 
          status: 401,
          headers: getSecurityHeaders()
        }
      )
    }

    // Get site configuration
    const siteConfig = await siteConfigOperations.getConfig()
    if (!siteConfig) {
      return NextResponse.json(
        { error: 'Site not configured' },
        { 
          status: 500,
          headers: getSecurityHeaders()
        }
      )
    }

    // Performance monitoring
    const files = await PerformanceMonitor.measureAsync('github-fetch-files', async () => {
      // Initialize GitHub service
      const githubService = new GitHubService(siteConfig.github_repo, siteConfig.branch)

      // Check if repository is accessible
      const hasAccess = await githubService.checkAccess()
      if (!hasAccess) {
        throw new Error('Unable to access GitHub repository')
      }

      // Get markdown files from configured folders
      const markdownFiles = await githubService.getMarkdownFiles(siteConfig.folders)
      return markdownFiles
    })

    // Update last sync timestamp
    await siteConfigOperations.updateLastSync()

    return NextResponse.json(
      {
        success: true,
        files,
        lastSync: new Date().toISOString(),
        repository: siteConfig.github_repo,
        branch: siteConfig.branch,
        folders: siteConfig.folders
      },
      { 
        status: 200,
        headers: {
          ...getSecurityHeaders(),
          'Cache-Control': 'private, max-age=300' // Cache for 5 minutes
        }
      }
    )

  } catch (error) {
    logError(error as Error, {
      additionalData: { 
        context: 'fetch-github-files',
        userAgent: request.headers.get('user-agent')
      }
    })

    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch files'
    
    return NextResponse.json(
      { 
        error: 'GITHUB_FETCH_ERROR',
        message: errorMessage
      },
      { 
        status: 500,
        headers: getSecurityHeaders()
      }
    )
  }
}

// Handle unsupported methods
export async function POST() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { 
      status: 405,
      headers: {
        ...getSecurityHeaders(),
        'Allow': 'GET'
      }
    }
  )
}