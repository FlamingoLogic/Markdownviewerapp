'use client'

import React, { useState } from 'react'
import { 
  Lock, 
  Shield, 
  User, 
  Settings,
  Eye,
  EyeOff,
  ArrowRight,
  FileText,
  Github,
  Zap,
  Loader2
} from 'lucide-react'
import { SiteConfig } from '@/lib/supabase'

interface AccessPortalProps {
  siteConfig: SiteConfig | null
  onLogin: (e: React.FormEvent, isAdmin?: boolean) => Promise<void>
  authState: {
    isAuthenticated: boolean
    isLoading: boolean
    error?: string
  }
  password: string
  setPassword: (password: string) => void
}

type AccessType = 'user' | 'admin'

export function AccessPortal({ siteConfig, onLogin, authState, password, setPassword }: AccessPortalProps) {
  const [selectedAccess, setSelectedAccess] = useState<AccessType>('user')
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onLogin(e, selectedAccess === 'admin')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 25px 25px, rgba(255,255,255,0.2) 2px, transparent 0)`,
          backgroundSize: '50px 50px'
        }} />
      </div>
      
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '4s' }} />
      </div>

      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-lg">
          {/* Header Section */}
          <div className="text-center mb-8">
            {/* Logo */}
            <div className="relative group mb-6">
              {siteConfig?.logo_url ? (
                <div className="relative inline-block">
                  <div className="absolute -inset-4 bg-gradient-to-r from-primary-500/20 via-purple-500/20 to-blue-500/20 rounded-full blur-xl opacity-60 group-hover:opacity-100 transition-opacity duration-700" />
                  <img
                    src={siteConfig.logo_url}
                    alt="Site Logo"
                    className="relative w-20 h-20 mx-auto rounded-2xl shadow-2xl object-contain group-hover:scale-105 transition-transform duration-500 border border-slate-700/50"
                  />
                </div>
              ) : (
                <div className="relative inline-block">
                  <div className="absolute -inset-4 bg-gradient-to-r from-primary-500/30 via-purple-500/30 to-blue-500/30 rounded-full blur-xl opacity-60 group-hover:opacity-100 transition-opacity duration-700" />
                  <div className="relative w-20 h-20 mx-auto bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 rounded-2xl flex items-center justify-center shadow-2xl border border-primary-500/30 group-hover:scale-105 transition-all duration-500">
                    <FileText className="w-10 h-10 text-white drop-shadow-lg" />
                  </div>
                </div>
              )}
            </div>

            {/* Title and Description */}
            <div className="space-y-2 mb-8">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-100 via-slate-200 to-slate-100 bg-clip-text text-transparent">
                {siteConfig?.title || 'Access Portal'}
              </h1>
              <p className="text-slate-400 text-lg">
                Choose your access type to continue
              </p>
              {siteConfig?.slogan && (
                <p className="text-slate-500 text-sm">
                  {siteConfig.slogan}
                </p>
              )}
            </div>
          </div>

          {/* Access Type Selection */}
          <div className="space-y-4 mb-8">
            {/* User Access Card */}
            <button
              type="button"
              onClick={() => setSelectedAccess('user')}
              className={`w-full p-6 rounded-2xl border-2 transition-all duration-300 text-left group ${
                selectedAccess === 'user'
                  ? 'border-primary-500 bg-primary-500/10 shadow-lg shadow-primary-500/20'
                  : 'border-slate-700/50 bg-slate-900/50 hover:border-slate-600 hover:bg-slate-800/50'
              }`}
            >
              <div className="flex items-center space-x-4">
                <div className={`p-3 rounded-xl transition-colors ${
                  selectedAccess === 'user' 
                    ? 'bg-primary-500 text-white' 
                    : 'bg-slate-700 text-slate-300 group-hover:bg-slate-600'
                }`}>
                  <User className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className={`text-lg font-semibold transition-colors ${
                    selectedAccess === 'user' ? 'text-white' : 'text-slate-200 group-hover:text-white'
                  }`}>
                    User Access
                  </h3>
                  <p className={`text-sm transition-colors ${
                    selectedAccess === 'user' ? 'text-primary-100' : 'text-slate-400 group-hover:text-slate-300'
                  }`}>
                    Read documents & browse content
                  </p>
                </div>
                <div className={`transition-all duration-300 ${
                  selectedAccess === 'user' ? 'text-primary-300 scale-110' : 'text-slate-500 group-hover:text-slate-400'
                }`}>
                  <ArrowRight className="w-5 h-5" />
                </div>
              </div>
            </button>

            {/* Admin Access Card */}
            <button
              type="button"
              onClick={() => setSelectedAccess('admin')}
              className={`w-full p-6 rounded-2xl border-2 transition-all duration-300 text-left group ${
                selectedAccess === 'admin'
                  ? 'border-orange-500 bg-orange-500/10 shadow-lg shadow-orange-500/20'
                  : 'border-slate-700/50 bg-slate-900/50 hover:border-slate-600 hover:bg-slate-800/50'
              }`}
            >
              <div className="flex items-center space-x-4">
                <div className={`p-3 rounded-xl transition-colors ${
                  selectedAccess === 'admin' 
                    ? 'bg-orange-500 text-white' 
                    : 'bg-slate-700 text-slate-300 group-hover:bg-slate-600'
                }`}>
                  <Shield className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className={`text-lg font-semibold transition-colors ${
                    selectedAccess === 'admin' ? 'text-white' : 'text-slate-200 group-hover:text-white'
                  }`}>
                    Admin Access
                  </h3>
                  <p className={`text-sm transition-colors ${
                    selectedAccess === 'admin' ? 'text-orange-100' : 'text-slate-400 group-hover:text-slate-300'
                  }`}>
                    Manage configuration & settings
                  </p>
                </div>
                <div className={`transition-all duration-300 ${
                  selectedAccess === 'admin' ? 'text-orange-300 scale-110' : 'text-slate-500 group-hover:text-slate-400'
                }`}>
                  <Settings className="w-5 h-5" />
                </div>
              </div>
            </button>
          </div>

          {/* Login Form */}
          <div className="bg-slate-900/70 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-8 shadow-2xl">
            <div className="flex items-center space-x-3 mb-6">
              <div className={`p-2 rounded-lg ${
                selectedAccess === 'user' ? 'bg-primary-500/20 text-primary-400' : 'bg-orange-500/20 text-orange-400'
              }`}>
                <Lock className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-semibold text-white">
                {selectedAccess === 'user' ? 'Site Password' : 'Admin Password'}
              </h2>
            </div>

            {siteConfig?.help_text && (
              <div className="mb-6 p-4 bg-slate-800/50 rounded-xl border border-slate-700/30">
                <p className="text-sm text-slate-300">{siteConfig.help_text}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-slate-300">
                  Enter {selectedAccess === 'user' ? 'site access' : 'admin'} password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={`Enter ${selectedAccess} password`}
                    className="w-full px-4 py-3 pr-12 bg-slate-800/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                    disabled={authState.isLoading}
                    autoFocus
                    autoComplete="new-password"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck="false"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-slate-400 hover:text-slate-300 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <p className="text-xs text-slate-500">
                  Contact your administrator for the {selectedAccess === 'user' ? 'site' : 'admin'} password
                </p>
              </div>

              {authState.error && (
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                  <p className="text-sm text-red-400">{authState.error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={authState.isLoading || !password.trim()}
                className={`w-full py-4 px-6 rounded-xl font-semibold text-white transition-all duration-200 flex items-center justify-center space-x-2 ${
                  selectedAccess === 'user'
                    ? 'bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 focus:ring-primary-500 disabled:from-primary-800 disabled:to-primary-900'
                    : 'bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 focus:ring-orange-500 disabled:from-orange-800 disabled:to-orange-900'
                } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg`}
              >
                {authState.isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Authenticating...</span>
                  </>
                ) : (
                  <>
                    <span>Access {selectedAccess === 'user' ? 'Documentation' : 'Admin Panel'}</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Features Section */}
          <div className="mt-8 bg-slate-900/30 backdrop-blur-sm rounded-2xl border border-slate-700/30 p-6">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-2 h-2 bg-primary-400 rounded-full" />
              <h3 className="text-lg font-semibold text-white">
                {siteConfig?.title || 'NDIS Knowledge System'}
              </h3>
            </div>
            <p className="text-slate-400 text-sm mb-4">
              Access comprehensive documentation, guides, and chat support.
            </p>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-3 text-sm">
                <div className="w-8 h-8 bg-slate-800/50 rounded-lg flex items-center justify-center">
                  <FileText className="w-4 h-4 text-slate-400" />
                </div>
                <span className="text-slate-300">View published documents</span>
              </div>
              <div className="flex items-center space-x-3 text-sm">
                <div className="w-8 h-8 bg-slate-800/50 rounded-lg flex items-center justify-center">
                  <Github className="w-4 h-4 text-slate-400" />
                </div>
                <span className="text-slate-300">Search knowledge base</span>
              </div>
              <div className="flex items-center space-x-3 text-sm">
                <div className="w-8 h-8 bg-slate-800/50 rounded-lg flex items-center justify-center">
                  <Zap className="w-4 h-4 text-slate-400" />
                </div>
                <span className="text-slate-300">AI chat assistance</span>
              </div>
              <div className="flex items-center space-x-3 text-sm">
                <div className="w-8 h-8 bg-slate-800/50 rounded-lg flex items-center justify-center">
                  <Settings className="w-4 h-4 text-slate-400" />
                </div>
                <span className="text-slate-300">Browse categories</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-xs text-slate-500">
              Powered by{' '}
              <a 
                href="https://github.com/FlamingoLogic/Markdownviewerapp"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-400 hover:text-primary-300 transition-colors"
              >
                Markdown Viewer App
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
