const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Create default workspace
  const workspace = await prisma.workspace.upsert({
    where: { id: 'default-workspace-id' },
    update: {},
    create: {
      id: 'default-workspace-id',
      name: 'Default Workspace',
      description: 'Default workspace for project management'
    }
  })

  // Create users with different roles
  const adminPassword = await bcrypt.hash('admin123', 10)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      id: 'admin-user-id',
      email: 'admin@example.com',
      name: 'System Admin',
      password: adminPassword,
      role: 'ADMIN'
    }
  })

  const managerPassword = await bcrypt.hash('manager123', 10)
  const manager = await prisma.user.upsert({
    where: { email: 'manager@example.com' },
    update: {},
    create: {
      id: 'manager-user-id',
      email: 'manager@example.com',
      name: 'Project Manager',
      password: managerPassword,
      role: 'PROJECT_MANAGER'
    }
  })

  const officer1Password = await bcrypt.hash('officer123', 10)
  const officer1 = await prisma.user.upsert({
    where: { email: 'officer1@example.com' },
    update: {},
    create: {
      id: 'officer1-user-id',
      email: 'officer1@example.com',
      name: 'John Officer',
      password: officer1Password,
      role: 'PROJECT_OFFICER'
    }
  })

  const officer2Password = await bcrypt.hash('officer2123', 10)
  const officer2 = await prisma.user.upsert({
    where: { email: 'officer2@example.com' },
    update: {},
    create: {
      id: 'officer2-user-id',
      email: 'officer2@example.com',
      name: 'Jane Officer',
      password: officer2Password,
      role: 'PROJECT_OFFICER'
    }
  })

  const memberPassword = await bcrypt.hash('member123', 10)
  const member = await prisma.user.upsert({
    where: { email: 'member@example.com' },
    update: {},
    create: {
      id: 'member-user-id',
      email: 'member@example.com',
      name: 'Team Member',
      password: memberPassword,
      role: 'MEMBER'
    }
  })

  // Add users to workspace
  const users = [admin, manager, officer1, officer2, member]
  for (const user of users) {
    await prisma.workspaceMember.upsert({
      where: { 
        userId_workspaceId: { 
          userId: user.id, 
          workspaceId: workspace.id 
        } 
      },
      update: {},
      create: {
        userId: user.id,
        workspaceId: workspace.id,
        role: user.id === admin.id ? 'OWNER' : 'MEMBER'
      }
    })
  }

  // Create sample projects with different access levels
  const project1 = await prisma.project.create({
    data: {
      name: 'Enterprise Web Application',
      description: 'A comprehensive web application for enterprise clients',
      color: '#3b82f6',
      status: 'ACTIVE',
      ownerId: admin.id,
      workspaceId: workspace.id,
      startDate: new Date('2024-01-01'),
      dueDate: new Date('2024-06-30')
    }
  })

  const project2 = await prisma.project.create({
    data: {
      name: 'Mobile App Development',
      description: 'Cross-platform mobile application development',
      color: '#10b981',
      status: 'PLANNING',
      ownerId: manager.id,
      workspaceId: workspace.id,
      startDate: new Date('2024-02-01'),
      dueDate: new Date('2024-08-31')
    }
  })

  // Add project members with specific roles
  const projectMembers = [
    { projectId: project1.id, userId: admin.id, role: 'ADMIN' },
    { projectId: project1.id, userId: manager.id, role: 'MANAGER' },
    { projectId: project1.id, userId: officer1.id, role: 'OFFICER' },
    { projectId: project1.id, userId: officer2.id, role: 'OFFICER' },
    { projectId: project1.id, userId: member.id, role: 'MEMBER' },
    
    { projectId: project2.id, userId: manager.id, role: 'ADMIN' },
    { projectId: project2.id, userId: officer1.id, role: 'MANAGER' },
    { projectId: project2.id, userId: officer2.id, role: 'OFFICER' },
    { projectId: project2.id, userId: member.id, role: 'VIEWER' }
  ]

  for (const memberData of projectMembers) {
    await prisma.projectMember.create({
      data: memberData
    })
  }

  // Create project timeline entries
  await prisma.projectTimeline.createMany({
    data: [
      {
        projectId: project1.id,
        title: 'Requirements Analysis',
        description: 'Gather and analyze project requirements',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        color: '#ef4444'
      },
      {
        projectId: project1.id,
        title: 'Development Phase 1',
        description: 'Core functionality development',
        startDate: new Date('2024-02-01'),
        endDate: new Date('2024-04-30'),
        color: '#f59e0b'
      },
      {
        projectId: project1.id,
        title: 'Testing & Deployment',
        description: 'Quality assurance and production deployment',
        startDate: new Date('2024-05-01'),
        endDate: new Date('2024-06-30'),
        color: '#10b981'
      }
    ]
  })

  // Create sections for projects
  const section1 = await prisma.section.create({
    data: {
      name: 'Backend Development',
      projectId: project1.id,
      position: 1
    }
  })

  const section2 = await prisma.section.create({
    data: {
      name: 'Frontend Development',
      projectId: project1.id,
      position: 2
    }
  })

  const section3 = await prisma.section.create({
    data: {
      name: 'Testing',
      projectId: project1.id,
      position: 3
    }
  })

  // Create tasks with different statuses and assignments
  const task1 = await prisma.task.create({
    data: {
      title: 'Setup Database Schema',
      description: 'Design and implement the database schema for the application',
      status: 'DONE',
      priority: 'HIGH',
      dueDate: new Date('2024-01-15'),
      assigneeId: officer1.id,
      creatorId: manager.id,
      projectId: project1.id,
      sectionId: section1.id,
      position: 1,
      completedAt: new Date('2024-01-14'),
      verificationStatus: 'VERIFIED',
      verifiedById: manager.id,
      verifiedAt: new Date('2024-01-15'),
      estimatedHours: 20,
      actualHours: 18
    }
  })

  const task2 = await prisma.task.create({
    data: {
      title: 'Implement User Authentication',
      description: 'Create user registration, login, and authentication system',
      status: 'AWAITING_VERIFICATION',
      priority: 'HIGH',
      dueDate: new Date('2024-02-01'),
      assigneeId: officer2.id,
      creatorId: manager.id,
      projectId: project1.id,
      sectionId: section1.id,
      position: 2,
      completedAt: new Date('2024-01-30'),
      verificationStatus: 'PENDING',
      estimatedHours: 32,
      actualHours: 35
    }
  })

  const task3 = await prisma.task.create({
    data: {
      title: 'Design UI Components',
      description: 'Create reusable UI components for the frontend',
      status: 'IN_PROGRESS',
      priority: 'MEDIUM',
      dueDate: new Date('2024-02-15'),
      assigneeId: member.id,
      creatorId: officer1.id,
      projectId: project1.id,
      sectionId: section2.id,
      position: 1,
      estimatedHours: 40
    }
  })

  const task4 = await prisma.task.create({
    data: {
      title: 'Setup Testing Framework',
      description: 'Configure and setup automated testing framework',
      status: 'TODO',
      priority: 'MEDIUM',
      dueDate: new Date('2024-03-01'),
      assigneeId: officer1.id,
      creatorId: manager.id,
      projectId: project1.id,
      sectionId: section3.id,
      position: 1,
      estimatedHours: 16
    }
  })

  // Create task dependencies
  await prisma.taskDependency.create({
    data: {
      precedingTaskId: task1.id,
      dependentTaskId: task2.id
    }
  })

  await prisma.taskDependency.create({
    data: {
      precedingTaskId: task2.id,
      dependentTaskId: task3.id
    }
  })

  // Create subtasks
  await prisma.subTask.createMany({
    data: [
      {
        title: 'Create user table',
        isCompleted: true,
        taskId: task1.id
      },
      {
        title: 'Create project table',
        isCompleted: true,
        taskId: task1.id
      },
      {
        title: 'Create task table',
        isCompleted: true,
        taskId: task1.id
      },
      {
        title: 'Setup JWT authentication',
        isCompleted: true,
        taskId: task2.id
      },
      {
        title: 'Create login form',
        isCompleted: true,
        taskId: task2.id
      },
      {
        title: 'Create registration form',
        isCompleted: false,
        taskId: task2.id
      }
    ]
  })

  // Create comments
  await prisma.comment.createMany({
    data: [
      {
        content: 'Great work on the database schema! Very well structured.',
        userId: manager.id,
        taskId: task1.id
      },
      {
        content: 'The authentication system looks good, but please add password validation.',
        userId: manager.id,
        taskId: task2.id
      },
      {
        content: 'I have added the password validation as requested.',
        userId: officer2.id,
        taskId: task2.id
      }
    ]
  })

  // Create task tags
  await prisma.taskTag.createMany({
    data: [
      { name: 'backend', taskId: task1.id, color: '#3b82f6' },
      { name: 'database', taskId: task1.id, color: '#6366f1' },
      { name: 'authentication', taskId: task2.id, color: '#8b5cf6' },
      { name: 'security', taskId: task2.id, color: '#ef4444' },
      { name: 'frontend', taskId: task3.id, color: '#10b981' },
      { name: 'ui', taskId: task3.id, color: '#f59e0b' },
      { name: 'testing', taskId: task4.id, color: '#84cc16' }
    ]
  })

  console.log('Database seeded successfully!')
  console.log('\nTest Users:')
  console.log('Admin: admin@example.com / admin123')
  console.log('Manager: manager@example.com / manager123')
  console.log('Officer 1: officer1@example.com / officer123')
  console.log('Officer 2: officer2@example.com / officer2123')
  console.log('Member: member@example.com / member123')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })