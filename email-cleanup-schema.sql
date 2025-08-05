-- Email Cleanup Co-Pilot Database Schema
-- Add this to your Prisma schema

model EmailAccount {
  id          String   @id @default(cuid())
  userId      String
  email       String
  provider    String   // 'gmail' | 'outlook' | 'other'
  accessToken String?  @db.Text
  refreshToken String? @db.Text
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  emails      Email[]
  
  @@unique([userId, email])
  @@map("email_accounts")
}

model Email {
  id          String   @id @default(cuid())
  accountId   String
  threadId    String?
  messageId   String   @unique
  subject     String
  fromEmail   String
  fromName    String?
  toEmails    String[] // JSON array
  ccEmails    String[] // JSON array  
  bccEmails   String[] // JSON array
  body        String   @db.Text
  snippet     String?
  timestamp   DateTime
  isRead      Boolean  @default(false)
  labels      String[] // JSON array
  attachments Json?    // Attachment metadata
  rawHeaders  Json?    // Raw email headers
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  account           EmailAccount           @relation(fields: [accountId], references: [id], onDelete: Cascade)
  categorization    EmailCategorization?
  
  @@map("emails")
}

model ProspectStage {
  id          String   @id @default(cuid())
  name        String
  description String?
  keywords    String[] // JSON array
  priority    Int
  color       String
  isDefault   Boolean  @default(false)
  userId      String?  // null for system defaults
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  user            User?                   @relation(fields: [userId], references: [id], onDelete: Cascade)
  categorizations EmailCategorization[]
  
  @@map("prospect_stages")
}

model EmailCategorization {
  id                 String   @id @default(cuid())
  emailId            String   @unique
  prospectStageId    String
  confidence         Float    // 0-1 confidence score
  followUpOpportunity Boolean @default(false)
  followUpSuggestion String?  @db.Text
  responseTemplate   String?  @db.Text
  engagementScore    Float    // 0-1 engagement score
  sentimentScore     Float    // -1 to 1 sentiment score
  urgencyLevel       String   // 'low' | 'medium' | 'high' | 'urgent'
  aiAnalysis         Json?    // Full AI analysis data
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt
  
  email         Email        @relation(fields: [emailId], references: [id], onDelete: Cascade)
  prospectStage ProspectStage @relation(fields: [prospectStageId], references: [id])
  
  @@map("email_categorizations")
}

model EmailInsight {
  id                     String   @id @default(cuid())
  userId                 String
  date                   DateTime
  totalEmails            Int      @default(0)
  categorizedEmails      Int      @default(0)
  followUpOpportunities  Int      @default(0)
  averageResponseTime    Float?   // In hours
  openRate               Float?   // 0-1
  responseRate           Float?   // 0-1
  topSubjects            Json?    // Top performing subjects
  stageDistribution      Json?    // Prospect stage distribution
  createdAt              DateTime @default(now())
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@unique([userId, date])
  @@map("email_insights")
}

model EmailTemplate {
  id          String   @id @default(cuid())
  userId      String
  name        String
  subject     String?
  body        String   @db.Text
  category    String   // 'follow-up' | 'introduction' | 'proposal' | 'closing'
  tags        String[] // JSON array
  useCount    Int      @default(0)
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@map("email_templates")
}

// Add these to existing User model
model User {
  // ... existing fields
  emailAccounts    EmailAccount[]
  prospectStages   ProspectStage[]
  emailInsights    EmailInsight[]
  emailTemplates   EmailTemplate[]
}
