# 🚀 Deployment Checklist for AWS Amplify

## ⚠️ **CRITICAL: Read Before Every Deploy**

This checklist prevents the morning issues we experienced. Follow it religiously!

---

## 🔧 **Pre-Deployment Checklist**

### ✅ **Environment Variables (Amplify Console)**
Verify these are set in AWS Amplify Console → App Settings → Environment Variables:

```bash
# Required Variables
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Optional Variables
GITHUB_TOKEN=your-github-token (for private repos)
NEXT_PUBLIC_GITHUB_TOKEN=your-github-token (Amplify fallback)
```

### ✅ **Build Configuration**
- [ ] `amplify.yml` uses correct artifacts configuration
- [ ] `next.config.js` has `output: 'standalone'` for Amplify
- [ ] No duplicate security headers between files
- [ ] Build cache paths are correct

### ✅ **Code Quality**
- [ ] Run `npm run lint` - no errors
- [ ] Run `npm run type-check` - no TypeScript errors  
- [ ] Run `npm run build` locally - successful build
- [ ] Test authentication flow locally
- [ ] Test GitHub API connectivity

---

## 🏗️ **Deployment Process**

### 1. **Local Testing**
```bash
# Test the build locally first
npm run build
npm run start

# Test critical paths:
# - Authentication (/admin login)
# - File loading (GitHub API)
# - Error handling (invalid repos)
```

### 2. **Git Push**
```bash
git add .
git commit -m "Deploy: [describe changes]"
git push origin main
```

### 3. **Monitor Amplify Build**
- [ ] Watch build logs in Amplify Console
- [ ] Check for environment variable warnings
- [ ] Verify build artifacts are generated
- [ ] Test deployment URL after completion

---

## 🚨 **Common Issues & Solutions**

### **Issue: Build Fails on Amplify**
**Symptoms:** Build stops during npm run build
**Solutions:**
- Check Node.js version (should be 18+)
- Verify all dependencies in package.json
- Check for TypeScript errors
- Review amplify.yml configuration

### **Issue: Environment Variables Not Working**
**Symptoms:** "placeholder.supabase.co" in logs, authentication fails
**Solutions:**
- Use `NEXT_PUBLIC_` prefix for server-side variables on Amplify
- Verify variables are set in Amplify Console (not .env.local)
- Restart deployment after adding variables

### **Issue: GitHub API Rate Limits**
**Symptoms:** "rate limit exceeded" errors, file loading fails
**Solutions:**
- Add GITHUB_TOKEN environment variable
- Implement proper retry logic (already in code)
- Monitor GitHub API usage

### **Issue: Security Headers Conflict**
**Symptoms:** Console warnings about duplicate headers
**Solutions:**
- Remove duplicate X-Frame-Options from amplify.yml
- Keep CSP headers in next.config.js only
- Test with browser dev tools

---

## 🔍 **Post-Deployment Testing**

### **Critical Path Testing:**
1. [ ] **Landing Page** - loads without errors
2. [ ] **Authentication** - site password works
3. [ ] **Admin Panel** - admin password works  
4. [ ] **File Explorer** - GitHub files load
5. [ ] **Markdown Viewer** - content displays correctly
6. [ ] **Error Handling** - graceful failure modes

### **Performance Testing:**
- [ ] Page load times < 3 seconds
- [ ] GitHub API responses < 5 seconds
- [ ] No console errors in browser
- [ ] Mobile responsiveness works

---

## 📊 **Health Monitoring**

### **Endpoints to Monitor:**
- `GET /api/health` - Overall system health
- `GET /api/auth/check` - Authentication system
- `GET /api/github/files` - GitHub connectivity

### **Expected Responses:**
```json
// /api/health
{
  "status": "healthy",
  "checks": {
    "supabase": { "status": "pass" },
    "environment": { "status": "pass" },
    "memory": { "status": "pass" }
  }
}
```

---

## 🔄 **Rollback Plan**

### **If Deployment Fails:**
1. Check Amplify build logs for specific errors
2. Revert to last known good commit:
   ```bash
   git revert HEAD
   git push origin main
   ```
3. Fix issues in development branch
4. Test locally before re-deploying

### **Emergency Contacts:**
- AWS Amplify Console: [Your Amplify App URL]
- Supabase Dashboard: [Your Supabase Project URL]  
- GitHub Repository: https://github.com/FlamingoLogic/Markdownviewerapp

---

## 📝 **Deployment Log Template**

```
Date: [DATE]
Deployer: [NAME]
Commit: [COMMIT_HASH]
Changes: [BRIEF_DESCRIPTION]

Pre-Deploy Checklist: ✅
Build Status: ✅/❌
Post-Deploy Tests: ✅/❌
Issues Found: [NONE/DESCRIBE]
Rollback Required: ✅/❌

Notes: [ANY_ADDITIONAL_NOTES]
```

---

## 🎯 **Success Metrics**

A successful deployment should have:
- ✅ Build time < 5 minutes
- ✅ Zero TypeScript errors
- ✅ Zero console errors
- ✅ All health checks passing
- ✅ Authentication working
- ✅ GitHub API connectivity working
- ✅ Mobile responsive design working

---

**Remember: Never deploy on Friday afternoons! 😄**

*Last Updated: [Current Date]*
*Next Review: [Monthly]*