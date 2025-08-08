// Gmail Integration Demo with Real Email Simulation
// This demonstrates how the system would work with real Gmail emails

console.log('🚀 Gmail Integration Demo Starting...')
console.log('=' .repeat(60))

// Simulated real Gmail emails (based on actual email patterns)
const simulatedGmailEmails = [
  {
    id: '18f2a8b5c7d9e123',
    threadId: 'thread_001',
    subject: 'Re: Website redesign project - excited to move forward',
    from: 'sarah.johnson@tecstartup.com',
    to: ['hello@myagency.com'],
    body: `Hi team,

I hope this email finds you well. I've had a chance to review the proposal you sent last week for our website redesign project, and I'm really impressed with your approach and portfolio.

We're definitely interested in moving forward and would love to schedule a call to discuss the timeline and pricing in more detail. Our budget is flexible, and we're looking to launch the new site by Q4.

A few specific questions:
- Can you accommodate a November launch date?
- Do you offer ongoing maintenance packages?
- What's your process for content migration?

Looking forward to hearing from you soon!

Best regards,
Sarah Johnson
VP Marketing, TechStartup Inc.`,
    snippet: 'I\'ve had a chance to review the proposal you sent last week...',
    timestamp: new Date('2025-08-05T09:30:00Z'),
    isRead: false,
    labels: ['UNREAD', 'INBOX', 'IMPORTANT']
  },
  {
    id: '28a9b6c4d8e2f456',
    threadId: 'thread_002', 
    subject: 'Cold outreach - Digital marketing services for your restaurant',
    from: 'marketing@spamcompany.net',
    to: ['hello@myagency.com'],
    body: `Dear Business Owner,

Are you struggling to get customers through your doors? Our revolutionary digital marketing system has helped over 10,000 restaurants increase their revenue by 300% in just 30 days!

For a limited time, we're offering our premium package at 50% off. Don't miss this opportunity to transform your business.

Click here to claim your discount: [spammy-link]

Best regards,
Generic Marketing Team`,
    snippet: 'Are you struggling to get customers through your doors?...',
    timestamp: new Date('2025-08-05T08:15:00Z'),
    isRead: false,
    labels: ['UNREAD', 'INBOX']
  },
  {
    id: '39c8d7e5f9a3b789',
    threadId: 'thread_003',
    subject: 'Contract signed! Next steps for the mobile app project',
    from: 'david.chen@innovativecorp.com',
    to: ['hello@myagency.com'],
    body: `Hi there,

Great news! I've just signed and returned the contract for the mobile app development project. The legal team approved everything, and we're ready to kick off.

I've attached the signed contract and the initial requirements document. Our team is excited to start working with you.

Can we schedule a kickoff meeting for next week? I'm available Tuesday through Thursday, 2-5 PM EST.

Looking forward to a successful partnership!

David Chen
CTO, Innovative Corp`,
    snippet: 'Great news! I\'ve just signed and returned the contract...',
    timestamp: new Date('2025-08-05T14:22:00Z'),
    isRead: false,
    labels: ['UNREAD', 'INBOX', 'IMPORTANT']
  },
  {
    id: '4ad9e8f6g0b4c012',
    threadId: 'thread_004',
    subject: 'Following up on our proposal - any questions?',
    from: 'me@myagency.com',
    to: ['prospects@retailchain.com'],
    body: `Hi team,

I wanted to follow up on the e-commerce platform proposal I sent two weeks ago. I understand you're probably busy evaluating different options.

I'd be happy to answer any questions you might have or provide additional information that would help with your decision-making process.

Would you be available for a brief 15-minute call this week to discuss?

Best regards,
Alex Thompson
Senior Developer`,
    snippet: 'I wanted to follow up on the e-commerce platform proposal...',
    timestamp: new Date('2025-08-05T11:45:00Z'),
    isRead: false,
    labels: ['UNREAD', 'SENT']
  },
  {
    id: '5be0f9g7h1c5d345',
    threadId: 'thread_005',
    subject: 'Thanks but we\'ve decided to go with another vendor',
    from: 'procurement@bigcorp.com',
    to: ['hello@myagency.com'],
    body: `Dear Team,

Thank you for taking the time to submit a proposal for our digital transformation project. We appreciate the effort you put into understanding our requirements.

After careful consideration, we have decided to move forward with another vendor who better aligns with our current strategic direction and budget constraints.

We will keep your information on file for future opportunities that may be a better fit.

Thank you again for your interest in working with us.

Best regards,
Jennifer Martinez
Procurement Manager, BigCorp`,
    snippet: 'Thank you for taking the time to submit a proposal...',
    timestamp: new Date('2025-08-05T16:10:00Z'),
    isRead: false,
    labels: ['UNREAD', 'INBOX']
  },
  {
    id: '6cf1g0h8i2d6e678',
    threadId: 'thread_006',
    subject: 'Pricing question - WordPress maintenance packages',
    from: 'info@smallbusiness.local',
    to: ['hello@myagency.com'],
    body: `Hello,

I found your website through a Google search and I'm interested in your WordPress maintenance services.

Could you please send me information about:
- Monthly maintenance packages and pricing
- What's included in each package
- Response times for urgent issues
- Whether you handle security updates

My website is a small business site with about 20 pages and a contact form. Nothing too complex.

Thanks in advance!

Mike Rodriguez
Owner, Local Print Shop`,
    snippet: 'I found your website through a Google search...',
    timestamp: new Date('2025-08-05T13:30:00Z'),
    isRead: false,
    labels: ['UNREAD', 'INBOX']
  },
  {
    id: '7dg2h1i9j3e7f901',
    threadId: 'thread_007',
    subject: 'Meeting notes and next steps from yesterday\'s call',
    from: 'project.manager@enterprise.com',
    to: ['hello@myagency.com'],
    body: `Hi team,

Thanks for the productive call yesterday. Here are the key points we discussed:

Action Items:
- You'll send revised wireframes by Friday
- We'll provide final logo assets by Wednesday  
- Legal review of terms is scheduled for next week
- Project kickoff planned for August 15th

Budget approved: $85,000 for the initial phase
Timeline: 12 weeks from kickoff to launch

Let me know if I missed anything important.

Best,
Lisa Wang
Senior Project Manager`,
    snippet: 'Thanks for the productive call yesterday. Here are the key points...',
    timestamp: new Date('2025-08-05T10:15:00Z'),
    isRead: false,
    labels: ['UNREAD', 'INBOX', 'IMPORTANT']
  },
  {
    id: '8eh3i2j0k4f8g234',
    threadId: 'thread_008',
    subject: 'Invoice #2024-089 - Payment processed',
    from: 'accounting@happyclient.com',
    to: ['billing@myagency.com'],
    body: `Dear Billing Team,

This email confirms that payment for Invoice #2024-089 in the amount of $15,750.00 has been processed and will be transferred to your account within 2-3 business days.

Project: E-commerce website development
Invoice Date: July 28, 2025
Payment Method: ACH Transfer

Thank you for your excellent work on our project.

Best regards,
Robert Kim
Accounting Department`,
    snippet: 'This email confirms that payment for Invoice #2024-089...',
    timestamp: new Date('2025-08-05T15:45:00Z'),
    isRead: false,
    labels: ['UNREAD', 'INBOX']
  },
  {
    id: '9fi4j3k1l5g9h567',
    threadId: 'thread_009',
    subject: 'Urgent: Website down - need immediate assistance',
    from: 'emergency@criticalclient.com',
    to: ['support@myagency.com'],
    body: `URGENT ASSISTANCE NEEDED

Our e-commerce website has been down for the past 2 hours and we're losing sales. Customers can't complete purchases and we're getting error messages.

Error: "Database connection failed"

This is costing us approximately $5,000 per hour in lost revenue. Please respond immediately.

Contact me directly: (555) 123-4567

Tom Bradley
Operations Director
Critical Client Corp`,
    snippet: 'Our e-commerce website has been down for the past 2 hours...',
    timestamp: new Date('2025-08-05T17:30:00Z'),
    isRead: false,
    labels: ['UNREAD', 'INBOX', 'IMPORTANT']
  },
  {
    id: '0gj5k4l2m6h0i890',
    threadId: 'thread_010',
    subject: 'Referral opportunity - my colleague needs web development',
    from: 'satisfied.customer@example.com',
    to: ['hello@myagency.com'],
    body: `Hi Alex,

I hope you're doing well! I've been extremely happy with the website you built for my consulting business last year.

My colleague Jessica runs a yoga studio and is looking for someone to build her a new website with online class booking functionality. I immediately thought of your team.

She has a budget of around $8,000-$12,000 and needs it completed by October for her fall class schedule launch.

Would you be interested in this project? If so, I can introduce you both.

Best regards,
Amanda Foster
Foster Consulting Solutions`,
    snippet: 'I hope you\'re doing well! I\'ve been extremely happy...',
    timestamp: new Date('2025-08-05T12:20:00Z'),
    isRead: false,
    labels: ['UNREAD', 'INBOX']
  }
]

