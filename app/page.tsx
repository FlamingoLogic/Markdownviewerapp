'use client'

import React, { useState, useEffect } from 'react'
import { FileText, Lock, Shield, Loader2, Github, Zap } from 'lucide-react'
import { ResizableLayout } from '@/components/layout/ResizableLayout'
import { FileExplorer } from '@/components/FileExplorer'
import { MarkdownViewer } from '@/components/MarkdownViewer'
import { ChatPanel } from '@/components/ChatPanel'
import { siteConfigOperations, type SiteConfig } from '@/lib/supabase'
import { FileTreeItem } from '@/lib/github'
import { logError } from '@/lib/error-tracking'

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
  const [selectedFile, setSelectedFile] = useState<FileTreeItem | null>(null)
  const [markdownContent, setMarkdownContent] = useState('')
  const [loadingContent, setLoadingContent] = useState(false)

  // Check authentication and load config on mount
  useEffect(() => {
    checkAuthentication()
    loadSiteConfig()
  }, [])

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
    try {
      const config = await siteConfigOperations.getConfig()
      setSiteConfig(config)
    } catch (error) {
      logError(error as Error, { context: 'loadSiteConfig' })
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!password.trim()) return

    setAuthState(prev => ({ ...prev, isLoading: true, error: undefined }))

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })

      const data = await response.json()

      if (response.ok) {
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
      }
    } catch (error) {
      setAuthState({
        isAuthenticated: false,
        isLoading: false,
        error: 'Login failed. Please try again.',
      })
      logError(error as Error, { context: 'login' })
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
          context: 'loadFiles',
          additionalData: { error: data.message }
        })
      }
    } catch (error) {
      logError(error as Error, { context: 'loadFiles' })
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
          context: 'loadFileContent',
          additionalData: { file: file.path, error: data.message }
        })
      }
    } catch (error) {
      setMarkdownContent('')
      logError(error as Error, { 
        context: 'loadFileContent',
        additionalData: { file: file.path }
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
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Site Logo and Title */}
          <div className="text-center mb-8">
            {siteConfig?.logo_url ? (
              <img
                src={siteConfig.logo_url}
                alt="Site Logo"
                className="w-16 h-16 mx-auto mb-4 rounded-lg"
              />
            ) : (
              <div className="w-16 h-16 mx-auto mb-4 bg-primary-600 rounded-lg flex items-center justify-center">
                <FileText className="w-8 h-8 text-white" />
              </div>
            )}
            
            <h1 className="text-2xl font-bold text-slate-100 mb-2">
              {siteConfig?.title || 'Documentation'}
            </h1>
            
            {siteConfig?.slogan && (
              <p className="text-slate-400">
                {siteConfig.slogan}
              </p>
            )}
          </div>

          {/* Login Form */}
          <div className="card-elevated p-6">
            <div className="flex items-center gap-2 mb-4">
              <Lock className="w-5 h-5 text-primary-400" />
              <h2 className="text-lg font-semibold text-slate-100">
                Access Required
              </h2>
            </div>

            {siteConfig?.help_text && (
              <div className="mb-4 p-3 bg-slate-900/50 rounded-lg text-sm text-slate-300">
                {siteConfig.help_text}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label htmlFor="password" className="sr-only">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="input-primary w-full"
                  disabled={authState.isLoading}
                  autoFocus
                />
              </div>

              {authState.error && (
                <div className="text-sm text-error-400 bg-error-900/20 border border-error-700/30 rounded-lg p-3">
                  {authState.error}
                </div>
              )}

              <button
                type="submit"
                disabled={authState.isLoading || !password.trim()}
                className="btn-primary w-full"
              >
                {authState.isLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Checking...</span>
                  </div>
                ) : (
                  'Access Documentation'
                )}
              </button>
            </form>
          </div>

          {/* Features */}
          <div className="mt-8 grid grid-cols-2 gap-4 text-center">
            <div className="card p-4">
              <Github className="w-6 h-6 text-primary-400 mx-auto mb-2" />
              <h3 className="text-sm font-medium text-slate-200 mb-1">
                GitHub Sync
              </h3>
              <p className="text-xs text-slate-500">
                Auto-synced content
              </p>
            </div>
            
            <div className="card p-4">
              <Zap className="w-6 h-6 text-primary-400 mx-auto mb-2" />
              <h3 className="text-sm font-medium text-slate-200 mb-1">
                Fast & Secure
              </h3>
              <p className="text-xs text-slate-500">
                Read-only access
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-xs text-slate-600">
              Powered by{' '}
              <a 
                href="https://github.com/FlamingoLogic/Markdownviewerapp"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-400 hover:text-primary-300"
              >
                Markdown Viewer App
              </a>
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Show main documentation interface
  return (
    <ResizableLayout>
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
      
      <ChatPanel iframeUrl={siteConfig?.iframe_url} />
    </ResizableLayout>
  )
}