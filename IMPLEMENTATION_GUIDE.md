# Implementation Guide: Payments, AI Credits, Referrals & Google Drive

This guide provides step-by-step implementation instructions for adding payment processing, AI usage billing, referral programs, and Google Drive integration to your project management application.

## 📋 Prerequisites

### Required Services & Accounts
1. **Stripe Account** - For payment processing
2. **Google Cloud Console** - For Drive API access
3. **Google OAuth 2.0** - For user authentication
4. **Webhook Endpoints** - For real-time updates

### Environment Variables
```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_INDIVIDUAL_PRO_MONTHLY=price_...
STRIPE_PRICE_TEAM_STANDARD_MONTHLY=price_...
STRIPE_PRICE_TEAM_PREMIUM_MONTHLY=price_...

# Google Drive API
GOOGLE_DRIVE_CLIENT_ID=123456789.apps.googleusercontent.com
GOOGLE_DRIVE_CLIENT_SECRET=GOCSPX-...
GOOGLE_DRIVE_REDIRECT_URI=https://yourapp.com/api/integrations/google-drive/callback

# AI Configuration
OPENAI_API_KEY=sk-...
AI_CREDIT_RATE=0.02  # $0.02 per credit
DEFAULT_AI_CREDITS=10

# Referral Program
REFERRAL_BONUS_AMOUNT=15.00
REFEREE_DISCOUNT_AMOUNT=10.00
MINIMUM_PAYOUT=50.00
```

## 🏗️ Implementation Steps

### Phase 1: Database Setup

#### 1.1 Update Prisma Schema
```bash
# Add the new models to your prisma/schema.prisma
# Copy models from DATABASE_SCHEMA_EXTENSION.md

# Generate and apply migration
npx prisma migrate dev --name add-payments-ai-referrals-storage
npx prisma generate
```

#### 1.2 Seed Initial Data
```typescript
// prisma/seed-billing.ts
import { PrismaClient, SubscriptionPlan } from '@prisma/client'

const prisma = new PrismaClient()

async function seedBillingPlans() {
  // Create default subscription plans
  const plans = [
    {
      name: 'FREE',
      maxUsers: 1,
      maxStorage: 1024, // 1GB
      maxAiCredits: 10,
      maxApiCalls: 1000
    },
    {
      name: 'INDIVIDUAL_PRO',
      maxUsers: 1,
      maxStorage: 10240, // 10GB
      maxAiCredits: 100,
      maxApiCalls: 10000
    },
    // Add more plans...
  ]
  
  // Implementation here...
}
```

### Phase 2: Payment System Implementation

#### 2.1 Install Dependencies
```bash
npm install stripe
npm install @stripe/stripe-js
npm install webhook
```

#### 2.2 Stripe Service Setup
```typescript
// src/lib/stripe.ts
import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
})

export class StripeService {
  static async createCustomer(user: { id: string; email: string; name?: string }) {
    return await stripe.customers.create({
      email: user.email,
      name: user.name || undefined,
      metadata: {
        userId: user.id
      }
    })
  }

  static async createSubscription(customerId: string, priceId: string, paymentMethodId?: string) {
    const subscriptionData: Stripe.SubscriptionCreateParams = {
      customer: customerId,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      expand: ['latest_invoice.payment_intent'],
    }

    if (paymentMethodId) {
      subscriptionData.default_payment_method = paymentMethodId
    }

    return await stripe.subscriptions.create(subscriptionData)
  }

  static async handleWebhook(rawBody: string, signature: string) {
    const event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )

    switch (event.type) {
      case 'customer.subscription.created':
        await this.handleSubscriptionCreated(event.data.object as Stripe.Subscription)
        break
      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
        break
      case 'invoice.payment_succeeded':
        await this.handlePaymentSucceeded(event.data.object as Stripe.Invoice)
        break
      // Add more webhook handlers...
    }
  }

  private static async handleSubscriptionCreated(subscription: Stripe.Subscription) {
    // Update database with new subscription
    // Implementation here...
  }
}
```

