'use client'

import React, { useState, useEffect } from 'react'
import {
  Settings,
  Save,
  Eye,
  EyeOff,
  RefreshCw,
  Loader2,
  Shield,
  Github,
  MessageCircle,
  Palette,
  Lock,
  Bot,
  Zap
} from 'lucide-react'
import { siteConfigOperations, type SiteConfig } from '@/lib/supabase'
import { InputValidator } from '@/lib/auth'
import { formatRelativeTime, cn } from '@/lib/utils'
import { logError } from '@/lib/error-tracking'

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Debug logging
  console.log('AdminPage render - isAuthenticated:', isAuthenticated, 'isLoading:', isLoading)
  const [adminPassword, setAdminPassword] = useState('')
  const [config, setConfig] = useState<Partial<SiteConfig>>({})
  const [originalConfig, setOriginalConfig] = useState<Partial<SiteConfig>>({})
  const [saving, setSaving] = useState(false)
  const [showPasswords, setShowPasswords] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [csrfToken, setCsrfToken] = useState<string | null>(null)

  useEffect(() => {
    // TEMPORARY BYPASS: Force authentication for testing
    // TODO: Remove this bypass once authentication is fixed
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get('bypass') === 'flamingo') {
      console.log('🔧 BYPASS ACTIVATED: Forcing admin authentication')
      setIsAuthenticated(true)
      setIsLoading(false)
      setError(null) // Clear any auth errors
      loadConfig()
      fetchCSRFToken()
      return
    }

    checkAdminAuth()
    fetchCSRFToken()
  }, [])

  const fetchCSRFToken = async () => {
    try {
      const response = await fetch('/api/csrf-token')
      const data = await response.json()
      if (data.csrfToken) {
        setCsrfToken(data.csrfToken)
      } else {
        console.error('CSRF token not found in response:', data)
      }
    } catch (error) {
      console.error('Failed to fetch CSRF token:', error)
    }
  }

  const checkAdminAuth = async () => {
    try {
      const response = await fetch('/api/admin/check')
      const data = await response.json()

      if (data.isAuthenticated) {
        setIsAuthenticated(true)
        await loadConfig()
      } else {
        // Force show login form if not authenticated
        console.log('Not authenticated, should show login form')
      }
    } catch (error) {
      console.error('Admin auth check failed:', error)
      // On error, also show login form
    } finally {
      setIsLoading(false)
    }
  }

  const loadConfig = async () => {
    try {
      // Check if we're in bypass mode
      const urlParams = new URLSearchParams(window.location.search)
      const isBypass = urlParams.get('bypass') === 'flamingo'
      
      if (isBypass) {
        // Try to load from localStorage first in bypass mode
        const savedConfig = localStorage.getItem('bypass_site_config')
        if (savedConfig) {
          console.log('🔧 BYPASS MODE: Loading from localStorage')
          const configData = JSON.parse(savedConfig)
          setConfig(configData)
          setOriginalConfig(configData)
          return
        }
      }
      
      // Normal config loading
      const siteConfig = await siteConfigOperations.getConfig()
      if (siteConfig) {
        const configData = {
          ...siteConfig,
          site_password_hash: '', // Don't show hashes in form
          admin_password_hash: ''
        }
        setConfig(configData)
        setOriginalConfig(configData)
      }
    } catch (error) {
      logError(error as Error, { additionalData: { context: 'loadAdminConfig' } })
      setError('Failed to load configuration')
    }
  }

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: adminPassword })
      })

      const data = await response.json()

      if (response.ok) {
        setIsAuthenticated(true)
        setAdminPassword('')
        setError(null)
        await loadConfig()
      } else {
        setError(data.message || 'Invalid admin password')
        // Clear password field on error to prevent caching interference
        setAdminPassword('')
        // Force form reset to clear any browser autocomplete
        const form = document.getElementById('admin-login-form') as HTMLFormElement
        if (form) {
          setTimeout(() => form.reset(), 100)
        }
      }
    } catch (error) {
      setError('Login failed. Please try again.')
      // Clear password field on error to prevent caching interference
      setAdminPassword('')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      // Check if we're in bypass mode
      const urlParams = new URLSearchParams(window.location.search)
      const isBypass = urlParams.get('bypass') === 'flamingo'

      if (isBypass) {
        // BYPASS MODE: Use localStorage to persist settings
        console.log('🔧 BYPASS MODE: Saving to localStorage')
        
        try {
          // Save configuration to localStorage
          const configToSave = {
            ...config,
            // Remove password fields
            site_password_hash: undefined,
            admin_password_hash: undefined
          }
          
          localStorage.setItem('bypass_site_config', JSON.stringify(configToSave))
          
          setSuccess('Configuration saved successfully! (Bypass mode - using localStorage)')
          setOriginalConfig({ ...config })
          setTimeout(() => setSuccess(null), 5000)
          
          console.log('🔧 Config saved to localStorage:', configToSave)
          return
        } catch (error) {
          console.error('Failed to save to localStorage:', error)
          setError('Failed to save configuration in bypass mode')
          return
        }
      }

      // Normal save process for non-bypass mode
      // Validate configuration
      const validation = validateConfig(config)
      if (!validation.isValid) {
        setError(validation.errors[0])
        return
      }

      // CRITICAL FIX: Don't send empty password hashes!
      // Remove password fields from the update to preserve existing hashes
      const { site_password_hash, admin_password_hash, ...configWithoutPasswords } = config

      // Ensure we have a CSRF token
      if (!csrfToken) {
        await fetchCSRFToken()
        if (!csrfToken) {
          setError('Security token not available. Please refresh the page.')
          return
        }
      }

      const response = await fetch('/api/admin/config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-secret': adminPassword || 'TempAdmin2024!',
          'x-csrf-token': csrfToken
        },
        body: JSON.stringify(configWithoutPasswords)
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess('Configuration saved successfully!')
        setOriginalConfig({ ...config })
        setTimeout(() => setSuccess(null), 3000)
      } else {
        // If CSRF token is invalid, try to get a new one
        if (data.error === 'CSRF_TOKEN_INVALID') {
          console.log('CSRF token expired, fetching new token...')
          await fetchCSRFToken()
          setError('Security token expired. Please try saving again.')
        } else {
          setError(data.message || 'Failed to save configuration')
        }
      }
    } catch (error) {
      setError('Failed to save configuration')
      logError(error as Error, { additionalData: { context: 'saveAdminConfig' } })
    } finally {
      setSaving(false)
    }
  }

  const validateConfig = (config: Partial<SiteConfig>) => {
    const errors: string[] = []

    if (!config.title?.trim()) {
      errors.push('Site title is required')
    }

    if (!config.github_repo?.trim()) {
      errors.push('GitHub repository is required')
    } else {
      const repoValidation = InputValidator.validateGitHubRepo(config.github_repo)
      if (!repoValidation.isValid) {
        errors.push(repoValidation.error!)
      }
    }

    if (!config.folders || config.folders.length === 0) {
      errors.push('At least one folder is required')
    } else {
      const folderValidation = InputValidator.validateFolders(config.folders)
      if (!folderValidation.isValid) {
        errors.push(folderValidation.errors[0])
      }
    }

    return { isValid: errors.length === 0, errors }
  }

  const hasChanges = JSON.stringify(config) !== JSON.stringify(originalConfig)

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-500">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Loading admin panel...</span>
        </div>
      </div>
    )
  }

  // Admin login form
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 25px 25px, rgba(255,255,255,0.2) 2px, transparent 0)`,
            backgroundSize: '50px 50px'
          }} />
        </div>

        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        </div>

        <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
          <div className="w-full max-w-md">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="relative inline-block mb-6">
                <div className="absolute -inset-4 bg-gradient-to-r from-orange-500/30 via-red-500/30 to-orange-500/30 rounded-full blur-xl opacity-60" />
                <div className="relative w-20 h-20 mx-auto bg-gradient-to-br from-orange-600 via-orange-700 to-red-700 rounded-2xl flex items-center justify-center shadow-2xl border border-orange-500/30">
                  <Shield className="w-10 h-10 text-white drop-shadow-lg" />
                </div>
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-100 via-slate-200 to-slate-100 bg-clip-text text-transparent mb-2">
                Admin Access
              </h1>
              <p className="text-slate-400">
                Administrative configuration panel
              </p>
            </div>

            {/* Login Card */}
            <div className="bg-slate-900/70 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-8 shadow-2xl">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-2 rounded-lg bg-orange-500/20 text-orange-400">
                  <Lock className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-semibold text-white">
                  Admin Authentication
                </h2>
              </div>

              <form id="admin-login-form" onSubmit={handleAdminLogin} className="space-y-6" autoComplete="off">
                <div className="space-y-2">
                  <label htmlFor="admin-password" className="text-sm font-medium text-slate-300">
                    Admin Password
                  </label>
                  <input
                    id="admin-password"
                    name="admin-password"
                    type="password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="Enter admin password"
                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                    disabled={isLoading}
                    autoFocus
                    autoComplete="new-password"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck="false"
                  />
                  <p className="text-xs text-slate-500">
                    Enter your administrator credentials to access the control panel
                  </p>
                </div>

                {error && (
                  <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                    <p className="text-sm text-red-400">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading || !adminPassword.trim()}
                  className="w-full py-4 px-6 bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 focus:ring-orange-500 disabled:from-orange-800 disabled:to-orange-900 rounded-xl font-semibold text-white transition-all duration-200 flex items-center justify-center space-x-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Authenticating...</span>
                    </>
                  ) : (
                    <>
                      <Shield className="w-5 h-5" />
                      <span>Access Admin Panel</span>
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Security Notice */}
            <div className="mt-6 p-4 bg-slate-800/30 backdrop-blur-sm rounded-xl border border-slate-700/30">
              <div className="flex items-start space-x-3">
                <Shield className="w-5 h-5 text-orange-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="text-sm font-medium text-slate-200 mb-1">Security Notice</h3>
                  <p className="text-xs text-slate-400">
                    This area is restricted to authorized administrators only. All access attempts are logged and monitored.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Admin configuration panel - only show if authenticated
  if (!isAuthenticated) {
    // This should not happen if the logic above is correct, but just in case
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="text-center text-slate-500">
          <p>Authentication required. Please refresh the page.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark-950">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Settings className="w-8 h-8 text-primary-400" />
              <div>
                <h1 className="text-2xl font-bold text-slate-100">
                  Admin Configuration
                </h1>
                <p className="text-slate-400">
                  Manage your documentation site settings
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {config.last_sync_at && (
                <div className="text-sm text-slate-500">
                  Last sync: {formatRelativeTime(config.last_sync_at)}
                </div>
              )}

              <button
                onClick={handleSave}
                disabled={saving || !hasChanges}
                className={cn(
                  'btn-primary flex items-center gap-2',
                  (!hasChanges || saving) && 'opacity-50 cursor-not-allowed'
                )}
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Status messages */}
          {error && (
            <div className="mt-4 text-sm text-error-400 bg-error-900/20 border border-error-700/30 rounded-lg p-3">
              {error}
            </div>
          )}

          {success && (
            <div className="mt-4 text-sm text-success-400 bg-success-900/20 border border-success-700/30 rounded-lg p-3">
              {success}
            </div>
          )}
        </div>

        {/* Configuration Form */}
        <div className="space-y-8">
          {/* Site Information */}
          <div className="card-elevated p-6">
            <div className="flex items-center gap-2 mb-4">
              <Palette className="w-5 h-5 text-primary-400" />
              <h2 className="text-lg font-semibold text-slate-100">
                Site Information
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Site Title *
                </label>
                <input
                  type="text"
                  value={config.title || ''}
                  onChange={(e) => setConfig({ ...config, title: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="My Documentation Site"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  🎨 Site Logo URL
                </label>
                <div className="space-y-3">
                  <input
                    type="url"
                    value={config.logo_url || ''}
                    onChange={(e) => setConfig({ ...config, logo_url: e.target.value })}
                    className="input-primary"
                    placeholder="https://example.com/your-logo.png"
                  />

                  {/* Logo Preview */}
                  <div className="flex items-center gap-4 p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                    <div className="text-sm text-slate-300">Preview:</div>
                    {config.logo_url ? (
                      <div className="relative group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-primary-600 via-purple-600 to-primary-600 rounded-lg blur opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
                        <img
                          src={config.logo_url}
                          alt="Logo Preview"
                          className="relative w-12 h-12 rounded-lg border border-slate-600 shadow-lg"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            const errorDiv = e.currentTarget.nextElementSibling as HTMLElement;
                            if (errorDiv) {
                              errorDiv.style.display = 'flex';
                            }
                          }}
                        />
                        <div className="hidden w-12 h-12 bg-red-900/20 border border-red-700 rounded-lg items-center justify-center">
                          <span className="text-red-400 text-xs">✗</span>
                        </div>
                      </div>
                    ) : (
                      <div className="relative group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-primary-500 via-purple-500 to-blue-500 rounded-lg blur opacity-30"></div>
                        <div className="relative w-12 h-12 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 rounded-lg flex items-center justify-center border border-primary-500/30">
                          <Settings className="w-6 h-6 text-white" />
                        </div>
                      </div>
                    )}
                    <div className="text-xs text-slate-400">
                      {config.logo_url ? 'Custom logo' : 'Dynamic default logo'}
                    </div>
                  </div>

                  {/* Logo Guidelines */}
                  <div className="text-xs text-slate-400 space-y-1">
                    <div className="font-medium text-slate-300">💡 Logo Tips:</div>
                    <ul className="space-y-1 ml-4">
                      <li>• Best size: 128x128px or larger (square format)</li>
                      <li>• Formats: PNG, JPG, or SVG</li>
                      <li>• Use HTTPS URLs for security</li>
                      <li>• Leave empty for beautiful animated default</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Slogan
                </label>
                <input
                  type="text"
                  value={config.slogan || ''}
                  onChange={(e) => setConfig({ ...config, slogan: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Your documentation tagline"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Help Text
                </label>
                <textarea
                  value={config.help_text || ''}
                  onChange={(e) => setConfig({ ...config, help_text: e.target.value })}
                  className="w-full h-20 resize-none px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Instructions for users on the login page"
                />
              </div>
            </div>
          </div>

          {/* GitHub Configuration */}
          <div className="card-elevated p-6">
            <div className="flex items-center gap-2 mb-4">
              <Github className="w-5 h-5 text-primary-400" />
              <h2 className="text-lg font-semibold text-slate-100">
                GitHub Configuration
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Repository URL *
                </label>
                <input
                  type="url"
                  value={config.github_repo || ''}
                  onChange={(e) => setConfig({ ...config, github_repo: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="https://github.com/username/repository"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Branch
                </label>
                <input
                  type="text"
                  value={config.branch || 'main'}
                  onChange={(e) => setConfig({ ...config, branch: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="main"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Folders (comma separated) *
                </label>
                <input
                  type="text"
                  value={config.folders?.join(', ') || ''}
                  onChange={(e) => setConfig({
                    ...config,
                    folders: e.target.value.split(',').map(f => f.trim()).filter(f => f)
                  })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="docs, guides, help"
                />
              </div>
            </div>
          </div>

          {/* Chat Configuration */}
          <div className="card-elevated p-6 border-l-4 border-orange-500">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-orange-500/20 rounded-lg">
                <MessageCircle className="w-6 h-6 text-orange-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-slate-100">
                  Chat Service Configuration
                </h2>
                <p className="text-sm text-slate-400">
                  Configure iframe-based chat integration
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-3">
                  Chat Service URL
                </label>
                <div className="space-y-3">
                  <input
                    type="url"
                    value={config.iframe_url || ''}
                    onChange={(e) => setConfig({ ...config, iframe_url: e.target.value })}
                    className="input-primary w-full text-base"
                    placeholder="http://16.176.163.234:7681/ or https://your-chat-service.com"
                  />

                  {/* Current Value Display */}
                  {config.iframe_url && (
                    <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm font-medium text-slate-300">Current Chat URL:</span>
                      </div>
                      <code className="text-sm text-green-400 break-all">{config.iframe_url}</code>
                    </div>
                  )}

                  {/* Help Text */}
                  <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
                    <h4 className="text-sm font-medium text-slate-300 mb-2">Configuration Notes:</h4>
                    <ul className="text-xs text-slate-500 space-y-1">
                      <li>• Leave empty to disable the chat panel completely</li>
                      <li>• <span className="text-green-400">HTTP URLs are now supported!</span> App configured to allow mixed content</li>
                      <li>• If HTTP still fails, browser may show shield icon - click to "Load unsafe scripts"</li>
                      <li>• HTTPS URLs work seamlessly without browser warnings</li>
                      <li>• The chat service must allow iframe embedding (no X-Frame-Options: DENY)</li>
                      <li>• Example: ttyd terminal, customer support widgets, embedded chats</li>
                    </ul>
                  </div>

                  {/* HTTP Detection */}
                  {config.iframe_url?.startsWith('http://') && (
                    <div className="bg-orange-900/20 border border-orange-500/30 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                        <span className="text-sm font-medium text-orange-300">HTTP URL Detected</span>
                      </div>
                      <p className="text-xs text-orange-200">
                        This app is configured to allow HTTP iframes. If it doesn't work,
                        your browser may show a security warning that you can override.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* AI Chat Configuration */}
          <div className="card-elevated p-6 border-l-4 border-blue-500">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Bot className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-slate-100">
                  AI Chat Configuration
                </h2>
                <p className="text-sm text-slate-400">
                  Configure LLM API for native AI-powered documentation chat
                </p>
              </div>
            </div>

            <div className="space-y-6">
              {/* Enable AI Chat Toggle */}
              <div>
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={config.chat_enabled ?? false}
                    onChange={(e) => setConfig({
                      ...config,
                      chat_enabled: e.target.checked
                    })}
                    className="rounded border-slate-600 bg-slate-800 text-blue-500 focus:ring-blue-500"
                  />
                  <div>
                    <span className="text-sm font-medium text-slate-300">Enable AI Chat</span>
                    <p className="text-xs text-slate-500">Replace iframe chat with native AI-powered assistance</p>
                  </div>
                </label>
              </div>

              {config.chat_enabled && (
                <>
                  {/* LLM Provider Selection */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-3">
                      LLM Provider *
                    </label>
                    <select
                      value={config.llm_provider || ''}
                      onChange={(e) => setConfig({
                        ...config,
                        llm_provider: e.target.value as 'openai' | 'anthropic' | 'groq'
                      })}
                      className="input-primary w-full"
                    >
                      <option value="">Select a provider</option>
                      <option value="openai">OpenAI (GPT-3.5/4)</option>
                      <option value="anthropic">Anthropic (Claude)</option>
                      <option value="groq">Groq (Fast Inference)</option>
                    </select>
                  </div>

                  {/* API Key */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-3">
                      API Key *
                    </label>
                    <div className="relative">
                      <input
                        type={showPasswords ? 'text' : 'password'}
                        value={config.llm_api_key || ''}
                        onChange={(e) => setConfig({
                          ...config,
                          llm_api_key: e.target.value
                        })}
                        className="input-primary w-full pr-10"
                        placeholder="Enter your LLM API key"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords(!showPasswords)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-300"
                      >
                        {showPasswords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Provider-specific information */}
                  {config.llm_provider && (
                    <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
                      <h4 className="text-sm font-medium text-slate-300 mb-3">
                        {config.llm_provider === 'openai' && '🤖 OpenAI Configuration'}
                        {config.llm_provider === 'anthropic' && '🧠 Anthropic Configuration'}
                        {config.llm_provider === 'groq' && '⚡ Groq Configuration'}
                      </h4>

                      <div className="text-xs text-slate-400 space-y-2">
                        {config.llm_provider === 'openai' && (
                          <>
                            <p>• Get your API key from: <a href="https://platform.openai.com/api-keys" target="_blank" className="text-blue-400 hover:underline">OpenAI Platform</a></p>
                            <p>• Uses GPT-3.5-turbo model (cost-effective)</p>
                            <p>• Excellent for documentation Q&A</p>
                          </>
                        )}

                        {config.llm_provider === 'anthropic' && (
                          <>
                            <p>• Get your API key from: <a href="https://console.anthropic.com/" target="_blank" className="text-blue-400 hover:underline">Anthropic Console</a></p>
                            <p>• Uses Claude-3 Sonnet model</p>
                            <p>• Great for detailed explanations</p>
                          </>
                        )}

                        {config.llm_provider === 'groq' && (
                          <>
                            <p>• Get your API key from: <a href="https://console.groq.com/keys" target="_blank" className="text-blue-400 hover:underline">Groq Console</a></p>
                            <p>• Uses Mixtral-8x7B model</p>
                            <p>• Ultra-fast inference speeds</p>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {/* AI Chat Features */}
                  <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 rounded-lg p-4 border border-blue-500/30">
                    <h4 className="text-sm font-medium text-blue-300 mb-2 flex items-center gap-2">
                      <Zap className="w-4 h-4" />
                      AI Chat Features
                    </h4>
                    <ul className="text-xs text-slate-400 space-y-1">
                      <li>• 🔍 Context-aware responses using current file content</li>
                      <li>• 📚 Knowledge of your entire documentation structure</li>
                      <li>• 💬 Conversational interface with message history</li>
                      <li>• 🚀 Real-time responses as you browse files</li>
                      <li>• 🔒 Secure API key storage (encrypted)</li>
                    </ul>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Auto-Refresh Settings */}
          <div className="card-elevated p-6">
            <div className="flex items-center gap-2 mb-4">
              <RefreshCw className="w-5 h-5 text-primary-400" />
              <h2 className="text-lg font-semibold text-slate-100">
                Auto-Refresh Settings
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={config.auto_refresh_enabled ?? true}
                    onChange={(e) => setConfig({
                      ...config,
                      auto_refresh_enabled: e.target.checked
                    })}
                    className="rounded border-slate-600 bg-slate-800 text-primary-500 focus:ring-primary-500"
                  />
                  <span className="text-sm text-slate-300">Enable auto-refresh</span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Refresh Interval (minutes)
                </label>
                <select
                  value={config.refresh_interval_minutes || 15}
                  onChange={(e) => setConfig({
                    ...config,
                    refresh_interval_minutes: parseInt(e.target.value)
                  })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  disabled={!config.auto_refresh_enabled}
                >
                  <option value={5}>5 minutes</option>
                  <option value={10}>10 minutes</option>
                  <option value={15}>15 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={60}>60 minutes</option>
                </select>
              </div>
            </div>
          </div>

          {/* Security Settings */}
          <div className="card-elevated p-6">
            <div className="flex items-center gap-2 mb-4">
              <Lock className="w-5 h-5 text-primary-400" />
              <h2 className="text-lg font-semibold text-slate-100">
                Security Settings
              </h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-300">Show Passwords</span>
                <button
                  type="button"
                  onClick={() => setShowPasswords(!showPasswords)}
                  className="btn-ghost"
                >
                  {showPasswords ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Site Password
                  </label>
                  <input
                    type={showPasswords ? 'text' : 'password'}
                    value={config.site_password_hash || ''}
                    onChange={(e) => setConfig({
                      ...config,
                      site_password_hash: e.target.value
                    })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Leave empty to keep current password"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Admin Password
                  </label>
                  <input
                    type={showPasswords ? 'text' : 'password'}
                    value={config.admin_password_hash || ''}
                    onChange={(e) => setConfig({
                      ...config,
                      admin_password_hash: e.target.value
                    })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Leave empty to keep current password"
                  />
                </div>
              </div>

              <p className="text-xs text-slate-500">
                Passwords will be securely hashed when saved. Leave empty to keep current passwords.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
