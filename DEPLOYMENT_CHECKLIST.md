# 🚀 Deployment Checklist for ObsidianSync Integration

## ✅ What's Already Done:
- [x] Repository configured: `https://github.com/FlamingoLogic/ObsidianSync`
- [x] Folder configured: `02 AbilityERP`
- [x] Branch configured: `main`
- [x] Debug endpoints created for testing
- [x] Default configuration updated

## 🔧 What You Need to Do in AWS Amplify:

### 1. **Set Environment Variables** (Critical!)
Go to AWS Amplify Console → Your App → App Settings → Environment Variables

**Add these variables:**
```
GITHUB_TOKEN=your_github_personal_access_token
```

**Optional (for full Supabase setup):**
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_key
```

### 2. **Create GitHub Token**
1. Visit: https://github.com/settings/tokens
2. "Generate new token (classic)"
3. Select scopes:
   - `public_repo` (if ObsidianSync is public)
   - `repo` (if ObsidianSync is private)
4. Copy token (starts with `ghp_`)
5. Add as `GITHUB_TOKEN` in Amplify

### 3. **Push to GitHub** (Triggers Amplify Build)
```bash
git add .
git commit -m "Configure ObsidianSync repository integration"
git push origin main
```

### 4. **Test After Deployment**
Once Amplify finishes building, test these URLs:

**Main site:** `https://your-amplify-url.com`
- Login with: `flamingo`
- Should show files from `02 AbilityERP` folder

**Debug endpoints:**
- `https://your-amplify-url.com/api/debug/test-obsidian-sync`
- `https://your-amplify-url.com/api/debug/github-connection-test`

**Expected results:**
```json
{
  "success": true,
  "tests": {
    "repositoryAccess": { "success": true },
    "targetFolder": {
      "success": true,
      "markdownFiles": 5  // or however many .md files you have
    }
  }
}
```

## 🚨 Troubleshooting:

### **Issue: "Repository not found"**
- Check if `FlamingoLogic/ObsidianSync` is public
- If private, ensure `GITHUB_TOKEN` is set in Amplify

### **Issue: "Folder not found"**
- Verify folder exists: `02 AbilityERP` (exact spelling)
- Check it's in the `main` branch

### **Issue: "No markdown files"**
- Confirm there are `.md` files in the `02 AbilityERP` folder
- Files should have `.md` or `.markdown` extension

## 📁 Your Repository Structure:
```
FlamingoLogic/ObsidianSync/
├── main branch
└── 02 AbilityERP/          ← Target folder
    ├── file1.md            ← These should appear
    ├── file2.md            ← in your documentation
    └── subfolder/
        └── file3.md
```

## 🎯 Success Indicators:
- ✅ Amplify build completes without errors
- ✅ Debug endpoint returns `"success": true`
- ✅ Admin panel shows repository as configured
- ✅ File explorer shows markdown files from `02 AbilityERP`
- ✅ Can click and read markdown content

---

**Next Step**: Push these changes to GitHub to trigger Amplify deployment!

