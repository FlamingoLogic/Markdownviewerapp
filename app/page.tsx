'use client'

import React, { useState, useEffect } from 'react'
import { FileText, Lock, Shield, Loader2, Github, Zap } from 'lucide-react'
import { ResizableLayout } from '@/components/layout/ResizableLayout'
import { FileExplorer } from '@/components/FileExplorer'
import { MarkdownViewer } from '@/components/MarkdownViewer'
import { ChatPanel } from '@/components/ChatPanel'
import { AccessPortal } from '@/components/AccessPortal'
import { siteConfigOperations, type SiteConfig } from '@/lib/supabase'
import { FileTreeItem } from '@/lib/github'
import { logError } from '@/lib/error-tracking'
import { EnhancedChatPanel } from '@/components/EnhancedChatPanel'

interface AuthState {
  isAuthenticated: boolean
  isLoading: boolean
  error?: string
}

export default function HomePage() {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: true,
  })
  const [siteConfig, setSiteConfig] = useState<SiteConfig | null>(null)
  const [password, setPassword] = useState('')
  const [files, setFiles] = useState<FileTreeItem[]>([])
  const [selectedFile, setSelectedFile] = useState<FileTreeItem | undefined>(undefined)
  const [markdownContent, setMarkdownContent] = useState('')
  const [loadingContent, setLoadingContent] = useState(false)
  const [configLoaded, setConfigLoaded] = useState(false)

  // Check authentication and load config on mount
  useEffect(() => {
    checkAuthentication()
    loadSiteConfig()
  }, [])

  // Update document title when site config changes
  useEffect(() => {
    if (siteConfig?.title) {
      document.title = siteConfig.title
    }
  }, [siteConfig?.title])

  const checkAuthentication = async () => {
    try {
      const response = await fetch('/api/auth/check')
      const data = await response.json()

      setAuthState({
        isAuthenticated: data.isAuthenticated || false,
        isLoading: false,
      })
    } catch (error) {
      console.error('Auth check failed:', error)
      setAuthState({
        isAuthenticated: false,
        isLoading: false,
        error: 'Failed to check authentication status',
      })
    }
  }

  const loadSiteConfig = async () => {
    // Prevent multiple config loads
    if (configLoaded) {
      console.log('⚠️ Config already loaded, skipping')
      return
    }

    try {
      console.log('📊 Loading site configuration...')
      const config = await siteConfigOperations.getConfig()
      setSiteConfig(config)
      setConfigLoaded(true)

      // Log if we're in test mode
      if (config?.chat_enabled) {
        console.log('🤖 AI Chat is enabled via configuration')
      }
    } catch (error) {
      logError(error as Error, { additionalData: { context: 'loadSiteConfig' } })
    }
  }

  const handleLogin = async (e: React.FormEvent, isAdmin: boolean = false) => {
    e.preventDefault()

    if (!password.trim()) return

    setAuthState(prev => ({ ...prev, isLoading: true, error: undefined }))

    try {
      const endpoint = isAdmin ? '/api/admin/login' : '/api/auth/login'
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })

      const data = await response.json()

      if (response.ok) {
        if (isAdmin) {
          // Redirect to admin panel
          window.location.href = '/admin'
          return
        }

        setAuthState({
          isAuthenticated: true,
          isLoading: false,
        })
        setPassword('')
        // Load files after successful authentication
        loadFiles()
      } else {
        setAuthState({
          isAuthenticated: false,
          isLoading: false,
          error: data.message || 'Invalid password',
        })
        // Clear password field on error to prevent caching interference
        setPassword('')
      }
    } catch (error) {
      setAuthState({
        isAuthenticated: false,
        isLoading: false,
        error: 'Login failed. Please try again.',
      })
      // Clear password field on error to prevent caching interference
      setPassword('')
      logError(error as Error, { additionalData: { context: 'login' } })
    }
  }

  const loadFiles = async () => {
    if (!siteConfig) return

    try {
      const response = await fetch('/api/github/files')
      const data = await response.json()

      if (response.ok) {
        setFiles(data.files || [])
      } else {
        logError(new Error('Failed to load files'), {
          additionalData: { context: 'loadFiles', error: data.message }
        })
      }
    } catch (error) {
      logError(error as Error, { additionalData: { context: 'loadFiles' } })
    }
  }

  const handleFileSelect = async (file: FileTreeItem) => {
    if (file.type !== 'file') return

    setSelectedFile(file)
    setLoadingContent(true)

    try {
      const response = await fetch(`/api/github/content?path=${encodeURIComponent(file.path)}`)
      const data = await response.json()

      if (response.ok) {
        setMarkdownContent(data.content || '')
      } else {
        setMarkdownContent('')
        logError(new Error('Failed to load file content'), {
          additionalData: { context: 'loadFileContent', file: file.path, error: data.message }
        })
      }
    } catch (error) {
      setMarkdownContent('')
      logError(error as Error, {
        additionalData: { context: 'loadFileContent', file: file.path }
      })
    } finally {
      setLoadingContent(false)
    }
  }

  const handleRefreshFiles = () => {
    loadFiles()
  }

  // Show loading state while checking authentication
  if (authState.isLoading) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-500">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    )
  }

  // Show landing page if not authenticated
  if (!authState.isAuthenticated) {
    return <AccessPortal siteConfig={siteConfig} onLogin={handleLogin} authState={authState} password={password} setPassword={setPassword} />
  }

  // Show main documentation interface
  return (
    <ResizableLayout siteConfig={siteConfig}>
      <FileExplorer
        files={files}
        onFileSelect={handleFileSelect}
        onRefresh={handleRefreshFiles}
        selectedFile={selectedFile?.path}
        lastSync={siteConfig?.last_sync_at}
      />

      <MarkdownViewer
        file={selectedFile}
        content={markdownContent}
        loading={loadingContent}
      />

      {siteConfig?.chat_enabled ? (
        <EnhancedChatPanel
          currentFile={selectedFile ? {
            name: selectedFile.name,
            path: selectedFile.path,
            content: markdownContent
          } : undefined}
          onConfigureAPI={() => window.location.href = '/admin'}
        />
      ) : (
        <ChatPanel iframeUrl={siteConfig?.iframe_url} />
      )}
    </ResizableLayout>
  )
}
