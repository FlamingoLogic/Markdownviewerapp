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
  const [selectedFile, setSelectedFile] = useState<FileTreeItem | undefined>(undefined)
  const [markdownContent, setMarkdownContent] = useState('')
  const [loadingContent, setLoadingContent] = useState(false)

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
    try {
      const config = await siteConfigOperations.getConfig()
      setSiteConfig(config)
    } catch (error) {
      logError(error as Error, { additionalData: { context: 'loadSiteConfig' } })
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
        // Clear password field on error to prevent caching interference
        setPassword('')
        // Force form reset to clear any browser autocomplete
        const form = document.getElementById('site-login-form') as HTMLFormElement
        if (form) {
          setTimeout(() => form.reset(), 100)
        }
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
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Site Logo and Title */}
          <div className="text-center mb-8">
            {siteConfig?.logo_url ? (
              <div className="relative group">
                <div className="absolute -inset-2 bg-gradient-to-r from-primary-600 via-purple-600 to-primary-600 rounded-2xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity duration-500 animate-pulse"></div>
                <img
                  src={siteConfig.logo_url}
                  alt="Site Logo"
                  className="relative w-24 h-24 mx-auto mb-4 rounded-2xl shadow-2xl border-2 border-slate-700 group-hover:border-primary-500 transition-all duration-300 transform group-hover:scale-105"
                />
              </div>
            ) : (
              <div className="relative group">
                {/* Animated background layers */}
                <div className="absolute -inset-4 bg-gradient-to-r from-primary-500 via-purple-500 to-blue-500 rounded-3xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity duration-700 animate-pulse"></div>
                <div className="absolute -inset-2 bg-gradient-to-r from-slate-600 to-slate-800 rounded-2xl blur-md opacity-40"></div>
                
                {/* Main logo container */}
                <div className="relative w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 rounded-2xl flex items-center justify-center shadow-2xl border border-primary-500/30 group-hover:border-primary-400/50 transition-all duration-500 transform group-hover:scale-105 group-hover:rotate-1">
                  {/* Icon with animated glow */}
                  <div className="relative">
                    <FileText className="w-12 h-12 text-white drop-shadow-lg transform transition-transform duration-300 group-hover:scale-110" />
                    <div className="absolute inset-0 w-12 h-12 bg-white rounded-full opacity-20 blur-xl animate-pulse"></div>
                  </div>
                  
                  {/* Decorative elements */}
                  <div className="absolute top-2 right-2 w-2 h-2 bg-primary-300 rounded-full animate-ping"></div>
                  <div className="absolute bottom-2 left-2 w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse"></div>
                </div>
                
                {/* Floating particles effect */}
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute top-0 left-1/4 w-1 h-1 bg-primary-400 rounded-full animate-bounce" style={{animationDelay: '0s'}}></div>
                  <div className="absolute bottom-4 right-1/3 w-0.5 h-0.5 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '1s'}}></div>
                  <div className="absolute top-1/3 right-0 w-0.5 h-0.5 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '2s'}}></div>
                </div>
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

            <form id="site-login-form" onSubmit={handleLogin} className="space-y-4" autoComplete="off">
              <div>
                <label htmlFor="password" className="sr-only">
                  Password
                </label>
                <input
                  id="password"
                  name="site-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="input-primary w-full"
                  disabled={authState.isLoading}
                  autoFocus
                  autoComplete="new-password"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck="false"
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
      
      <ChatPanel iframeUrl={siteConfig?.iframe_url} />
    </ResizableLayout>
  )
}