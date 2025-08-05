# 🔧 Fix Google OAuth "redirect_uri_mismatch" Error

## 🚨 **Error Explanation**
The error `redirect_uri_mismatch` means that the redirect URI we're sending in the OAuth request doesn't match what's configured in your Google Cloud Console OAuth2 credentials.

## 📝 **Step-by-Step Fix Instructions**

### **1. Open Google Cloud Console**
Go to: https://console.cloud.google.com/

### **2. Navigate to Credentials**
1. **Select your project** (the one where you created the OAuth credentials)
2. **Go to**: APIs & Services → Credentials
3. **Find your OAuth 2.0 Client ID** (starts with `447386615051-...`)

### **3. Edit OAuth Client Configuration**
1. **Click on your OAuth 2.0 Client ID** to edit it
2. **Scroll down to "Authorized redirect URIs"**
3. **Add the following URI exactly** (case-sensitive):
   ```
   http://localhost:3000/api/email/gmail/callback
   ```

### **4. Save Configuration**
1. **Click "Save"** at the bottom
2. **Wait 5-10 minutes** for changes to propagate (Google's servers need time)

### **5. Alternative Redirect URIs to Try**
If the above doesn't work, also add these variations:
```
http://localhost:3000/api/email/gmail/callback
https://localhost:3000/api/email/gmail/callback  
http://127.0.0.1:3000/api/email/gmail/callback
```

## 🔄 **After Making Changes**

### **Wait for Propagation**
- Google OAuth changes can take **5-10 minutes** to take effect
- Don't test immediately after saving

### **Test the Connection Again**
1. **Go to**: http://localhost:3000/email-cleanup
2. **Click**: Gmail Test tab
3. **Click**: "Connect Gmail" button
4. **Should work** without the redirect_uri_mismatch error

## 🏗️ **Complete OAuth Setup Checklist**

### **In Google Cloud Console:**
- ✅ **Project created** with Gmail API enabled
- ✅ **OAuth 2.0 Client ID** created
- ✅ **Authorized redirect URIs** includes:
  - `http://localhost:3000/api/email/gmail/callback`
- ✅ **Scopes configured** (Gmail read/modify)

### **In Your .env File:**
- ✅ **GOOGLE_CLIENT_ID**: `447386615051-991cas13orb6k1q826gn8h07qif3nhlr.apps.googleusercontent.com`
- ✅ **GOOGLE_CLIENT_SECRET**: `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`
- ✅ **GOOGLE_REDIRECT_URI**: `http://localhost:3000/api/email/gmail/callback`

## 🎯 **Quick Test**
After making the changes and waiting 5-10 minutes:

1. **Restart your development server**:
   ```bash
   # Press Ctrl+C to stop the server, then:
   npm run dev
   ```

2. **Test the OAuth URL generation**:
   ```bash
   curl "http://localhost:3000/api/email/gmail/connect"
   ```

3. **Try Gmail connection again** in the UI

## 🆘 **If Still Having Issues**

### **Common Problems:**
1. **Time delay**: Google changes take 5-10 minutes
2. **Case sensitivity**: URI must match exactly
3. **Protocol mismatch**: Use `http://` not `https://` for localhost
4. **Port number**: Must include `:3000`

### **Debug Steps:**
1. **Check the exact error** in browser developer tools (F12)
2. **Verify redirect URI** in Google Cloud Console matches exactly
3. **Clear browser cache** and cookies for Google
4. **Try incognito/private browser** window

## 🎉 **Expected Result**
After fixing the redirect URI, you should:
1. Click "Connect Gmail" 
2. See Google OAuth popup (no error)
3. Sign in with your Gmail account
4. Grant permissions
5. Get redirected back with "Gmail Connected" status
6. Be able to analyze your real unread emails!

---

**The fix is simple: just add the redirect URI to your Google Cloud Console OAuth configuration and wait a few minutes for it to propagate!** 🚀