#### 2.3 Billing API Routes
```typescript
// src/app/api/billing/subscriptions/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth'
import { StripeService } from '@/lib/stripe'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { plan, workspaceId, paymentMethodId } = await request.json()

    // Validate plan
    const validPlans = ['INDIVIDUAL_PRO', 'TEAM_STANDARD', 'TEAM_PREMIUM']
    if (!validPlans.includes(plan)) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }

    // Create or get Stripe customer
    let stripeCustomerId = session.user.stripeCustomerId
    if (!stripeCustomerId) {
      const customer = await StripeService.createCustomer(session.user)
      stripeCustomerId = customer.id
      
      // Update user with customer ID
      await db.user.update({
        where: { id: session.user.id },
        data: { stripeCustomerId }
      })
    }

    // Create subscription
    const priceId = process.env[`STRIPE_PRICE_${plan}_MONTHLY`]!
    const subscription = await StripeService.createSubscription(
      stripeCustomerId,
      priceId,
      paymentMethodId
    )

    return NextResponse.json({
      subscriptionId: subscription.id,
      clientSecret: (subscription.latest_invoice as Stripe.Invoice)?.payment_intent?.client_secret
    })

  } catch (error) {
    console.error('Error creating subscription:', error)
    return NextResponse.json({ error: 'Failed to create subscription' }, { status: 500 })
  }
}
```

### Phase 3: AI Credits System

#### 3.1 AI Credits Service
```typescript
// src/lib/ai-credits.ts
import { db } from './db'
import { AiService } from '@prisma/client'

export class AiCreditsService {
  static async getUserCredits(userId: string, workspaceId?: string) {
    return await db.aiCreditBalance.findUnique({
      where: {
        userId_workspaceId: {
          userId,
          workspaceId: workspaceId || null
        }
      }
    })
  }

  static async deductCredits(
    userId: string,
    amount: number,
    service: AiService,
    description: string,
    workspaceId?: string,
    metadata?: any
  ) {
    return await db.$transaction(async (tx) => {
      // Get current balance
      const balance = await tx.aiCreditBalance.findUnique({
        where: {
          userId_workspaceId: {
            userId,
            workspaceId: workspaceId || null
          }
        }
      })

      if (!balance || balance.balance < amount) {
        throw new Error('Insufficient AI credits')
      }

      // Deduct credits
      const updatedBalance = await tx.aiCreditBalance.update({
        where: { id: balance.id },
        data: {
          balance: balance.balance - amount,
          totalUsed: balance.totalUsed + amount
        }
      })

      // Record transaction
      await tx.aiCreditTransaction.create({
        data: {
          balanceId: balance.id,
          userId,
          type: 'USAGE',
          amount: -amount,
          service,
          description,
          metadata: metadata ? JSON.stringify(metadata) : null
        }
      })

      // Log usage
      await tx.aiUsageLog.create({
        data: {
          userId,
          workspaceId,
          service,
          operation: description,
          creditsUsed: amount,
          requestData: metadata ? JSON.stringify(metadata) : null
        }
      })

      return updatedBalance
    })
  }

  static async purchaseCredits(userId: string, amount: number, purchaseAmount: number, paymentMethodId: string) {
    // Implementation for credit purchases
    // Integration with Stripe for one-time payments
  }
}
```

#### 3.2 AI Service Wrapper
```typescript
// src/lib/ai-service-wrapper.ts
import { AiCreditsService } from './ai-credits'
import { AiService } from '@prisma/client'

export class AiServiceWrapper {
  static async generateTasks(
    userId: string,
    projectDescription: string,
    workspaceId?: string
  ) {
    const creditCost = this.calculateCreditCost('TASK_GENERATION', { complexity: 'medium' })
    
    // Deduct credits first
    await AiCreditsService.deductCredits(
      userId,
      creditCost,
      AiService.TASK_GENERATION,
      `Generated tasks for project`,
      workspaceId,
      { projectDescription, creditCost }
    )

    try {
      // Call actual AI service
      const result = await this.callOpenAI('task-generation', {
        description: projectDescription
      })

      return result
    } catch (error) {
      // Refund credits on failure
      await AiCreditsService.refundCredits(userId, creditCost, workspaceId)
      throw error
    }
  }

  private static calculateCreditCost(service: string, metadata: any): number {
    const baseCosts = {
      'TASK_GENERATION': 3,
      'SMART_NOTIFICATIONS': 1,
      'PROJECT_ANALYSIS': 5,
      'CHAT_ASSISTANT': 2
    }

    const multipliers = {
      'simple': 0.8,
      'medium': 1.0,
      'complex': 1.5
    }

    const baseCost = baseCosts[service] || 1
    const multiplier = multipliers[metadata.complexity] || 1

    return Math.ceil(baseCost * multiplier)
  }
}
```

### Phase 4: Referral Program

