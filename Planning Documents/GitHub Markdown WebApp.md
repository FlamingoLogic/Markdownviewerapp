# 📘GitHub Markdown WebApp

**Read-Only Documentation Viewer with GitHub Integration**

---

## ✅ Summary

Build a **simple, read-only documentation viewer** that:

- **Displays** Markdown files from GitHub repo folders (read-only viewing)
    
- **No editing capabilities** - purely for content consumption
    
- **No writing to GitHub** - just fetches and displays existing content
    
- Offers a **password-protected admin panel** to configure repo, branding, and folders
    
- Supports a fully **custom landing page** for site branding
    
- Includes a **right-hand iframe panel** for chat integration
    
- Uses **Supabase database** for configuration storage only
    
- Simple password-based access control

### 🎯 **Simplified Scope Benefits:**
- **Faster Development:** 3-4 weeks instead of 8-12 weeks
- **Lower Complexity:** No content management, version control, or editing workflows  
- **Better Security:** Zero risk to source content in GitHub
- **Pure Focus:** Exceptional documentation viewing experience
- **Easy Maintenance:** Minimal moving parts, fewer things to break

---

## 🏠 Landing Page (Public Homepage)

When visiting the root (`/`), users see:

- Logo (upload or URL)
    
- Site title
    
- Slogan or description
    
- Help text (Markdown allowed)
    
- Password input
    

Once the password is entered, users access the main documentation viewer.

> All content on the landing page is managed via the `/admin` panel.

---

## 🔐 Access Flow

1. User opens the site → sees the landing page
    
2. Enters password
    
3. Gains access to Markdown content viewer (stored session)
    
4. Right-hand panel (iframe) is loaded
    

---

## ⚙️ Admin Panel (`/admin`)

Accessed via a separate admin password.

### Features:

- **GitHub Settings**
    
    - Repo (e.g. `user/docs`)
        
    - Branch (e.g. `main`)
        
    - Multiple folders (e.g. `docs`, `checklists`, `guides`)
        
- **Branding & Landing Page**
    
    - Site title
        
    - Logo (upload or URL)
        
    - Slogan
        
    - Help text (supports Markdown)
        
    - Iframe URL for right panel
        
- **Auto-Refresh Settings**
    
    - Refresh interval (5, 10, 15, 30, 60 minutes)
        
    - Enable/disable auto-refresh toggle
        
    - Last sync status display
        
    - Manual refresh button
        
- **Security**
    
    - Site password
        
    - Admin password
        

---

## 🗂️ Read-Only Markdown Viewer

### GitHub Integration (Read-Only)

- **Fetch** `.md` files from configured GitHub repo folders
    
- **Display-only** - no editing, writing, or file management
    
- **Auto-generate** sidebar navigation from folder structure
    
- **Simple refresh** mechanism via admin panel
    
- **Works with public and private repos** (GitHub token for private)
    

### Markdown Rendering

- **Rich display** with frontmatter support (`title`, `order`, `hidden`)
    
- **Mermaid diagrams** for technical documentation
    
- **Code syntax highlighting** for technical content
    
- **Internal and relative links** within the repo
    
- **Image display** from GitHub repo or external URLs
    

### UI Layout (Cursor-Style 3-Column)

**Desktop Layout (Resizable Panels):**
- **Column 1 - Files (2/10 width):** Folder/file navigation tree
- **Column 2 - Viewer (5/10 width):** Markdown content display  
- **Column 3 - Chat (3/10 width):** Iframe chat panel

**Resizable Panel Features:**
- **Drag to resize** any column by grabbing the dividers
- **Minimum widths** to prevent columns from disappearing
- **Snap positions** for common layouts (hide chat, focus reader, etc.)
- **Remember layout** preferences in local storage
- **Double-click divider** to reset to default proportions

**Mobile Layout (Responsive):**
- **Collapsible panels** with bottom tabs or hamburger menu
- **Focus mode** - one panel at a time on mobile
- **Swipe gestures** to switch between panels
    

---

## 🏗️ Development & Build Process

### **MVP Build Phases (3-4 Week Timeline):**
**Phase 1 (Core MVP - Week 1):**
- ✅ Basic landing page with password authentication
- ✅ Simple markdown viewer with GitHub API integration
- ✅ Admin panel for basic configuration
- ✅ 3-column resizable layout foundation

