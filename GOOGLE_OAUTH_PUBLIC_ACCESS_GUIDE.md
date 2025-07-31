# Google OAuth Public Access Configuration Guide

## The Problem
Currently, your Google OAuth app shows "Access blocked: Authorization Error" because it's in **testing mode**, which only allows specific test users to authenticate.

## Solution: Publish Your OAuth App

### Step 1: Complete OAuth Consent Screen Configuration

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to "APIs & Services" > "OAuth consent screen"
3. Complete all required sections:

#### User Type
- Choose **"External"** to allow any Google user

#### OAuth Consent Screen
- **App name**: Your app name (e.g., "PM App")
- **User support email**: Your email address
- **App logo**: Upload a logo (optional but recommended)
- **App domain**: Your website domain (can be localhost for development)
- **Authorized domains**: Add your domains:
  - `localhost` (for development)
  - Your production domain (when ready)
- **Developer contact information**: Your email address

#### Scopes
Add the following scopes:
- `../auth/userinfo.email`
- `../auth/userinfo.profile`
- `openid`

#### Test Users (Only needed if staying in testing mode)
- Add specific email addresses that can test your app
- **OR** proceed to publish the app (recommended)

### Step 2: Publish Your App (Recommended)

1. In the OAuth consent screen, click **"PUBLISH APP"**
2. You may see a warning about verification - this is normal
3. For apps requesting only basic scopes (email, profile), verification is not required
4. Click **"CONFIRM"** to publish

### Step 3: Update Your Environment Variables

You need to get your actual Google OAuth credentials:

1. Go to "APIs & Services" > "Credentials"
2. Click on your OAuth 2.0 Client ID
3. Copy the **Client ID** and **Client Secret**

Update your `.env` file with real credentials:

```env
# Replace these placeholder values with your actual Google OAuth credentials
GOOGLE_CLIENT_ID="123456789-abcdefghijklmnop.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-abcdefghijklmnopqrstuvwxyz"
```

### Step 4: Configure OAuth URLs

In your Google Cloud Console OAuth 2.0 Client, configure these URLs:

#### Authorized JavaScript Origins (where your app runs):
- `http://localhost:3000`
- `http://localhost:3001`

#### Authorized Redirect URIs (where Google sends users back):
- `http://localhost:3000/api/auth/google/callback`
- `http://localhost:3001/api/auth/google/callback`
- Your production callback URL when ready

**Important**: URLs must match exactly - no trailing slashes on origins!

### Step 5: Verify Configuration

After updating your credentials, test the configuration:

1. Start your server: `npm run dev`
2. Visit: `http://localhost:3001/api/auth/google/url`
3. You should see a JSON response with `"configured": true`
4. Try the Google login flow at: `http://localhost:3001/auth/login`

## Development vs Production

### Development (Current)
- **App Status**: Testing or Published
- **User Access**: Any Google user (once published)
- **Domain**: localhost
- **HTTPS**: Not required

### Production (Future)
- **App Status**: Published (possibly verified)
- **User Access**: Any Google user
- **Domain**: Your production domain
- **HTTPS**: Required
- **Verification**: May be required for sensitive scopes

## Common Issues and Solutions

### Issue: "Access blocked: Authorization Error"
**Cause**: App is in testing mode with restricted users
**Solution**: Publish the app or add user to test users list

### Issue: "OAuth client was not found"
**Cause**: Invalid Client ID or Client Secret
**Solution**: Double-check credentials from Google Console

### Issue: "redirect_uri_mismatch"
**Cause**: Callback URL doesn't match registered URIs
**Solution**: Add exact callback URL to authorized redirect URIs

### Issue: "invalid_client"
**Cause**: Client Secret is incorrect or missing
**Solution**: Regenerate and update Client Secret

## Security Considerations

1. **Client Secret Security**: Never expose in client-side code
2. **HTTPS in Production**: Always use HTTPS for production OAuth flows
3. **Scope Limitation**: Only request necessary scopes
4. **Regular Rotation**: Periodically rotate your Client Secret
5. **Monitor Usage**: Check Google Console for unusual activity

## Testing with Multiple Users

Once published, you can test with:
- Your personal Google account
- Any Gmail/Google Workspace account
- Different browsers/incognito windows
- Mobile devices

The key is publishing the OAuth app to remove the "testing mode" restrictions!
