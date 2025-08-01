import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { siteConfigOperations } from '@/lib/supabase'
import bcrypt from 'bcryptjs'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

function isAuthenticated(): boolean {
  try {
    const cookieStore = cookies()
    const adminSession = cookieStore.get('admin-session')
    
    if (!adminSession) {
      return false
    }

    // For now, just check if session exists and is valid format
    // In production, you'd validate the session token properly
    return adminSession.value && adminSession.value.length > 10
  } catch (error) {
    console.error('Auth check error:', error)
    return false
  }
}

export async function GET(request: NextRequest) {
  try {
    if (!isAuthenticated()) {
      return NextResponse.json(
        { message: 'Unauthorized' },
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
    if (!isAuthenticated()) {
      return NextResponse.json(
        { message: 'Unauthorized' },
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
    const success = await siteConfigOperations.updateConfig(updates)
    
    if (!success) {
      return NextResponse.json(
        { message: 'Failed to update configuration' },
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