**Phase 2 (Enhancement - Week 2):**
- ✅ File explorer navigation with folder structure
- ✅ Auto-refresh functionality (15-minute intervals)
- ✅ Responsive design and mobile optimization
- ✅ Iframe chat panel integration

**Phase 3 (Polish - Week 3):**
- ✅ Error handling and loading states
- ✅ Performance optimization and caching
- ✅ Admin panel completion
- ✅ Testing and deployment

**Phase 4 (Launch - Week 4):**
- ✅ AWS Amplify deployment setup
- ✅ Supabase configuration
- ✅ Final testing and bug fixes
- ✅ Documentation and handoff

### **One-Command Development Setup:**
```bash
# Simple development setup
npm create next-app@latest markdown-site --typescript --tailwind --app
cd markdown-site
npm install @supabase/supabase-js octokit gray-matter remark react-resizable-panels
npm run dev  # Start development immediately
```

### **Environment Variables:**
```env
# Required for development and production
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key
GITHUB_TOKEN=optional_for_private_repos
```

---

## 🛡️ Error Handling & Performance

### **User-Friendly Error Messages:**
```typescript
const ErrorMessages = {
  githubDown: "📡 Can't reach GitHub right now. Showing cached content.",
  wrongPassword: "🔐 Incorrect password. Please try again.",
  noContent: "📭 No markdown files found in configured folders.",
  adminOnly: "⚠️ Admin access required for this action.",
  refreshFailed: "🔄 Auto-refresh failed. Using cached content.",
  loadingTimeout: "⏱️ Content taking longer than expected to load."
}
```

### **Performance Targets:**
- **Landing page:** < 1 second load time
- **Markdown content:** < 2 seconds from GitHub API
- **Navigation:** Instant (cached sidebar)
- **Panel resizing:** 60fps smooth interactions
- **Auto-refresh:** Background, non-blocking

### **Smart Caching Strategy:**
```typescript
const CacheStrategy = {
  fileList: "5 minutes - sidebar navigation",
  markdownContent: "15 minutes - individual files",
  adminConfig: "1 hour - settings and branding",
  githubAPI: "Rate limit aware with exponential backoff",
  userLayout: "Persistent in localStorage"
}
```

### **Session Management:**
```typescript
const SessionStrategy = {
  storage: "HttpOnly cookies for security",
  duration: "24 hours with auto-extension",
  renewal: "Extends on user activity",
  security: "Secure, SameSite=strict, HTTPS only"
}
```

---

## 📱 Mobile-First Responsive Design

### **Responsive Breakpoints:**
```css
/* Mobile-first approach */
.layout {
  /* Mobile (< 768px): Tabbed interface */
  @media (max-width: 767px) {
    .panels { display: none; }
    .tabs { display: flex; }
    .active-panel { display: block; width: 100%; }
  }
  
  /* Tablet (768px - 1024px): Simplified resizing */
  @media (min-width: 768px) and (max-width: 1024px) {
    .panel-min-width { min-width: 200px; }
    .resizer { touch-action: pan-x; }
  }
  
  /* Desktop (> 1024px): Full Cursor-style experience */
  @media (min-width: 1025px) {
    .panel-min-width { min-width: 150px; }
    .advanced-features { display: block; }
  }
}
```

### **Mobile Navigation Strategy:**
- **Bottom tabs** for panel switching (Files | Reader | Chat)
- **Swipe gestures** between panels
- **Collapsible headers** to maximize content space
- **Touch-friendly** resize handles (larger touch targets)

---

## 🧪 Testing & Quality Assurance

### **Simplified Testing Approach:**
```typescript
const TestingStrategy = {
  unit: "Core functions - auth, GitHub API, markdown parsing",
  integration: "Main user flows - login → browse → view content",
  manual: "Cross-browser testing on mobile + desktop",
  automated: "Amplify build checks + basic smoke tests",
  performance: "Lighthouse scores + Core Web Vitals"
}
```

### **Development Workflow:**
```bash
# Simple but effective workflow
npm run dev          # Local development with hot reload
npm run build        # Test production build locally
npm run start        # Test production bundle
git push main        # Auto-deploy via Amplify
```

