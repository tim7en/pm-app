# 🚀 PM-App (Project Management Platform)

Modern project & task management application built on Next.js 15, TypeScript, Prisma, real‑time Socket.IO, shadcn/ui, and robust role / workspace / notification systems. This README consolidates prior duplicate docs and corrects version mismatches.

## ✨ Technology Stack

This scaffold provides a robust foundation built with:

### 🎯 Core Framework
- **⚡ Next.js 15** (App Router)
- **📘 TypeScript 5**
- **🎨 Tailwind CSS 3.4** (corrected; earlier doc showed v4)

### 🧩 UI Components & Styling
- **🧩 shadcn/ui** - High-quality, accessible components built on Radix UI
- **🎯 Lucide React** - Beautiful & consistent icon library
- **🌈 Framer Motion** - Production-ready motion library for React
- **🎨 Next Themes** - Perfect dark mode in 2 lines of code

### 📋 Forms & Validation
- **🎣 React Hook Form** - Performant forms with easy validation
- **✅ Zod** - TypeScript-first schema validation

### 🔄 State Management & Data Fetching
- **🐻 Zustand** - Simple, scalable state management
- **🔄 TanStack Query** - Powerful data synchronization for React
- **🌐 Axios** - Promise-based HTTP client

### 🗄️ Database & Backend
- **🗄️ Prisma** - Next-generation Node.js and TypeScript ORM
- **🔐 NextAuth.js** - Complete open-source authentication solution

### 🎨 Advanced UI Features
- **📊 TanStack Table** - Headless UI for building tables and datagrids
- **🖱️ DND Kit** - Modern drag and drop toolkit for React
- **📊 Recharts** - Redefined chart library built with React and D3
- **🖼️ Sharp** - High performance image processing

### 🌍 Internationalization & Utilities
- **🌍 Next Intl** - Internationalization library for Next.js
- **📅 Date-fns** - Modern JavaScript date utility library
- **🪝 ReactUse** - Collection of essential React hooks for modern development

## 🎯 Why This Scaffold?

- **🏎️ Fast Development** - Pre-configured tooling and best practices
- **🎨 Beautiful UI** - Complete shadcn/ui component library with advanced interactions
- **🔒 Type Safety** - Full TypeScript configuration with Zod validation
- **📱 Responsive** - Mobile-first design principles with smooth animations
- **🗄️ Database Ready** - Prisma ORM configured for rapid backend development
- **🔐 Auth Included** - NextAuth.js for secure authentication flows
- **📊 Data Visualization** - Charts, tables, and drag-and-drop functionality
- **🌍 i18n Ready** - Multi-language support with Next Intl
- **🚀 Production Ready** - Optimized build and deployment settings
- **🤖 AI-Friendly** - Structured codebase perfect for AI assistance

## 🚀 Quick Start (Development)

### Prerequisites
- Node.js >= 20.19.0 (check `.nvmrc` file)
- npm >= 10.0.0

### Platform-specific Node.js Installation

#### Windows
```bash
# Install nvm-windows from: https://github.com/coreybutler/nvm-windows
nvm install 20.19.0
nvm use 20.19.0
```

#### macOS/Linux
```bash
# Install nvm from: https://github.com/nvm-sh/nvm
nvm install 20.19.0
nvm use 20.19.0
```

### Install & Run

```bash
# Install dependencies (use legacy peer deps for compatibility)
npm install --legacy-peer-deps

# Start development server (cross-platform)
npm run dev

# Platform-specific development commands:
npm run dev:windows    # Windows
npm run dev:mac        # macOS/Linux

# Build & start production locally
npm run build
npm start

# PM2 (optional process manager)
npm run start:pm2
```

### Troubleshooting Cross-Platform Issues

1. **Node.js version mismatch**: Ensure you're using Node.js >= 20.19.0
2. **Permission errors on Windows**: Run PowerShell as Administrator
3. **CSS compilation issues**: Clear browser cache and restart dev server
4. **Dependency conflicts**: Always use `--legacy-peer-deps` flag
5. **Path separator issues**: The scripts are now cross-platform compatible

Open [http://localhost:3000](http://localhost:3000) to see your application running.

## 🔐 Core Product Features

- Authentication (role & workspace aware)
- Multi-workspace membership
- Projects (status, ownership, sections)
- Tasks (multi-assignee, verification workflow, dependencies, tags, attachments, subtasks)
- Real-time notifications & messaging (Socket.IO)
- Calendar events & attendees
- Bug reports module
- Conversations (internal / external)
- Internationalization scaffolding
- Analytics / dashboard foundations

## 📁 Project Structure (Simplified)

```
src/
├── app/                 # Next.js App Router pages
├── components/          # Reusable React components
│   └── ui/             # shadcn/ui components
├── hooks/              # Custom React hooks
└── lib/                # Utility functions and configurations
```

## 🛠 API Surface (Representative)

See `src/app/api/*` for full implementation.

| Method | Endpoint      | Purpose        |
|--------|---------------|----------------|
| GET    | /api/projects | List projects  |
| POST   | /api/projects | Create project |
| GET    | /api/tasks    | List tasks     |
| POST   | /api/tasks    | Create task    |
| GET    | /api/health   | Health check   |

Prisma schema (`prisma/schema.prisma`) defines data model & relations.

## 🧪 Testing

Vitest configured (`vitest.config.ts`). Place tests under `tests/` (preferred) and gradually migrate any legacy scripts. Run:
```
npm test
```

## � Database & Migrations

Development: SQLite (fast, local). Production: switch to PostgreSQL.

Apply migrations in production:
```
npm run db:migrate:deploy
```

Local dev (evolve schema):
```
npm run db:migrate
```

## ⚙️ Environment Variables

Essential:
- DATABASE_URL
- NEXTAUTH_SECRET / JWT_SECRET
- PORT / NODE_ENV
- GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET (optional)
- OPENAI_API_KEY (optional)

See `.env.example` & `.env.production.example`.

## 📦 Deployment Overview

1. Docker / Docker Compose – see `DEPLOYMENT_GUIDE.md`
2. PM2 on Ubuntu – see `UBUNTU_DEPLOYMENT_GUIDE.md`
3. Future: PaaS (custom server & Socket.IO need adaptation for Vercel)

Health endpoint: `GET /api/health`
WebSocket path: `/api/socketio`

## 🛡 Security Notes

- Security headers in `next.config.ts`
- Add CSP & permissions-policy post-launch (tracked)
- Rotate all secrets before go-live
- Enforce HTTPS at reverse proxy (Nginx)

## 🧭 Roadmap (Post Launch)

- Consolidate duplicate QA scripts
- S3 / object storage for uploads
- Feature flag system
- Observability (Sentry + OpenTelemetry)
- API rate limiting & abuse protection
- CI pipeline (build / test / scan / deploy)

## 📄 Launch Support

See `PRODUCTION_LAUNCH_CHECKLIST.md` for gating criteria.

## ❤️ Attribution

Built by the team. Production readiness hardening & documentation consolidation complete.

---
For deployment paths consult: `DEPLOYMENT_GUIDE.md` and `UBUNTU_DEPLOYMENT_GUIDE.md`.

## 🤝 Get Started with Z.ai

1. **Clone this scaffold** to jumpstart your project
2. **Visit [chat.z.ai](https://chat.z.ai)** to access your AI coding assistant
3. **Start building** with intelligent code generation and assistance
4. **Deploy with confidence** using the production-ready setup
