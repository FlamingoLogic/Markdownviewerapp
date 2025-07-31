import bcrypt from 'bcryptjs'
import { NextApiRequest } from 'next'

// Session management
export interface Session {
  isAuthenticated: boolean
  isAdmin: boolean
  expiresAt: number
}

// Password hashing
export class PasswordService {
  private static readonly SALT_ROUNDS = 12

  static async hash(password: string): Promise<string> {
    try {
      return await bcrypt.hash(password, this.SALT_ROUNDS)
    } catch (error) {
      console.error('Error hashing password:', error)
      throw new Error('Failed to hash password')
    }
  }

  static async verify(password: string, hash: string): Promise<boolean> {
    try {
      return await bcrypt.compare(password, hash)
    } catch (error) {
      console.error('Error verifying password:', error)
      return false
    }
  }
}

// Rate limiting for authentication
export class AuthRateLimiter {
  private attempts: Map<string, { count: number; resetTime: number }> = new Map()
  private readonly maxAttempts = 5
  private readonly windowMs = 15 * 60 * 1000 // 15 minutes

  checkRateLimit(ip: string): { allowed: boolean; remainingAttempts: number; resetTime?: number } {
    const now = Date.now()
    const record = this.attempts.get(ip)

    if (!record || now > record.resetTime) {
      // First attempt or window expired
      this.attempts.set(ip, { count: 1, resetTime: now + this.windowMs })
      return { allowed: true, remainingAttempts: this.maxAttempts - 1 }
    }

    if (record.count >= this.maxAttempts) {
      // Rate limited
      return { 
        allowed: false, 
        remainingAttempts: 0,
        resetTime: record.resetTime
      }
    }

    // Increment attempts
    record.count++
    return { 
      allowed: true, 
      remainingAttempts: this.maxAttempts - record.count 
    }
  }

  reset(ip: string): void {
    this.attempts.delete(ip)
  }
}

// Global rate limiter instance
export const authRateLimiter = new AuthRateLimiter()

// Session utilities
export class SessionService {
  private static readonly SESSION_DURATION = 24 * 60 * 60 * 1000 // 24 hours

  static createSession(isAdmin: boolean = false): Session {
    return {
      isAuthenticated: true,
      isAdmin,
      expiresAt: Date.now() + this.SESSION_DURATION,
    }
  }

  static isValidSession(session: Session | null): boolean {
    if (!session) return false
    return session.isAuthenticated && Date.now() < session.expiresAt
  }

  static isAdminSession(session: Session | null): boolean {
    return this.isValidSession(session) && session?.isAdmin === true
  }

  static extendSession(session: Session): Session {
    return {
      ...session,
      expiresAt: Date.now() + this.SESSION_DURATION,
    }
  }
}

// Cookie utilities for secure session management
export class CookieService {
  private static readonly SITE_COOKIE = 'site_session'
  private static readonly ADMIN_COOKIE = 'admin_session'

  static getSiteCookieOptions() {
    return {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict' as const,
      maxAge: 24 * 60 * 60, // 24 hours in seconds
      path: '/',
    }
  }

  static getAdminCookieOptions() {
    return {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict' as const,
      maxAge: 24 * 60 * 60, // 24 hours in seconds
      path: '/admin',
    }
  }

  static createSiteSessionCookie(session: Session): { name: string; value: string; options: any } {
    return {
      name: this.SITE_COOKIE,
      value: Buffer.from(JSON.stringify(session)).toString('base64'),
      options: this.getSiteCookieOptions(),
    }
  }

  static createAdminSessionCookie(session: Session): { name: string; value: string; options: any } {
    return {
      name: this.ADMIN_COOKIE,
      value: Buffer.from(JSON.stringify(session)).toString('base64'),
      options: this.getAdminCookieOptions(),
    }
  }

  static parseSessionFromCookie(cookieValue: string | undefined): Session | null {
    if (!cookieValue) return null

    try {
      const sessionData = Buffer.from(cookieValue, 'base64').toString('utf-8')
      const session = JSON.parse(sessionData) as Session
      return SessionService.isValidSession(session) ? session : null
    } catch {
      return null
    }
  }

  static createLogoutCookie(cookieName: string): { name: string; value: string; options: any } {
    return {
      name: cookieName,
      value: '',
      options: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict' as const,
        maxAge: -1, // Expire immediately
        path: cookieName === this.ADMIN_COOKIE ? '/admin' : '/',
      },
    }
  }
}

// IP address extraction utility
export function getClientIP(req: NextApiRequest): string {
  const forwarded = req.headers['x-forwarded-for']
  const ip = forwarded 
    ? (Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0])
    : req.connection.remoteAddress || 'unknown'
  
  return ip.trim()
}

// Input validation
export class InputValidator {
  static validatePassword(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!password) {
      errors.push('Password is required')
      return { isValid: false, errors }
    }

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long')
    }

    if (password.length > 100) {
      errors.push('Password must be less than 100 characters')
    }

    // Check for common weak passwords
    const commonPasswords = ['password', '12345678', 'qwerty', 'admin', 'root']
    if (commonPasswords.includes(password.toLowerCase())) {
      errors.push('Password is too common')
    }

    return { isValid: errors.length === 0, errors }
  }

  static sanitizeString(input: string, maxLength: number = 255): string {
    if (!input) return ''
    
    return input
      .trim()
      .slice(0, maxLength)
      .replace(/[<>\"'&]/g, '') // Basic XSS prevention
  }

  static validateGitHubRepo(repo: string): { isValid: boolean; error?: string } {
    if (!repo) {
      return { isValid: false, error: 'Repository URL is required' }
    }

    const githubPattern = /^https:\/\/github\.com\/[^\/]+\/[^\/]+\/?$/
    if (!githubPattern.test(repo)) {
      return { isValid: false, error: 'Invalid GitHub repository URL format' }
    }

    return { isValid: true }
  }

  static validateFolders(folders: string[]): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!Array.isArray(folders)) {
      errors.push('Folders must be an array')
      return { isValid: false, errors }
    }

    if (folders.length === 0) {
      errors.push('At least one folder is required')
      return { isValid: false, errors }
    }

    for (const folder of folders) {
      if (!folder || typeof folder !== 'string') {
        errors.push('Invalid folder name')
        continue
      }

      if (folder.includes('..') || folder.includes('/') || folder.includes('\\')) {
        errors.push(`Invalid folder name: ${folder}`)
      }
    }

    return { isValid: errors.length === 0, errors }
  }
}

// Security headers utility
export function getSecurityHeaders(): Record<string, string> {
  return {
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'X-XSS-Protection': '1; mode=block',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  }
}

// Error responses
export const AuthErrors = {
  INVALID_CREDENTIALS: { message: 'Invalid password', code: 'INVALID_CREDENTIALS' },
  RATE_LIMITED: { message: 'Too many attempts. Please try again later.', code: 'RATE_LIMITED' },
  SESSION_EXPIRED: { message: 'Session expired. Please log in again.', code: 'SESSION_EXPIRED' },
  UNAUTHORIZED: { message: 'Unauthorized access', code: 'UNAUTHORIZED' },
  VALIDATION_ERROR: { message: 'Invalid input data', code: 'VALIDATION_ERROR' },
} as const