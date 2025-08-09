# 🔐 Google OAuth Setup Guide - Fix "400: invalid_request" Error

## 🚨 Current Issue
**Error**: "You can't sign in to this app because it doesn't comply with Google's OAuth 2.0 policy"
**Cause**: Incorrect Google OAuth configuration in your PM-App

## 🎯 **Quick Fix Options**

### **Option 1: Fix Google OAuth (Recommended for Production)**

#### Step 1: Update Environment Configuration
```bash
# Update your .env.local file
NEXTAUTH_URL="http://localhost:3000"  # Changed from IP to localhost
GOOGLE_CLIENT_ID="your-new-client-id"
GOOGLE_CLIENT_SECRET="your-new-client-secret"
```

#### Step 2: Create New Google OAuth App
1. **Go to Google Cloud Console**: https://console.cloud.google.com/
2. **Create/Select Project**: 
   - Click "Select a project" → "New Project"
   - Name: "PM-App" → Create

3. **Enable Google+ API**:
   - Navigate to "APIs & Services" → "Library"
   - Search "Google+ API" → Enable
   - Also enable "Gmail API" (if using Gmail integration)

4. **Configure OAuth Consent Screen**:
   - Go to "APIs & Services" → "OAuth consent screen"
   - Choose "External" → Create
   - Fill required fields:
     - **App name**: PM-App
     - **User support email**: your-email@gmail.com
     - **Developer contact**: your-email@gmail.com
   - Click "Save and Continue"

5. **Create OAuth Credentials**:
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth 2.0 Client IDs"
   - **Application type**: Web application
   - **Name**: PM-App OAuth
   - **Authorized redirect URIs**: 
     - `http://localhost:3000/api/auth/callback/google`
     - `http://127.0.0.1:3000/api/auth/callback/google`
   - Click "Create"
   - **Copy Client ID and Client Secret**

### **Option 2: Disable Google OAuth (Quick Solution)**

If you want to skip Google OAuth for now, let's disable it:
