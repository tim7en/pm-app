# Network Authentication Setup Guide

## Issue Diagnosed
Your colleagues can't sign in because of Google OAuth redirect URI mismatch. The app is running on `http://192.168.1.145:3000` but Google OAuth is configured for `localhost:3000`.

## Quick Fix Applied
✅ Updated `NEXTAUTH_URL` in `.env.local` to use network IP: `http://192.168.1.145:3000`
✅ Restarted server with network configuration

## Required: Update Google Cloud Console

### Step 1: Access Google Cloud Console
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to your project (or create one if needed)
3. Go to "APIs & Services" → "Credentials"

### Step 2: Update OAuth Client
1. Find your OAuth 2.0 Client ID (currently configured with ID: `447386615051-991cas13orb6k1q826gn8h07qif3nhlr`)
2. Click on it to edit
3. In "Authorized redirect URIs" section, ADD these URLs:
   - Keep existing: `http://localhost:3000/auth/google/callback`
   - Add new: `http://192.168.1.145:3000/auth/google/callback`
   - Optional: `http://192.168.1.145:3000/api/auth/callback/google`

### Step 3: Test Authentication
1. Have your colleagues try accessing: `http://192.168.1.145:3000/auth`
2. Click "Continue with Google"
3. Should now redirect properly after Google authentication

## Alternative Solutions

### Option 1: Use Regular Email/Password
If Google OAuth setup is complex, colleagues can:
1. Go to `http://192.168.1.145:3000/auth`
2. Click "Create Account" tab
3. Register with email/password
4. Login normally

### Option 2: Temporary Localhost Mapping
Add to colleagues' Windows hosts file (`C:\Windows\System32\drivers\etc\hosts`):
```
192.168.1.145 localhost
```
Then they can use `http://localhost:3000` (requires admin access)

### Option 3: Use ngrok for External Access
```bash
npm install -g ngrok
ngrok http 3000
```
Use the provided ngrok URL for external access.

## Server Status
✅ Server running on: `http://192.168.1.145:3000`
✅ Socket.IO working: `ws://192.168.1.145:3000/api/socketio`
✅ Database connected: SQLite with Prisma
✅ Environment updated: Network IP configured

## Troubleshooting

### If Still Getting Loading Issues:
1. Check Windows Firewall - allow port 3000
2. Check router firewall settings
3. Ensure all devices on same network
4. Try browser incognito/private mode
5. Clear browser cache and cookies

### If Google OAuth Still Fails:
1. Verify redirect URI in Google Console matches exactly
2. Check browser developer tools for error messages
3. Ensure Google OAuth credentials are not placeholder values
4. Consider creating new OAuth client if needed

## Test Commands
```bash
# Check if server is accessible from network
curl http://192.168.1.145:3000/api/auth/google/url

# Check if port is open
netstat -an | findstr :3000
```

## Current Configuration Status
- ✅ Server bound to all interfaces (0.0.0.0)
- ✅ Environment variables updated for network IP
- ⚠️ Google OAuth redirect URI needs manual update in Google Console
- ✅ Regular email/password authentication working
- ✅ Database and Socket.IO functioning properly
