import { NextRequest, NextResponse } from 'next/server'
import { GitHubService } from '@/lib/github'
import { siteConfigOperations } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Get site configuration
    const siteConfig = await siteConfigOperations.getConfig()
    if (!siteConfig) {
      return NextResponse.json({
        success: false,
        error: 'Site not configured'
      })
    }

    console.log('Site config:', {
      repo: siteConfig.github_repo,
      branch: siteConfig.branch,
      folders: siteConfig.folders
    })

    // Test GitHub service
    const githubService = new GitHubService(siteConfig.github_repo, siteConfig.branch)
    
    // Test file path
    const testPath = 'Planning Documents/GitHub Markdown WebApp.md'
    console.log('Testing file path:', testPath)
    
    try {
      // Test access
      const hasAccess = await githubService.checkAccess()
      console.log('GitHub access:', hasAccess)
      
      // Test content fetch
      const content = await githubService.getFileContent(testPath)
      console.log('Content length:', content?.length || 0)
      
      return NextResponse.json({
        success: true,
        siteConfig: {
          repo: siteConfig.github_repo,
          branch: siteConfig.branch,
          folders: siteConfig.folders
        },
        testPath,
        hasAccess,
        contentLength: content?.length || 0,
        contentPreview: content?.substring(0, 200) || 'No content'
      })
      
    } catch (contentError) {
      console.error('Content fetch error:', contentError)
      return NextResponse.json({
        success: false,
        siteConfig: {
          repo: siteConfig.github_repo,
          branch: siteConfig.branch,
          folders: siteConfig.folders
        },
        testPath,
        error: contentError instanceof Error ? contentError.message : 'Unknown error'
      })
    }
    
  } catch (error) {
    console.error('Debug test error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}