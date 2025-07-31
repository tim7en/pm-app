# Gmail Integration Setup Guide

## 1. Google Cloud Console Setup

### Create a Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the Gmail API:
   - Go to "APIs & Services" > "Library"
   - Search for "Gmail API"
   - Click "Enable"

### Create OAuth 2.0 Credentials
1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client ID"
3. Configure OAuth consent screen first if prompted
4. Choose "Web application" as application type
5. Add authorized JavaScript origins:
   - `http://localhost:3000` (development)
   - `https://yourdomain.com` (production)
6. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (development)
   - `https://yourdomain.com/api/auth/callback/google` (production)
7. Save the Client ID and Client Secret

## 2. Environment Variables

Add these to your `.env.local` file:

```env
# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000

# Gmail API
GMAIL_SCOPE=https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.send
```

## 3. Required Dependencies

```bash
npm install googleapis google-auth-library
```

## 4. NextAuth Configuration

The app will need NextAuth.js configured with Google provider to handle OAuth authentication and token management.

## 5. Gmail API Implementation

The Gmail API requires:
- OAuth 2.0 authentication
- Access tokens for API calls
- Refresh token handling
- Proper scope permissions

## 6. Security Considerations

- Store refresh tokens securely in database
- Use HTTPS in production
- Implement proper error handling
- Rate limiting for API calls
- User consent for email access

## 7. Implementation Steps

1. Set up OAuth flow
2. Store user tokens in database
3. Implement Gmail API wrapper
4. Create email sync functionality
5. Handle real-time updates
6. Implement error handling and retry logic