// Simulate AI analysis for each email
const analyzeEmailWithAI = (email) => {
  // Simulate the AI analysis process
  let category = 'uncategorized'
  let prospectStage = 'unknown'
  let priority = 'medium'
  let sentiment = 0
  let suggestedActions = []
  let confidence = 0.5

  const subject = email.subject.toLowerCase()
  const body = email.body.toLowerCase()
  const from = email.from.toLowerCase()

  // Prospect stage detection
  if (body.includes('signed') && body.includes('contract')) {
    prospectStage = 'Closed Won'
    category = 'Closed Won'
    priority = 'high'
    sentiment = 0.9
    suggestedActions = ['Schedule kickoff meeting', 'Send welcome package']
    confidence = 0.95
  } else if (body.includes('interested') && body.includes('move forward')) {
    prospectStage = 'Qualified Lead'
    category = 'Qualified Lead'
    priority = 'high'
    sentiment = 0.8
    suggestedActions = ['Schedule demo call', 'Send detailed proposal']
    confidence = 0.9
  } else if (body.includes('decided to go with another') || body.includes('not interested')) {
    prospectStage = 'Closed Lost'
    category = 'Closed Lost'
    priority = 'low'
    sentiment = -0.3
    suggestedActions = ['Update CRM status', 'Send thank you note']
    confidence = 0.95
  } else if (body.includes('urgent') || subject.includes('urgent')) {
    prospectStage = 'Follow-up Required'
    category = 'Support Issue'
    priority = 'urgent'
    sentiment = -0.5
    suggestedActions = ['Respond immediately', 'Escalate to senior team']
    confidence = 0.9
  } else if (body.includes('invoice') && body.includes('payment')) {
    prospectStage = 'Closed Won'
    category = 'Payment Confirmation'
    priority = 'medium'
    sentiment = 0.7
    suggestedActions = ['Update accounting records', 'Send receipt']
    confidence = 0.85
  } else if (body.includes('pricing') || body.includes('quote')) {
    prospectStage = 'Qualified Lead'
    category = 'Pricing Inquiry'
    priority = 'high'
    sentiment = 0.6
    suggestedActions = ['Send pricing package', 'Schedule consultation']
    confidence = 0.8
  } else if (body.includes('referral') || body.includes('colleague')) {
    prospectStage = 'Cold Outreach'
    category = 'Referral'
    priority = 'high'
    sentiment = 0.8
    suggestedActions = ['Thank referrer', 'Contact new prospect']
    confidence = 0.85
  } else if (from.includes('spam') || body.includes('50% off') || body.includes('click here')) {
    prospectStage = 'Closed Lost'
    category = 'Spam'
    priority = 'low'
    sentiment = -0.8
    suggestedActions = ['Mark as spam', 'Block sender']
    confidence = 0.9
  } else if (body.includes('follow up') || body.includes('following up')) {
    prospectStage = 'Follow-up Required'
    category = 'Follow-up'
    priority = 'medium'
    sentiment = 0.3
    suggestedActions = ['Schedule follow-up call', 'Send additional info']
    confidence = 0.75
  } else if (body.includes('meeting') && body.includes('next steps')) {
    prospectStage = 'Negotiation'
    category = 'Project Planning'
    priority = 'high'
    sentiment = 0.8
    suggestedActions = ['Review action items', 'Prepare deliverables']
    confidence = 0.85
  }

  return {
    category,
    prospectStage,
    priority,
    sentiment,
    confidence,
    suggestedActions,
    keyEntities: extractKeyEntities(email),
    isProspect: !['Spam', 'Payment Confirmation'].includes(category),
    isImportant: priority === 'high' || priority === 'urgent',
    requiresAction: suggestedActions.length > 0
  }
}

