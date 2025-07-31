import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import '../styles/globals.css'
import { ErrorBoundary } from '@/components/ErrorBoundary'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Markdown Documentation Viewer',
  description: 'Modern read-only documentation viewer with GitHub integration',
  keywords: ['documentation', 'markdown', 'github', 'viewer'],
  authors: [{ name: 'FlamingoLogic' }],
  creator: 'FlamingoLogic',
  publisher: 'FlamingoLogic',
  robots: 'index, follow',
  viewport: 'width=device-width, initial-scale=1',
  themeColor: '#0f172a',
  colorScheme: 'dark',
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    type: 'website',
    title: 'Markdown Documentation Viewer',
    description: 'Modern read-only documentation viewer with GitHub integration',
    siteName: 'Markdown Documentation Viewer',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Markdown Documentation Viewer',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Markdown Documentation Viewer',
    description: 'Modern read-only documentation viewer with GitHub integration',
    images: ['/og-image.png'],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      </head>
      <body className={`${inter.className} bg-dark-950 text-slate-100 antialiased`}>
        <ErrorBoundary>
          <div className="min-h-screen">
            {children}
          </div>
        </ErrorBoundary>
        
        {/* Global scripts */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Simple theme detection and setup
              if (typeof window !== 'undefined') {
                // Ensure dark mode is active
                document.documentElement.classList.add('dark');
                
                // Performance mark for analytics
                if (window.performance && window.performance.mark) {
                  window.performance.mark('app-start');
                }
              }
            `,
          }}
        />
      </body>
    </html>
  )
}