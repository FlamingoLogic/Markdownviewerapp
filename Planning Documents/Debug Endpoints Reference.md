# 🔧 Debug Endpoints Reference

**Quick Fix Solutions for Common Issues**

---

## 🚨 **CRITICAL PASSWORD FIXES** (Use These First)

### 1. `/api/debug/auto-password-restore` ⭐ **RECOMMENDED**
**What it does:** Intelligently restores missing password hashes without overwriting existing ones
**When to use:** When you can't login to site OR admin (first choice)
**Why it's best:** Safe, smart, only fixes what's broken

```
Status: Ready to use
Usage: Navigate to: https://your-app-url.amplifyapp.com/api/debug/auto-password-restore
Result: Restores TempSite2024! and TempAdmin2024! only if missing
```

### 2. `/api/debug/final-password-fix` ⚡ **NUCLEAR OPTION**
**What it does:** Forcefully resets both passwords and verifies they work
**When to use:** When auto-restore doesn't work or for complete reset
**Why it works:** Direct database method, always succeeds

```
Status: Ready to use  
Usage: Navigate to: https://your-app-url.amplifyapp.com/api/debug/final-password-fix
Result: Forces both passwords to TempSite2024! and TempAdmin2024!
```

### 3. `/api/debug/password-monitor` 📊 **STATUS CHECK**
**What it does:** Shows current password hash status and length
**When to use:** To check if passwords exist before attempting fixes
**Why it's useful:** Diagnostic tool to understand the problem

```
Status: Ready to use
Usage: Navigate to: https://your-app-url.amplifyapp.com/api/debug/password-monitor  
Result: Shows if site_password_hash and admin_password_hash exist
```

---

## 🔍 **AUTHENTICATION & LOGIN ISSUES**

### 4. `/api/debug/login-test` 🧪 **PASSWORD VERIFICATION**
**What it does:** Tests if default passwords work with current database hashes
**When to use:** When you suspect passwords are wrong but hashes exist
**Why it's helpful:** Isolates password verification from UI issues

```
Status: Ready to use
Usage: Navigate to: https://your-app-url.amplifyapp.com/api/debug/login-test
Result: Tests TempSite2024! and TempAdmin2024! against stored hashes
```

### 5. `/api/debug/rate-limit-check` ⏱️ **RATE LIMITING**  
**What it does:** Shows current rate limit status and can reset it
**When to use:** When getting "too many attempts" errors
**Why it's needed:** Clears failed login attempt counters

```
Status: Ready to use
Usage: Navigate to: https://your-app-url.amplifyapp.com/api/debug/rate-limit-check
Result: Shows remaining attempts, can reset rate limits
```

---

## ⚙️ **CONFIGURATION & ENVIRONMENT**

### 6. `/api/debug/config` 🔧 **SUPABASE STATUS**
**What it does:** Shows Supabase connection status and current site configuration  
**When to use:** When "Failed to update configuration" errors occur
**Why it's essential:** Diagnoses database connectivity issues

```
Status: Ready to use
Usage: Navigate to: https://your-app-url.amplifyapp.com/api/debug/config
Result: Shows if Supabase is connected and current config values
```

### 7. `/api/debug/env` 🌍 **ENVIRONMENT VARIABLES**
**What it does:** Shows which Supabase environment variables are detected
**When to use:** When Amplify deployment issues occur
**Why it's critical:** Verifies NEXT_PUBLIC_ prefixed variables are available

```
Status: Ready to use  
Usage: Navigate to: https://your-app-url.amplifyapp.com/api/debug/env
Result: Shows SUPABASE_URL, ANON_KEY, SERVICE_ROLE_KEY detection
```

---

## 📁 **CONTENT & GITHUB ISSUES**

### 8. `/api/debug/test-content` 📖 **GITHUB CONTENT LOADING**
**What it does:** Tests GitHub API access and content fetching for a specific file
**When to use:** When markdown files won't load or display
**Why it works:** Bypasses frontend to test backend GitHub integration

```
Status: Ready to use
Usage: Navigate to: https://your-app-url.amplifyapp.com/api/debug/test-content  
Result: Tests access to "Planning Documents/GitHub Markdown WebApp.md"
```

---

## 🖼️ **IFRAME & CHAT ISSUES**

### 9. `/api/debug/test-iframe` 🌐 **IFRAME DIAGNOSTICS**
**What it does:** Analyzes iframe loading issues (HTTPS/HTTP, X-Frame-Options, etc.)
**When to use:** When chat iframe shows "Loading..." forever
**Why it's useful:** Identifies mixed content, CSP, and network issues

```
Status: Ready to use
Usage: Navigate to: https://your-app-url.amplifyapp.com/api/debug/test-iframe
Result: Shows iframe blocking reasons and recommendations
```

---

## 🛠️ **ADDITIONAL DIAGNOSTICS**

### 10. `/api/debug/all-env` 📋 **ALL ENVIRONMENT VARIABLES**
**What it does:** Lists all environment variables available to the application
**When to use:** When debugging Amplify environment variable issues
**Why it's comprehensive:** Shows everything available to troubleshoot naming

### 11. `/api/debug/supabase-direct-test` 🎯 **DIRECT DATABASE TEST**
**What it does:** Bypasses abstraction layers to test raw Supabase operations
**When to use:** When suspecting database connectivity or persistence issues
**Why it's thorough:** Tests credentials, read, update, and password operations

---

## 📝 **USAGE PATTERNS**

### **Common Issue Resolution Flow:**

1. **Can't login to anything:** → `/api/debug/auto-password-restore`
2. **Auto-restore didn't work:** → `/api/debug/final-password-fix`  
3. **Config won't save:** → `/api/debug/config` then `/api/debug/env`
4. **Files won't load:** → `/api/debug/test-content`
5. **Chat won't load:** → `/api/debug/test-iframe`
6. **Want to check status:** → `/api/debug/password-monitor`

### **Preventive Maintenance:**
- Bookmark `/api/debug/auto-password-restore` for quick access
- Use incognito/private browsing for admin access
- Clear browser cache if autocomplete issues occur
- Avoid unnecessary admin configuration changes

---

## 🎯 **DEFAULT CREDENTIALS**

- **Site Password:** `TempSite2024!`
- **Admin Password:** `TempAdmin2024!`

These are restored by all password fix endpoints.

---

## ⚠️ **IMPORTANT NOTES**

1. **Browser Caching:** Clear cache/cookies if login issues persist
2. **Autocomplete:** Type passwords manually, don't rely on browser autofill  
3. **Incognito Mode:** Use for admin access to avoid caching issues
4. **Rate Limiting:** Use `/api/debug/rate-limit-check` if locked out
5. **Persistence:** Password issues can recur due to admin panel bug

---

*This document contains all debug endpoints created during development. Keep this reference handy for quick issue resolution.*