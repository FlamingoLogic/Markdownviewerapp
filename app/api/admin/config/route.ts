import { NextRequest, NextResponse } from 'next/server'
import { siteConfigOperations } from '@/lib/supabase'
import bcrypt from 'bcryptjs'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

function isAuthenticated(request: NextRequest): boolean {
  try {
    // Check for admin secret in header or query param
    const adminSecret = request.headers.get('x-admin-secret') || 
                       request.nextUrl.searchParams.get('admin_secret') ||
                       request.headers.get('authorization')?.replace('Bearer ', '')
    
    // Use environment variable or fallback to our temp password
    const validSecret = process.env.ADMIN_SECRET || 'TempAdmin2024!'
    
    return adminSecret === validSecret
  } catch (error) {
    console.error('Auth check error:', error)
    return false
  }
}

export async function GET(request: NextRequest) {
  try {
    if (!isAuthenticated(request)) {
      return NextResponse.json(
        { message: 'Unauthorized - Admin secret required' },
        { status: 401 }
      )
    }

    const config = await siteConfigOperations.getConfig()
    if (!config) {
      return NextResponse.json(
        { message: 'Configuration not found' },
        { status: 404 }
      )
    }

    // Remove password hashes from response
    const { site_password_hash, admin_password_hash, ...safeConfig } = config
    
    return NextResponse.json(safeConfig, { status: 200 })
  } catch (error) {
    console.error('Get config error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    if (!isAuthenticated(request)) {
      return NextResponse.json(
        { message: 'Unauthorized - Admin secret required' },
        { status: 401 }
      )
    }

    const updates = await request.json()

    // Handle password updates if provided
    if (updates.site_password) {
      updates.site_password_hash = await bcrypt.hash(updates.site_password, 10)
      delete updates.site_password
    }

    if (updates.admin_password) {
      updates.admin_password_hash = await bcrypt.hash(updates.admin_password, 10)
      delete updates.admin_password
    }

    // Update configuration
    console.log('Attempting to update config with:', updates)
    const success = await siteConfigOperations.updateConfig(updates)
    
    if (!success) {
      console.error('Config update failed for updates:', updates)
      return NextResponse.json(
        { message: 'Failed to update configuration - check server logs' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { message: 'Configuration updated successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Update config error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}