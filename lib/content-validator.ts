import { remark } from 'remark'
import remarkGfm from 'remark-gfm'
import remarkHtml from 'remark-html'
import matter from 'gray-matter'

// Content validation interface
export interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  sanitizedContent?: string
  frontmatter?: Record<string, any>
}

// Markdown content validator
export class ContentValidator {
  private static readonly MAX_FILE_SIZE = 1024 * 1024 // 1MB
  private static readonly MAX_CONTENT_LENGTH = 500000 // 500KB of text

  // Main validation function
  static async validateMarkdownContent(content: string, filename?: string): Promise<ValidationResult> {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
    }

    try {
      // Basic size validation
      if (!this.validateSize(content, result)) {
        return result
      }

      // Parse frontmatter
      const { data: frontmatter, content: markdownContent } = matter(content)
      result.frontmatter = frontmatter

      // Validate frontmatter
      this.validateFrontmatter(frontmatter, result)

      // Security validation
      this.validateSecurity(markdownContent, result)

      // Markdown syntax validation
      await this.validateMarkdownSyntax(markdownContent, result)

      // File-specific validation
      if (filename) {
        this.validateFilename(filename, result)
      }

      // If we have errors, mark as invalid
      result.isValid = result.errors.length === 0

      // Sanitize content if valid
      if (result.isValid) {
        result.sanitizedContent = this.sanitizeContent(content)
      }

      return result
    } catch (error) {
      console.error('Content validation error:', error)
      result.isValid = false
      result.errors.push('Failed to validate content')
      return result
    }
  }

  // Size validation
  private static validateSize(content: string, result: ValidationResult): boolean {
    const sizeInBytes = Buffer.byteLength(content, 'utf8')

    if (sizeInBytes > this.MAX_FILE_SIZE) {
      result.errors.push(`File too large: ${Math.round(sizeInBytes / 1024)}KB (max: ${this.MAX_FILE_SIZE / 1024}KB)`)
      return false
    }

    if (content.length > this.MAX_CONTENT_LENGTH) {
      result.errors.push(`Content too long: ${content.length} characters (max: ${this.MAX_CONTENT_LENGTH})`)
      return false
    }

    if (!content.trim()) {
      result.errors.push('Content cannot be empty')
      return false
    }

    return true
  }

  // Security validation - check for potentially dangerous content
  private static validateSecurity(content: string, result: ValidationResult): void {
    // Remove code blocks and inline code to avoid false positives in documentation
    const contentWithoutCodeBlocks = content
      .replace(/```[\s\S]*?```/g, '') // Remove code blocks
      .replace(/`[^`]*`/g, '') // Remove inline code
    
    const dangerousPatterns = [
      {
        pattern: /<script[^>]*>.*?<\/script>/gi,
        message: 'Script tags are not allowed'
      },
      {
        pattern: /<iframe[^>]*src\s*=\s*["'][^"']*javascript:/gi,
        message: 'JavaScript iframes are not allowed'
      },
      {
        pattern: /<object[^>]*>/gi,
        message: 'Object embeds are not allowed'
      },
      {
        pattern: /<embed[^>]*>/gi,
        message: 'Embed tags are not allowed'
      }
    ]

    // Only check dangerous patterns in content outside of code blocks
    for (const { pattern, message } of dangerousPatterns) {
      if (pattern.test(contentWithoutCodeBlocks)) {
        result.errors.push(message)
      }
    }
    
    // Allow javascript: URLs and event handlers in code examples
    // These are commonly used in documentation and are safe when in markdown

    // Check for suspicious URLs
    const urlPattern = /\[([^\]]*)\]\(([^)]+)\)/g
    let match
    while ((match = urlPattern.exec(content)) !== null) {
      const url = match[2]
      if (this.isSuspiciousUrl(url)) {
        result.warnings.push(`Potentially suspicious URL detected: ${url}`)
      }
    }
  }

  // Check for suspicious URLs
  private static isSuspiciousUrl(url: string): boolean {
    const suspiciousPatterns = [
      /^javascript:/i,
      /^data:/i,
      /^vbscript:/i,
      /^file:/i,
    ]

    return suspiciousPatterns.some(pattern => pattern.test(url))
  }

  // Validate markdown syntax
  private static async validateMarkdownSyntax(content: string, result: ValidationResult): Promise<void> {
    try {
      // Use remark to parse and validate markdown
      const processor = remark()
        .use(remarkGfm)
        .use(remarkHtml)

      await processor.process(content)
    } catch (error) {
      result.errors.push(`Markdown syntax error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Validate frontmatter
  private static validateFrontmatter(frontmatter: Record<string, any>, result: ValidationResult): void {
    if (!frontmatter || typeof frontmatter !== 'object') {
      return // Frontmatter is optional
    }

    // Validate common frontmatter fields
    if (frontmatter.title && typeof frontmatter.title !== 'string') {
      result.warnings.push('Frontmatter title should be a string')
    }

    if (frontmatter.order && (typeof frontmatter.order !== 'number' || frontmatter.order < 0)) {
      result.warnings.push('Frontmatter order should be a positive number')
    }

    if (frontmatter.hidden && typeof frontmatter.hidden !== 'boolean') {
      result.warnings.push('Frontmatter hidden should be a boolean')
    }

    if (frontmatter.tags && !Array.isArray(frontmatter.tags)) {
      result.warnings.push('Frontmatter tags should be an array')
    }

    // Check for potentially dangerous frontmatter
    const dangerousKeys = ['script', 'javascript', 'eval', 'function']
    for (const key of dangerousKeys) {
      if (key in frontmatter) {
        result.errors.push(`Dangerous frontmatter field: ${key}`)
      }
    }
  }

  // Validate filename
  private static validateFilename(filename: string, result: ValidationResult): void {
    if (!filename.endsWith('.md') && !filename.endsWith('.markdown')) {
      result.warnings.push('File should have .md or .markdown extension')
    }

    // Check for dangerous characters in filename
    const dangerousChars = /[<>:"|?*\x00-\x1f]/
    if (dangerousChars.test(filename)) {
      result.errors.push('Filename contains invalid characters')
    }

    // Check for very long filenames
    if (filename.length > 255) {
      result.errors.push('Filename is too long')
    }
  }

  // Sanitize content - remove or escape dangerous elements
  private static sanitizeContent(content: string): string {
    // Remove script tags completely
    let sanitized = content.replace(/<script[^>]*>.*?<\/script>/gi, '')

    // Remove event handlers
    sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')

    // Remove javascript: URLs
    sanitized = sanitized.replace(/href\s*=\s*["']javascript:[^"']*["']/gi, '')

    // Remove dangerous data URLs
    sanitized = sanitized.replace(/src\s*=\s*["']data:text\/html[^"']*["']/gi, '')

    return sanitized
  }

  // Quick validation for file upload
  static quickValidate(content: string): { isValid: boolean; error?: string } {
    if (!content || !content.trim()) {
      return { isValid: false, error: 'Content is empty' }
    }

    const sizeInBytes = Buffer.byteLength(content, 'utf8')
    if (sizeInBytes > this.MAX_FILE_SIZE) {
      return { isValid: false, error: 'File too large' }
    }

    // Quick security check
    const dangerousPatterns = [
      /<script/i,
      /javascript:/i,
      /data:text\/html/i
    ]

    for (const pattern of dangerousPatterns) {
      if (pattern.test(content)) {
        return { isValid: false, error: 'Content contains potentially dangerous elements' }
      }
    }

    return { isValid: true }
  }
}

// Utility functions for content processing
export class ContentProcessor {
  // Extract title from content (frontmatter or first heading)
  static extractTitle(content: string, filename?: string): string {
    try {
      const { data: frontmatter, content: markdownContent } = matter(content)
      
      // Try frontmatter title first
      if (frontmatter.title && typeof frontmatter.title === 'string') {
        return frontmatter.title.trim()
      }

      // Try first heading
      const headingMatch = markdownContent.match(/^#\s+(.+)$/m)
      if (headingMatch) {
        return headingMatch[1].trim()
      }

      // Fallback to filename
      if (filename) {
        return filename.replace(/\.(md|markdown)$/i, '').replace(/[-_]/g, ' ')
      }

      return 'Untitled'
    } catch {
      return filename ? filename.replace(/\.(md|markdown)$/i, '') : 'Untitled'
    }
  }

  // Extract description from content
  static extractDescription(content: string, maxLength: number = 160): string {
    try {
      const { content: markdownContent } = matter(content)
      
      // Remove markdown syntax and get plain text
      const plainText = markdownContent
        .replace(/^#.+$/gm, '') // Remove headings
        .replace(/\*\*(.+?)\*\*/g, '$1') // Remove bold
        .replace(/\*(.+?)\*/g, '$1') // Remove italic
        .replace(/`(.+?)`/g, '$1') // Remove code
        .replace(/\[(.+?)\]\(.+?\)/g, '$1') // Remove links
        .replace(/\n+/g, ' ') // Replace newlines with spaces
        .trim()

      if (plainText.length <= maxLength) {
        return plainText
      }

      // Truncate at word boundary
      const truncated = plainText.slice(0, maxLength)
      const lastSpace = truncated.lastIndexOf(' ')
      
      return lastSpace > maxLength * 0.8 
        ? truncated.slice(0, lastSpace) + '...'
        : truncated + '...'
    } catch {
      return ''
    }
  }

  // Extract tags from frontmatter
  static extractTags(content: string): string[] {
    try {
      const { data: frontmatter } = matter(content)
      
      if (Array.isArray(frontmatter.tags)) {
        return frontmatter.tags
          .filter(tag => typeof tag === 'string')
          .map(tag => tag.trim())
          .filter(tag => tag.length > 0)
      }

      return []
    } catch {
      return []
    }
  }

  // Get reading time estimate
  static getReadingTime(content: string): number {
    try {
      const { content: markdownContent } = matter(content)
      const words = markdownContent.trim().split(/\s+/).length
      const wordsPerMinute = 200 // Average reading speed
      return Math.ceil(words / wordsPerMinute)
    } catch {
      return 1
    }
  }
}