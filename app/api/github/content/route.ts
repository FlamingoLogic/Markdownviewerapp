import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { GitHubService } from '@/lib/github'
import { siteConfigOperations } from '@/lib/supabase'
import { CookieService, SessionService, getSecurityHeaders } from '@/lib/auth'
import { ContentValidator } from '@/lib/content-validator'
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

    // Get file path from query parameters
    const { searchParams } = new URL(request.url)
    const filePath = searchParams.get('path')
    
    if (!filePath) {
      return NextResponse.json(
        { error: 'File path is required' },
        { 
          status: 400,
          headers: getSecurityHeaders()
        }
      )
    }

    // Validate file path (security check)
    if (filePath.includes('..') || !filePath.endsWith('.md')) {
      return NextResponse.json(
        { error: 'Invalid file path' },
        { 
          status: 400,
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
    const result = await PerformanceMonitor.measureAsync('github-fetch-content', async () => {
      // Initialize GitHub service
      const githubService = new GitHubService(siteConfig.github_repo, siteConfig.branch)

      // Fetch file content
      const content = await githubService.getFileContent(filePath)
      
      // Validate content
      const validation = await ContentValidator.validateMarkdownContent(content, filePath)
      
      if (!validation.isValid) {
        throw new Error(`Content validation failed: ${validation.errors.join(', ')}`)
      }

      return {
        content: validation.sanitizedContent || content,
        frontmatter: validation.frontmatter,
        warnings: validation.warnings
      }
    })

    return NextResponse.json(
      {
        success: true,
        content: result.content,
        frontmatter: result.frontmatter,
        warnings: result.warnings,
        path: filePath,
        repository: siteConfig.github_repo,
        branch: siteConfig.branch
      },
      { 
        status: 200,
        headers: {
          ...getSecurityHeaders(),
          'Cache-Control': 'private, max-age=600' // Cache for 10 minutes
        }
      }
    )

  } catch (error) {
    logError(error as Error, {
      additionalData: { 
        context: 'fetch-github-content',
        filePath: request.url,
        userAgent: request.headers.get('user-agent')
      }
    })

    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch content'
    
    // Handle specific GitHub errors
    let status = 500
    let errorCode = 'GITHUB_FETCH_ERROR'
    
    if (errorMessage.includes('Not Found') || errorMessage.includes('404')) {
      status = 404
      errorCode = 'FILE_NOT_FOUND'
    } else if (errorMessage.includes('rate limit')) {
      status = 429
      errorCode = 'RATE_LIMITED'
    } else if (errorMessage.includes('validation failed')) {
      status = 400
      errorCode = 'CONTENT_VALIDATION_ERROR'
    }
    
    return NextResponse.json(
      { 
        error: errorCode,
        message: errorMessage
      },
      { 
        status,
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