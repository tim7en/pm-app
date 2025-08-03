# Database Schema Extension for Payments, AI, Referrals & Storage

This document outlines the additional database models needed to support payments, AI usage billing, referral programs, and Google Drive integration.

## New Database Models

### 1. Subscription & Billing Models

```prisma
model Subscription {
  id                  String             @id @default(cuid())
  userId              String?            // For individual subscriptions
  workspaceId         String?            // For team subscriptions
  stripeSubscriptionId String?           @unique
  
  plan                SubscriptionPlan
  status              SubscriptionStatus @default(ACTIVE)
  billingInterval     BillingInterval    @default(MONTHLY)
  
  // Pricing
  amount              Int                // Amount in cents
  currency            String             @default("USD")
  
  // Periods
  currentPeriodStart  DateTime
  currentPeriodEnd    DateTime
  trialStart          DateTime?
  trialEnd            DateTime?
  cancelAtPeriodEnd   Boolean            @default(false)
  canceledAt          DateTime?
  
  // Usage limits
  maxUsers            Int                @default(1)
  maxStorage          Int                @default(1024) // MB
  maxAiCredits        Int                @default(10)
  maxApiCalls         Int                @default(1000)
  
  createdAt           DateTime           @default(now())
  updatedAt           DateTime           @updatedAt

  // Relations
  user                User?              @relation(fields: [userId], references: [id], onDelete: Cascade)
  workspace           Workspace?         @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  invoices            Invoice[]
  usageRecords        UsageRecord[]

  @@map("subscriptions")
}

model PaymentMethod {
  id                  String   @id @default(cuid())
  userId              String
  stripePaymentMethodId String @unique
  
  type                String   // card, bank_account, etc.
  isDefault           Boolean  @default(false)
  
  // Card details (for display)
  cardBrand           String?
  cardLast4           String?
  cardExpMonth        Int?
  cardExpYear         Int?
  
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  // Relations
  user                User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  invoices            Invoice[]

  @@map("payment_methods")
}

model Invoice {
  id                  String        @id @default(cuid())
  subscriptionId      String
  paymentMethodId     String?
  stripeInvoiceId     String?       @unique
  
  number              String        @unique
  status              InvoiceStatus @default(PENDING)
  
  // Amounts in cents
  subtotal            Int
  tax                 Int           @default(0)
  total               Int
  amountPaid          Int           @default(0)
  currency            String        @default("USD")
  
  description         String?
  
  // Dates
  issueDate           DateTime      @default(now())
  dueDate             DateTime
  paidAt              DateTime?
  
  // URLs
  hostedInvoiceUrl    String?
  invoicePdfUrl       String?
  
  createdAt           DateTime      @default(now())
  updatedAt           DateTime      @updatedAt

  // Relations
  subscription        Subscription  @relation(fields: [subscriptionId], references: [id], onDelete: Cascade)
  paymentMethod       PaymentMethod? @relation(fields: [paymentMethodId], references: [id], onDelete: SetNull)
  lineItems           InvoiceLineItem[]

  @@map("invoices")
}

model InvoiceLineItem {
  id          String   @id @default(cuid())
  invoiceId   String
  
  description String
  quantity    Int      @default(1)
  unitAmount  Int      // Amount in cents
  amount      Int      // Total amount in cents
  
  // Relations
  invoice     Invoice  @relation(fields: [invoiceId], references: [id], onDelete: Cascade)

  @@map("invoice_line_items")
}

model UsageRecord {
  id             String         @id @default(cuid())
  subscriptionId String
  userId         String?
  workspaceId    String?
  
  metric         UsageMetric
  quantity       Int
  unit           String         @default("count")
  
  // Metadata
  description    String?
  metadata       String?        // JSON string for additional data
  
  recordedAt     DateTime       @default(now())
  billingPeriod  DateTime       // The billing period this usage belongs to

  // Relations
  subscription   Subscription   @relation(fields: [subscriptionId], references: [id], onDelete: Cascade)
  user           User?          @relation("UserUsageRecords", fields: [userId], references: [id], onDelete: Cascade)
  workspace      Workspace?     @relation("WorkspaceUsageRecords", fields: [workspaceId], references: [id], onDelete: SetNull)

  @@map("usage_records")
}
```

### 2. AI Credits & Usage Models