#### 4.1 Referral Service
```typescript
// src/lib/referral-service.ts
import { db } from './db'
import { generateReferralCode } from './utils'

export class ReferralService {
  static async createReferralProgram(userId: string) {
    const referralCode = generateReferralCode(userId)
    
    return await db.referralProgram.create({
      data: {
        userId,
        referralCode,
        customReferralUrl: `${process.env.NEXT_PUBLIC_APP_URL}/signup?ref=${referralCode}`
      }
    })
  }

  static async trackReferral(referralCode: string, refereeEmail: string, ipAddress?: string) {
    const program = await db.referralProgram.findUnique({
      where: { referralCode }
    })

    if (!program) {
      throw new Error('Invalid referral code')
    }

    return await db.referral.create({
      data: {
        referralProgramId: program.id,
        refereeEmail,
        ipAddress
      }
    })
  }

  static async confirmReferral(refereeUserId: string) {
    const referral = await db.referral.findFirst({
      where: {
        refereeUserId,
        status: 'SIGNED_UP'
      },
      include: {
        referralProgram: true
      }
    })

    if (!referral) return

    // Update referral status and award bonus
    await db.$transaction(async (tx) => {
      await tx.referral.update({
        where: { id: referral.id },
        data: {
          status: 'CONFIRMED',
          confirmedAt: new Date(),
          rewardAmount: Number(process.env.REFERRAL_BONUS_AMOUNT)
        }
      })

      await tx.referralProgram.update({
        where: { id: referral.referralProgramId },
        data: {
          successfulReferrals: { increment: 1 },
          totalEarnings: { increment: Number(process.env.REFERRAL_BONUS_AMOUNT) },
          availableBalance: { increment: Number(process.env.REFERRAL_BONUS_AMOUNT) }
        }
      })
    })
  }
}
```

### Phase 5: Google Drive Integration

#### 5.1 Google Drive Service
```typescript
// src/lib/google-drive.ts
import { google } from 'googleapis'
import { db } from './db'

export class GoogleDriveService {
  private static createOAuth2Client() {
    return new google.auth.OAuth2(
      process.env.GOOGLE_DRIVE_CLIENT_ID,
      process.env.GOOGLE_DRIVE_CLIENT_SECRET,
      process.env.GOOGLE_DRIVE_REDIRECT_URI
    )
  }

  static getAuthUrl(userId: string) {
    const oauth2Client = this.createOAuth2Client()
    
    return oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/drive',
        'https://www.googleapis.com/auth/userinfo.email'
      ],
      state: userId // Include user ID in state for security
    })
  }

  static async handleCallback(code: string, userId: string) {
    const oauth2Client = this.createOAuth2Client()
    
    const { tokens } = await oauth2Client.getAccessToken(code)
    oauth2Client.setCredentials(tokens)

    // Get user's Drive info
    const drive = google.drive({ version: 'v3', auth: oauth2Client })
    const about = await drive.about.get({ fields: 'user,storageQuota' })

    // Store integration
    return await db.googleDriveIntegration.create({
      data: {
        userId,
        accessToken: tokens.access_token!,
        refreshToken: tokens.refresh_token!,
        tokenExpiresAt: new Date(tokens.expiry_date!),
        driveEmail: about.data.user?.emailAddress!,
        quotaTotal: about.data.storageQuota?.limit ? BigInt(about.data.storageQuota.limit) : null,
        quotaUsed: about.data.storageQuota?.usage ? BigInt(about.data.storageQuota.usage) : null
      }
    })
  }

  static async listFiles(userId: string, folderId?: string, search?: string) {
    const integration = await db.googleDriveIntegration.findUnique({
      where: { userId }
    })

    if (!integration) {
      throw new Error('Google Drive not connected')
    }

    const oauth2Client = this.createOAuth2Client()
    oauth2Client.setCredentials({
      access_token: integration.accessToken,
      refresh_token: integration.refreshToken
    })

    const drive = google.drive({ version: 'v3', auth: oauth2Client })
    
    let query = "trashed=false"
    if (folderId) {
      query += ` and '${folderId}' in parents`
    }
    if (search) {
      query += ` and name contains '${search}'`
    }

    const response = await drive.files.list({
      q: query,
      fields: 'files(id,name,mimeType,size,createdTime,modifiedTime,webViewLink,thumbnailLink)',
      pageSize: 100
    })

    return response.data.files || []
  }

  static async attachFileToTask(userId: string, fileId: string, taskId: string) {
    // Get file details from Drive
    const files = await this.listFiles(userId)
    const driveFile = files.find(f => f.id === fileId)
    
    if (!driveFile) {
      throw new Error('File not found')
    }

    // Store in database
    return await db.driveFile.create({
      data: {
        integrationId: (await db.googleDriveIntegration.findUnique({ where: { userId } }))!.id,
        driveFileId: fileId,
        fileName: driveFile.name!,
        mimeType: driveFile.mimeType!,
        fileSize: driveFile.size ? BigInt(driveFile.size) : null,
        webViewLink: driveFile.webViewLink,
        thumbnailLink: driveFile.thumbnailLink,
        driveCreatedAt: new Date(driveFile.createdTime!),
        driveModifiedAt: new Date(driveFile.modifiedTime!),
        taskId
      }
    })
  }
}
```

