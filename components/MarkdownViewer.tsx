'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { remark } from 'remark'
import remarkGfm from 'remark-gfm'
import remarkHtml from 'remark-html'
import matter from 'gray-matter'
import { 
  FileText, 
  Clock, 
  User, 
  Calendar,
  Copy,
  ExternalLink,
  Loader2,
  AlertCircle,
  Eye,
  ChevronUp
} from 'lucide-react'
import { FileTreeItem } from '@/lib/github'
import { ContentProcessor } from '@/lib/content-validator'
import { formatRelativeTime, formatDate, copyToClipboard, cn } from '@/lib/utils'
import { InlineErrorFallback } from './ErrorBoundary'

interface MarkdownViewerProps {
  file?: FileTreeItem
  content?: string
  loading?: boolean
  error?: string
  className?: string
  onRetry?: () => void
}

interface TableOfContentsItem {
  id: string
  title: string
  level: number
}

export function MarkdownViewer({
  file,
  content,
  loading = false,
  error,
  className = '',
  onRetry
}: MarkdownViewerProps) {
  const [processedContent, setProcessedContent] = useState<string>('')
  const [frontmatter, setFrontmatter] = useState<any>({})
  const [tocItems, setTocItems] = useState<TableOfContentsItem[]>([])
  const [showToc, setShowToc] = useState(false)
  const [readingTime, setReadingTime] = useState<number>(0)
  const [scrollProgress, setScrollProgress] = useState<number>(0)

  // Process markdown content
  useEffect(() => {
    if (!content) {
      setProcessedContent('')
      setFrontmatter({})
      setTocItems([])
      setReadingTime(0)
      return
    }

    const processMarkdown = async () => {
      try {
        // Parse frontmatter
        const { data, content: markdownContent } = matter(content)
        setFrontmatter(data)

        // Calculate reading time
        const readTime = ContentProcessor.getReadingTime(content)
        setReadingTime(readTime)

        // Extract table of contents
        const toc = extractTableOfContents(markdownContent)
        setTocItems(toc)

        // Process markdown to HTML
        const processor = remark()
          .use(remarkGfm)
          .use(remarkHtml, { sanitize: false })

        const result = await processor.process(markdownContent)
        let html = result.toString()

        // Add IDs to headings for TOC navigation
        html = addHeadingIds(html)

        // Enhance code blocks
        html = enhanceCodeBlocks(html)

        setProcessedContent(html)
      } catch (err) {
        console.error('Error processing markdown:', err)
        setProcessedContent('<p class="text-error-400">Failed to process markdown content</p>')
      }
    }

    processMarkdown()
  }, [content])

  // Track scroll progress
  useEffect(() => {
    const handleScroll = (e: Event) => {
      const target = e.target as HTMLElement
      if (target) {
        const scrollTop = target.scrollTop
        const scrollHeight = target.scrollHeight - target.clientHeight
        const progress = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0
        setScrollProgress(Math.min(100, Math.max(0, progress)))
      }
    }

    const container = document.querySelector('.markdown-content')
    if (container) {
      container.addEventListener('scroll', handleScroll)
      return () => container.removeEventListener('scroll', handleScroll)
    }
  }, [processedContent])

  // Handle TOC navigation
  const scrollToHeading = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  // Handle copy content
  const handleCopyContent = async () => {
    if (content) {
      const success = await copyToClipboard(content)
      // You could show a toast notification here
      console.log(success ? 'Content copied!' : 'Failed to copy content')
    }
  }

  // Render loading state
  if (loading) {
    return (
      <div className={cn('h-full flex items-center justify-center bg-slate-950', className)}>
        <div className="flex items-center gap-3 text-slate-500">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading content...</span>
        </div>
      </div>
    )
  }

  // Render error state
  if (error) {
    return (
      <div className={cn('h-full flex items-center justify-center bg-slate-950 p-8', className)}>
        <div className="max-w-md text-center">
          <InlineErrorFallback message={error} />
          {onRetry && (
            <button onClick={onRetry} className="btn-secondary mt-4">
              Try Again
            </button>
          )}
        </div>
      </div>
    )
  }

  // Render empty state
  if (!file) {
    return (
      <div className={cn('h-full flex items-center justify-center bg-slate-950', className)}>
        <div className="text-center text-slate-500">
          <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium mb-2">No file selected</h3>
          <p className="text-sm">Select a markdown file from the sidebar to start reading</p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('h-full flex flex-col bg-slate-950', className)}>
      {/* Header */}
      <div className="flex-shrink-0 border-b border-slate-800 bg-slate-950/80 backdrop-blur-sm">
        {/* Progress bar */}
        <div className="h-1 bg-slate-800">
          <div 
            className="h-full bg-primary-500 transition-all duration-150"
            style={{ width: `${scrollProgress}%` }}
          />
        </div>

        <div className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-semibold text-slate-100 mb-2 truncate">
                {frontmatter.title || ContentProcessor.extractTitle(content || '', file.name)}
              </h1>
              
              {/* File metadata */}
              <div className="flex items-center gap-4 text-sm text-slate-500">
                <div className="flex items-center gap-1">
                  <FileText className="w-4 h-4" />
                  <span>{file.name}</span>
                </div>
                
                {readingTime > 0 && (
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{readingTime} min read</span>
                  </div>
                )}

                {file.size && (
                  <div className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    <span>{Math.round(file.size / 1024)}KB</span>
                  </div>
                )}
              </div>

              {/* Frontmatter metadata */}
              {(frontmatter.author || frontmatter.date) && (
                <div className="flex items-center gap-4 text-sm text-slate-500 mt-2">
                  {frontmatter.author && (
                    <div className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      <span>{frontmatter.author}</span>
                    </div>
                  )}
                  
                  {frontmatter.date && (
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(frontmatter.date)}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Tags */}
              {frontmatter.tags && Array.isArray(frontmatter.tags) && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {frontmatter.tags.map((tag: string, index: number) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-slate-800 text-slate-300 text-xs rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 ml-4">
              {tocItems.length > 0 && (
                <button
                  onClick={() => setShowToc(!showToc)}
                  className="btn-ghost"
                  title="Table of Contents"
                >
                  <ChevronUp className={cn('w-4 h-4 transition-transform', showToc && 'rotate-180')} />
                </button>
              )}
              
              <button
                onClick={handleCopyContent}
                className="btn-ghost"
                title="Copy content"
              >
                <Copy className="w-4 h-4" />
              </button>

              <a
                href={`https://github.com/${file.path}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-ghost"
                title="View on GitHub"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Table of Contents */}
          {showToc && tocItems.length > 0 && (
            <div className="mt-4 p-3 bg-slate-900/50 rounded-lg border border-slate-700/50">
              <h4 className="text-sm font-medium text-slate-300 mb-2">Table of Contents</h4>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {tocItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => scrollToHeading(item.id)}
                    className="block w-full text-left text-sm text-slate-400 hover:text-slate-300 py-1 px-2 rounded transition-colors"
                    style={{ paddingLeft: `${(item.level - 1) * 12 + 8}px` }}
                  >
                    {item.title}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto markdown-content">
        {processedContent ? (
          <div 
            className="prose-dark p-6 max-w-none"
            dangerouslySetInnerHTML={{ __html: processedContent }}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-slate-500">
            <div className="text-center">
              <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No content to display</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Helper functions
function extractTableOfContents(markdown: string): TableOfContentsItem[] {
  const headingRegex = /^(#{1,6})\s+(.+)$/gm
  const toc: TableOfContentsItem[] = []
  let match

  while ((match = headingRegex.exec(markdown)) !== null) {
    const level = match[1].length
    const title = match[2].trim()
    const id = title.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-')
    
    toc.push({ id, title, level })
  }

  return toc
}

function addHeadingIds(html: string): string {
  return html.replace(
    /<h([1-6])>(.*?)<\/h[1-6]>/g,
    (match, level, content) => {
      const id = content.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-')
      return `<h${level} id="${id}">${content}</h${level}>`
    }
  )
}

function enhanceCodeBlocks(html: string): string {
  // Add copy button to code blocks (basic implementation)
  return html.replace(
    /<pre><code class="language-(\w+)">(.*?)<\/code><\/pre>/gs,
    (match, language, code) => {
      return `
        <div class="relative group">
          <div class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button class="btn-ghost text-xs p-1" onclick="navigator.clipboard?.writeText(decodeURIComponent('${encodeURIComponent(code.replace(/<[^>]*>/g, ''))}'))">
              Copy
            </button>
          </div>
          <pre><code class="language-${language}">${code}</code></pre>
        </div>
      `
    }
  )
}