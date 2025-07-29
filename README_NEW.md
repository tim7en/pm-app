# PM-app - Project Management Application

A modern project management application built with Next.js 14, TypeScript, Prisma, and shadcn/ui components.

## Features

- 🔐 **Authentication System** - JWT-based authentication with user roles
- 📊 **Project Management** - Create, edit, and delete projects with role-based access
- ✅ **Task Management** - Complete task lifecycle with status tracking and subtasks
- 👥 **Team Collaboration** - Project member management with role assignments
- 🎯 **Task Verification** - Task completion verification system
- 📱 **Responsive Design** - Mobile-first design with modern UI components
- 🔄 **Real-time Updates** - WebSocket integration for live updates
- 📈 **Analytics Dashboard** - Project and task analytics and reporting
- 📋 **Export Features** - Export projects and tasks to PDF and other formats

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, React
- **UI Components**: shadcn/ui, Tailwind CSS
- **Backend**: Next.js API Routes, Custom server
- **Database**: SQLite with Prisma ORM
- **Authentication**: JWT tokens with role-based access control
- **Real-time**: Socket.IO for WebSocket communication
- **Deployment**: Vercel-ready configuration

## Project Structure

```
src/
├── app/                    # Next.js 14 App Router
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── projects/          # Project management
│   ├── tasks/             # Task management
│   └── ...                # Other pages
├── components/            # Reusable React components
│   ├── dashboard/         # Dashboard components
│   ├── projects/          # Project-related components
│   ├── tasks/             # Task-related components
│   ├── ui/                # shadcn/ui components
│   └── layout/            # Layout components
├── hooks/                 # Custom React hooks
├── lib/                   # Utility functions and configurations
├── contexts/              # React context providers
└── prisma/               # Database schema and migrations
```

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Git

### Installation

1. Clone the repository:
```bash
git clone https://github.com/YOUR_USERNAME/PM-app.git
cd PM-app
```

2. Install dependencies:
```bash
npm install
```

3. Set up the database:
```bash
npx prisma generate
npx prisma db push
npx prisma db seed
```

4. Create a `.env.local` file:
```env
DATABASE_URL="file:./db/custom.db"
JWT_SECRET="your-secret-key-here"
NEXTAUTH_SECRET="your-nextauth-secret"
```

5. Start the development server:
```bash
npm run dev
```

6. Open [http://localhost:3001](http://localhost:3001) in your browser.

### Default Login Credentials

- **Email**: test@example.com
- **Password**: password

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - User logout

### Projects
- `GET /api/projects` - Get all accessible projects
- `POST /api/projects` - Create new project
- `GET /api/projects/[id]` - Get project details
- `PUT /api/projects/[id]` - Update project
- `DELETE /api/projects/[id]` - Delete project

### Tasks
- `GET /api/tasks` - Get all accessible tasks
- `POST /api/tasks` - Create new task
- `GET /api/tasks/[id]` - Get task details
- `PUT /api/tasks/[id]` - Update task
- `DELETE /api/tasks/[id]` - Delete task

## Database Schema

The application uses Prisma with SQLite and includes:

- **Users** - User accounts with roles
- **Projects** - Project entities with ownership
- **Tasks** - Task management with status tracking
- **ProjectMembers** - Project membership with roles
- **SubTasks** - Task breakdown into smaller items
- **Comments** - Task commenting system

## Role-Based Access Control

- **OWNER** - System owner with full access
- **ADMIN** - System administrator with broad permissions
- **MEMBER** - Regular user with limited access
- **VIEWER** - Read-only access to assigned projects

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript compiler

### Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

If you have any questions or issues, please open an issue on GitHub or contact the development team.

---

**Note**: This is a development version. For production deployment, ensure to:
- Use a production database (PostgreSQL recommended)
- Set up proper environment variables
- Configure authentication secrets
- Enable HTTPS
- Set up monitoring and logging
