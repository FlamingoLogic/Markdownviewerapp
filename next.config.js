/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configure output for Amplify deployment
  output: 'standalone',
  trailingSlash: false,
  
  // Optimize for production builds
  compress: true,
  poweredByHeader: false,
  
  async headers() {
    return [
      {
        // Apply headers to all routes
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:; frame-src 'self' http: https:; frame-ancestors 'self';"
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          }
        ],
      },
    ]
  },
  
  // Environment variable configuration for Amplify
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  
  // Experimental features for better Amplify compatibility
  experimental: {
    serverComponentsExternalPackages: ['@supabase/supabase-js'],
  },
}

module.exports = nextConfig