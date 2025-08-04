'use client'

import React, { useState, useEffect, useRef } from 'react'
import { 
  MessageCircle, 
  ExternalLink, 
  RefreshCw, 
  AlertCircle,
  Maximize2,
  Minimize2,
  X,
  Loader2
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface ChatPanelProps {
  iframeUrl?: string
  className?: string
  onUrlChange?: (url: string) => void
}

export function ChatPanel({ iframeUrl, className = '', onUrlChange }: ChatPanelProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isMaximized, setIsMaximized] = useState(false)
  const [customUrl, setCustomUrl] = useState('')
  const [showUrlInput, setShowUrlInput] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Handle iframe load
  const handleIframeLoad = () => {
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current)
      loadingTimeoutRef.current = null
    }
    setLoading(false)
    setError(null)
  }

  // Handle iframe error
  const handleIframeError = () => {
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current)
      loadingTimeoutRef.current = null
    }
    setLoading(false)
    setError('Failed to load chat service')
  }

  // Refresh iframe
  const refreshIframe = () => {
    if (iframeRef.current && iframeUrl) {
      setLoading(true)
      setError(null)
      iframeRef.current.src = iframeUrl
    }
  }

  // Open in new window
  const openInNewWindow = () => {
    if (iframeUrl) {
      window.open(iframeUrl, '_blank', 'noopener,noreferrer')
    }
  }

  // Handle custom URL submission
  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (customUrl.trim() && onUrlChange) {
      onUrlChange(customUrl.trim())
      setShowUrlInput(false)
      setCustomUrl('')
    }
  }

  // Set loading state when URL changes with timeout
  useEffect(() => {
    if (iframeUrl) {
      setLoading(true)
      setError(null)
      
      // Clear any existing timeout
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current)
      }
      
      // Set a timeout to stop loading if iframe doesn't respond
      loadingTimeoutRef.current = setTimeout(() => {
        setLoading(false)
        setError('Chat service is taking too long to load. Try refreshing or check the URL.')
        loadingTimeoutRef.current = null
      }, 15000) // 15 second timeout
      
      return () => {
        if (loadingTimeoutRef.current) {
          clearTimeout(loadingTimeoutRef.current)
          loadingTimeoutRef.current = null
        }
      }
    }
  }, [iframeUrl])

  // Render empty state when no URL is configured
  if (!iframeUrl) {
    return (
      <div className={cn('h-full flex flex-col bg-slate-925', className)}>
        <div className="flex-shrink-0 p-4 border-b border-slate-800">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-200">Chat</h3>
            {onUrlChange && (
              <button
                onClick={() => setShowUrlInput(true)}
                className="btn-ghost text-xs"
              >
                Configure
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center text-slate-500">
            <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <h4 className="text-lg font-medium mb-2">No Chat Service</h4>
            <p className="text-sm mb-4">
              Configure a chat service URL to enable the chat panel
            </p>
            
            {onUrlChange && (
              <button
                onClick={() => setShowUrlInput(true)}
                className="btn-primary"
              >
                Add Chat Service
              </button>
            )}
          </div>
        </div>

        {/* URL Input Modal */}
        {showUrlInput && onUrlChange && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="card-elevated p-6 w-full max-w-md">
              <h4 className="text-lg font-semibold text-slate-100 mb-4">
                Configure Chat Service
              </h4>
              
              <form onSubmit={handleUrlSubmit}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Chat Service URL
                  </label>
                  <input
                    type="url"
                    value={customUrl}
                    onChange={(e) => setCustomUrl(e.target.value)}
                    placeholder="https://example.com/chat"
                    className="input-primary w-full"
                    required
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Enter the URL of your chat service or widget
                  </p>
                </div>
                
                <div className="flex gap-3">
                  <button type="submit" className="btn-primary flex-1">
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowUrlInput(false)
                      setCustomUrl('')
                    }}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={cn('h-full flex flex-col bg-slate-925', className)}>
      {/* Header */}
      <div className="flex-shrink-0 p-3 border-b border-slate-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-slate-400" />
            <h3 className="text-sm font-semibold text-slate-200">Chat</h3>
          </div>
          
          <div className="flex items-center gap-1">
            <button
              onClick={refreshIframe}
              disabled={loading}
              className="btn-ghost p-1"
              title="Refresh chat"
            >
              {loading ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <RefreshCw className="w-3 h-3" />
              )}
            </button>
            
            <button
              onClick={openInNewWindow}
              className="btn-ghost p-1"
              title="Open in new window"
            >
              <ExternalLink className="w-3 h-3" />
            </button>
            
            <button
              onClick={() => setIsMaximized(!isMaximized)}
              className="btn-ghost p-1"
              title={isMaximized ? "Minimize" : "Maximize"}
            >
              {isMaximized ? (
                <Minimize2 className="w-3 h-3" />
              ) : (
                <Maximize2 className="w-3 h-3" />
              )}
            </button>

            {onUrlChange && (
              <button
                onClick={() => setShowUrlInput(true)}
                className="btn-ghost p-1"
                title="Change URL"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Chat Content */}
      <div className="flex-1 relative overflow-hidden">
        {loading && (
          <div className="absolute inset-0 bg-slate-925 flex items-center justify-center z-10">
            <div className="flex items-center gap-2 text-slate-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Loading chat...</span>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 bg-slate-925 flex items-center justify-center z-10">
            <div className="text-center text-slate-500 p-4">
              <AlertCircle className="w-8 h-8 mx-auto mb-2 text-error-400" />
              <p className="text-sm mb-3">{error}</p>
              <button
                onClick={refreshIframe}
                className="btn-secondary text-xs"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {iframeUrl && (
          <iframe
            ref={iframeRef}
            src={iframeUrl}
            className={cn(
              'w-full h-full border-none',
              (loading || error) && 'opacity-0'
            )}
            onLoad={handleIframeLoad}
            onError={handleIframeError}
            title="Chat Service"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-top-navigation"
            allow="microphone; camera; autoplay; encrypted-media; fullscreen"
          />
        )}
      </div>

      {/* Maximized Overlay */}
      {isMaximized && (
        <div className="fixed inset-0 bg-black z-50 flex flex-col">
          <div className="flex-shrink-0 bg-slate-900 p-4 border-b border-slate-800">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-100">Chat</h3>
              <button
                onClick={() => setIsMaximized(false)}
                className="btn-ghost"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          <div className="flex-1">
            <iframe
              src={iframeUrl}
              className="w-full h-full border-none"
              title="Chat Service (Maximized)"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-top-navigation"
              allow="microphone; camera; autoplay; encrypted-media; fullscreen"
            />
          </div>
        </div>
      )}

      {/* URL Input Modal */}
      {showUrlInput && onUrlChange && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="card-elevated p-6 w-full max-w-md">
            <h4 className="text-lg font-semibold text-slate-100 mb-4">
              Update Chat Service URL
            </h4>
            
            <form onSubmit={handleUrlSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Chat Service URL
                </label>
                <input
                  type="url"
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  placeholder={iframeUrl}
                  className="input-primary w-full"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Leave empty to remove chat service
                </p>
              </div>
              
              <div className="flex gap-3">
                <button type="submit" className="btn-primary flex-1">
                  Update
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowUrlInput(false)
                    setCustomUrl('')
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

// Simple chat panel for when no iframe is needed
export function SimpleChatPanel({ className = '' }: { className?: string }) {
  return (
    <div className={cn('h-full flex flex-col bg-slate-925', className)}>
      <div className="flex-shrink-0 p-4 border-b border-slate-800">
        <h3 className="text-sm font-semibold text-slate-200">Chat</h3>
      </div>
      
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center text-slate-500">
          <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <h4 className="text-lg font-medium mb-2">Chat Unavailable</h4>
          <p className="text-sm">
            Chat service is not configured for this site
          </p>
        </div>
      </div>
    </div>
  )
}