# 📖 GitHub Markdown WebApp

> **Read-Only Documentation Viewer with Cursor-Style Interface**

A modern, self-hosted documentation webapp that displays markdown files from GitHub repositories. Features a resizable 3-column layout (Files | Viewer | Chat), auto-refresh sync, password protection, and admin configuration panel.

[![Deploy with Amplify](https://oneclick.amplifyapp.com/button.svg)](https://console.aws.amazon.com/amplify/home#/deploy?repo=https://github.com/FlamingoLogic/Markdownviewerapp)

## ✨ Features

### 🎯 **Core Functionality**
- **📁 GitHub Integration** - Browse markdown files from any GitHub repository
- **📖 Rich Markdown Rendering** - Syntax highlighting, Mermaid diagrams, frontmatter support
- **🔄 Auto-Refresh** - Syncs with GitHub every 15 minutes (configurable)
- **🛡️ Password Protection** - Simple site access + admin panel security
- **📱 Responsive Design** - Works perfectly on desktop, tablet, and mobile

### 🖥️ **Cursor-Style Interface**
- **3-Column Layout** - Files (20%) | Viewer (50%) | Chat (30%)
- **Resizable Panels** - Drag dividers to customize layout
- **Smart Persistence** - Remembers your preferred panel sizes
- **Mobile Adaptive** - Transforms to tabbed interface on mobile

### ⚙️ **Admin Features**
- **GitHub Configuration** - Set repository, branch, and folders
- **Branding Control** - Custom logo, title, colors, and help text
- **Auto-Refresh Settings** - Configure sync intervals and manual refresh
- **Chat Integration** - Embed any iframe-based chat service

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- GitHub repository with markdown files
- [Supabase account](https://supabase.com) (free tier)
- [AWS account](https://aws.amazon.com/amplify/) for Amplify (free tier)

### 1. Clone & Install
```bash
git clone https://github.com/FlamingoLogic/Markdownviewerapp.git
cd Markdownviewerapp
npm install
```

### 2. Environment Setup
Create `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_key
GITHUB_TOKEN=optional_for_private_repos
```

### 3. Database Setup
Run this SQL in your Supabase SQL editor:
```sql
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

ALTER TABLE site_configs ENABLE ROW LEVEL SECURITY;
```

### 4. Development
```bash
npm run dev
```
Visit `http://localhost:3000` and `http://localhost:3000/admin` to configure.

### 5. Deploy to AWS Amplify
1. Push your code to GitHub
2. Connect repository to [AWS Amplify](https://console.aws.amazon.com/amplify/)
3. Add environment variables in Amplify console
4. Deploy automatically on every git push

## 📁 Project Structure

```
├── pages/
│   ├── api/
│   │   ├── auth.ts              # Authentication endpoints
│   │   ├── github.ts            # GitHub API endpoints
│   │   ├── config.ts            # Admin configuration
│   │   └── health.ts            # Health check endpoint
│   ├── admin/
│   │   └── index.tsx            # Admin panel
│   ├── viewer/
│   │   └── [...slug].tsx        # Markdown viewer
│   └── index.tsx                # Landing page
├── components/
│   ├── layout/
│   │   ├── ResizableLayout.tsx  # 3-column resizable container
│   │   └── PanelDivider.tsx     # Draggable dividers
│   ├── FileExplorer.tsx         # File navigation tree
│   ├── MarkdownViewer.tsx       # Markdown content display
│   ├── ChatPanel.tsx            # Chat iframe integration
│   ├── ErrorBoundary.tsx        # Error boundaries
│   └── LandingPage.tsx          # Custom landing page
├── lib/
│   ├── supabase.ts              # Supabase client
│   ├── github.ts                # GitHub API utilities
│   ├── auth.ts                  # Authentication logic
│   ├── auto-refresh.ts          # Background sync
│   ├── rate-limit.ts            # Rate limiting
│   ├── error-tracking.ts        # Error logging
│   └── content-validator.ts     # Content validation
└── amplify.yml                  # Amplify build config
```

## ⚙️ Configuration

### Admin Panel Settings
Access via `/admin` with your admin password:

- **GitHub Settings** - Repository, branch, folders to display
- **Branding** - Site title, logo, slogan, help text
- **Auto-Refresh** - Enable/disable, set interval (5-60 minutes)
- **Chat Integration** - Iframe URL for chat service
- **Security** - Update site and admin passwords

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | ✅ |
| `GITHUB_TOKEN` | GitHub personal access token | ⚠️ Private repos only |

## 🛡️ Security Features

- **Rate Limiting** - 5 password attempts per 15 minutes
- **Input Validation** - Sanitizes all user inputs
- **Content Validation** - Checks for dangerous markdown patterns
- **Security Headers** - XSS protection, clickjacking prevention
- **Error Boundaries** - Prevents crashes from malformed content

## 📊 Monitoring

### Health Check
- **Endpoint**: `/api/health`
- **Use**: Uptime monitoring with services like UptimeRobot
- **Response**: JSON with status, timestamp, version

### Error Tracking
- **Development**: Console logging
- **Production**: Structured error logging to `/api/log-error`
- **Integration**: Compatible with Sentry, LogRocket, etc.

## 🎨 Customization

### Panel Layout Presets
- **Reading Focus**: Files(10%) + Viewer(70%) + Chat(20%)
- **Chat Focus**: Files(10%) + Viewer(40%) + Chat(50%)
- **Browse Mode**: Files(30%) + Viewer(50%) + Chat(20%)
- **Hide Chat**: Files(20%) + Viewer(80%) + Chat(0%)

### Responsive Breakpoints
- **Mobile (<768px)**: Tabbed interface
- **Tablet (768px-1024px)**: Simplified resizing
- **Desktop (>1024px)**: Full Cursor-style experience

## 🔧 Development

### Available Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # TypeScript type checking
```

### Tech Stack
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **Database**: Supabase (PostgreSQL)
- **Markdown**: remark, gray-matter, MDX
- **Panels**: react-resizable-panels
- **Hosting**: AWS Amplify
- **API**: GitHub REST API via Octokit

## 📦 Deployment

### AWS Amplify (Recommended)
1. Connect GitHub repository to Amplify
2. Configure environment variables
3. Use provided `amplify.yml` for build settings
4. Automatic deployments on git push

### Other Platforms
- **Vercel**: Works out of the box
- **Netlify**: Compatible with build settings
- **Docker**: Dockerfile available for self-hosting

## 🔄 Auto-Refresh System

### How it Works
- **Background Check**: Every 15 minutes (configurable)
- **Change Detection**: Compares file SHA hashes
- **Smart Updates**: Only refreshes changed content
- **Non-Blocking**: Never interrupts user reading

### Configuration
- **Admin Panel**: Set interval (5-60 minutes)
- **Manual Refresh**: Force immediate sync
- **Status Display**: Shows last sync time

## 🚀 Multi-Site Usage

This app is designed as a **reusable template**:

1. **Build once** - Perfect the documentation viewer
2. **Clone repository** for each new documentation site
3. **Configure environment variables** for different:
   - GitHub repositories (content source)
   - Supabase databases (configuration)
   - Domain names and branding
4. **Deploy to separate Amplify apps**

Perfect for agencies, consultants, or organizations managing multiple documentation sites.

## 📋 Status & Roadmap

### ✅ **COMPLETED - Ready for Deployment!**
- [x] **Core markdown viewing** with beautiful dark theme
- [x] **3-column resizable layout** (Cursor-style interface)  
- [x] **GitHub integration** with auto-refresh
- [x] **Authentication system** with password protection
- [x] **Admin configuration panel** 
- [x] **Security hardening** with rate limiting
- [x] **Error handling & monitoring**
- [x] **AWS Amplify deployment configuration**

### Phase 2 (Planned)
- [ ] Full-text search
- [ ] Dark/light mode toggle
- [ ] Table of contents generation
- [ ] Keyboard shortcuts
- [ ] Advanced panel features

### Phase 3 (Future)
- [ ] Multiple chat providers
- [ ] Commenting system integration
- [ ] Analytics dashboard
- [ ] API endpoints
- [ ] SSR optimization

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the GPL-3.0 License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: Check this README and the Planning Documents folder
- **Issues**: [GitHub Issues](https://github.com/FlamingoLogic/Markdownviewerapp/issues)
- **Discussions**: [GitHub Discussions](https://github.com/FlamingoLogic/Markdownviewerapp/discussions)

## 🎯 Use Cases

- **Internal Documentation** - Company wikis, procedures, guides
- **Knowledge Bases** - Customer support documentation
- **Technical Docs** - API documentation, developer guides
- **Help Centers** - User manuals, troubleshooting guides
- **Educational Content** - Courses, tutorials, resources

---

**Built with ❤️ for simple, effective documentation sharing**

## 🚀 **READY FOR DEPLOYMENT!**

Your markdown documentation viewer is **complete and ready** for AWS Amplify deployment! 

### **Next Steps:**

#### **1. Push to GitHub**
```bash
git add .
git commit -m "Complete markdown documentation viewer"
git push origin main
```

#### **2. Deploy to AWS Amplify**
1. Go to [AWS Amplify Console](https://console.aws.amazon.com/amplify/)
2. Click "New app" → "Host web app"
3. Connect your GitHub repository: `FlamingoLogic/Markdownviewerapp`
4. Use the included `amplify.yml` configuration
5. Add environment variables in Amplify console

#### **3. Set Environment Variables in Amplify**
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_key
GITHUB_TOKEN=your_github_token (optional for private repos)
```

#### **4. Set Up Supabase Database**
Run the SQL schema from the Quick Start section above.

#### **5. Configure Your Site**
Visit `/admin` with your admin password to configure:
- GitHub repository and folders
- Site branding and passwords  
- Auto-refresh settings
- Chat integration

### **🎉 You're Live!**
Your professional documentation viewer will be available at your Amplify URL within minutes!

---

**Built with ❤️ for simple, effective documentation sharing**

*Last updated: December 2024*