```prisma
model AiCreditBalance {
  id             String   @id @default(cuid())
  userId         String?
  workspaceId    String?
  
  balance        Int      @default(0)
  totalPurchased Int      @default(0)
  totalUsed      Int      @default(0)
  
  // Reset information for subscription limits
  lastReset      DateTime @default(now())
  nextReset      DateTime
  
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  // Relations
  user           User?       @relation("UserAiCredits", fields: [userId], references: [id], onDelete: Cascade)
  workspace      Workspace?  @relation("WorkspaceAiCredits", fields: [workspaceId], references: [id], onDelete: Cascade)
  transactions   AiCreditTransaction[]

  @@unique([userId, workspaceId])
  @@map("ai_credit_balances")
}

model AiCreditTransaction {
  id             String            @id @default(cuid())
  balanceId      String
  userId         String
  
  type           CreditTransactionType
  amount         Int               // Positive for additions, negative for usage
  
  // Service information for usage
  service        AiService?
  description    String?
  metadata       String?           // JSON string for service-specific data
  
  // Purchase information
  purchaseAmount Decimal?          @db.Decimal(10, 2) // USD amount for purchases
  paymentMethodId String?
  
  createdAt      DateTime          @default(now())

  // Relations
  balance        AiCreditBalance   @relation(fields: [balanceId], references: [id], onDelete: Cascade)
  user           User              @relation("UserAiTransactions", fields: [userId], references: [id], onDelete: Cascade)

  @@map("ai_credit_transactions")
}

model AiUsageLog {
  id          String    @id @default(cuid())
  userId      String
  workspaceId String?
  
  service     AiService
  operation   String    // Specific operation within the service
  creditsUsed Int
  
  // Request/Response data
  inputTokens  Int?
  outputTokens Int?
  requestData  String?  // JSON string of request parameters
  
  // Performance metrics
  processingTime Int?   // Milliseconds
  success        Boolean @default(true)
  errorMessage   String?
  
  createdAt   DateTime @default(now())

  // Relations
  user        User      @relation("UserAiUsage", fields: [userId], references: [id], onDelete: Cascade)
  workspace   Workspace? @relation("WorkspaceAiUsage", fields: [workspaceId], references: [id], onDelete: SetNull)

  @@map("ai_usage_logs")
}
```

### 3. Referral Program Models

```prisma
model ReferralProgram {
  id                    String   @id @default(cuid())
  userId                String   @unique
  
  referralCode          String   @unique
  customReferralUrl     String?
  
  // Statistics
  totalReferrals        Int      @default(0)
  successfulReferrals   Int      @default(0)
  totalEarnings         Decimal  @default(0) @db.Decimal(10, 2)
  availableBalance      Decimal  @default(0) @db.Decimal(10, 2)
  paidOut               Decimal  @default(0) @db.Decimal(10, 2)
  
  // Settings
  isActive              Boolean  @default(true)
  customMessage         String?
  
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt

  // Relations
  user                  User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  referrals             Referral[]
  payouts               ReferralPayout[]

  @@map("referral_programs")
}

model Referral {
  id                String         @id @default(cuid())
  referralProgramId String
  
  // Referee information
  refereeEmail      String
  refereeName       String?
  refereeUserId     String?        // Set when they actually sign up
  
  status            ReferralStatus @default(PENDING)
  
  // Tracking
  ipAddress         String?
  userAgent         String?
  source            String?        // utm_source equivalent
  campaign          String?        // utm_campaign equivalent
  
  // Important dates
  clickedAt         DateTime       @default(now())
  signupAt          DateTime?
  confirmedAt       DateTime?      // When they become a paying customer
  
  // Reward information
  rewardAmount      Decimal?       @db.Decimal(10, 2)
  rewardPaidAt      DateTime?
  
  // Relations
  referralProgram   ReferralProgram @relation(fields: [referralProgramId], references: [id], onDelete: Cascade)
  referee           User?          @relation("UserReferrals", fields: [refereeUserId], references: [id], onDelete: SetNull)

  @@map("referrals")
}

model ReferralPayout {
  id                String         @id @default(cuid())
  referralProgramId String
  
  amount            Decimal        @db.Decimal(10, 2)
  currency          String         @default("USD")
  
  method            PayoutMethod
  status            PayoutStatus   @default(PENDING)
  
  // Payment details
  accountEmail      String?
  accountId         String?
  transactionId     String?
  
  requestedAt       DateTime       @default(now())
  processedAt       DateTime?
  completedAt       DateTime?
  
  notes             String?
  errorMessage      String?

  // Relations
  referralProgram   ReferralProgram @relation(fields: [referralProgramId], references: [id], onDelete: Cascade)

  @@map("referral_payouts")
}
```

