// Error tracking and logging utilities

export interface ErrorContext {
  userId?: string
  sessionId?: string
  userAgent?: string
  url?: string
  timestamp?: string
  additionalData?: Record<string, any>
}

export interface ErrorLog {
  id: string
  message: string
  stack?: string
  level: 'error' | 'warning' | 'info'
  context: ErrorContext
  timestamp: string
}

// Error logger class
export class ErrorLogger {
  private static instance: ErrorLogger
  private logs: ErrorLog[] = []
  private maxLogs = 100 // Keep last 100 logs in memory

  static getInstance(): ErrorLogger {
    if (!ErrorLogger.instance) {
      ErrorLogger.instance = new ErrorLogger()
    }
    return ErrorLogger.instance
  }

  // Log an error
  async logError(
    error: Error | string,
    level: 'error' | 'warning' | 'info' = 'error',
    context: ErrorContext = {}
  ): Promise<void> {
    const errorLog: ErrorLog = {
      id: this.generateId(),
      message: typeof error === 'string' ? error : error.message,
      stack: typeof error === 'object' ? error.stack : undefined,
      level,
      context: {
        timestamp: new Date().toISOString(),
        userAgent: typeof window !== 'undefined' ? navigator.userAgent : undefined,
        url: typeof window !== 'undefined' ? window.location.href : undefined,
        ...context,
      },
      timestamp: new Date().toISOString(),
    }

    // Add to in-memory logs
    this.logs.push(errorLog)
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs)
    }

    // Console log in development
    if (process.env.NODE_ENV === 'development') {
      this.consoleLog(errorLog)
    }

    // Send to external service in production
    if (process.env.NODE_ENV === 'production') {
      await this.sendToExternalService(errorLog)
    }
  }

  // Console logging for development
  private consoleLog(errorLog: ErrorLog): void {
    const { level, message, stack, context } = errorLog

    console.group(`🚨 ${level.toUpperCase()}: ${message}`)
    
    if (stack) {
      console.error('Stack trace:', stack)
    }

    if (Object.keys(context).length > 0) {
      console.info('Context:', context)
    }

    console.groupEnd()
  }

  // Send error to external service (production)
  private async sendToExternalService(errorLog: ErrorLog): Promise<void> {
    try {
      // Send to your logging endpoint
      await fetch('/api/log-error', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(errorLog),
      })
    } catch (sendError) {
      // Silently fail - don't break the app if logging fails
      console.error('Failed to send error log:', sendError)
    }
  }

  // Generate unique ID for error logs
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  // Get recent logs (for admin panel)
  getRecentLogs(count: number = 20): ErrorLog[] {
    return this.logs.slice(-count).reverse()
  }

  // Clear logs
  clearLogs(): void {
    this.logs = []
  }

  // Get error statistics
  getErrorStats(): {
    total: number
    byLevel: Record<string, number>
    recent: number
  } {
    const now = Date.now()
    const oneHourAgo = now - (60 * 60 * 1000)

    const byLevel = this.logs.reduce((acc, log) => {
      acc[log.level] = (acc[log.level] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const recent = this.logs.filter(log => 
      new Date(log.timestamp).getTime() > oneHourAgo
    ).length

    return {
      total: this.logs.length,
      byLevel,
      recent,
    }
  }
}

// Global error handler setup
export function setupGlobalErrorHandling(): void {
  const logger = ErrorLogger.getInstance()

  // Catch unhandled promise rejections
  if (typeof window !== 'undefined') {
    window.addEventListener('unhandledrejection', (event) => {
      logger.logError(
        new Error(`Unhandled Promise Rejection: ${event.reason}`),
        'error',
        { type: 'unhandledrejection' }
      )
    })

    // Catch global errors
    window.addEventListener('error', (event) => {
      logger.logError(
        new Error(`Global Error: ${event.message}`),
        'error',
        {
          type: 'globalerror',
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        }
      )
    })
  }

  // Server-side error handling
  if (typeof process !== 'undefined') {
    process.on('unhandledRejection', (reason, promise) => {
      logger.logError(
        new Error(`Unhandled Rejection at: ${promise}, reason: ${reason}`),
        'error',
        { type: 'unhandledrejection' }
      )
    })

    process.on('uncaughtException', (error) => {
      logger.logError(error, 'error', { type: 'uncaughtexception' })
    })
  }
}

// Convenience functions for different error types
export const errorLogger = ErrorLogger.getInstance()

export function logError(error: Error | string, context?: ErrorContext): void {
  errorLogger.logError(error, 'error', context)
}

export function logWarning(message: string, context?: ErrorContext): void {
  errorLogger.logError(message, 'warning', context)
}

export function logInfo(message: string, context?: ErrorContext): void {
  errorLogger.logError(message, 'info', context)
}

// API error handler for consistent error responses
export function handleApiError(error: any, context?: ErrorContext): {
  status: number
  message: string
  code: string
} {
  logError(error, context)

  // Default error response
  let status = 500
  let message = 'Internal server error'
  let code = 'INTERNAL_ERROR'

  // Handle specific error types
  if (error?.message?.includes('ENOTFOUND')) {
    status = 503
    message = 'Service temporarily unavailable'
    code = 'SERVICE_UNAVAILABLE'
  } else if (error?.message?.includes('timeout')) {
    status = 504
    message = 'Request timeout'
    code = 'TIMEOUT'
  } else if (error?.status === 401) {
    status = 401
    message = 'Unauthorized'
    code = 'UNAUTHORIZED'
  } else if (error?.status === 403) {
    status = 403
    message = 'Forbidden'
    code = 'FORBIDDEN'
  } else if (error?.status === 404) {
    status = 404
    message = 'Not found'
    code = 'NOT_FOUND'
  } else if (error?.status === 429) {
    status = 429
    message = 'Too many requests'
    code = 'RATE_LIMITED'
  }

  return { status, message, code }
}

// Performance monitoring
export class PerformanceMonitor {
  private static measurements: Map<string, number> = new Map()

  static startMeasurement(name: string): void {
    this.measurements.set(name, Date.now())
  }

  static endMeasurement(name: string): number {
    const startTime = this.measurements.get(name)
    if (!startTime) {
      logWarning(`Performance measurement '${name}' was not started`)
      return 0
    }

    const duration = Date.now() - startTime
    this.measurements.delete(name)

    // Log slow operations
    if (duration > 5000) { // 5 seconds
      logWarning(`Slow operation detected: ${name} took ${duration}ms`, {
        additionalData: { operation: name, duration },
      })
    }

    return duration
  }

  static measureAsync<T>(name: string, operation: () => Promise<T>): Promise<T> {
    return new Promise(async (resolve, reject) => {
      this.startMeasurement(name)
      
      try {
        const result = await operation()
        const duration = this.endMeasurement(name)
        
        logInfo(`Operation completed: ${name} (${duration}ms)`, {
          additionalData: { operation: name, duration },
        })
        
        resolve(result)
      } catch (error) {
        this.endMeasurement(name)
        logError(error as Error, {
          additionalData: { operation: name },
        })
        reject(error)
      }
    })
  }
}

// Health check utilities
export class HealthChecker {
  private static checks: Map<string, () => Promise<boolean>> = new Map()

  static addHealthCheck(name: string, check: () => Promise<boolean>): void {
    this.checks.set(name, check)
  }

  static async runHealthChecks(): Promise<{
    status: 'healthy' | 'unhealthy'
    checks: Record<string, { status: 'pass' | 'fail'; error?: string }>
  }> {
    const results: Record<string, { status: 'pass' | 'fail'; error?: string }> = {}
    let allHealthy = true

    for (const [name, check] of this.checks) {
      try {
        const isHealthy = await check()
        results[name] = { status: isHealthy ? 'pass' : 'fail' }
        if (!isHealthy) allHealthy = false
      } catch (error) {
        results[name] = { 
          status: 'fail', 
          error: error instanceof Error ? error.message : 'Unknown error' 
        }
        allHealthy = false
      }
    }

    return {
      status: allHealthy ? 'healthy' : 'unhealthy',
      checks: results,
    }
  }
}

// Initialize global error handling when this module is imported
if (typeof window !== 'undefined' || typeof process !== 'undefined') {
  setupGlobalErrorHandling()
}