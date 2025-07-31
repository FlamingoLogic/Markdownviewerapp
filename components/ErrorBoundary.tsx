'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import { logError } from '@/lib/error-tracking'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo })
    
    // Log error to our tracking system
    logError(error, {
      additionalData: {
        componentStack: errorInfo.componentStack,
        errorBoundary: true,
      },
    })
    
    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
  }

  handleGoHome = () => {
    window.location.href = '/'
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-dark-950 flex items-center justify-center p-4">
          <div className="max-w-md w-full">
            <div className="card-elevated p-8 text-center">
              <div className="mb-6">
                <div className="w-16 h-16 bg-error-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="w-8 h-8 text-error-400" />
                </div>
                <h1 className="text-xl font-semibold text-slate-100 mb-2">
                  Something went wrong
                </h1>
                <p className="text-slate-400 text-sm">
                  We encountered an unexpected error. This has been logged and we'll look into it.
                </p>
              </div>

              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="mb-6 p-4 bg-slate-900 rounded-lg text-left">
                  <h3 className="text-sm font-medium text-slate-300 mb-2">
                    Error Details (Development Only)
                  </h3>
                  <div className="text-xs text-slate-400 font-mono break-all">
                    <div className="mb-2">
                      <strong>Message:</strong> {this.state.error.message}
                    </div>
                    {this.state.error.stack && (
                      <div>
                        <strong>Stack:</strong>
                        <pre className="mt-1 whitespace-pre-wrap">
                          {this.state.error.stack}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-3 justify-center">
                <button
                  onClick={this.handleRetry}
                  className="btn-secondary flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Try Again
                </button>
                <button
                  onClick={this.handleGoHome}
                  className="btn-primary flex items-center gap-2"
                >
                  <Home className="w-4 h-4" />
                  Go Home
                </button>
              </div>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Higher-order component for wrapping components with error boundary
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary fallback={fallback}>
      <Component {...props} />
    </ErrorBoundary>
  )

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`
  
  return WrappedComponent
}

// Simple error fallback components
export const SimpleErrorFallback = ({ error, retry }: { error?: string; retry?: () => void }) => (
  <div className="p-4 bg-error-900/20 border border-error-700/30 rounded-lg">
    <div className="flex items-center gap-3">
      <AlertTriangle className="w-5 h-5 text-error-400 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-error-300">
          {error || 'An error occurred while loading this content'}
        </p>
      </div>
      {retry && (
        <button
          onClick={retry}
          className="btn-ghost text-xs py-1 px-2"
        >
          Retry
        </button>
      )}
    </div>
  </div>
)

export const InlineErrorFallback = ({ message }: { message?: string }) => (
  <div className="flex items-center gap-2 text-error-400 text-sm py-2">
    <AlertTriangle className="w-4 h-4" />
    <span>{message || 'Failed to load'}</span>
  </div>
)