### 4. Google Drive Integration Models

```prisma
model GoogleDriveIntegration {
  id              String   @id @default(cuid())
  userId          String   @unique
  workspaceId     String?
  
  // OAuth tokens
  accessToken     String
  refreshToken    String
  tokenExpiresAt  DateTime
  
  // Drive info
  driveEmail      String
  driveId         String?
  quotaTotal      BigInt?
  quotaUsed       BigInt?
  
  // Sync settings
  autoSync        Boolean  @default(true)
  syncFrequency   String   @default("hourly") // hourly, daily, manual
  lastSyncAt      DateTime?
  
  // Folder mappings
  rootFolderId    String?  // Main folder for this integration
  workspaceFolderId String? // Specific workspace folder
  
  isActive        Boolean  @default(true)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  // Relations
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  workspace       Workspace? @relation(fields: [workspaceId], references: [id], onDelete: SetNull)
  driveFiles      DriveFile[]
  syncLogs        DriveSyncLog[]

  @@map("google_drive_integrations")
}

model DriveFile {
  id              String   @id @default(cuid())
  integrationId   String
  
  // Google Drive file info
  driveFileId     String   @unique
  fileName        String
  mimeType        String
  fileSize        BigInt?
  
  // Drive URLs
  webViewLink     String?
  downloadUrl     String?
  thumbnailLink   String?
  
  // Drive metadata
  driveCreatedAt  DateTime
  driveModifiedAt DateTime
  driveParentId   String?
  
  // App associations
  taskId          String?
  projectId       String?
  workspaceId     String?
  
  // Permissions
  isPublic        Boolean  @default(false)
  canEdit         Boolean  @default(false)
  canShare        Boolean  @default(true)
  
  // Local cache
  localPath       String?  // If file is cached locally
  cacheExpiry     DateTime?
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  // Relations
  integration     GoogleDriveIntegration @relation(fields: [integrationId], references: [id], onDelete: Cascade)
  task            Task?    @relation(fields: [taskId], references: [id], onDelete: SetNull)
  project         Project? @relation(fields: [projectId], references: [id], onDelete: SetNull)
  workspace       Workspace? @relation(fields: [workspaceId], references: [id], onDelete: SetNull)

  @@map("drive_files")
}

model DriveSyncLog {
  id              String   @id @default(cuid())
  integrationId   String
  
  syncType        String   // full, incremental, file_specific
  status          String   // started, completed, failed
  
  filesScanned    Int      @default(0)
  filesAdded      Int      @default(0)
  filesUpdated    Int      @default(0)
  filesRemoved    Int      @default(0)
  
  errorMessage    String?
  errorDetails    String?  // JSON string for detailed error info
  
  startedAt       DateTime @default(now())
  completedAt     DateTime?
  duration        Int?     // Milliseconds

  // Relations
  integration     GoogleDriveIntegration @relation(fields: [integrationId], references: [id], onDelete: Cascade)

  @@map("drive_sync_logs")
}
```

### 5. Storage Management Models

```prisma
model StorageUsage {
  id           String   @id @default(cuid())
  userId       String?
  workspaceId  String?
  
  // Usage by category
  totalUsed    BigInt   @default(0) // Bytes
  
  taskAttachments    BigInt @default(0)
  driveCache         BigInt @default(0)
  userAvatars        BigInt @default(0)
  projectAssets      BigInt @default(0)
  temporaryFiles     BigInt @default(0)
  
  lastCalculated     DateTime @default(now())
  
  // Relations
  user         User?      @relation("UserStorageUsage", fields: [userId], references: [id], onDelete: Cascade)
  workspace    Workspace? @relation("WorkspaceStorageUsage", fields: [workspaceId], references: [id], onDelete: Cascade)

  @@unique([userId, workspaceId])
  @@map("storage_usage")
}

model FileUpload {
  id           String     @id @default(cuid())
  userId       String
  workspaceId  String?
  
  // File info
  originalName String
  fileName     String
  filePath     String
  fileSize     BigInt
  mimeType     String
  
  // File type and associations
  fileType     FileType
  taskId       String?
  projectId    String?
  
  // Upload info
  uploadStatus UploadStatus @default(UPLOADING)
  checksumMd5  String?
  
  // Lifecycle
  isTemporary  Boolean    @default(false)
  expiresAt    DateTime?
  deletedAt    DateTime?
  
  createdAt    DateTime   @default(now())
  updatedAt    DateTime   @updatedAt

  // Relations
  user         User       @relation("UserFileUploads", fields: [userId], references: [id], onDelete: Cascade)
  workspace    Workspace? @relation("WorkspaceFileUploads", fields: [workspaceId], references: [id], onDelete: SetNull)
  task         Task?      @relation(fields: [taskId], references: [id], onDelete: SetNull)
  project      Project?   @relation(fields: [projectId], references: [id], onDelete: SetNull)

  @@map("file_uploads")
}
```

