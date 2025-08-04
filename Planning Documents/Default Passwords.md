# 🔐 Default Passwords

**GitHub Markdown WebApp - Authentication Reference**

---

## 📝 Overview

This document contains the default passwords for accessing different parts of the GitHub Markdown WebApp. These passwords are used for initial setup and testing purposes.

## 🔑 Default Credentials

### Site Access (Main Application)
- **Username**: Not required
- **Password**: `TempSite2024!`
- **Purpose**: Access to view markdown files and browse documentation
- **Usage**: Enter this password on the main login screen to access the file viewer

### Admin Panel Access
- **Username**: Not required  
- **Password**: `TempAdmin2024!`
- **Purpose**: Administrative configuration and settings
- **Usage**: Access via `/admin` route or "Admin Panel" button in the top navigation
- **Features**:
  - Configure GitHub repository settings
  - Set up Supabase database connection
  - Manage folder permissions
  - Update site branding and settings

## 🔧 Password Configuration

### How Passwords Are Stored
- Passwords are hashed using **bcrypt** with salt rounds
- Site password hash is stored in Supabase `site_config` table
- Admin password hash is stored in the same configuration table
- No plain text passwords are stored anywhere in the system

### Environment Variables
```bash
# Supabase Configuration (Required)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# GitHub Integration (Required)
GITHUB_TOKEN=your_github_personal_access_token
```

### Database Schema
The passwords are stored in the `site_config` table:
```sql
- site_password_hash: VARCHAR (bcrypt hash of TempSite2024!)
- admin_password_hash: VARCHAR (bcrypt hash of TempAdmin2024!)
```

## 🚨 Security Notes

### For Production Use
- **⚠️ IMPORTANT**: Change these default passwords before deploying to production
- Use strong, unique passwords for both site and admin access
- Consider implementing additional authentication methods
- Regular password rotation is recommended

### Authentication Features
- **Rate Limiting**: Failed login attempts are rate limited per IP
- **Session Management**: Secure session cookies with expiration
- **Input Validation**: Password format validation and sanitization
- **HTTPS Only**: All authentication should happen over HTTPS in production

## 🛠️ Changing Default Passwords

### Via Admin Panel
1. Login to admin panel with `TempAdmin2024!`
2. Navigate to "Security Settings" section
3. Update both site and admin passwords
4. Save configuration to update database

### Via Database (Advanced)
1. Generate new bcrypt hashes for your passwords
2. Update the `site_config` table directly
3. Restart the application to pick up changes

## 📚 Related Documentation

- [GitHub Markdown WebApp.md](./GitHub%20Markdown%20WebApp.md) - Main project documentation
- [README.md](../README.md) - Setup and installation guide

## 🔄 Password Reset Process

If you forget the passwords:
1. Check this document for defaults
2. Use the debug endpoints to verify current configuration
3. Use the password fix endpoint to reset to defaults if needed
4. Contact system administrator for production environments

---

**Last Updated**: January 2025  
**Version**: 1.0  
**Status**: Active for Development/Testing