### **Deployment Checklist:**
- ✅ Environment variables configured in Amplify
- ✅ Supabase database schema created with RLS policies
- ✅ GitHub token set (if using private repositories)
- ✅ Custom domain configured (optional)
- ✅ Admin passwords configured securely
- ✅ Auto-refresh settings tested and working

---

## ⚙️ Amplify Configuration (amplify.yml)

### **Simple Build Configuration**
```yaml
# amplify.yml - Keep it simple and reliable
version: 1
applications:
  - frontend:
      phases:
        preBuild:
          commands:
            - npm ci
            - echo "Installing dependencies..."
        build:
          commands:
            - echo "Building Next.js application..."
            - npm run build
      artifacts:
        baseDirectory: .next
        files:
          - '**/*'
      cache:
        paths:
          - node_modules/**/*
          - .next/cache/**/*
      customHeaders:
        - pattern: '**/*'
          headers:
            - key: 'Strict-Transport-Security'
              value: 'max-age=31536000; includeSubDomains'
            - key: 'X-Frame-Options'
              value: 'DENY'
            - key: 'X-Content-Type-Options'
              value: 'nosniff'
```

### **Environment-Specific Builds**
```typescript
// Different configurations per environment
const AmplifyEnvironments = {
  main: "Production build with all optimizations",
  develop: "Development build with staging environment", 
  feature: "Feature branch builds for testing"
}
```

---

## 🛡️ Phase 1: Security & Reliability (Critical for Launch)

### **Simple Security Hardening**
```typescript
// Essential security measures - keep it simple
const SecurityEssentials = {
  rateLimiting: "5 requests per minute per IP for password attempts",
  inputValidation: "Sanitize all user inputs (passwords, admin settings)",
  cors: "Restrict to your domain only",
  headers: "Basic security headers via Next.js config"
}
```

### **Next.js Security Configuration**
```javascript
// next.config.js - Simple security headers
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options', 
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          }
        ]
      }
    ]
  }
}
```

### **Rate Limiting (Simple Implementation)**
```typescript
// lib/rate-limit.ts - Basic rate limiting
const rateLimiter = new Map()

export function checkRateLimit(ip: string, maxAttempts = 5): boolean {
  const now = Date.now()
  const windowMs = 15 * 60 * 1000 // 15 minutes
  
  if (!rateLimiter.has(ip)) {
    rateLimiter.set(ip, { count: 1, resetTime: now + windowMs })
    return true
  }
  
  const limit = rateLimiter.get(ip)
  if (now > limit.resetTime) {
    rateLimiter.set(ip, { count: 1, resetTime: now + windowMs })
    return true
  }
  
  if (limit.count >= maxAttempts) {
    return false
  }
  
  limit.count++
  return true
}
```

---

## 🚨 Error Boundaries & Content Validation

### **React Error Boundaries**
```typescript
// components/ErrorBoundary.tsx - Prevent app crashes
interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

class ErrorBoundary extends Component<PropsWithChildren, ErrorBoundaryState> {
  constructor(props: PropsWithChildren) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-50 border border-red-200 rounded">
          <h2 className="text-red-800 font-bold">Something went wrong</h2>
          <p className="text-red-600">
            Unable to load this content. Please try refreshing the page.
          </p>
        </div>
      )
    }
    return this.props.children
  }
}
```

### **Content Validation (Simple)**
```typescript
// lib/content-validator.ts - Basic content safety
export function validateMarkdown(content: string): {valid: boolean, error?: string} {
  try {
    // Basic validation
    if (!content || content.length > 1000000) {
      return { valid: false, error: "Content too large or empty" }
    }
    
    // Check for potentially dangerous content
    const dangerousPatterns = [
      /<script/i,
      /javascript:/i,
      /data:text\/html/i
    ]
    
    for (const pattern of dangerousPatterns) {
      if (pattern.test(content)) {
        return { valid: false, error: "Potentially unsafe content detected" }
      }
    }
    
    return { valid: true }
  } catch (error) {
    return { valid: false, error: "Content validation failed" }
  }
}
```

---

## 🌍 Environment Management (Simple)

