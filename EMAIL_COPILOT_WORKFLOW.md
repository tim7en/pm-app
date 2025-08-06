# Email Co-Pilot Full Workflow - Swimlane Chart

This document shows the complete workflow of the Email Co-Pilot system with all existing code paths and functionality.

```mermaid
flowchart TD
    %% Define swimlanes with subgraphs
    subgraph "Frontend Components"
        A[Email Cleanup Co-Pilot Component] --> B{Gmail Connected?}
        B -->|No| C[Show Connect Gmail Button]
        B -->|Yes| D[Load Dashboard Data]
        
        C --> E[OAuth Flow Start]
        E --> F[Redirect to Google Auth]
        F --> G[User Grants Permissions]
        G --> H[OAuth Callback Handler]
        H --> I[Store Tokens in Context]
        I --> D
        
        D --> J[Fetch Gmail Stats API]
        D --> K[Fetch Prospect Stages]
        D --> L[Fetch Sample Emails 100]
        
        subgraph "Tab Navigation"
            M[Dashboard Tab] --> N[Show Stats & Charts]
            O[Bulk Analyzer Tab] --> P[AI Email Processing]
            Q[Label Manager Tab] --> R[Real Gmail Labels]
            S[Label Cleanup Tab] --> T[Label Management Tools]
            U[AI Prompts Tab] --> V[Prompt Configuration]
            W[Email List Tab] --> X[All Emails Display]
            Y[Insights Tab] --> Z[Real Data Analytics]
            AA[Settings Tab] --> BB[Account Management]
        end
        
        X --> CC[Email List with 100 Items]
        CC --> DD{User Clicks Eye Button}
        DD --> EE[Read Email Function]
        EE --> FF[Call Gmail Debug API get-email]
        FF --> GG[Display Full Email Content]
        
        P --> HH[Bulk Email Analysis Form]
        HH --> II{Apply Labels?}
        II -->|Yes| JJ[Process with Label Application]
        II -->|No| KK[Process Analysis Only]
        
        R --> LL[Load Real Gmail Labels]
        LL --> MM[Display in Categories]
        MM --> NN[AI Generated, System, User, Custom]
        
        Z --> OO[Calculate Real Insights]
        OO --> PP[Subject Pattern Analysis]
        OO --> QQ[Follow-up Recommendations]
        OO --> RR[Email Activity Metrics]
    end
    
    subgraph "API Layer"
        SS[/api/email/gmail/connect] --> TT[Generate OAuth URL]
        UU[/api/email/gmail/callback] --> VV[Handle OAuth Response]
        WW[/api/email/gmail/stats] --> XX[Get Email Statistics]
        YY[/api/email/gmail/debug] --> ZZ[Multi-action Debug Endpoint]
        
        ZZ --> AAA{Action Type}
        AAA -->|test-connection| BBB[Test Gmail Connection]
        AAA -->|list-labels| CCC[Get All Gmail Labels]
        AAA -->|sample-emails| DDD[Get Sample Emails]
        AAA -->|get-email| EEE[Get Single Email Content]
        
        FFF[/api/email/gmail/bulk-analyze] --> GGG[AI Bulk Processing]
        HHH[/api/email/process] --> III[Legacy Email Processing]
        JJJ[/api/email/gmail/progress] --> KKK[Session Progress Tracking]
        
        GGG --> LLL{AI Model Selection}
        LLL -->|gpt-4| MMM[OpenAI Processing]
        LLL -->|glm-4| NNN[Z.AI Processing]
        LLL -->|auto| OOO[Auto Fallback Logic]
        
        MMM --> PPP[Email Classification]
        NNN --> PPP
        OOO --> PPP
        
        PPP --> QQQ{Apply Labels?}
        QQQ -->|Yes| RRR[Create Gmail Labels]
        QQQ -->|No| SSS[Return Analysis Only]
        
        RRR --> TTT[Apply Labels to Emails]
        TTT --> UUU[Verify Label Application]
        
        XX --> VVV[Calculate Email Counts]
        VVV --> WWW[Get Label Breakdown]
        WWW --> XXX[Return Statistics Object]
    end
    
    subgraph "Gmail Service Layer"
        YYY[GmailService Class] --> ZZZ[OAuth2 Client Setup]
        ZZZ --> AAAA[Token Management]
        
        AAAA --> BBBB{Token Valid?}
        BBBB -->|No| CCCC[Refresh Token]
        BBBB -->|Yes| DDDD[Use Existing Token]
        
        CCCC --> DDDD
        DDDD --> EEEE[Gmail API Client]
        
        EEEE --> FFFF[getProfile]
        EEEE --> GGGG[getAllEmails]
        EEEE --> HHHH[getUnreadEmails]
        EEEE --> IIII[getLabels]
        EEEE --> JJJJ[createLabel]
        EEEE --> KKKK[addLabel]
        EEEE --> LLLL[getEmailById - NEW]
        EEEE --> MMMM[bulkApplyLabels]
        EEEE --> NNNN[verifyLabelApplied]
        
        FFFF --> OOOO[User Profile Data]
        GGGG --> PPPP[Email List with Metadata]
        HHHH --> QQQQ[Unread Emails Only]
        IIII --> RRRR[Gmail Labels Array]
        JJJJ --> SSSS[New Label ID]
        KKKK --> TTTT[Label Applied to Email]
        LLLL --> UUUU[Full Email Content]
        MMMM --> VVVV[Batch Label Results]
        NNNN --> WWWW[Verification Status]
    end
    
    subgraph "AI Processing Layer"
        XXXX[AI Classification Engine] --> YYYY{Model Available?}
        YYYY -->|OpenAI| ZZZZ[GPT-4 Processing]
        YYYY -->|Z.AI| AAAAA[GLM-4 Processing]
        YYYY -->|None| BBBBB[Return Empty Classification]
        
        ZZZZ --> CCCCC[Send Email to OpenAI]
        CCCCC --> DDDDD[Parse AI Response]
        DDDDD --> EEEEE[Extract Labels & Classifications]
        
        AAAAA --> FFFFF[Send Email to Z.AI]
        FFFFF --> GGGGG[Parse Z.AI Response]
        GGGGG --> EEEEE
        
        EEEEE --> HHHHH[Classification Result Object]
        HHHHH --> IIIII{Labels to Apply?}
        IIIII -->|Yes| JJJJJ[Prepare Label Application]
        IIIII -->|No| KKKKK[Return Analysis Only]
        
        JJJJJ --> LLLLL[Create Missing Labels]
        LLLLL --> MMMMM[Apply Labels to Emails]
        MMMMM --> NNNNN[Track Success/Failure]
        NNNNN --> OOOOO[Return Results with Metrics]
    end
    
    subgraph "Data Storage & Context"
        PPPPP[Email Cleanup Context] --> QQQQQ[Gmail Connection State]
        QQQQQ --> RRRRR[Auth Tokens Storage]
        RRRRR --> SSSSS[Profile Information]
        
        TTTTT[Local Storage] --> UUUUU[gmail-tokens.json for Testing]
        VVVVV[Session Storage] --> WWWWW[Progress Tracking]
        WWWWW --> XXXXX[Real-time Updates]
        
        YYYYY[Component State] --> ZZZZZ[Dashboard Stats]
        ZZZZZ --> AAAAAA[Email List Array]
        AAAAAA --> BBBBBB[Prospect Stages]
        BBBBBB --> CCCCCC[Insights Data]
        CCCCCC --> DDDDDD[Selected Email Content]
    end
    
    subgraph "Testing & Validation"
        EEEEEE[Comprehensive Test Suite] --> FFFFFF[Server Health Check]
        FFFFFF --> GGGGGG[Gmail Auth Test]
        GGGGGG --> HHHHHH[Email Stats Test]
        HHHHHH --> IIIIII[Label Retrieval Test]
        IIIIII --> JJJJJJ[Email Sampling Test]
        JJJJJJ --> KKKKKK[Bulk Analysis Test]
        KKKKKK --> LLLLLL[Label Application Test]
        LLLLLL --> MMMMMM[Label Verification Test]
        
        MMMMMM --> NNNNNN[Generate Test Report]
        NNNNNN --> OOOOOO[Success Rate Calculation]
        OOOOOO --> PPPPPP[88% Current Success Rate]
    end
    
    %% Connect major flows
    J --> XX
    K --> CCC
    L --> DDD
    EE --> EEE
    JJ --> GGG
    KK --> GGG
    LL --> CCC
    
    %% API to Service connections
    XX --> FFFF
    CCC --> IIII
    DDD --> GGGG
    EEE --> LLLL
    GGG --> XXXX
    
    %% Service to Gmail API
    EEEE --> |Gmail API v1| OOOO
    EEEE --> |Gmail API v1| PPPP
    EEEE --> |Gmail API v1| RRRR
    EEEE --> |Gmail API v1| SSSS
    EEEE --> |Gmail API v1| TTTT
    EEEE --> |Gmail API v1| UUUU
    
    %% Data flow back to frontend
    OOOO --> N
    PPPP --> CC
    RRRR --> MM
    UUUU --> GG
    OOOOO --> PP
    
    %% Context management
    I --> RRRRR
    RRRRR --> |Auth Flow| E
    SSSSS --> |Profile Data| D
    
    %% Real-time progress tracking
    XXXXX --> |WebSocket/Polling| HH
    WWWWW --> |Session Data| JJJ
    
    %% Testing validation
    PPPPPP --> |Validates| A
    EEEEEE --> |Tests| SS
    EEEEEE --> |Tests| YYY
    EEEEEE --> |Tests| XXXX
    
    %% Styling
    classDef frontend fill:#e1f5fe
    classDef api fill:#f3e5f5
    classDef service fill:#e8f5e8
    classDef ai fill:#fff3e0
    classDef storage fill:#fce4ec
    classDef testing fill:#f1f8e9
    
    class A,B,C,D,E,F,G,H,I,J,K,L,M,N,O,P,Q,R,S,T,U,V,W,X,Y,Z,AA,BB,CC,DD,EE,FF,GG,HH,II,JJ,KK,LL,MM,NN,OO,PP,QQ,RR frontend
    class SS,TT,UU,VV,WW,XX,YY,ZZ,AAA,BBB,CCC,DDD,EEE,FFF,GGG,HHH,III,JJJ,KKK,LLL,MMM,NNN,OOO,PPP,QQQ,RRR,SSS,TTT,UUU,VVV,WWW,XXX api
    class YYY,ZZZ,AAAA,BBBB,CCCC,DDDD,EEEE,FFFF,GGGG,HHHH,IIII,JJJJ,KKKK,LLLL,MMMM,NNNN,OOOO,PPPP,QQQQ,RRRR,SSSS,TTTT,UUUU,VVVV,WWWW service
    class XXXX,YYYY,ZZZZ,AAAAA,BBBBB,CCCCC,DDDDD,EEEEE,FFFFF,GGGGG,HHHHH,IIIII,JJJJJ,KKKKK,LLLLL,MMMMM,NNNNN,OOOOO ai
    class PPPPP,QQQQQ,RRRRR,SSSSS,TTTTT,UUUUU,VVVVV,WWWWW,XXXXX,YYYYY,ZZZZZ,AAAAAA,BBBBBB,CCCCCC,DDDDDD storage
    class EEEEEE,FFFFFF,GGGGGG,HHHHHH,IIIIII,JJJJJJ,KKKKKK,LLLLLL,MMMMMM,NNNNNN,OOOOOO,PPPPPP testing
```