## Updated Enums

```prisma
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
  INCOMPLETE_EXPIRED
}

enum BillingInterval {
  MONTHLY
  YEARLY
}

enum InvoiceStatus {
  PENDING
  PAID
  FAILED
  REFUNDED
  VOID
}

enum UsageMetric {
  USERS
  STORAGE
  AI_CREDITS
  API_CALLS
  PROJECTS
  TASKS
}

enum CreditTransactionType {
  PURCHASE
  SUBSCRIPTION_GRANT
  USAGE
  REFUND
  BONUS
  ADMIN_ADJUSTMENT
}

enum AiService {
  TASK_GENERATION
  SMART_NOTIFICATIONS
  PROJECT_ANALYSIS
  CHAT_ASSISTANT
  DOCUMENT_ANALYSIS
  WORKFLOW_OPTIMIZATION
}

enum ReferralStatus {
  PENDING
  CLICKED
  SIGNED_UP
  CONFIRMED
  PAID
  EXPIRED
}

enum PayoutMethod {
  STRIPE
  PAYPAL
  BANK_TRANSFER
  STORE_CREDIT
}

enum PayoutStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
  CANCELED
}

enum FileType {
  TASK_ATTACHMENT
  USER_AVATAR
  PROJECT_ASSET
  WORKSPACE_LOGO
  TEMPORARY_UPLOAD
  DRIVE_CACHE
}

enum UploadStatus {
  UPLOADING
  COMPLETED
  FAILED
  VIRUS_SCAN_PENDING
  VIRUS_DETECTED
}
```

## Updated User Model Relations

Add these relations to the existing User model:

```prisma
// Add to User model relations section
subscriptions           Subscription[]
paymentMethods          PaymentMethod[]
usageRecords            UsageRecord[]           @relation("UserUsageRecords")
aiCreditBalance         AiCreditBalance?        @relation("UserAiCredits")
aiCreditTransactions    AiCreditTransaction[]   @relation("UserAiTransactions")
aiUsageLogs             AiUsageLog[]            @relation("UserAiUsage")
referralProgram         ReferralProgram?
referrals               Referral[]              @relation("UserReferrals")
googleDriveIntegration  GoogleDriveIntegration?
storageUsage            StorageUsage?           @relation("UserStorageUsage")
fileUploads             FileUpload[]            @relation("UserFileUploads")
```

## Updated Workspace Model Relations

Add these relations to the existing Workspace model:

```prisma
// Add to Workspace model relations section
subscriptions       Subscription[]
usageRecords        UsageRecord[]     @relation("WorkspaceUsageRecords")
aiCreditBalance     AiCreditBalance?  @relation("WorkspaceAiCredits")
aiUsageLogs         AiUsageLog[]      @relation("WorkspaceAiUsage")
driveIntegrations   GoogleDriveIntegration[]
driveFiles          DriveFile[]
storageUsage        StorageUsage?     @relation("WorkspaceStorageUsage")
fileUploads         FileUpload[]      @relation("WorkspaceFileUploads")
```

## Updated Task and Project Models

Add these relations:

```prisma
// Add to Task model
driveFiles    DriveFile[]
fileUploads   FileUpload[]

// Add to Project model
driveFiles    DriveFile[]
fileUploads   FileUpload[]
```

This schema extension provides a comprehensive foundation for implementing payments, AI usage billing, referral programs, and Google Drive integration while maintaining data integrity and supporting complex business logic.
