import { Octokit } from '@octokit/rest'

// Initialize GitHub client
const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN, // Optional for public repos
})

export interface GitHubFile {
  name: string
  path: string
  type: 'file' | 'dir'
  sha: string
  size: number
  url: string
  download_url?: string
  content?: string
}

export interface GitHubFolder {
  name: string
  path: string
  files: GitHubFile[]
  folders: GitHubFolder[]
}

export interface FileTreeItem {
  name: string
  path: string
  type: 'file' | 'folder'
  children?: FileTreeItem[]
  sha?: string
  size?: number
}

export class GitHubService {
  private owner: string
  private repo: string
  private branch: string

  constructor(repoUrl: string, branch: string = 'main') {
    // Parse GitHub repo URL
    const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/)
    if (!match) {
      throw new Error('Invalid GitHub repository URL')
    }
    
    this.owner = match[1]
    this.repo = match[2].replace('.git', '')
    this.branch = branch
  }

  // Get repository information
  async getRepoInfo() {
    try {
      const { data } = await octokit.rest.repos.get({
        owner: this.owner,
        repo: this.repo,
      })
      
      return {
        name: data.name,
        fullName: data.full_name,
        description: data.description,
        isPrivate: data.private,
        defaultBranch: data.default_branch,
        lastUpdated: data.updated_at,
      }
    } catch (error) {
      console.error('Error fetching repo info:', error)
      throw new Error('Failed to fetch repository information')
    }
  }

  // Get contents of a directory
  async getDirectoryContents(path: string = ''): Promise<GitHubFile[]> {
    try {
      const { data } = await octokit.rest.repos.getContent({
        owner: this.owner,
        repo: this.repo,
        path,
        ref: this.branch,
      })

      if (!Array.isArray(data)) {
        throw new Error('Expected directory, got file')
      }

      return data.map(item => ({
        name: item.name,
        path: item.path,
        type: item.type as 'file' | 'dir',
        sha: item.sha,
        size: item.size || 0,
        url: item.html_url || '',
        download_url: item.download_url || undefined,
      }))
    } catch (error) {
      console.error(`Error fetching directory contents for ${path}:`, error)
      throw new Error(`Failed to fetch directory contents: ${path}`)
    }
  }

  // Get file content
  async getFileContent(path: string): Promise<string> {
    try {
      const { data } = await octokit.rest.repos.getContent({
        owner: this.owner,
        repo: this.repo,
        path,
        ref: this.branch,
      })

      if (Array.isArray(data) || data.type !== 'file') {
        throw new Error('Expected file, got directory')
      }

      // Decode base64 content
      const content = Buffer.from(data.content, 'base64').toString('utf-8')
      return content
    } catch (error) {
      console.error(`Error fetching file content for ${path}:`, error)
      throw new Error(`Failed to fetch file content: ${path}`)
    }
  }

  // Get markdown files from specified folders
  async getMarkdownFiles(folders: string[]): Promise<FileTreeItem[]> {
    const tree: FileTreeItem[] = []

    try {
      for (const folder of folders) {
        const folderItem: FileTreeItem = {
          name: folder,
          path: folder,
          type: 'folder',
          children: [],
        }

        // Get all files in this folder recursively
        const files = await this.getMarkdownFilesRecursive(folder)
        folderItem.children = files

        tree.push(folderItem)
      }

      return tree
    } catch (error) {
      console.error('Error building markdown file tree:', error)
      throw new Error('Failed to fetch markdown files')
    }
  }

  // Recursively get markdown files from a directory
  private async getMarkdownFilesRecursive(path: string): Promise<FileTreeItem[]> {
    try {
      const contents = await this.getDirectoryContents(path)
      const items: FileTreeItem[] = []

      for (const item of contents) {
        if (item.type === 'dir') {
          // Recursively get subdirectory contents
          const children = await this.getMarkdownFilesRecursive(item.path)
          if (children.length > 0) {
            items.push({
              name: item.name,
              path: item.path,
              type: 'folder',
              children,
            })
          }
        } else if (item.type === 'file' && item.name.endsWith('.md')) {
          // Add markdown files
          items.push({
            name: item.name,
            path: item.path,
            type: 'file',
            sha: item.sha,
            size: item.size,
          })
        }
      }

      return items
    } catch (error) {
      console.error(`Error fetching recursive contents for ${path}:`, error)
      return []
    }
  }

  // Check if repository is accessible
  async checkAccess(): Promise<boolean> {
    try {
      await this.getRepoInfo()
      return true
    } catch {
      return false
    }
  }

  // Get file SHA for change detection
  async getFileSHA(path: string): Promise<string | null> {
    try {
      const { data } = await octokit.rest.repos.getContent({
        owner: this.owner,
        repo: this.repo,
        path,
        ref: this.branch,
      })

      if (Array.isArray(data) || data.type !== 'file') {
        return null
      }

      return data.sha
    } catch {
      return null
    }
  }

  // Check if files have changed (for auto-refresh)
  async checkForChanges(fileList: Array<{ path: string; sha: string }>): Promise<{
    hasChanges: boolean
    changedFiles: string[]
    newFiles: string[]
    deletedFiles: string[]
  }> {
    const result = {
      hasChanges: false,
      changedFiles: [] as string[],
      newFiles: [] as string[],
      deletedFiles: [] as string[],
    }

    try {
      // Get current file tree
      const currentTree = await this.getMarkdownFiles(['docs', 'guides']) // Default folders
      const currentFiles = this.flattenFileTree(currentTree)

      // Compare with cached file list
      const currentPaths = new Set(currentFiles.map(f => f.path))
      const cachedPaths = new Set(fileList.map(f => f.path))

      // Find new files
      for (const file of currentFiles) {
        if (!cachedPaths.has(file.path)) {
          result.newFiles.push(file.path)
          result.hasChanges = true
        }
      }

      // Find deleted files
      for (const cachedFile of fileList) {
        if (!currentPaths.has(cachedFile.path)) {
          result.deletedFiles.push(cachedFile.path)
          result.hasChanges = true
        }
      }

      // Find changed files (different SHA)
      for (const file of currentFiles) {
        const cachedFile = fileList.find(f => f.path === file.path)
        if (cachedFile && cachedFile.sha !== file.sha) {
          result.changedFiles.push(file.path)
          result.hasChanges = true
        }
      }

      return result
    } catch (error) {
      console.error('Error checking for changes:', error)
      return result
    }
  }

  // Helper to flatten file tree
  private flattenFileTree(tree: FileTreeItem[]): Array<{ path: string; sha: string }> {
    const files: Array<{ path: string; sha: string }> = []

    function traverse(items: FileTreeItem[]) {
      for (const item of items) {
        if (item.type === 'file' && item.sha) {
          files.push({ path: item.path, sha: item.sha })
        } else if (item.type === 'folder' && item.children) {
          traverse(item.children)
        }
      }
    }

    traverse(tree)
    return files
  }
}

// Utility functions
export function parseGitHubUrl(url: string): { owner: string; repo: string } | null {
  const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)/)
  if (!match) return null

  return {
    owner: match[1],
    repo: match[2].replace('.git', ''),
  }
}

export function isMarkdownFile(filename: string): boolean {
  return /\.(md|markdown)$/i.test(filename)
}

export function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9.-]/g, '_')
}

// Rate limiting helper for GitHub API
export class RateLimiter {
  private lastRequestTime = 0
  private minInterval = 1000 // 1 second between requests

  async waitIfNeeded(): Promise<void> {
    const now = Date.now()
    const timeSinceLastRequest = now - this.lastRequestTime
    
    if (timeSinceLastRequest < this.minInterval) {
      const waitTime = this.minInterval - timeSinceLastRequest
      await new Promise(resolve => setTimeout(resolve, waitTime))
    }
    
    this.lastRequestTime = Date.now()
  }
}