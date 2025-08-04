import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'
// Workaround: Try multiple possible environment variable names
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 
                          process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY ||
                          process.env._AMPLIFY_SUPABASE_SERVICE_ROLE_KEY ||
                          'placeholder-service-key'

// Client for browser usage
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Admin client for server-side operations
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

// Database types
export interface SiteConfig {
  id: string
  title: string
  logo_url?: string
  slogan?: string
  help_text?: string
  github_repo: string
  branch: string
  folders: string[]
  iframe_url?: string
  auto_refresh_enabled: boolean
  refresh_interval_minutes: number
  last_sync_at?: string
  site_password_hash: string
  admin_password_hash: string
  created_at: string
  updated_at: string
}

// Site configuration operations
export const siteConfigOperations = {
  // Get site configuration
  async getConfig(): Promise<SiteConfig | null> {
    try {
      // If Supabase is not configured (using placeholder URL), return mock config
      if (supabaseUrl === 'https://placeholder.supabase.co') {
        return {
          id: 'demo-config',
          title: 'Demo Documentation Site',
          slogan: 'Your documentation, beautifully organized',
          help_text: 'Welcome to your documentation site! Configure this in the admin panel.',
          github_repo: 'your-username/your-repo',
          branch: 'main',
          folders: ['docs', 'guides'],
          iframe_url: 'https://example.com/chat',
          auto_refresh_enabled: true,
          refresh_interval_minutes: 15,
          last_sync_at: new Date().toISOString(),
          site_password_hash: '$2a$10$.Z5wZpZ4xbTVjjqT39AUKOtqGTO2nLD0E3t2NU8atQUmV/KFU6LlC', // TempSite2024!
          admin_password_hash: '$2a$10$wwQvHyDwBeQW0rQMFttmLuJk8bshJai6tE0nRo4w71BjLYJQlmeAu', // TempAdmin2024!
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      }

      const { data, error } = await supabase
        .from('site_configs')
        .select('*')
        .single()

      if (error) {
        console.error('Error fetching site config:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error in getConfig:', error)
      return null
    }
  },

  // Update site configuration (admin only)
  async updateConfig(config: Partial<SiteConfig>): Promise<boolean> {
    try {
      // If Supabase is not configured (using placeholder URL), cannot update
      if (supabaseUrl === 'https://placeholder.supabase.co') {
        console.warn('Cannot update configuration: Supabase not configured. Using mock configuration.')
        return false
      }

      // Get current config to ensure we have a valid ID
      const currentConfig = await this.getConfig()
      
      if (!currentConfig) {
        // No config exists, create a new one
        console.log('No configuration found, creating initial configuration...')
        console.log('Config data received:', config)
        
        const newConfig = {
          title: config.title || 'Documentation Site',
          github_repo: config.github_repo || 'your-username/your-repo',
          branch: config.branch || 'main',
          folders: config.folders || ['docs'],
          auto_refresh_enabled: config.auto_refresh_enabled ?? true,
          refresh_interval_minutes: config.refresh_interval_minutes || 15,
          site_password_hash: config.site_password_hash || '$2a$10$.Z5wZpZ4xbTVjjqT39AUKOtqGTO2nLD0E3t2NU8atQUmV/KFU6LlC',
          admin_password_hash: config.admin_password_hash || '$2a$10$wwQvHyDwBeQW0rQMFttmLuJk8bshJai6tE0nRo4w71BjLYJQlmeAu',
          ...config
        }
        
        console.log('Creating new config:', newConfig)
        const createdConfig = await this.createConfig(newConfig)
        console.log('Created config result:', createdConfig)
        return !!createdConfig
      }

      // Update existing config
      const { error } = await supabaseAdmin
        .from('site_configs')
        .update({
          ...config,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentConfig.id)

      if (error) {
        console.error('Error updating site config:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error in updateConfig:', error)
      return false
    }
  },

  // Create initial site configuration
  async createConfig(config: Omit<SiteConfig, 'id' | 'created_at' | 'updated_at'>): Promise<SiteConfig | null> {
    try {
      console.log('Attempting to create config in Supabase:', config)
      
      const { data, error } = await supabaseAdmin
        .from('site_configs')
        .insert([config])
        .select()
        .single()

      if (error) {
        console.error('Supabase error creating site config:', error)
        console.error('Error details:', JSON.stringify(error, null, 2))
        return null
      }

      console.log('Successfully created config:', data)
      return data
    } catch (error) {
      console.error('Exception in createConfig:', error)
      return null
    }
  },

  // Update last sync timestamp
  async updateLastSync(): Promise<boolean> {
    try {
      // If Supabase is not configured (using placeholder URL), cannot update
      if (supabaseUrl === 'https://placeholder.supabase.co') {
        console.warn('Cannot update last sync: Supabase not configured. Using mock configuration.')
        return false
      }

      // Get the first config to update (since we expect only one)
      const currentConfig = await this.getConfig()
      if (!currentConfig?.id) {
        console.error('No site configuration found to update sync time')
        return false
      }

      const { error } = await supabaseAdmin
        .from('site_configs')
        .update({
          last_sync_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', currentConfig.id)

      if (error) {
        console.error('Error updating last sync:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error in updateLastSync:', error)
      return false
    }
  }
}

// Health check for Supabase connection
export async function checkSupabaseHealth(): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('site_configs')
      .select('id')
      .limit(1)

    return !error
  } catch {
    return false
  }
}