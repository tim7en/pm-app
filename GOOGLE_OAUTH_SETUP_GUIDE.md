# Google OAuth Setup Guide

## Step 1: Create Google OAuth Application

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API:
   - Go to "APIs & Services" > "Library"
   - Search for "Google+ API" and enable it
   - Also enable "Google People API" for better user info access

## Step 2: Create OAuth 2.0 Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client IDs"
3. If prompted, configure the OAuth consent screen first:
   - Choose "External" user type
   - Fill in required fields:
     - App name: "PM App" (or your app name)
     - User support email: your email
     - Developer contact information: your email
   - Add scopes: email, profile, openid
   - Add test users if needed

4. Create OAuth 2.0 Client ID:
   - Application type: "Web application"
   - Name: "PM App Web Client"
   - Authorized JavaScript origins:
     - http://localhost:3000
     - http://localhost:3001
   - Authorized redirect URIs:
     - http://localhost:3000/api/auth/google/callback
     - http://localhost:3001/api/auth/google/callback

## Step 3: Copy Credentials

After creating the OAuth client, you'll get:
- Client ID (looks like: 123456789-abcdefghijklmnop.apps.googleusercontent.com)
- Client Secret (looks like: GOCSPX-abcdefghijklmnop)

## Step 4: Update Environment Variables

Add these to your .env file:

```
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
NEXTAUTH_URL=http://localhost:3001
```

## Step 5: Test the Integration

1. Start your development server
2. Go to http://localhost:3001/auth/login
3. Click "Continue with Google"
4. Complete the OAuth flow

## Common Issues and Fixes

### Error 401: invalid_client
- Double-check your Client ID and Client Secret
- Make sure the redirect URI matches exactly
- Verify the OAuth consent screen is configured

### Error 400: redirect_uri_mismatch
- The redirect URI in your Google Console must match exactly
- Check both localhost:3000 and localhost:3001 are added

### Error 403: access_denied
- Make sure your email is added as a test user
- Check if your app needs verification for production use

## Production Setup

For production, you'll need to:
1. Add your production domain to authorized origins and redirect URIs
2. Complete the OAuth app verification process
3. Update NEXTAUTH_URL to your production URL
4. Use HTTPS for all redirect URIs

## Security Best Practices

1. Keep your Client Secret confidential
2. Use HTTPS in production
3. Regularly rotate your Client Secret
4. Monitor your OAuth usage in Google Console
5. Implement proper error handling for OAuth failures