### **Environment Strategy**
```typescript
// Simple 3-environment approach
const Environments = {
  development: {
    url: "http://localhost:3000",
    database: "Local Supabase project",
    github: "Test repository",
    monitoring: "Console logs only"
  },
  staging: {
    url: "https://staging-branch.amplifyapp.com", 
    database: "Staging Supabase project",
    github: "Same repo, test content",
    monitoring: "Basic error tracking"
  },
  production: {
    url: "https://your-domain.com",
    database: "Production Supabase project", 
    github: "Production repository",
    monitoring: "Full error tracking + uptime"
  }
}
```

### **Environment Variables Checklist**
```env
# Development (.env.local)
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_local_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_local_service_key
GITHUB_TOKEN=optional_dev_token
NODE_ENV=development

# Staging (Amplify environment variables)
NEXT_PUBLIC_SUPABASE_URL=https://your-staging-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_staging_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_staging_service_key
GITHUB_TOKEN=production_token
NODE_ENV=production

# Production (Amplify environment variables)
NEXT_PUBLIC_SUPABASE_URL=https://your-production-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_production_service_key
GITHUB_TOKEN=production_token
NODE_ENV=production
```

---

## 📊 Basic Monitoring (Launch Essentials)

### **Simple Error Tracking**
```typescript
// lib/error-tracking.ts - Basic error capture
export function logError(error: Error, context?: any) {
  // Development - log to console
  if (process.env.NODE_ENV === 'development') {
    console.error('Error:', error, context)
    return
  }
  
  // Production - send to simple endpoint or service
  fetch('/api/log-error', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent
    })
  }).catch(() => {
    // Silently fail - don't break app if logging fails
  })
}
```

### **Health Check Endpoint**
```typescript
// pages/api/health.ts - Simple uptime monitoring
export default function handler(req: NextRequest, res: NextResponse) {
  try {
    // Basic health checks
    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0'
    }
    
    res.status(200).json(health)
  } catch (error) {
    res.status(500).json({ 
      status: 'error', 
      message: 'Health check failed' 
    })
  }
}
```

### **Simple Uptime Monitoring**
```typescript
// Monitor these endpoints for uptime
const MonitoringEndpoints = {
  healthCheck: "https://your-domain.com/api/health",
  landingPage: "https://your-domain.com/",
  githubAPI: "Monitor GitHub API response times"
}

// Use simple services like:
// - UptimeRobot (free)
// - Pingdom
// - AWS CloudWatch (built into Amplify)
```

---

## 🧰 Tech Stack

- **Framework:** Next.js
    
- **Styling:** TailwindCSS
    
- **Markdown:** remark, gray-matter, MDX
    
- **GitHub API:** Octokit or fetch (direct API calls)
    
- **Resizable Panels:** react-resizable-panels or react-split-pane
    
- **Database:** Supabase (PostgreSQL)
    
- **Authentication:** Custom password auth with bcrypt
    
- **Hosting:** AWS Amplify (with GitHub integration)
    
- **CDN:** CloudFront (automatic with Amplify)
    

---

## 🗃️ Database Schema (Supabase)

```sql
CREATE TABLE site_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR NOT NULL,
  logo_url VARCHAR,
  slogan VARCHAR,
  help_text TEXT,
  github_repo VARCHAR NOT NULL,
  branch VARCHAR DEFAULT 'main',
  folders TEXT[], -- PostgreSQL array for multiple folders
  iframe_url VARCHAR,
  auto_refresh_enabled BOOLEAN DEFAULT true,
  refresh_interval_minutes INTEGER DEFAULT 15,
  last_sync_at TIMESTAMPTZ,
  site_password_hash VARCHAR NOT NULL,
  admin_password_hash VARCHAR NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE site_configs ENABLE ROW LEVEL SECURITY;
```

---

## 🧪 Example User Journey

1. **User opens `/`** → Sees custom landing page (logo, help text, password field)
    
2. **Enters password** → Gains access to main documentation interface
    
3. **Sees 3-column layout:**
   - **Left (2/10):** File explorer with folder structure
   - **Center (5/10):** Welcome page or last viewed document  
   - **Right (3/10):** Chat iframe panel
    
4. **Browses files** → Clicks on markdown file in left panel
    
5. **Reads content** → Markdown renders beautifully in center panel
    
