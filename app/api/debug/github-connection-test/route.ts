import { NextRequest, NextResponse } from 'next/server'
import { Octokit } from '@octokit/rest'
import { GitHubService } from '@/lib/github'
import { siteConfigOperations } from '@/lib/supabase'
import { getSecurityHeaders } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    console.log('=== GITHUB CONNECTION TEST ===')

    // Test 1: Check environment variables
    const githubToken = process.env.GITHUB_TOKEN
    const hasToken = !!githubToken

    console.log('GitHub Token exists:', hasToken)
    console.log('Token length:', githubToken?.length || 0)
    console.log('Token starts with ghp_:', githubToken?.startsWith('ghp_') || false)
    console.log('Token starts with github_pat_:', githubToken?.startsWith('github_pat_') || false)

    // Test 2: Get site configuration
    console.log('\n=== SITE CONFIGURATION ===')
    const siteConfig = await siteConfigOperations.getConfig()

    if (!siteConfig) {
      console.log('❌ No site configuration found')
      return NextResponse.json({
        success: false,
        error: 'No site configuration found. Please configure the site in the admin panel.',
        timestamp: new Date().toISOString()
      }, { status: 500, headers: getSecurityHeaders() })
    }

    console.log('Site config found:')
    console.log('- GitHub Repo:', siteConfig.github_repo)
    console.log('- Branch:', siteConfig.branch)
    console.log('- Folders:', siteConfig.folders)

    // Test 3: Validate GitHub repo URL
    const repoUrl = siteConfig.github_repo
    if (!repoUrl) {
      console.log('❌ No GitHub repository configured')
      return NextResponse.json({
        success: false,
        error: 'No GitHub repository configured. Please set the repository URL in the admin panel.',
        timestamp: new Date().toISOString()
      }, { status: 400, headers: getSecurityHeaders() })
    }

    // Parse repository URL
    const repoMatch = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/)
    if (!repoMatch) {
      console.log('❌ Invalid GitHub repository URL:', repoUrl)
      return NextResponse.json({
        success: false,
        error: `Invalid GitHub repository URL: ${repoUrl}. Expected format: https://github.com/owner/repo`,
        timestamp: new Date().toISOString()
      }, { status: 400, headers: getSecurityHeaders() })
    }

    const [, owner, repoName] = repoMatch
    const cleanRepoName = repoName.replace('.git', '')

    console.log('Parsed repository:')
    console.log('- Owner:', owner)
    console.log('- Repository:', cleanRepoName)

    // Test 4: Test GitHub API connection
    console.log('\n=== GITHUB API CONNECTION ===')
    const octokit = new Octokit({
      auth: githubToken // Will be undefined for public repos without token
    })

    let apiTests = {
      rateLimit: { success: false, error: null as string | null, data: null as any },
      repoAccess: { success: false, error: null as string | null, data: null as any },
      repoContents: { success: false, error: null as string | null, data: null as any },
      folderAccess: { success: false, error: null as string | null, data: null as any }
    }

    // Test rate limit (checks if API is accessible)
    try {
      console.log('Testing GitHub API rate limit...')
      const rateLimitResponse = await octokit.rest.rateLimit.get()
      apiTests.rateLimit = {
        success: true,
        error: null,
        data: {
          remaining: rateLimitResponse.data.rate.remaining,
          limit: rateLimitResponse.data.rate.limit,
          reset: new Date(rateLimitResponse.data.rate.reset * 1000).toISOString()
        }
      }
      console.log('✅ Rate limit check passed')
      console.log(`- Remaining: ${rateLimitResponse.data.rate.remaining}/${rateLimitResponse.data.rate.limit}`)
    } catch (error: any) {
      apiTests.rateLimit = {
        success: false,
        error: error.message,
        data: null
      }
      console.log('❌ Rate limit check failed:', error.message)
    }

    // Test repository access
    try {
      console.log('Testing repository access...')
      const repoResponse = await octokit.rest.repos.get({
        owner,
        repo: cleanRepoName
      })

      apiTests.repoAccess = {
        success: true,
        error: null,
        data: {
          name: repoResponse.data.name,
          fullName: repoResponse.data.full_name,
          isPrivate: repoResponse.data.private,
          defaultBranch: repoResponse.data.default_branch,
          hasIssues: repoResponse.data.has_issues,
          hasWiki: repoResponse.data.has_wiki,
          size: repoResponse.data.size,
          language: repoResponse.data.language,
          updatedAt: repoResponse.data.updated_at
        }
      }
      console.log('✅ Repository access successful')
      console.log(`- Repository: ${repoResponse.data.full_name}`)
      console.log(`- Private: ${repoResponse.data.private}`)
      console.log(`- Default branch: ${repoResponse.data.default_branch}`)
    } catch (error: any) {
      apiTests.repoAccess = {
        success: false,
        error: error.message,
        data: null
      }
      console.log('❌ Repository access failed:', error.message)

      // If repo access fails, provide specific guidance
      if (error.status === 404) {
        console.log('💡 Repository not found. Check:')
        console.log('   - Repository URL is correct')
        console.log('   - Repository exists and is public, OR')
        console.log('   - GITHUB_TOKEN is set with proper permissions for private repos')
      } else if (error.status === 401) {
        console.log('💡 Authentication failed. Check:')
        console.log('   - GITHUB_TOKEN is valid and not expired')
        console.log('   - Token has proper repository permissions')
      }
    }

    // Test repository contents (root level)
    if (apiTests.repoAccess.success) {
      try {
        console.log('Testing repository contents access...')
        const contentsResponse = await octokit.rest.repos.getContent({
          owner,
          repo: cleanRepoName,
          path: '',
          ref: siteConfig.branch || 'main'
        })

        const contents = Array.isArray(contentsResponse.data) ? contentsResponse.data : [contentsResponse.data]

        apiTests.repoContents = {
          success: true,
          error: null,
          data: {
            itemCount: contents.length,
            items: contents.slice(0, 10).map(item => ({
              name: item.name,
              type: item.type,
              path: item.path
            }))
          }
        }
        console.log('✅ Repository contents access successful')
        console.log(`- Found ${contents.length} items in root`)
      } catch (error: any) {
        apiTests.repoContents = {
          success: false,
          error: error.message,
          data: null
        }
        console.log('❌ Repository contents access failed:', error.message)
      }
    }

    // Test configured folders access
    if (apiTests.repoAccess.success && siteConfig.folders && siteConfig.folders.length > 0) {
      try {
        console.log('Testing configured folders access...')
        const folderTests = []

        for (const folder of siteConfig.folders.slice(0, 3)) { // Test first 3 folders
          try {
            const folderResponse = await octokit.rest.repos.getContent({
              owner,
              repo: cleanRepoName,
              path: folder,
              ref: siteConfig.branch || 'main'
            })

            const folderContents = Array.isArray(folderResponse.data) ? folderResponse.data : [folderResponse.data]
            const markdownFiles = folderContents.filter(item =>
              item.type === 'file' && item.name.endsWith('.md')
            )

            folderTests.push({
              folder,
              success: true,
              itemCount: folderContents.length,
              markdownCount: markdownFiles.length,
              error: null
            })

            console.log(`✅ Folder '${folder}': ${folderContents.length} items, ${markdownFiles.length} markdown files`)
          } catch (error: any) {
            folderTests.push({
              folder,
              success: false,
              itemCount: 0,
              markdownCount: 0,
              error: error.message
            })
            console.log(`❌ Folder '${folder}' access failed:`, error.message)
          }
        }

        apiTests.folderAccess = {
          success: folderTests.some(test => test.success),
          error: folderTests.every(test => !test.success) ? 'All configured folders failed to load' : null,
          data: folderTests
        }
      } catch (error: any) {
        apiTests.folderAccess = {
          success: false,
          error: error.message,
          data: null
        }
      }
    }

    // Test 5: Test GitHubService class
    console.log('\n=== GITHUB SERVICE TEST ===')
    let serviceTest = { success: false, error: null as string | null, data: null as any }

    try {
      const githubService = new GitHubService(repoUrl, siteConfig.branch || 'main')

      // Test basic access
      const hasAccess = await githubService.checkAccess()

      if (hasAccess) {
        // Try to get markdown files
        const markdownFiles = await githubService.getMarkdownFiles(siteConfig.folders || ['docs'])

        serviceTest = {
          success: true,
          error: null,
          data: {
            hasAccess,
            folderCount: markdownFiles.length,
            totalFiles: markdownFiles.reduce((count, folder) =>
              count + (folder.children?.length || 0), 0
            )
          }
        }
        console.log('✅ GitHubService test passed')
        console.log(`- Access: ${hasAccess}`)
        console.log(`- Folders: ${markdownFiles.length}`)
      } else {
        serviceTest = {
          success: false,
          error: 'GitHubService.checkAccess() returned false',
          data: null
        }
        console.log('❌ GitHubService test failed: No access')
      }
    } catch (error: any) {
      serviceTest = {
        success: false,
        error: error.message,
        data: null
      }
      console.log('❌ GitHubService test failed:', error.message)
    }

    // Generate recommendations
    const recommendations = []

    if (!hasToken) {
      if (apiTests.repoAccess.data?.isPrivate) {
        recommendations.push({
          type: 'critical',
          message: 'Private repository requires GITHUB_TOKEN environment variable',
          action: 'Set GITHUB_TOKEN with a personal access token that has repo permissions'
        })
      } else {
        recommendations.push({
          type: 'info',
          message: 'No GITHUB_TOKEN set - this is OK for public repositories',
          action: 'Consider setting GITHUB_TOKEN to avoid rate limits'
        })
      }
    }

    if (!apiTests.repoAccess.success) {
      recommendations.push({
        type: 'critical',
        message: 'Cannot access repository',
        action: 'Check repository URL and ensure it exists. For private repos, verify GITHUB_TOKEN permissions.'
      })
    }

    if (apiTests.folderAccess.success === false && siteConfig.folders) {
      recommendations.push({
        type: 'warning',
        message: 'Configured folders are not accessible',
        action: 'Verify folder names exist in the repository and check spelling/case'
      })
    }

    if (apiTests.rateLimit.data && apiTests.rateLimit.data.remaining < 10) {
      recommendations.push({
        type: 'warning',
        message: 'GitHub API rate limit is low',
        action: 'Consider setting GITHUB_TOKEN to increase rate limits'
      })
    }

    const overallSuccess = apiTests.repoAccess.success && serviceTest.success

    console.log('\n=== TEST SUMMARY ===')
    console.log('Overall success:', overallSuccess)
    console.log('Recommendations:', recommendations.length)

    return NextResponse.json({
      success: overallSuccess,
      summary: {
        repositoryAccessible: apiTests.repoAccess.success,
        foldersAccessible: apiTests.folderAccess.success,
        serviceWorking: serviceTest.success,
        hasToken: hasToken,
        tokenType: hasToken ? (githubToken?.startsWith('ghp_') ? 'classic' :
          githubToken?.startsWith('github_pat_') ? 'fine-grained' : 'unknown') : null
      },
      configuration: {
        repository: repoUrl,
        owner,
        repoName: cleanRepoName,
        branch: siteConfig.branch || 'main',
        folders: siteConfig.folders || []
      },
      tests: {
        environment: {
          hasGitHubToken: hasToken,
          tokenLength: githubToken?.length || 0
        },
        apiConnection: apiTests,
        githubService: serviceTest
      },
      recommendations,
      timestamp: new Date().toISOString()
    }, {
      status: overallSuccess ? 200 : 500,
      headers: getSecurityHeaders()
    })

  } catch (error: any) {
    console.error('GitHub connection test error:', error)
    return NextResponse.json({
      success: false,
      error: 'GitHub connection test failed',
      message: error.message,
      timestamp: new Date().toISOString()
    }, {
      status: 500,
      headers: getSecurityHeaders()
    })
  }
}

