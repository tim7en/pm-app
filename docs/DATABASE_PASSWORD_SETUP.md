# Database Password Management Guide

## 🔑 Password Requirements

### Development Environment
- Username: `pmapp_user`
- Password: `secure_local_password` (can be simple for local dev)
- Database: `pmapp`

### Production Environment  
- Username: `pmapp_user`
- Password: `strong_random_password_123!@#` (must be complex)
- Database: `pmapp`

## 🛡️ Security Guidelines

### Password Strength Requirements:
- Minimum 12 characters
- Mix of uppercase/lowercase letters
- Include numbers and special characters
- Avoid dictionary words
- Different for each environment

### Example Strong Passwords:
```
Development: secure_local_password
Staging: StG_pmApp2024#DevOps
Production: Pr0d_PM_4pp_2024!@#SecureDB
```

## 🔄 Password Generation Commands

### Generate Random Password (Linux/macOS):
```bash
# Generate 16-character password
openssl rand -base64 16

# Generate 24-character password with special chars
tr -dc 'A-Za-z0-9!@#$%^&*' < /dev/urandom | head -c 24
```

### Generate Random Password (Any system with Node.js):
```bash
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
```

## 📝 Environment File Examples

### .env.local (Development)
```env
DATABASE_URL="postgresql://pmapp_user:secure_local_password@localhost:5432/pmapp"
```

### .env.production (Production)
```env
DATABASE_URL="postgresql://pmapp_user:${DB_PASSWORD}@pm-app-db:5432/pmapp"
DB_PASSWORD="your_super_secure_production_password_here"
```

## 🚀 Quick Setup Commands

### For Local Development:
```bash
# 1. Start database
docker-compose -f docker-compose.local.yml up -d postgres

# 2. Wait for database to be ready
sleep 10

# 3. Initialize schema
npx prisma db push

# 4. Start application
npm run dev
```

### For Production:
```bash
# 1. Set environment variables
export DB_PASSWORD="your_production_password"
export REDIS_PASSWORD="your_redis_password"

# 2. Deploy with docker-compose
docker-compose -f docker-compose.production.yml up -d

# 3. Run migrations
docker-compose -f docker-compose.production.yml exec pm-app npx prisma migrate deploy
```