6. **Adjusts layout** → Drags dividers to make chat panel bigger for assistance
    
7. **Navigates efficiently** → Uses file tree navigation while keeping content and chat visible
    

---

## 🧱 Suggested File Structure

```
/pages
  /api
    /auth.ts              → Authentication endpoints
    /github.ts            → GitHub API endpoints
    /config.ts            → Admin config management
  /index.tsx              → Landing page
  /viewer/[...slug].tsx   → Markdown viewer   
  /admin/index.tsx        → Admin panel

/components
  /layout
    /ResizableLayout.tsx  → Main 3-column resizable container
    /PanelDivider.tsx     → Draggable divider component
  /FileExplorer.tsx       → Left panel - file navigation tree
  /MarkdownViewer.tsx     → Center panel - markdown content display
  /ChatPanel.tsx          → Right panel - iframe chat integration  
  /LandingPage.tsx        → Custom landing page

/lib
  /supabase.ts            → Supabase client and queries
  /auth.ts                → Password and session logic
  /github.ts              → GitHub API utilities
  /auto-refresh.ts        → Background auto-refresh logic
  /markdown.ts            → Markdown processing utilities
  /rate-limit.ts          → Rate limiting utilities
  /error-tracking.ts      → Error logging utilities
  /content-validator.ts   → Markdown content validation

/components
  /ErrorBoundary.tsx      → App-wide error boundary

/amplify.yml              → Amplify build configuration
```

---

## 📦 Deployment

**Primary Hosting:** AWS Amplify with GitHub integration

### AWS Amplify Features:
- **Auto-deployment** from GitHub commits
- **Environment variables** for secure config storage
- **CloudFront CDN** for fast global delivery
- **Custom domains** with SSL certificates
- **Preview deployments** for testing changes

### External Services:
- **Database:** Supabase (PostgreSQL with real-time features)
- **File Storage:** GitHub repositories (markdown files)
- **Optional:** S3 for uploaded assets (logos, etc.)

### GitHub Integration:
- **Direct API calls** to fetch markdown files
- **No webhooks needed** - simple refresh mechanism
- **Rate limiting** handled with smart caching
- **Manual refresh** via admin panel when content updates
    

---

## 📖 Read-Only Approach Benefits

### Why Read-Only is Perfect for Documentation:
- **Simplicity** - No complex editing interfaces or workflows
- **Security** - Cannot accidentally modify or break GitHub content  
- **Performance** - Aggressive caching since content doesn't change from app
- **Reliability** - No risk of data loss or sync conflicts
- **Focus** - Pure documentation consumption experience

