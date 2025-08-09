# 🚀 Quick Google OAuth Setup for Public Access

## Current Issue
Your app shows "Access blocked: Authorization Error" because:
1. Google OAuth credentials are not configured (still using placeholder values)
2. OR your OAuth app is in testing mode (restricts to specific users only)

## ✅ Solution: 5-Minute Setup

### Step 1: Go to Google Cloud Console
1. Open: https://console.cloud.google.com/
2. Create a new project or select existing one
3. Make sure billing is enabled (free tier is fine)

### Step 2: Enable Required APIs
1. Go to "APIs & Services" > "Library"
2. Search and enable:
   - **Google+ API**
   - **Google People API** (recommended)

### Step 3: Configure OAuth Consent Screen
1. Go to "APIs & Services" > "OAuth consent screen"
2. Choose **"External"** user type (allows any Google user)
3. Fill required fields:
   ```
   App name: PM App (or your app name)
   User support email: your-email@gmail.com
   Developer contact: your-email@gmail.com
   ```
4. Add scopes:
   - `../auth/userinfo.email`
   - `../auth/userinfo.profile`
   - `openid`
5. **IMPORTANT**: Click "PUBLISH APP" button
   - This removes the "testing mode" restriction
   - Allows ANY Google user to authenticate
   - No verification needed for basic scopes

### Step 4: Create OAuth 2.0 Client
1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client IDs"
3. Application type: **"Web application"**
4. Name: "PM App Web Client"
5. **Authorized redirect URIs** (add both):
   ```
   http://localhost:3001/api/auth/google/callback
   http://localhost:3000/api/auth/google/callback
   ```
6. Click "Create"
7. **Copy the Client ID and Client Secret**

### Step 5: Update Your .env File
Replace the placeholder values in your `.env` file:

```env
# Replace these with your actual values from Google Console
GOOGLE_CLIENT_ID="123456789-abcdef.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-your-actual-secret-here"
```

### Step 6: Test Configuration
1. Run the checker: `node check-google-oauth.js`
2. Should show: ✅ Google OAuth configuration appears to be complete!
3. Start server: `npm run dev`
4. Test OAuth URL: visit `http://localhost:3001/api/auth/google/url`
5. Try login: visit `http://localhost:3001/auth/login`

## 🎯 Key Points for Public Access

### ✅ What Allows Any User to Login:
1. **App Status**: Published (not in testing mode)
2. **User Type**: External (not internal)
3. **Scopes**: Only basic scopes (email, profile) - no verification needed
4. **Client Type**: Web application with correct redirect URIs

### ❌ What Restricts Access:
1. **Testing Mode**: Only allows specified test users
2. **Internal App**: Only allows your organization's users
3. **Missing Scopes**: App won't work without proper scopes
4. **Wrong Redirect URIs**: OAuth flow will fail

### 🔒 Security Notes:
- Your app will work for ANY Google account once published
- No additional verification required for basic scopes
- Users will see a consent screen showing what permissions you're requesting
- For production, use HTTPS redirect URIs

## 🐛 Troubleshooting

### Error: "OAuth client was not found"
- Double-check your Client ID in .env
- Make sure it ends with `.apps.googleusercontent.com`

### Error: "Access blocked: Authorization Error"
- Your app is still in testing mode
- Go to OAuth consent screen and click "PUBLISH APP"

### Error: "redirect_uri_mismatch"
- Add exact callback URL to authorized redirect URIs
- Check spelling and protocol (http vs https)

### Success Indicators:
✅ Google login page appears  
✅ User can grant permissions  
✅ User is redirected back to your app  
✅ User is logged in with Google account info  

## 📝 Final Checklist

- [ ] Google Cloud project created
- [ ] Required APIs enabled
- [ ] OAuth consent screen configured as "External"
- [ ] App status is "PUBLISHED" (not testing)
- [ ] OAuth 2.0 client created with correct redirect URIs
- [ ] Client ID and Secret copied to .env file
- [ ] Configuration checker shows ✅ success
- [ ] Test login works with any Google account

Once completed, **any user with a Google account** can login or register with your app!
