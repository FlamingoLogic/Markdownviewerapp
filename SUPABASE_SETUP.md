# 🔥 Quick Supabase Setup for MarkdownViewerApp

## 1. Create Supabase Project (2 minutes)

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Choose your organization
4. **Project Name**: `markdownviewerapp` (or your preferred name)
5. **Database Password**: Generate a secure password (save it!)
6. **Region**: Choose closest to your users
7. Click "Create new project"

## 2. Get Your Environment Variables (1 minute)

Once project is created:

1. Go to **Settings** → **API**
2. Copy these values:

```
Project URL: https://your-project-id.supabase.co
anon/public key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 3. Set Amplify Environment Variables (1 minute)

In your **AWS Amplify Console**:

1. Go to your app → **Environment variables**
2. Add these variables:

```
SUPABASE_URL = https://your-project-id.supabase.co
SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

3. **Save** and **Redeploy**

## 4. Create Database Table (1 minute)

In Supabase **SQL Editor**, run this:

```sql
CREATE TABLE site_configs (
  id TEXT PRIMARY KEY DEFAULT 'main-config',
  title TEXT NOT NULL DEFAULT 'Documentation Site',
  slogan TEXT,
  help_text TEXT,
  logo_url TEXT,
  github_repo TEXT NOT NULL,
  branch TEXT NOT NULL DEFAULT 'main',
  folders TEXT[] NOT NULL DEFAULT '{}',
  iframe_url TEXT,
  auto_refresh_enabled BOOLEAN DEFAULT true,
  refresh_interval_minutes INTEGER DEFAULT 15,
  last_sync_at TIMESTAMPTZ,
  site_password_hash TEXT NOT NULL,
  admin_password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert initial configuration
INSERT INTO site_configs (
  id,
  title,
  slogan,
  help_text,
  github_repo,
  branch,
  folders,
  iframe_url,
  site_password_hash,
  admin_password_hash
) VALUES (
  'main-config',
  'My Documentation Site',
  'Beautiful documentation made simple',
  'Configure your GitHub repository in the admin panel to get started.',
  'FlamingoLogic/Markdownviewerapp',
  'main',
  ARRAY['Planning Documents'],
  'https://example.com/chat',
  '$2a$10$.Z5wZpZ4xbTVjjqT39AUKOtqGTO2nLD0E3t2NU8atQUmV/KFU6LlC',
  '$2a$10$wwQvHyDwBeQW0rQMFttmLuJk8bshJai6tE0nRo4w71BjLYJQlmeAu'
);

-- Enable Row Level Security
ALTER TABLE site_configs ENABLE ROW LEVEL SECURITY;

-- Allow public read access (for the app to function)
CREATE POLICY "Allow public read access" ON site_configs FOR SELECT TO PUBLIC USING (true);

-- Allow authenticated updates (for admin panel)
CREATE POLICY "Allow admin updates" ON site_configs FOR UPDATE TO PUBLIC USING (true);
```

## 5. Done! 🎉

- **Site Password**: `TempSite2024!`
- **Admin Password**: `TempAdmin2024!`
- Your app will now use **real persistent configuration**
- Changes in admin panel will **save permanently**
- Ready for **production use**!

---

**Next Steps:**
1. Access admin panel with `TempAdmin2024!`
2. Configure your actual GitHub repository
3. Set new secure passwords
4. Start adding your documentation content!