### Content Management Workflow:
1. **Edit markdown files** directly in GitHub (using GitHub's editor)
2. **Commit changes** to your repository  
3. **Click "Refresh"** in admin panel to update viewer
4. **Users see latest content** immediately

## 🔗 GitHub Integration Strategy (Read-Only)

### How Content Loading Works:
1. **Admin configures** GitHub repo and folders in admin panel
2. **App fetches file tree** using GitHub API (read-only endpoints)
3. **Smart caching** prevents excessive API calls  
4. **Manual refresh** button to fetch latest content from GitHub

### GitHub API Endpoints Used (Read-Only):
```
GET /repos/{owner}/{repo}/contents/{path}  → List files in folder
GET /repos/{owner}/{repo}/contents/{file}  → Get markdown file content
```
*No write/POST endpoints needed - purely read operations*

### Content Update Flow:
1. **Edit content** in GitHub using web interface or local editor
2. **Commit to repository** (standard Git workflow)
3. **Auto-refresh every 15 minutes** OR **manual refresh** via admin panel
4. **App detects changes:** new files, deleted files, modified content
5. **Users see updated content** automatically

### Auto-Refresh Strategy:
- **Default interval:** 15 minutes (configurable in admin panel)
- **Background checking:** Non-blocking, happens behind the scenes
- **Smart detection:** Compares file lists and modification dates
- **Cache invalidation:** Only updates changed/new/deleted files
- **User experience:** Seamless updates without page refresh

### Technical Benefits:
- **No GitHub authentication complexity** - optional read-only token
- **No webhook setup** required - simple refresh mechanism
- **Works with any repo** - public or private  
- **Zero risk** to your source content
- **Simple API usage** - well within rate limits

---

## ⏰ Auto-Refresh Implementation

### Background Sync (Every 15 Minutes)
```typescript
const AutoRefreshConfig = {
  defaultInterval: "15 minutes",
  configurable: "Admin can set 5-60 minute intervals",
  backgroundMode: "Non-blocking, happens behind scenes",
  smartSync: "Only updates changed content",
  userExperience: "Seamless - no page refreshes needed"
}
```

### File Change Detection:
```typescript
// Simple but effective change detection
const ChangeDetection = {
  newFiles: "Compare current file list vs cached list",
  deletedFiles: "Remove from sidebar if no longer in GitHub",
  modifiedFiles: "Check 'sha' hash or 'updated_at' timestamp",
  folderChanges: "Detect new/removed folders in structure"
}
```

### Admin Panel Auto-Refresh Settings:
- **Refresh Interval:** Dropdown (5, 10, 15, 30, 60 minutes)
- **Auto-Refresh Toggle:** Enable/disable automatic checking
- **Last Sync Status:** Shows when content was last updated
- **Manual Refresh Button:** Force immediate update
- **Sync Status Indicator:** Visual feedback when syncing

### Technical Implementation:
```typescript
// Background refresh mechanism
const RefreshMechanism = {
  trigger: "setInterval() running in background",
  api: "GET /repos/{owner}/{repo}/contents/{path}",
  comparison: "Compare file SHA hashes with cached versions",
  update: "Update sidebar navigation and invalidate content cache",
  notification: "Optional subtle indicator when content updates"
}
```

### User Experience:
- **Invisible updates** - content refreshes automatically in background
- **Navigation updates** - sidebar shows new/removed files instantly  
- **No interruption** - current reading is never disrupted
- **Smart caching** - only re-fetch changed content, not everything
- **Optional notifications** - subtle indicator when content is updated

---

## 🖥️ Resizable Layout Implementation (Cursor-Style)

### Panel Layout Structure:
```typescript
// Default panel sizes (out of 10 units)
const DefaultLayout = {
  files: 2,      // 20% - File explorer
  viewer: 5,     // 50% - Markdown content  
  chat: 3        // 30% - Chat iframe
}

// Minimum panel sizes (prevent disappearing)
const MinSizes = {
  files: 1,      // 10% minimum
  viewer: 3,     // 30% minimum 
  chat: 1        // 10% minimum
}
```

### Technical Implementation:
- **React Resizable Panels** library for smooth drag interactions
- **CSS Grid or Flexbox** for responsive layout foundation  
- **Local Storage** to persist user's preferred panel sizes
- **Event handlers** for drag, double-click reset, and snap positions

### User Experience Features:
```typescript
const PanelFeatures = {
  dragResize: "Click and drag dividers to resize panels",
  doubleClickReset: "Double-click divider to return to default sizes",
  snapPositions: "Auto-snap to common layouts (hide chat, focus reader)",
  minSizes: "Prevents panels from becoming unusably small",
  persistence: "Remembers your layout between sessions",
  mobileAdaptive: "Transforms to tabs/accordion on mobile"
}
```

### Common Layout Presets:
- **Reading Focus:** Files(1) + Viewer(7) + Chat(2) 
- **Chat Focus:** Files(1) + Viewer(4) + Chat(5)
- **Browse Mode:** Files(3) + Viewer(5) + Chat(2)
- **Hide Chat:** Files(2) + Viewer(8) + Chat(0)

### Mobile Responsive Strategy:
- **< 768px:** Transform to tabbed interface
- **768px - 1024px:** Allow resizing but with larger minimum sizes
- **> 1024px:** Full resizable panel experience

---

## 📄 Example Config as JSON

```json
{
  "siteTitle": "Flamingo Logic Docs",
  "slogan": "Internal documentation and checklists", 
  "logoUrl": "/logo.png",
  "helpText": "Enter password to access documentation",
  "githubRepo": "flamingologic/internal-docs",
  "branch": "main",
  "folders": ["docs", "checklists", "guides"],
  "iframeUrl": "https://chat.flamingologic.com/embed",
  "autoRefreshEnabled": true,
  "refreshIntervalMinutes": 15,
  "lastSyncAt": "2024-01-15T10:30:00Z"
}
```

*Note: Passwords stored securely in Supabase as bcrypt hashes*

---

## 🔮 Future Enhancements (Optional)

### Enhanced Viewing Experience:
- **Full-text search** across all markdown content
- **Dark/light mode** toggle for better reading
- **Table of contents** auto-generation from headings
- **Print-friendly** CSS styling
- **Keyboard shortcuts** for navigation (arrows, search)

### Advanced Panel Features:
- **Panel presets** - Save/load custom layout configurations
- **Panel tabs** - Multiple files open in tabs within viewer panel
- **Panel maximization** - Double-click panel header to maximize temporarily
- **Floating panels** - Detach chat or viewer to separate windows
- **Panel zoom** - Zoom in/out on individual panels

### Accessibility & Usability:
- **Keyboard navigation** - Tab, Enter, Arrow keys for full navigation
- **Screen reader support** - Semantic HTML and ARIA labels
- **High contrast mode** - Support for OS-level accessibility settings
- **Focus indicators** - Clear visual focus for all interactive elements
- **Reduced motion** - Respect user's motion preferences
- **Text scaling** - Responsive to browser zoom levels

### Content Discovery:
- **Recently viewed** files (local storage)
- **Bookmark/favorites** system  
- **Related content** suggestions
- **Tag/category** filtering from frontmatter
- **Export to PDF** functionality

### Performance & UX:
- **Offline reading** (service worker caching)
- **Progressive loading** for large repositories
- **Image optimization** and lazy loading
- **Mobile app** (PWA with install prompt)
- **Reading progress** tracking

### Analytics & Insights:
- **Page view tracking** (privacy-friendly)
- **Popular content** dashboard in admin
- **Search queries** analysis
- **User engagement** metrics

### Integration Options:
- **Multiple chat providers** (not just iframe)
- **Commenting system** (external service like Disqus)
- **Notification system** for content updates
- **RSS feed** generation for updates
- **API endpoints** for headless usage

*Note: All enhancements maintain read-only nature - no editing capabilities added*

---

## 🚀 Quick Setup Guide (Phase 1 Ready)

### **Prerequisites**
- Node.js 18+ installed
- Git repository with markdown files
- Supabase account (free tier)
- AWS account for Amplify (free tier)

### **Setup Steps (30 minutes)**

#### **1. Create Next.js Project**
```bash
npx create-next-app@latest markdown-docs --typescript --tailwind --app
cd markdown-docs
npm install @supabase/supabase-js octokit gray-matter remark react-resizable-panels
```

#### **2. Setup Supabase**
```sql
-- Create site_configs table
CREATE TABLE site_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR NOT NULL,
  logo_url VARCHAR,
  slogan VARCHAR,
  help_text TEXT,
  github_repo VARCHAR NOT NULL,
  branch VARCHAR DEFAULT 'main',
  folders TEXT[],
  iframe_url VARCHAR,
  auto_refresh_enabled BOOLEAN DEFAULT true,
  refresh_interval_minutes INTEGER DEFAULT 15,
  last_sync_at TIMESTAMPTZ,
  site_password_hash VARCHAR NOT NULL,
  admin_password_hash VARCHAR NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE site_configs ENABLE ROW LEVEL SECURITY;
```

#### **3. Configure Environment Variables**
```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_key
GITHUB_TOKEN=optional_for_private_repos
```

#### **4. Deploy to Amplify**
1. Push code to GitHub repository
2. Connect repository to AWS Amplify
3. Add environment variables in Amplify console
4. Deploy automatically on git push

#### **5. Initial Configuration**
1. Visit `/admin` with admin password
2. Configure GitHub repository and folders
3. Set site branding and passwords
4. Test auto-refresh functionality

### **Production Checklist**
- ✅ Custom domain configured
- ✅ SSL certificate active
- ✅ Environment variables secured
- ✅ Rate limiting tested
- ✅ Error boundaries verified
- ✅ Mobile responsiveness checked
- ✅ Uptime monitoring configured

### **Maintenance Tasks**
- **Weekly:** Check error logs and uptime stats
- **Monthly:** Review GitHub API usage and performance
- **Quarterly:** Update dependencies and security patches