# 🚀 API Implementation Guide - Step by Step

This comprehensive guide provides detailed implementation steps for missing API functionality based on the API Reference Guide analysis.

## 📊 Implementation Status Overview

### ✅ **Production Ready (80% Complete)**
- **Authentication API**: JWT + OAuth system ✅
- **Tasks API**: Full CRUD with advanced features ✅  
- **Projects API**: Complete with member management ✅
- **Workspaces API**: Full functionality with invitations ✅
- **Team Management API**: User search and management ✅
- **Messages API**: Internal + Gmail integration ✅
- **Calendar API**: Database schema + UI (needs backend completion) ⚠️
- **Notifications API**: Real-time with security ✅
- **Bug Reports API**: Basic implementation ✅

### 🚧 **Needs Implementation (Missing Critical Features)**
- **Payments & Billing API**: 0% - Complete system needed
- **AI Usage & Credits API**: 0% - Framework exists, needs implementation
- **Referral Program API**: 0% - Database ready, API needed
- **Donations API**: 0% - New feature, full implementation needed
- **Google Drive Integration API**: 0% - Complete integration needed
- **Storage Management API**: 0% - File management system needed

---

## 🎯 **PHASE 1: Complete Calendar API Backend (Priority: HIGH)**

### Issue Analysis
Calendar frontend exists but uses mock data. Backend API endpoints need proper database integration.

### Implementation Steps

#### 1. Verify Database Schema
```bash
# Check if calendar schema exists
npx prisma db push
npx prisma studio
```

#### 2. Complete Calendar API Routes

**File: `/src/app/api/calendar/events/route.ts`**
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { z } from 'zod'

const createEventSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  type: z.enum(['MEETING', 'CALL', 'DEADLINE', 'REMINDER']),
  location: z.string().optional(),
  workspaceId: z.string(),
  projectId: z.string().optional(),
  attendeeIds: z.array(z.string()).optional()
})

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession(request)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const workspaceId = searchParams.get('workspaceId')
    const start = searchParams.get('start')
    const end = searchParams.get('end')

    if (!workspaceId) {
      return NextResponse.json({ error: 'Workspace ID required' }, { status: 400 })
    }

    // Verify workspace access
    const workspace = await db.workspaceMember.findFirst({
      where: {
        workspaceId,
        userId: session.user.id
      }
    })

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace access denied' }, { status: 403 })
    }

    const events = await db.calendarEvent.findMany({
      where: {
        workspaceId,
        ...(start && end && {
          startTime: {
            gte: new Date(start),
            lte: new Date(end)
          }
        })
      },
      include: {
        creator: {
          select: { id: true, name: true, avatar: true }
        },
        project: {
          select: { id: true, name: true, color: true }
        },
        attendees: {
          include: {
            user: {
              select: { id: true, name: true, avatar: true }
            }
          }
        }
      },
      orderBy: { startTime: 'asc' }
    })

    return NextResponse.json({ events })
  } catch (error) {
    console.error('Calendar events fetch error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession(request)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createEventSchema.parse(body)

    // Verify workspace access
    const workspace = await db.workspaceMember.findFirst({
      where: {
        workspaceId: validatedData.workspaceId,
        userId: session.user.id
      }
    })

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace access denied' }, { status: 403 })
    }

    const event = await db.calendarEvent.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        startTime: new Date(validatedData.startTime),
        endTime: new Date(validatedData.endTime),
        type: validatedData.type,
        location: validatedData.location,
        creatorId: session.user.id,
        workspaceId: validatedData.workspaceId,
        projectId: validatedData.projectId,
        attendees: {
          create: validatedData.attendeeIds?.map(userId => ({
            userId,
            response: 'PENDING'
          })) || []
        }
      },
      include: {
        creator: {
          select: { id: true, name: true, avatar: true }
        },
        project: {
          select: { id: true, name: true, color: true }
        },
        attendees: {
          include: {
            user: {
              select: { id: true, name: true, avatar: true }
            }
          }
        }
      }
    })

    return NextResponse.json({ event }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 })
    }
    console.error('Calendar event creation error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
```

#### 3. Update Frontend to Use Real API

**File: `/src/components/calendar/calendar-view.tsx`**
```typescript
// Remove mock data imports
// import { mockEvents } from '@/data/mock-calendar-data'

// Add real API calls
import { api } from '@/lib/api'

const CalendarView = () => {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const { workspaceId } = useAuth()

  useEffect(() => {
    const fetchEvents = async () => {
      if (!workspaceId) return
      
      try {
        setLoading(true)
        const start = startOfMonth(currentDate).toISOString()
        const end = endOfMonth(currentDate).toISOString()
        
        const response = await api.calendar.getEvents({
          workspaceId,
          start,
          end
        })
        
        setEvents(response.data.events)
      } catch (error) {
        console.error('Failed to fetch events:', error)
        // Show error toast
      } finally {
        setLoading(false)
      }
    }

    fetchEvents()
  }, [workspaceId, currentDate])

  // Rest of component logic...
}
```

#### 4. Testing
```bash
# Test calendar endpoints
curl -X GET "http://localhost:3000/api/calendar/events?workspaceId=test&start=2024-01-01&end=2024-01-31"
curl -X POST "http://localhost:3000/api/calendar/events" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Event","startTime":"2024-01-15T10:00:00Z","endTime":"2024-01-15T11:00:00Z","type":"MEETING","workspaceId":"test"}'
```

---

## 🎯 **PHASE 2: Payments & Billing System (Priority: HIGH)**

### Implementation Overview
Complete payment system with Stripe integration for subscriptions, invoices, and usage tracking.

### 1. Environment Setup
```bash
# Install required packages
npm install stripe @stripe/stripe-js

# Add to .env
STRIPE_SECRET_KEY=sk_test_your_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

### 2. Database Schema Extensions

**File: `prisma/schema.prisma`**
```prisma
model Subscription {
  id                    String    @id @default(cuid())
  userId                String?
  workspaceId           String?
  stripeCustomerId      String    @unique
  stripeSubscriptionId  String    @unique
  stripePriceId         String
  plan                  SubscriptionPlan
  status                SubscriptionStatus
  currentPeriodStart    DateTime
  currentPeriodEnd      DateTime
  cancelAtPeriodEnd     Boolean   @default(false)
  trialEnd              DateTime?
  
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt

  user                  User?     @relation(fields: [userId], references: [id], onDelete: SetNull)
  workspace             Workspace? @relation(fields: [workspaceId], references: [id], onDelete: SetNull)
  invoices              Invoice[]

  @@map("subscriptions")
}

model Invoice {
  id                String         @id @default(cuid())
  subscriptionId    String
  stripeInvoiceId   String         @unique
  number            String
  status            InvoiceStatus
  amount            Int            // Amount in cents
  currency          String         @default("USD")
  description       String
  paidAt            DateTime?
  dueDate           DateTime
  downloadUrl       String?
  
  createdAt         DateTime       @default(now())
  
  subscription      Subscription   @relation(fields: [subscriptionId], references: [id], onDelete: Cascade)

  @@map("invoices")
}

model PaymentMethod {
  id                String    @id @default(cuid())
  userId            String
  stripePaymentMethodId String @unique
  type              String    // 'card', 'bank_account', etc.
  card              Json?     // Card details (last4, brand, etc.)
  isDefault         Boolean   @default(false)
  
  createdAt         DateTime  @default(now())
  
  user              User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("payment_methods")
}

enum SubscriptionPlan {
  FREE
  INDIVIDUAL_PRO
  TEAM_STANDARD
  TEAM_PREMIUM
  ENTERPRISE
}

enum SubscriptionStatus {
  ACTIVE
  CANCELED
  PAST_DUE
  INCOMPLETE
  TRIALING
}

enum InvoiceStatus {
  PAID
  PENDING
  FAILED
  REFUNDED
}

// Add to User model
model User {
  // ... existing fields
  subscriptions     Subscription[]
  paymentMethods    PaymentMethod[]
}

// Add to Workspace model  
model Workspace {
  // ... existing fields
  subscriptions     Subscription[]
}
```

### 3. Stripe Service Implementation

**File: `/src/lib/stripe.ts`**
```typescript
import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
})

export const SUBSCRIPTION_PLANS = {
  INDIVIDUAL_PRO: {
    priceId: 'price_individual_pro',
    name: 'Individual Pro',
    price: 2999, // $29.99
    interval: 'month',
    features: ['Unlimited projects', '10GB storage', 'Email support']
  },
  TEAM_STANDARD: {
    priceId: 'price_team_standard', 
    name: 'Team Standard',
    price: 9999, // $99.99
    interval: 'month',
    features: ['Up to 10 users', '100GB storage', 'Priority support', 'Advanced analytics']
  },
  TEAM_PREMIUM: {
    priceId: 'price_team_premium',
    name: 'Team Premium', 
    price: 19999, // $199.99
    interval: 'month',
    features: ['Unlimited users', '1TB storage', '24/7 support', 'Custom integrations']
  }
}

export class StripeService {
  static async createCustomer(email: string, name?: string) {
    return await stripe.customers.create({
      email,
      name,
    })
  }

  static async createSubscription(customerId: string, priceId: string, paymentMethodId?: string) {
    const subscriptionData: Stripe.SubscriptionCreateParams = {
      customer: customerId,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
    }

    if (paymentMethodId) {
      subscriptionData.default_payment_method = paymentMethodId
    }

    return await stripe.subscriptions.create(subscriptionData)
  }

  static async updateSubscription(subscriptionId: string, priceId: string) {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId)
    
    return await stripe.subscriptions.update(subscriptionId, {
      items: [{
        id: subscription.items.data[0].id,
        price: priceId,
      }],
      proration_behavior: 'create_prorations',
    })
  }

  static async cancelSubscription(subscriptionId: string, cancelAtPeriodEnd = true) {
    return await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: cancelAtPeriodEnd,
    })
  }

  static async createPaymentMethod(customerId: string, type: string, cardData?: any) {
    const paymentMethod = await stripe.paymentMethods.create({
      type: type as any,
      card: cardData,
    })

    await stripe.paymentMethods.attach(paymentMethod.id, {
      customer: customerId,
    })

    return paymentMethod
  }

  static async getUsage(subscriptionId: string) {
    // Implement usage tracking based on your metrics
    const subscription = await stripe.subscriptions.retrieve(subscriptionId)
    return {
      currentPeriodStart: subscription.current_period_start,
      currentPeriodEnd: subscription.current_period_end,
      // Add custom usage metrics
    }
  }
}
```

### 4. Billing API Routes

**File: `/src/app/api/billing/subscriptions/route.ts`**
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { StripeService, SUBSCRIPTION_PLANS } from '@/lib/stripe'
import { z } from 'zod'

const createSubscriptionSchema = z.object({
  plan: z.enum(['INDIVIDUAL_PRO', 'TEAM_STANDARD', 'TEAM_PREMIUM']),
  workspaceId: z.string().optional(),
  paymentMethodId: z.string().optional(),
  billingInterval: z.enum(['month', 'year']).default('month')
})

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession(request)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const workspaceId = searchParams.get('workspaceId')

    let subscription
    if (workspaceId) {
      // Get workspace subscription (requires admin access)
      const workspaceMember = await db.workspaceMember.findFirst({
        where: {
          workspaceId,
          userId: session.user.id,
          role: { in: ['OWNER', 'ADMIN'] }
        }
      })

      if (!workspaceMember) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }

      subscription = await db.subscription.findFirst({
        where: { workspaceId },
        include: {
          workspace: {
            select: { id: true, name: true }
          }
        }
      })
    } else {
      // Get individual subscription
      subscription = await db.subscription.findFirst({
        where: { userId: session.user.id },
        include: {
          user: {
            select: { id: true, name: true, email: true }
          }
        }
      })
    }

    if (!subscription) {
      return NextResponse.json({
        subscription: {
          plan: 'FREE',
          status: 'ACTIVE',
          usage: {
            users: workspaceId ? 1 : 1,
            maxUsers: 1,
            storage: 512,
            maxStorage: 1024,
            aiCredits: 0,
            maxAiCredits: 5
          }
        }
      })
    }

    // Get usage data
    const usage = await StripeService.getUsage(subscription.stripeSubscriptionId)

    return NextResponse.json({
      subscription: {
        id: subscription.id,
        plan: subscription.plan,
        status: subscription.status,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        trialEnd: subscription.trialEnd,
        pricing: SUBSCRIPTION_PLANS[subscription.plan],
        usage
      }
    })

  } catch (error) {
    console.error('Subscription fetch error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession(request)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createSubscriptionSchema.parse(body)

    // Check if user already has a subscription
    const existingSubscription = await db.subscription.findFirst({
      where: validatedData.workspaceId
        ? { workspaceId: validatedData.workspaceId }
        : { userId: session.user.id }
    })

    if (existingSubscription) {
      return NextResponse.json({ error: 'Subscription already exists' }, { status: 400 })
    }

    // Create or get Stripe customer
    let stripeCustomerId = session.user.stripeCustomerId
    if (!stripeCustomerId) {
      const customer = await StripeService.createCustomer(
        session.user.email!,
        session.user.name || undefined
      )
      stripeCustomerId = customer.id

      // Update user with Stripe customer ID
      await db.user.update({
        where: { id: session.user.id },
        data: { stripeCustomerId }
      })
    }

    // Create subscription in Stripe
    const planConfig = SUBSCRIPTION_PLANS[validatedData.plan]
    const stripeSubscription = await StripeService.createSubscription(
      stripeCustomerId,
      planConfig.priceId,
      validatedData.paymentMethodId
    )

    // Create subscription in database
    const subscription = await db.subscription.create({
      data: {
        userId: validatedData.workspaceId ? null : session.user.id,
        workspaceId: validatedData.workspaceId,
        stripeCustomerId,
        stripeSubscriptionId: stripeSubscription.id,
        stripePriceId: planConfig.priceId,
        plan: validatedData.plan,
        status: stripeSubscription.status as any,
        currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
        currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
        trialEnd: stripeSubscription.trial_end 
          ? new Date(stripeSubscription.trial_end * 1000)
          : null
      }
    })

    return NextResponse.json({ 
      subscription,
      clientSecret: (stripeSubscription.latest_invoice as any)?.payment_intent?.client_secret
    }, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 })
    }
    console.error('Subscription creation error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
```

### 5. Stripe Webhook Handler

**File: `/src/app/api/billing/webhooks/route.ts`**
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { db } from '@/lib/db'
import { headers } from 'next/headers'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = headers().get('stripe-signature')!

  let event
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (error) {
    console.error('Webhook signature verification failed:', error)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'customer.subscription.updated':
      case 'customer.subscription.created': {
        const subscription = event.data.object
        await db.subscription.upsert({
          where: { stripeSubscriptionId: subscription.id },
          update: {
            status: subscription.status as any,
            currentPeriodStart: new Date(subscription.current_period_start * 1000),
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            cancelAtPeriodEnd: subscription.cancel_at_period_end
          },
          create: {
            stripeCustomerId: subscription.customer as string,
            stripeSubscriptionId: subscription.id,
            stripePriceId: subscription.items.data[0].price.id,
            plan: 'INDIVIDUAL_PRO', // Map from price ID
            status: subscription.status as any,
            currentPeriodStart: new Date(subscription.current_period_start * 1000),
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            cancelAtPeriodEnd: subscription.cancel_at_period_end
          }
        })
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object
        await db.subscription.update({
          where: { stripeSubscriptionId: subscription.id },
          data: { status: 'CANCELED' }
        })
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object
        if (invoice.subscription) {
          await db.invoice.upsert({
            where: { stripeInvoiceId: invoice.id },
            update: {
              status: 'PAID',
              paidAt: new Date(invoice.status_transitions.paid_at! * 1000)
            },
            create: {
              stripeInvoiceId: invoice.id,
              subscriptionId: '', // Get from subscription mapping
              number: invoice.number!,
              status: 'PAID',
              amount: invoice.amount_paid,
              currency: invoice.currency,
              description: invoice.description || '',
              paidAt: new Date(invoice.status_transitions.paid_at! * 1000),
              dueDate: new Date(invoice.due_date! * 1000),
              downloadUrl: invoice.invoice_pdf
            }
          })
        }
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook processing error:', error)
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 })
  }
}
```

---

## 🎯 **PHASE 3: AI Usage & Credits System (Priority: MEDIUM)**

### Implementation Overview
Track AI usage and implement credit-based billing system.

### 1. Database Extensions

**File: `prisma/schema.prisma`**
```prisma
model AiCreditBalance {
  id              String    @id @default(cuid())
  userId          String?
  workspaceId     String?
  current         Int       @default(0)
  limit           Int       @default(100)
  resetDate       DateTime
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  user            User?     @relation(fields: [userId], references: [id], onDelete: Cascade)
  workspace       Workspace? @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  usage           AiUsage[]

  @@unique([userId])
  @@unique([workspaceId])
  @@map("ai_credit_balances")
}

model AiUsage {
  id              String          @id @default(cuid())
  balanceId       String
  service         AiService
  description     String
  creditsUsed     Int
  metadata        Json?           // Additional context
  
  createdAt       DateTime        @default(now())

  balance         AiCreditBalance @relation(fields: [balanceId], references: [id], onDelete: Cascade)

  @@map("ai_usage")
}

model AiCreditPurchase {
  id              String    @id @default(cuid())
  userId          String
  workspaceId     String?
  packageId       String
  credits         Int
  price           Int       // Price in cents
  stripePaymentIntentId String @unique
  
  createdAt       DateTime  @default(now())

  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  workspace       Workspace? @relation(fields: [workspaceId], references: [id], onDelete: SetNull)

  @@map("ai_credit_purchases")
}

enum AiService {
  TASK_GENERATION
  SMART_NOTIFICATIONS
  PROJECT_ANALYSIS
  CHAT_ASSISTANT
  INACTIVITY_REMINDER
}

// Add to User and Workspace models
model User {
  // ... existing fields
  aiCreditBalance   AiCreditBalance?
  aiCreditPurchases AiCreditPurchase[]
}

model Workspace {
  // ... existing fields
  aiCreditBalance   AiCreditBalance?
  aiCreditPurchases AiCreditPurchase[]
}
```

### 2. AI Credits Service

**File: `/src/lib/ai-credits.ts`**
```typescript
import { db } from '@/lib/db'
import { AiService } from '@prisma/client'

const AI_SERVICE_COSTS = {
  TASK_GENERATION: 3,
  SMART_NOTIFICATIONS: 1,
  PROJECT_ANALYSIS: 5,
  CHAT_ASSISTANT: 2,
  INACTIVITY_REMINDER: 1
}

const CREDIT_PACKAGES = {
  SMALL: { credits: 100, price: 199, bonus: 0 }, // $1.99
  MEDIUM: { credits: 500, price: 899, bonus: 50 }, // $8.99
  LARGE: { credits: 1000, price: 1599, bonus: 150 } // $15.99
}

export class AiCreditsService {
  static async getBalance(userId: string, workspaceId?: string) {
    const balance = await db.aiCreditBalance.findFirst({
      where: workspaceId 
        ? { workspaceId }
        : { userId }
    })

    if (!balance) {
      // Create default balance
      return await db.aiCreditBalance.create({
        data: {
          userId: workspaceId ? null : userId,
          workspaceId,
          current: 10, // Free tier credits
          limit: 10,
          resetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
        }
      })
    }

    return balance
  }

  static async consumeCredits(
    userId: string, 
    service: AiService, 
    description: string,
    workspaceId?: string,
    metadata?: any
  ) {
    const balance = await this.getBalance(userId, workspaceId)
    const cost = AI_SERVICE_COSTS[service]

    if (balance.current < cost) {
      throw new Error('Insufficient credits')
    }

    // Use transaction to ensure consistency
    return await db.$transaction(async (tx) => {
      // Deduct credits
      const updatedBalance = await tx.aiCreditBalance.update({
        where: { id: balance.id },
        data: { current: { decrement: cost } }
      })

      // Record usage
      await tx.aiUsage.create({
        data: {
          balanceId: balance.id,
          service,
          description,
          creditsUsed: cost,
          metadata
        }
      })

      return updatedBalance
    })
  }

  static async addCredits(userId: string, credits: number, workspaceId?: string) {
    const balance = await this.getBalance(userId, workspaceId)

    return await db.aiCreditBalance.update({
      where: { id: balance.id },
      data: { 
        current: { increment: credits },
        limit: { increment: credits }
      }
    })
  }

  static async getUsageHistory(userId: string, workspaceId?: string, options?: {
    startDate?: Date
    endDate?: Date
    service?: AiService
  }) {
    const balance = await this.getBalance(userId, workspaceId)

    return await db.aiUsage.findMany({
      where: {
        balanceId: balance.id,
        ...(options?.startDate && {
          createdAt: { gte: options.startDate }
        }),
        ...(options?.endDate && {
          createdAt: { lte: options.endDate }
        }),
        ...(options?.service && {
          service: options.service
        })
      },
      orderBy: { createdAt: 'desc' }
    })
  }

  static getCreditPackages() {
    return CREDIT_PACKAGES
  }

  static async resetMonthlyCredits() {
    // Reset credits for users with active subscriptions
    const now = new Date()
    const balancesToReset = await db.aiCreditBalance.findMany({
      where: {
        resetDate: { lte: now }
      },
      include: {
        user: {
          include: {
            subscriptions: {
              where: { status: 'ACTIVE' }
            }
          }
        },
        workspace: {
          include: {
            subscriptions: {
              where: { status: 'ACTIVE' }
            }
          }
        }
      }
    })

    for (const balance of balancesToReset) {
      const hasActiveSubscription = 
        balance.user?.subscriptions.length > 0 ||
        balance.workspace?.subscriptions.length > 0

      if (hasActiveSubscription) {
        const newLimit = this.getSubscriptionCreditLimit(balance)
        await db.aiCreditBalance.update({
          where: { id: balance.id },
          data: {
            current: newLimit,
            limit: newLimit,
            resetDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
          }
        })
      }
    }
  }

  private static getSubscriptionCreditLimit(balance: any): number {
    const subscription = balance.user?.subscriptions[0] || balance.workspace?.subscriptions[0]
    
    switch (subscription?.plan) {
      case 'INDIVIDUAL_PRO': return 100
      case 'TEAM_STANDARD': return 500
      case 'TEAM_PREMIUM': return 1000
      case 'ENTERPRISE': return 5000
      default: return 10
    }
  }
}
```

### 3. AI Credits API

**File: `/src/app/api/ai/credits/route.ts`**
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth'
import { AiCreditsService } from '@/lib/ai-credits'

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession(request)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const workspaceId = searchParams.get('workspaceId')

    const balance = await AiCreditsService.getBalance(session.user.id, workspaceId || undefined)
    
    // Get usage for current month
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const usage = await AiCreditsService.getUsageHistory(
      session.user.id, 
      workspaceId || undefined,
      { startDate: startOfMonth }
    )

    const breakdown = usage.reduce((acc, item) => {
      acc[item.service] = (acc[item.service] || 0) + item.creditsUsed
      return acc
    }, {} as Record<string, number>)

    return NextResponse.json({
      balance: {
        current: balance.current,
        limit: balance.limit,
        resetDate: balance.resetDate
      },
      usage: {
        thisMonth: usage.reduce((sum, item) => sum + item.creditsUsed, 0),
        breakdown
      },
      pricing: {
        creditCost: 0.02,
        currency: 'USD',
        packSizes: AiCreditsService.getCreditPackages()
      }
    })

  } catch (error) {
    console.error('AI credits fetch error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
```

### 4. Update AI Services to Use Credits

**File: `/src/app/api/ai/generate-tasks/route.ts`** (Update existing)
```typescript
import { AiCreditsService } from '@/lib/ai-credits'

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession(request)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    
    // Check and consume credits BEFORE processing
    try {
      await AiCreditsService.consumeCredits(
        session.user.id,
        'TASK_GENERATION',
        `Generated tasks for: ${body.description}`,
        body.workspaceId,
        { 
          projectContext: body.projectContext,
          userRole: body.userRole,
          existingTaskCount: body.existingTasks?.length || 0
        }
      )
    } catch (creditsError) {
      return NextResponse.json(
        { error: 'Insufficient AI credits. Please purchase more credits to continue.' },
        { status: 402 } // Payment Required
      )
    }

    // Proceed with AI task generation...
    const suggestions = await aiAssistant.generateTasks(
      body.description,
      body.projectContext,
      body.userRole,
      body.existingTasks
    )

    return NextResponse.json({ suggestions })

  } catch (error) {
    console.error('AI task generation error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
```

---

## 🎯 **PHASE 4: Referral Program (Priority: LOW)**

### Implementation Overview
Complete referral system with tracking, rewards, and payouts.

### 1. API Implementation

**File: `/src/app/api/referrals/stats/route.ts`**
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession(request)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get or create referral program entry
    let referralProgram = await db.referralProgram.findFirst({
      where: { referrerId: session.user.id }
    })

    if (!referralProgram) {
      referralProgram = await db.referralProgram.create({
        data: {
          referrerId: session.user.id,
          referralCode: `REF_${session.user.id.slice(-8).toUpperCase()}`,
          totalEarnings: 0,
          availableBalance: 0,
          paidOut: 0
        }
      })
    }

    // Get referral statistics
    const referrals = await db.referral.findMany({
      where: { referrerId: session.user.id },
      include: {
        referee: {
          select: { name: true, email: true }
        }
      }
    })

    const stats = {
      totalReferrals: referrals.length,
      successfulReferrals: referrals.filter(r => r.status === 'CONFIRMED').length,
      pendingReferrals: referrals.filter(r => r.status === 'PENDING').length,
      totalEarnings: referralProgram.totalEarnings,
      currentMonthEarnings: referrals
        .filter(r => {
          const thisMonth = new Date()
          thisMonth.setDate(1)
          return r.confirmationDate && r.confirmationDate >= thisMonth
        })
        .reduce((sum, r) => sum + (r.rewardAmount || 0), 0),
      availableBalance: referralProgram.availableBalance,
      paidOut: referralProgram.paidOut
    }

    return NextResponse.json({
      referralCode: referralProgram.referralCode,
      stats,
      referralUrl: `${process.env.NEXT_PUBLIC_APP_URL}/signup?ref=${referralProgram.referralCode}`,
      rewards: {
        referrerBonus: 15.00,
        refereeDiscount: 10.00,
        minimumPayout: 50.00,
        payoutMethods: ['STRIPE', 'PAYPAL', 'BANK_TRANSFER']
      }
    })

  } catch (error) {
    console.error('Referral stats error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
```

---

## 🎯 **PHASE 5: Google Drive Integration (Priority: LOW)**

### Implementation Overview
Complete Google Drive integration for file management and collaboration.

### 1. Setup Google Drive API

```bash
# Install required packages
npm install googleapis

# Add to .env
GOOGLE_DRIVE_CLIENT_ID=your_client_id
GOOGLE_DRIVE_CLIENT_SECRET=your_client_secret
GOOGLE_DRIVE_REDIRECT_URI=http://localhost:3000/api/integrations/google-drive/callback
```

### 2. Google Drive Service

**File: `/src/lib/google-drive.ts`**
```typescript
import { google } from 'googleapis'
import { OAuth2Client } from 'google-auth-library'

export class GoogleDriveService {
  private oauth2Client: OAuth2Client

  constructor() {
    this.oauth2Client = new OAuth2Client(
      process.env.GOOGLE_DRIVE_CLIENT_ID,
      process.env.GOOGLE_DRIVE_CLIENT_SECRET,
      process.env.GOOGLE_DRIVE_REDIRECT_URI
    )
  }

  generateAuthUrl() {
    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/drive.file',
        'https://www.googleapis.com/auth/drive.readonly'
      ],
      include_granted_scopes: true
    })
  }

  async getAccessToken(code: string) {
    const { tokens } = await this.oauth2Client.getAccessToken(code)
    return tokens
  }

  async listFiles(accessToken: string, options?: {
    folderId?: string
    search?: string
    mimeType?: string
    limit?: number
  }) {
    this.oauth2Client.setCredentials({ access_token: accessToken })
    const drive = google.drive({ version: 'v3', auth: this.oauth2Client })

    let query = "trashed = false"
    
    if (options?.folderId) {
      query += ` and '${options.folderId}' in parents`
    }
    
    if (options?.search) {
      query += ` and name contains '${options.search}'`
    }
    
    if (options?.mimeType) {
      query += ` and mimeType = '${options.mimeType}'`
    }

    const response = await drive.files.list({
      q: query,
      pageSize: options?.limit || 50,
      fields: 'nextPageToken, files(id, name, mimeType, size, createdTime, modifiedTime, webViewLink, thumbnailLink, permissions)'
    })

    return response.data
  }

  async uploadFile(accessToken: string, fileData: {
    name: string
    data: Buffer
    mimeType: string
    parentFolderId?: string
  }) {
    this.oauth2Client.setCredentials({ access_token: accessToken })
    const drive = google.drive({ version: 'v3', auth: this.oauth2Client })

    const media = {
      mimeType: fileData.mimeType,
      body: fileData.data
    }

    const fileMetadata: any = {
      name: fileData.name
    }

    if (fileData.parentFolderId) {
      fileMetadata.parents = [fileData.parentFolderId]
    }

    const response = await drive.files.create({
      requestBody: fileMetadata,
      media,
      fields: 'id, name, mimeType, size, webViewLink'
    })

    return response.data
  }

  async createWorkspaceFolder(accessToken: string, workspaceName: string, parentFolderId?: string) {
    this.oauth2Client.setCredentials({ access_token: accessToken })
    const drive = google.drive({ version: 'v3', auth: this.oauth2Client })

    const fileMetadata: any = {
      name: `PM App - ${workspaceName}`,
      mimeType: 'application/vnd.google-apps.folder'
    }

    if (parentFolderId) {
      fileMetadata.parents = [parentFolderId]
    }

    const response = await drive.files.create({
      requestBody: fileMetadata,
      fields: 'id, name, webViewLink'
    })

    return response.data
  }

  async shareFolder(accessToken: string, folderId: string, emails: string[], role: 'reader' | 'writer' | 'owner' = 'reader') {
    this.oauth2Client.setCredentials({ access_token: accessToken })
    const drive = google.drive({ version: 'v3', auth: this.oauth2Client })

    const permissions = []
    for (const email of emails) {
      const permission = await drive.permissions.create({
        fileId: folderId,
        requestBody: {
          role,
          type: 'user',
          emailAddress: email
        }
      })
      permissions.push(permission.data)
    }

    return permissions
  }
}
```

### 3. Google Drive API Routes

**File: `/src/app/api/integrations/google-drive/auth-url/route.ts`**
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth'
import { GoogleDriveService } from '@/lib/google-drive'

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession(request)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const googleDriveService = new GoogleDriveService()
    const authUrl = googleDriveService.generateAuthUrl()

    // Generate state token for security
    const state = Buffer.from(JSON.stringify({
      userId: session.user.id,
      timestamp: Date.now()
    })).toString('base64')

    return NextResponse.json({
      authUrl: `${authUrl}&state=${state}`,
      state
    })

  } catch (error) {
    console.error('Google Drive auth URL error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
```

---

## 🛠️ **Implementation Priority & Timeline**

### **Phase 1: Calendar API Backend (1-2 days)**
- ✅ Database schema exists
- 🚧 Complete API routes
- 🚧 Update frontend
- ✅ Priority: HIGH (needed for calendar functionality)

### **Phase 2: Payments & Billing (1-2 weeks)**
- 🚧 Stripe integration
- 🚧 Subscription management
- 🚧 Webhook handling
- 🚧 Frontend components
- ✅ Priority: HIGH (monetization)

### **Phase 3: AI Credits System (3-5 days)**
- 🚧 Credit tracking
- 🚧 Usage monitoring
- 🚧 Purchase flow
- ✅ Priority: MEDIUM (AI usage control)

### **Phase 4: Referral Program (2-3 days)**
- 🚧 Referral tracking
- 🚧 Reward calculation
- 🚧 Payout system
- ✅ Priority: LOW (growth feature)

### **Phase 5: Google Drive Integration (1 week)**
- 🚧 OAuth setup
- 🚧 File operations
- 🚧 Workspace integration
- ✅ Priority: LOW (nice-to-have)

---

## 📋 **Implementation Checklist**

### Pre-Implementation
- [ ] Set up development environment
- [ ] Install required dependencies
- [ ] Configure environment variables
- [ ] Review database schema

### Phase 1: Calendar Backend
- [ ] Complete calendar API routes
- [ ] Update frontend components
- [ ] Test event creation/editing
- [ ] Verify permission system

### Phase 2: Payments System
- [ ] Set up Stripe account
- [ ] Implement subscription management
- [ ] Create webhook handlers
- [ ] Build payment UI components
- [ ] Test subscription flows

### Phase 3: AI Credits
- [ ] Extend database schema
- [ ] Implement credit service
- [ ] Update AI API endpoints
- [ ] Create purchase flow
- [ ] Add usage monitoring

### Phase 4: Referral System
- [ ] Complete referral APIs
- [ ] Implement tracking
- [ ] Create referral UI
- [ ] Test reward calculation

### Phase 5: Google Drive
- [ ] Set up Google APIs
- [ ] Implement OAuth flow
- [ ] Create file operations
- [ ] Add workspace integration

---

## 🔧 **Development Scripts**

Create these helper scripts for implementation:

**File: `/scripts/setup-billing.js`**
```javascript
// Script to set up Stripe products and prices
// Run: node scripts/setup-billing.js
```

**File: `/scripts/migrate-calendar.js`**
```javascript
// Script to migrate mock calendar data to database
// Run: node scripts/migrate-calendar.js
```

**File: `/scripts/test-integrations.js`**
```javascript
// Script to test all API integrations
// Run: node scripts/test-integrations.js
```

---

## 📊 **Testing Strategy**

1. **Unit Tests**: Test individual API endpoints
2. **Integration Tests**: Test complete workflows
3. **E2E Tests**: Test user journeys
4. **Load Tests**: Test with multiple users
5. **Security Tests**: Test authentication and permissions

---

This implementation guide provides a complete roadmap for implementing all missing API functionality. Each phase builds upon the previous one and includes detailed code examples, database schemas, and testing strategies.

The implementation should be done in phases to ensure stability and allow for iterative testing and refinement.