### Phase 6: Frontend Components

#### 6.1 Subscription Management Component
```typescript
// src/components/billing/subscription-card.tsx
'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'

interface SubscriptionCardProps {
  subscription: {
    plan: string
    status: string
    currentPeriodEnd: string
    usage: {
      users: number
      maxUsers: number
      storage: number
      maxStorage: number
      aiCredits: number
      maxAiCredits: number
    }
  }
}

export function SubscriptionCard({ subscription }: SubscriptionCardProps) {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleUpgrade = async () => {
    setLoading(true)
    try {
      // Implementation for upgrade flow
      const response = await fetch('/api/billing/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: 'TEAM_STANDARD' })
      })
      
      if (response.ok) {
        toast({ title: 'Subscription updated successfully' })
      }
    } catch (error) {
      toast({ 
        title: 'Error updating subscription',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Current Plan
          <Badge variant={subscription.status === 'ACTIVE' ? 'default' : 'destructive'}>
            {subscription.status}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-2xl font-bold">{subscription.plan}</div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Users</span>
            <span>{subscription.usage.users}/{subscription.usage.maxUsers}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Storage</span>
            <span>{subscription.usage.storage}MB/{subscription.usage.maxStorage}MB</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>AI Credits</span>
            <span>{subscription.usage.aiCredits}/{subscription.usage.maxAiCredits}</span>
          </div>
        </div>

        <Button onClick={handleUpgrade} disabled={loading} className="w-full">
          {loading ? 'Processing...' : 'Upgrade Plan'}
        </Button>
      </CardContent>
    </Card>
  )
}
```

#### 6.2 AI Credits Component
```typescript
// src/components/ai/credits-balance.tsx
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Zap } from 'lucide-react'

interface CreditsBalanceProps {
  balance: {
    current: number
    limit: number
    resetDate: string
  }
  usage: {
    thisMonth: number
    breakdown: Record<string, number>
  }
}

export function CreditsBalance({ balance, usage }: CreditsBalanceProps) {
  const percentage = (balance.current / balance.limit) * 100

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          AI Credits
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span>Available Credits</span>
            <span>{balance.current} / {balance.limit}</span>
          </div>
          <Progress value={percentage} className="h-2" />
        </div>

        <div className="text-xs text-muted-foreground">
          Resets on {new Date(balance.resetDate).toLocaleDateString()}
        </div>

        <div className="space-y-1">
          <div className="text-sm font-medium">This Month Usage</div>
          {Object.entries(usage.breakdown).map(([service, count]) => (
            <div key={service} className="flex justify-between text-xs">
              <span className="capitalize">{service.replace('_', ' ')}</span>
              <span>{count} credits</span>
            </div>
          ))}
        </div>

        <Button variant="outline" className="w-full">
          Purchase More Credits
        </Button>
      </CardContent>
    </Card>
  )
}
```

## 🚀 Deployment Checklist

### Environment Setup
- [ ] Configure Stripe webhook endpoints
- [ ] Set up Google Cloud OAuth credentials
- [ ] Configure environment variables
- [ ] Set up SSL certificates for webhook security

### Database
- [ ] Run database migrations
- [ ] Seed initial subscription plans
- [ ] Set up database backups
- [ ] Configure read replicas for analytics

### Monitoring & Analytics
- [ ] Set up payment failure alerts
- [ ] Configure usage monitoring
- [ ] Implement revenue tracking
- [ ] Set up referral conversion tracking

### Security
- [ ] Implement webhook signature verification
- [ ] Set up rate limiting for AI endpoints
- [ ] Configure CORS for payment pages
- [ ] Implement PCI compliance measures

### Testing
- [ ] Test payment flows with Stripe test mode
- [ ] Verify Google Drive integration
- [ ] Test referral tracking
- [ ] Load test AI credit system

This implementation guide provides a complete foundation for adding advanced billing, AI usage tracking, referral programs, and cloud storage integration to your project management application.
