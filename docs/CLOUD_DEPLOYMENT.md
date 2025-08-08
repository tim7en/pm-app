# 🚀 PM-App Cloud Deployment Guide

## 📋 Environment Variables Setup for Production

### ⚠️ Security Rules:
1. **NEVER** commit `.env` files with real secrets to GitHub
2. **ALWAYS** use cloud platform environment variable settings
3. **GENERATE** new secrets for production (don't reuse development secrets)

## 🔧 Step-by-Step Cloud Deployment

### 1. **Prepare Your Repository**

Your `.gitignore` already protects `.env*` files ✅

Files safe to commit to GitHub:
- ✅ `.env.example` (template with placeholder values)
- ✅ `.env.template` (backup template)
- ✅ `docker-compose.yml` (uses environment variables)
- ✅ `Dockerfile` (production ready)
- ❌ `.env` (contains real secrets - protected by .gitignore)
- ❌ `.env.local` (contains real secrets - protected by .gitignore)

### 2. **Generate Production Secrets**

```bash
# Generate secure secrets (run on your local machine)
openssl rand -base64 32  # For NEXTAUTH_SECRET
openssl rand -base64 32  # For JWT_SECRET
```

### 3. **Cloud Platform Setup**

#### **🌐 For Vercel:**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard:
# https://vercel.com/your-username/pm-app/settings/environment-variables
```

#### **🐙 For GitHub Pages + GitHub Actions:**
```bash
# Set in: Repository → Settings → Secrets and variables → Actions
# Add these as "Repository secrets":
```

#### **☁️ For Google Cloud Run:**
```bash
# Deploy with environment variables
gcloud run deploy pm-app \
  --source . \
  --set-env-vars="NODE_ENV=production,NEXTAUTH_SECRET=your-secret"
```

#### **🔧 For DigitalOcean App Platform:**
```bash
# Set in app dashboard under "Environment Variables"
```

#### **🟦 For Azure Container Instances:**
```bash
# Set in Azure portal under "Environment variables"
```

### 4. **Required Environment Variables for Production**

#### **🔴 CRITICAL (App won't work without these):**
```
NODE_ENV=production
NEXTAUTH_SECRET=your-32-char-secret
JWT_SECRET=your-32-char-secret
NEXTAUTH_URL=https://your-domain.com
DATABASE_URL=your-production-database-url
```

#### **🟡 RECOMMENDED (For full features):**
```
OPENAI_API_KEY=sk-your-openai-key
GOOGLE_CLIENT_ID=your-google-oauth-id
GOOGLE_CLIENT_SECRET=your-google-oauth-secret
```

#### **🟢 OPTIONAL (Nice to have):**
```
SMTP_HOST=smtp.gmail.com
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
ZAI_API_KEY=your-zai-key
```

### 5. **Database Setup for Production**

#### **🗄️ Recommended Production Databases:**

**PostgreSQL (Recommended):**
```
DATABASE_URL=postgresql://username:password@host:port/database
```

**MySQL:**
```
DATABASE_URL=mysql://username:password@host:port/database
```

**SQLite (Development only):**
```
DATABASE_URL=file:./data/pm-app.db
```

### 6. **Domain Configuration**

Update these URLs for your domain:
```
NEXTAUTH_URL=https://your-domain.com
GOOGLE_REDIRECT_URI=https://your-domain.com/api/email/gmail/callback
```

## 🎯 Quick Deploy Commands

### **Deploy to Vercel (Fastest):**
```bash
git push origin main
vercel --prod
```

### **Deploy with Docker:**
```bash
docker build -t pm-app .
docker run -d -p 3000:3000 --env-file .env.production pm-app
```

### **Deploy to Cloud Run:**
```bash
gcloud run deploy pm-app \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

## 🔍 Verification Steps

1. **✅ Check environment variables are set**
2. **✅ Verify database connection**
3. **✅ Test authentication flows**
4. **✅ Confirm Socket.IO works**
5. **✅ Test file uploads**
6. **✅ Verify email notifications**

## 🚨 Troubleshooting

**App won't start:**
- Check `NEXTAUTH_SECRET` and `JWT_SECRET` are set
- Verify `DATABASE_URL` is accessible

**Authentication fails:**
- Check `NEXTAUTH_URL` matches your domain
- Verify secrets are properly set

**AI features don't work:**
- Check `OPENAI_API_KEY` is valid

**Email integration fails:**
- Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
- Check redirect URI in Google Console

## 📖 Documentation Links

- [Vercel Environment Variables](https://vercel.com/docs/environment-variables)
- [GitHub Actions Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Google Cloud Run Environment Variables](https://cloud.google.com/run/docs/configuring/environment-variables)
- [DigitalOcean App Platform Environment Variables](https://docs.digitalocean.com/products/app-platform/how-to/use-environment-variables/)
