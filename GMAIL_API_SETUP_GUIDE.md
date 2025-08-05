# 🚀 Gmail API Setup Guide

## 🚨 **IMPORTANT: Enable Gmail API First!**

The Gmail API must be enabled in your Google Cloud Console project before OAuth will work.

## 📝 **Step-by-Step Setup Instructions**

### **1. Go to Google Cloud Console**
- Open: https://console.cloud.google.com/
- Make sure you're in the correct project: `LoginToPm`

### **2. Enable Gmail API**
1. **Go to**: APIs & Services → Library
2. **Search for**: "Gmail API"
3. **Click on**: "Gmail API" 
4. **Click**: "Enable" button

**Direct link**: https://console.cloud.google.com/apis/library/gmail.googleapis.com

### **3. Verify API is Enabled**
1. **Go to**: APIs & Services → Enabled APIs & services
2. **Look for**: "Gmail API" in the list
3. **Status should be**: "Enabled"

### **4. Check OAuth Consent Screen**
1. **Go to**: APIs & Services → OAuth consent screen
2. **Make sure**:
   - App name is set
   - User support email is provided
   - Scopes include Gmail permissions
   - Test users include your email address

### **5. Verify OAuth Client Configuration**
1. **Go to**: APIs & Services → Credentials
2. **Click on your OAuth 2.0 Client ID**: `447386615051-991c...`
3. **Check Authorized redirect URIs includes**:
   ```
   http://localhost:3000/api/email/gmail/callback
   ```

## 🔧 **Required Scopes for Gmail Integration**

Your app needs these Gmail API scopes:
- `https://www.googleapis.com/auth/gmail.readonly` - Read emails
- `https://www.googleapis.com/auth/gmail.modify` - Modify emails (mark as read, etc.)

## 🧪 **Test After Enabling API**

1. **Wait 2-3 minutes** for API enablement to propagate
2. **Go to**: http://localhost:3000/email-cleanup
3. **Click**: Gmail Test tab
4. **Click**: "Connect Gmail" button
5. **Should work** without errors now!

## 🎯 **Expected OAuth Flow**

1. Click "Connect Gmail" → Redirects to Google OAuth
2. Sign in with your Google account
3. Grant permissions for Gmail access
4. Redirects back to app with success message
5. Gmail connection status shows "Connected"
6. Can now analyze real emails

## 🆘 **If Still Having Issues**

### **Common Problems After Enabling API:**
1. **Cache delay**: Wait 2-3 minutes after enabling
2. **Redirect URI**: Must match exactly in OAuth client
3. **Test users**: Your email must be added to OAuth consent screen
4. **Scopes**: Gmail scopes must be configured

### **Debug Steps:**
1. **Check browser console** (F12) for error messages
2. **Look at server logs** for API error details
3. **Verify API quota** hasn't been exceeded
4. **Try incognito browser** to clear auth cache

## 🎉 **Success Indicators**

✅ Gmail API shows "Enabled" in Google Cloud Console  
✅ OAuth flow completes without redirect_uri_mismatch  
✅ User grants Gmail permissions successfully  
✅ App shows "Gmail Connected" status  
✅ Can fetch and analyze real unread emails  

---

**The Gmail API enablement is the most common reason for connection failures!** 🚀