// Extract key entities from email content
const extractKeyEntities = (email) => {
  const entities = []
  const text = `${email.subject} ${email.body}`.toLowerCase()
  
  // Company names
  const companies = text.match(/\b[A-Z][a-z]+ (Inc|Corp|LLC|Ltd|Company)\b/g) || []
  entities.push(...companies)
  
  // Dollar amounts
  const amounts = text.match(/\$[\d,]+/g) || []
  entities.push(...amounts)
  
  // Dates
  const dates = text.match(/\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\b/gi) || []
  entities.push(...dates.slice(0, 3)) // Limit to first 3
  
  return [...new Set(entities)].slice(0, 5) // Remove duplicates and limit
}

// Run the demo analysis
const runGmailAnalysisDemo = () => {
  console.log('📧 Analyzing 10 Simulated Gmail Emails...\n')
  
  const results = simulatedGmailEmails.map(email => {
    const analysis = analyzeEmailWithAI(email)
    
    return {
      id: email.id,
      subject: email.subject,
      from: email.from,
      snippet: email.snippet,
      timestamp: email.timestamp,
      analysis: {
        category: analysis.category,
        confidence: analysis.confidence,
        reasons: [`Detected ${analysis.prospectStage.toLowerCase()} stage`, `Sentiment: ${analysis.sentiment > 0 ? 'positive' : analysis.sentiment < 0 ? 'negative' : 'neutral'}`],
        priority: analysis.priority,
        sentiment: analysis.sentiment,
        keyEntities: analysis.keyEntities,
        suggestedActions: analysis.suggestedActions,
        prospectStage: analysis.prospectStage
      },
      classification: {
        isProspect: analysis.isProspect,
        isImportant: analysis.isImportant,
        requiresAction: analysis.requiresAction,
        category: analysis.category
      }
    }
  })

  // Display results
  results.forEach((email, index) => {
    console.log(`${index + 1}. 📧 ${email.subject}`)
    console.log(`   From: ${email.from}`)
    console.log(`   🎯 Category: ${email.analysis.category}`)
    console.log(`   📊 Confidence: ${(email.analysis.confidence * 100).toFixed(0)}%`)
    console.log(`   ⚡ Priority: ${email.analysis.priority.toUpperCase()}`)
    console.log(`   😊 Sentiment: ${email.analysis.sentiment > 0 ? '😊 Positive' : email.analysis.sentiment < 0 ? '😞 Negative' : '😐 Neutral'} (${email.analysis.sentiment.toFixed(2)})`)
    console.log(`   🏷️ Prospect Stage: ${email.analysis.prospectStage}`)
    
    if (email.analysis.keyEntities.length > 0) {
      console.log(`   🔍 Key Entities: ${email.analysis.keyEntities.join(', ')}`)
    }
    
    if (email.analysis.suggestedActions.length > 0) {
      console.log(`   ✅ Actions: ${email.analysis.suggestedActions.join(', ')}`)
    }
    
    console.log(`   📈 Prospect: ${email.classification.isProspect ? 'Yes' : 'No'} | Important: ${email.classification.isImportant ? 'Yes' : 'No'} | Action Needed: ${email.classification.requiresAction ? 'Yes' : 'No'}`)
    console.log('')
  })

  // Generate summary statistics
  const summary = {
    totalEmails: results.length,
    categorized: results.filter(r => r.analysis.category !== 'uncategorized').length,
    errors: 0,
    categoryBreakdown: {},
    prospectStageBreakdown: {},
    priorityBreakdown: {},
    insights: {
      highPriorityCount: results.filter(r => r.analysis.priority === 'high' || r.analysis.priority === 'urgent').length,
      prospectCount: results.filter(r => r.classification.isProspect).length,
      actionRequiredCount: results.filter(r => r.classification.requiresAction).length
    }
  }

  // Calculate breakdowns
  results.forEach(result => {
    // Category breakdown
    const cat = result.analysis.category
    summary.categoryBreakdown[cat] = (summary.categoryBreakdown[cat] || 0) + 1
    
    // Prospect stage breakdown
    const stage = result.analysis.prospectStage
    summary.prospectStageBreakdown[stage] = (summary.prospectStageBreakdown[stage] || 0) + 1
    
    // Priority breakdown
    const priority = result.analysis.priority
    summary.priorityBreakdown[priority] = (summary.priorityBreakdown[priority] || 0) + 1
  })

  console.log('📊 ANALYSIS SUMMARY')
  console.log('=' .repeat(40))
  console.log(`📧 Total Emails: ${summary.totalEmails}`)
  console.log(`✅ Successfully Categorized: ${summary.categorized}`)
  console.log(`🎯 Prospects Found: ${summary.insights.prospectCount}`)
  console.log(`⚡ High Priority: ${summary.insights.highPriorityCount}`)
  console.log(`📋 Action Required: ${summary.insights.actionRequiredCount}`)

  console.log('\n📂 CATEGORY BREAKDOWN:')
  Object.entries(summary.categoryBreakdown).forEach(([category, count]) => {
    console.log(`   ${category}: ${count}`)
  })

  console.log('\n🎯 PROSPECT STAGE BREAKDOWN:')
  Object.entries(summary.prospectStageBreakdown).forEach(([stage, count]) => {
    console.log(`   ${stage}: ${count}`)
  })

  console.log('\n⚡ PRIORITY BREAKDOWN:')
  Object.entries(summary.priorityBreakdown).forEach(([priority, count]) => {
    console.log(`   ${priority}: ${count}`)
  })

  console.log('\n🎉 DEMO COMPLETE!')
  console.log('This demonstrates how the Gmail integration would work with real emails.')
  console.log('The AI successfully categorized prospects, priorities, and suggested actions.')

  return { results, summary }
}

// Run the demo
runGmailAnalysisDemo()

console.log('\n🚀 To test with real Gmail emails:')
console.log('1. Configure Google OAuth credentials')
console.log('2. Set environment variables (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, OPENAI_API_KEY)')
console.log('3. Go to /email-cleanup > Gmail Test tab')
console.log('4. Click "Connect Gmail" and authorize access')
console.log('5. Click "Start AI Analysis" to analyze real unread emails')

// Make available in browser
if (typeof window !== 'undefined') {
  window.runGmailAnalysisDemo = runGmailAnalysisDemo
  window.simulatedGmailEmails = simulatedGmailEmails
}
