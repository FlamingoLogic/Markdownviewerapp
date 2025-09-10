# AWS Amplify Configuration Guide

## 🔧 Environment Variables Setup

You need to configure these environment variables in your AWS Amplify Console:

### **Required Variables:**
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_key
```

### **Optional (but recommended for your ObsidianSync repo):**
```
GITHUB_TOKEN=your_github_personal_access_token
```

## 📋 Steps to Configure in Amplify:

### 1. **Go to AWS Amplify Console**
- Navigate to your app: https://console.aws.amazon.com/amplify/
- Select your MarkDown Publish Site app

### 2. **Set Environment Variables**
- Click "App settings" → "Environment variables"
- Add each variable listed above
- Click "Save"

### 3. **Create GitHub Personal Access Token**
Since your ObsidianSync repository might be private or you want higher rate limits:

1. Go to: https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Select scopes:
   - `public_repo` (for public repositories)
   - `repo` (for private repositories)
4. Copy the token (starts with `ghp_` or `github_pat_`)
5. Add as `GITHUB_TOKEN` in Amplify

### 4. **Configure Your Repository in Admin Panel**
After deployment, go to: `https://your-amplify-url.com/admin`

**Login with**: `flamingo` (default password)

**Set these values:**
- **Repository URL**: `https://github.com/FlamingoLogic/ObsidianSync`
- **Branch**: `main`
- **Folders**: `02 AbilityERP`

## 🔍 Testing Your Configuration

### **Debug Endpoints** (available after deployment):
- `https://your-amplify-url.com/api/debug/github-connection-test`
- `https://your-amplify-url.com/api/debug/test-obsidian-sync`
- `https://your-amplify-url.com/api/debug/config`

### **Expected Results:**
✅ GitHub Token exists: true
✅ Repository accessible: FlamingoLogic/ObsidianSync
✅ Folder accessible: 02 AbilityERP
✅ Markdown files found: [number] files

## 🚨 Common Issues & Solutions:

### **Issue**: "Repository not found" (404 error)
**Solution**:
- Check if `FlamingoLogic/ObsidianSync` is public
- If private, ensure GITHUB_TOKEN is set with `repo` permissions

### **Issue**: "Folder not found"
**Solution**:
- Verify folder name: `02 AbilityERP` (exact case and spacing)
- Check the folder exists in the main branch

### **Issue**: "Site not configured"
**Solution**:
- Set up Supabase environment variables first
- Configure repository in admin panel

## 📁 Your Specific Configuration:

**Repository**: https://github.com/FlamingoLogic/ObsidianSync
**Folder**: `02 AbilityERP`
**Expected Files**: Markdown (.md) files in the 02 AbilityERP folder

This folder name contains:
- A number prefix: `02`
- A space character
- Mixed case: `AbilityERP`

All of these should work fine with the GitHub API.

## 🔄 Deployment Process:

1. **Push changes to GitHub** (your current step)
2. **Amplify auto-builds** the application
3. **Set environment variables** in Amplify Console
4. **Configure repository** in admin panel
5. **Test GitHub connection** using debug endpoints

## 💡 Quick Test:

After setting up environment variables and deploying:

1. Visit: `https://your-amplify-url.com/admin`
2. Configure the ObsidianSync repository
3. Test connection with: `https://your-amplify-url.com/api/debug/test-obsidian-sync`
4. Check for markdown files in the file explorer

---

**Next Steps**:
1. Set environment variables in Amplify Console
2. Push this configuration to trigger a new build
3. Configure the repository in the admin panel

