# Authentication System Setup Guide

## Overview

The Project Manager application now includes a comprehensive authentication system with the following features:

- ✅ **Email/Password Authentication**
- ✅ **Google OAuth Sign-In**
- ✅ **Password Reset via Email**
- ✅ **Account Security (lockout, failed attempts tracking)**
- ✅ **JWT Token-based Sessions**
- ✅ **Production-ready Security**

## Quick Start

### 1. Environment Setup

Create a `.env.local` file in the root directory:

```bash
cp .env.template .env.local
```

Fill in the required environment variables:

```env
# JWT Secret (generate a secure random string)
JWT_SECRET="your-very-long-and-secure-jwt-secret-key-here"

# NextAuth Configuration
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="another-secure-random-string"

# Database (already configured)
DATABASE_URL="file:./db/custom.db"
```

### 2. Database Migration

Apply the authentication schema changes:

```bash
npx prisma db push
npx prisma generate
```

### 3. Start the Development Server

```bash
npm run dev
```

### 4. Test Basic Authentication

Visit `http://localhost:3000/auth` and test:
- User registration
- User login
- Password reset (without email for now)

## Email Configuration (Optional but Recommended)

### Gmail Setup

1. Enable 2-factor authentication on your Gmail account
2. Generate an App Password:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate password for "Mail"

3. Add to `.env.local`:

```env
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-16-digit-app-password"
SMTP_FROM="your-email@gmail.com"
```

### Alternative Email Providers

#### SendGrid
```env
SMTP_HOST="smtp.sendgrid.net"
SMTP_PORT="587"
SMTP_USER="apikey"
SMTP_PASS="your-sendgrid-api-key"
```

#### AWS SES
```env
SMTP_HOST="email-smtp.us-east-1.amazonaws.com"
SMTP_PORT="587"
SMTP_USER="your-aws-access-key"
SMTP_PASS="your-aws-secret-key"
```

## Google OAuth Setup (Optional but Recommended)

### 1. Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable the Google+ API
4. Create OAuth 2.0 credentials:
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth 2.0 Client ID"
   - Choose "Web application"

### 2. Configure OAuth Redirect URIs

Add these authorized redirect URIs:
- Development: `http://localhost:3000/auth/google/callback`
- Production: `https://yourdomain.com/auth/google/callback`

### 3. Add Credentials to Environment

```env
GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-client-secret"
```

## Testing the System

### Manual Testing

1. **Registration Flow**:
   - Visit `/auth`
   - Click "Sign Up" tab
   - Register with new email/password
   - Verify successful registration

2. **Login Flow**:
   - Use registered credentials
   - Verify successful login and redirect

3. **Password Reset Flow**:
   - Click "Forgot your password?"
   - Enter email address
   - Check email for reset link (if SMTP configured)
   - Complete password reset

4. **Google OAuth Flow**:
   - Click "Continue with Google"
   - Complete Google authentication
   - Verify account creation/login

### Automated Testing

Run the test script:

```bash
node test-auth-system.js
```

## Security Features

### Account Protection
- ✅ 5 failed login attempts trigger 30-minute lockout
- ✅ Password reset tokens expire in 1 hour
- ✅ JWT tokens expire in 30 days
- ✅ Passwords hashed with bcrypt (12 rounds)

### Data Protection
- ✅ HTTP-only cookies prevent XSS
- ✅ Email addresses normalized (lowercase)
- ✅ Input validation and sanitization
- ✅ Secure token generation (256-bit entropy)

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user info

### Password Reset
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token

### Google OAuth
- `GET /api/auth/google/url` - Get OAuth authorization URL
- `POST /api/auth/google` - Complete OAuth flow

## File Structure

```
src/
├── app/
│   ├── auth/
│   │   ├── page.tsx                    # Main auth page (login/register)
│   │   ├── forgot-password/
│   │   │   └── page.tsx               # Forgot password page
│   │   ├── reset-password/
│   │   │   └── page.tsx               # Reset password page
│   │   └── google/
│   │       └── callback/
│   │           └── page.tsx           # Google OAuth callback
│   └── api/
│       └── auth/
│           ├── login/route.ts         # Login API
│           ├── register/route.ts      # Registration API
│           ├── logout/route.ts        # Logout API
│           ├── me/route.ts           # User info API
│           ├── forgot-password/route.ts # Password reset request
│           ├── reset-password/route.ts  # Password reset completion
│           └── google/
│               ├── route.ts           # Google OAuth handler
│               └── url/route.ts       # OAuth URL generator
├── lib/
│   ├── auth.ts                        # Authentication utilities
│   └── email.ts                       # Email service
└── contexts/
    └── AuthContext.tsx               # Authentication context
```

## Production Deployment

### Environment Variables (Production)

```env
NODE_ENV="production"
JWT_SECRET="very-long-secure-production-jwt-secret"
NEXTAUTH_URL="https://yourdomain.com"
NEXTAUTH_SECRET="very-long-secure-production-nextauth-secret"

# Configure production SMTP
SMTP_HOST="your-production-smtp-host"
SMTP_USER="your-production-smtp-user"
SMTP_PASS="your-production-smtp-password"

# Configure production Google OAuth
GOOGLE_CLIENT_ID="your-production-client-id"
GOOGLE_CLIENT_SECRET="your-production-client-secret"
```

### Security Checklist

- [ ] Change all default secrets
- [ ] Enable HTTPS/SSL
- [ ] Configure secure SMTP
- [ ] Set up monitoring and logging
- [ ] Test password reset emails
- [ ] Verify Google OAuth flow
- [ ] Run security audit
- [ ] Test account lockout functionality

## Troubleshooting

### Common Issues

1. **"Google OAuth not configured" error**
   - Check GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env.local
   - Verify Google Cloud Console setup

2. **Email not sending**
   - Check SMTP configuration
   - Verify app password for Gmail
   - Check firewall settings

3. **JWT errors**
   - Ensure JWT_SECRET is set and secure
   - Check token expiration settings

4. **Database errors**
   - Run `npx prisma db push` to apply schema changes
   - Check DATABASE_URL configuration

### Debug Mode

Enable detailed logging by adding:

```env
DEBUG="true"
```

## Support

For additional help:
1. Check the console logs for detailed error messages
2. Verify all environment variables are set correctly
3. Test each component individually
4. Review the AUTH_PRODUCTION_READY_REPORT.md for detailed assessment

---

*Last updated: July 31, 2025*
