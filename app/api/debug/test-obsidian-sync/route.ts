import { NextRequest, NextResponse } from 'next/server'
import { Octokit } from '@octokit/rest'
import { getSecurityHeaders } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    console.log('=== TESTING OBSIDIAN SYNC REPOSITORY ===')
    
    const owner = 'FlamingoLogic'
    const repo = 'ObsidianSync'
    const branch = 'main'
    const targetFolder = '02 AbilityERP'
    
    // Test with and without GitHub token
    const githubToken = process.env.GITHUB_TOKEN
    const octokit = new Octokit({
      auth: githubToken
    })
    
    console.log('Repository:', `${owner}/${repo}`)
    console.log('Branch:', branch)
    console.log('Target Folder:', targetFolder)
    console.log('Has GitHub Token:', !!githubToken)
    
    const results = {
      repository: `https://github.com/${owner}/${repo}`,
      branch,
      targetFolder,
      hasToken: !!githubToken,
      tests: {}
    }
    
    // Test 1: Repository Access
    try {
      console.log('\n--- Testing Repository Access ---')
      const repoResponse = await octokit.rest.repos.get({
        owner,
        repo
      })
      
      results.tests.repositoryAccess = {
        success: true,
        isPrivate: repoResponse.data.private,
        defaultBranch: repoResponse.data.default_branch,
        size: repoResponse.data.size,
        language: repoResponse.data.language,
        updatedAt: repoResponse.data.updated_at
      }
      
      console.log('✅ Repository accessible')
      console.log(`   Private: ${repoResponse.data.private}`)
      console.log(`   Default branch: ${repoResponse.data.default_branch}`)
      
    } catch (error: any) {
      results.tests.repositoryAccess = {
        success: false,
        error: error.message,
        status: error.status
      }
      console.log('❌ Repository access failed:', error.message)
    }
    
    // Test 2: Root Directory Contents
    try {
      console.log('\n--- Testing Root Directory ---')
      const rootResponse = await octokit.rest.repos.getContent({
        owner,
        repo,
        path: '',
        ref: branch
      })
      
      const rootContents = Array.isArray(rootResponse.data) ? rootResponse.data : [rootResponse.data]
      const folders = rootContents.filter(item => item.type === 'dir')
      
      results.tests.rootDirectory = {
        success: true,
        totalItems: rootContents.length,
        folders: folders.map(f => f.name),
        hasTargetFolder: folders.some(f => f.name === targetFolder)
      }
      
      console.log('✅ Root directory accessible')
      console.log(`   Total items: ${rootContents.length}`)
      console.log(`   Folders found: ${folders.map(f => f.name).join(', ')}`)
      console.log(`   Target folder '${targetFolder}' exists: ${folders.some(f => f.name === targetFolder)}`)
      
    } catch (error: any) {
      results.tests.rootDirectory = {
        success: false,
        error: error.message,
        status: error.status
      }
      console.log('❌ Root directory access failed:', error.message)
    }
    
    // Test 3: Target Folder Access
    try {
      console.log(`\n--- Testing Target Folder: ${targetFolder} ---`)
      const folderResponse = await octokit.rest.repos.getContent({
        owner,
        repo,
        path: targetFolder,
        ref: branch
      })
      
      const folderContents = Array.isArray(folderResponse.data) ? folderResponse.data : [folderResponse.data]
      const markdownFiles = folderContents.filter(item => 
        item.type === 'file' && item.name.toLowerCase().endsWith('.md')
      )
      
      results.tests.targetFolder = {
        success: true,
        totalItems: folderContents.length,
        markdownFiles: markdownFiles.length,
        files: markdownFiles.slice(0, 10).map(f => ({
          name: f.name,
          size: f.size,
          path: f.path
        }))
      }
      
      console.log(`✅ Target folder '${targetFolder}' accessible`)
      console.log(`   Total items: ${folderContents.length}`)
      console.log(`   Markdown files: ${markdownFiles.length}`)
      console.log(`   Sample files: ${markdownFiles.slice(0, 5).map(f => f.name).join(', ')}`)
      
    } catch (error: any) {
      results.tests.targetFolder = {
        success: false,
        error: error.message,
        status: error.status
      }
      console.log(`❌ Target folder '${targetFolder}' access failed:`, error.message)
    }
    
    // Test 4: Sample File Content
    if (results.tests.targetFolder?.success && results.tests.targetFolder.files?.length > 0) {
      try {
        const sampleFile = results.tests.targetFolder.files[0]
        console.log(`\n--- Testing Sample File: ${sampleFile.name} ---`)
        
        const fileResponse = await octokit.rest.repos.getContent({
          owner,
          repo,
          path: sampleFile.path,
          ref: branch
        })
        
        if (!Array.isArray(fileResponse.data) && fileResponse.data.type === 'file') {
          const content = Buffer.from(fileResponse.data.content, 'base64').toString('utf-8')
          
          results.tests.sampleFile = {
            success: true,
            fileName: sampleFile.name,
            filePath: sampleFile.path,
            contentLength: content.length,
            contentPreview: content.substring(0, 200) + (content.length > 200 ? '...' : '')
          }
          
          console.log(`✅ Sample file content loaded`)
          console.log(`   File: ${sampleFile.name}`)
          console.log(`   Size: ${content.length} characters`)
        }
        
      } catch (error: any) {
        results.tests.sampleFile = {
          success: false,
          error: error.message,
          status: error.status
        }
        console.log('❌ Sample file content failed:', error.message)
      }
    }
    
    // Generate recommendations
    const recommendations = []
    
    if (!results.tests.repositoryAccess?.success) {
      if (results.tests.repositoryAccess?.status === 404) {
        recommendations.push({
          type: 'critical',
          message: 'Repository not found or not accessible',
          action: 'Check if repository exists and is public, or add GITHUB_TOKEN for private repos'
        })
      } else if (results.tests.repositoryAccess?.status === 401) {
        recommendations.push({
          type: 'critical',
          message: 'Authentication failed',
          action: 'Add valid GITHUB_TOKEN environment variable'
        })
      }
    }
    
    if (results.tests.rootDirectory?.success && !results.tests.rootDirectory?.hasTargetFolder) {
      recommendations.push({
        type: 'warning',
        message: `Folder '${targetFolder}' not found in repository root`,
        action: `Available folders: ${results.tests.rootDirectory.folders?.join(', ') || 'none'}. Check folder name spelling and case.`
      })
    }
    
    if (!results.tests.targetFolder?.success) {
      recommendations.push({
        type: 'critical',
        message: `Cannot access target folder '${targetFolder}'`,
        action: 'Verify folder exists and check permissions'
      })
    }
    
    if (results.tests.targetFolder?.success && results.tests.targetFolder?.markdownFiles === 0) {
      recommendations.push({
        type: 'info',
        message: `No markdown files found in '${targetFolder}'`,
        action: 'Check if the folder contains .md files'
      })
    }
    
    const overallSuccess = results.tests.repositoryAccess?.success && 
                          results.tests.targetFolder?.success &&
                          (results.tests.targetFolder?.markdownFiles > 0)
    
    console.log('\n=== TEST SUMMARY ===')
    console.log('Overall Success:', overallSuccess)
    console.log('Repository Access:', results.tests.repositoryAccess?.success)
    console.log('Target Folder Access:', results.tests.targetFolder?.success)
    console.log('Markdown Files Found:', results.tests.targetFolder?.markdownFiles || 0)
    
    return NextResponse.json({
      success: overallSuccess,
      ...results,
      recommendations,
      timestamp: new Date().toISOString()
    }, {
      status: overallSuccess ? 200 : 500,
      headers: getSecurityHeaders()
    })
    
  } catch (error: any) {
    console.error('ObsidianSync test error:', error)
    return NextResponse.json({
      success: false,
      error: 'Test failed',
      message: error.message,
      timestamp: new Date().toISOString()
    }, {
      status: 500,
      headers: getSecurityHeaders()
    })
  }
}