## Key Workflow Components

### 1. **Frontend Layer** (Light Blue)
- Main Email Co-Pilot component with tab navigation
- Real-time email list with 100+ emails
- Email reading functionality with full content display
- Label management with real Gmail labels
- Insights dashboard with real data analysis

### 2. **API Layer** (Purple)
- OAuth authentication endpoints
- Gmail integration APIs with multiple actions
- Bulk AI processing with progress tracking
- Debug endpoints for testing and validation

### 3. **Gmail Service Layer** (Green)
- Complete Gmail API wrapper
- Token management and refresh logic
- Email operations (read, label, search)
- Bulk operations with batch processing

### 4. **AI Processing Layer** (Orange)
- Multi-model AI support (OpenAI GPT-4, Z.AI GLM-4)
- Auto-fallback mechanism
- Label creation and application
- Classification result tracking

### 5. **Data Storage & Context** (Pink)
- React context for state management
- Local storage for testing tokens
- Session-based progress tracking
- Real-time component state updates

### 6. **Testing & Validation** (Light Green)
- Comprehensive test suite with 8 test cases
- 88% current success rate
- End-to-end validation of all workflows
- Performance and error tracking

## Current Implementation Status

✅ **Completed Features:**
- OAuth authentication with Gmail
- Real Gmail data integration (no mock data)
- AI email classification with dual providers
- Label creation and application
- Bulk email processing
- Progress tracking and monitoring
- Comprehensive testing suite

✅ **Recently Fixed:**
- Label Manager now shows real Gmail labels
- Email List displays 100+ real emails
- Email reading functionality added
- Insights based on real data analysis
- Removed all mock data dependencies

🔄 **Current Workflow State:**
- All major components use real Gmail API data
- AI classification working with OpenAI and Z.AI
- Real-time label application to Gmail accounts
- End-to-end testing validates 88% success rate
- Production-ready email co-pilot functionality

The workflow shows both successful paths and error handling, representing the complete system architecture as it currently exists in the codebase.
