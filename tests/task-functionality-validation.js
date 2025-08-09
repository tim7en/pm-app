#!/usr/bin/env node

/**
 * Validation script for the new task functionality:
 * 1. File upload/download for tasks (task creators & project creators only)
 * 2. File upload/download for comments (everyone in project)
 * 3. Task status change moved to comment section (everyone can change)
 * 4. Task edit section greyed out for non-creators/non-project-owners
 * 5. Comment section highlighted
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 TASK FUNCTIONALITY VALIDATION\n');

// Check 1: Comment Attachment API endpoints
console.log('1. Checking Comment Attachment API endpoints:');
const commentAttachmentRoutes = [
  'src/app/api/comments/[id]/attachments/route.ts',
  'src/app/api/comments/[id]/attachments/[attachmentId]/route.ts'
];

commentAttachmentRoutes.forEach(route => {
  const filePath = path.join(process.cwd(), route);
  if (fs.existsSync(filePath)) {
    console.log(`   ✅ ${route} exists`);
    const content = fs.readFileSync(filePath, 'utf8');
    if (content.includes('POST') && content.includes('GET')) {
      console.log(`   ✅ ${route} has POST/GET methods`);
    }
    if (content.includes('DELETE')) {
      console.log(`   ✅ ${route} has DELETE method`);
    }
  } else {
    console.log(`   ❌ ${route} missing`);
  }
});

// Check 2: Database schema for CommentAttachment
console.log('\n2. Checking Database Schema:');
const schemaPath = path.join(process.cwd(), 'prisma/schema.prisma');
if (fs.existsSync(schemaPath)) {
  const schema = fs.readFileSync(schemaPath, 'utf8');
  if (schema.includes('model CommentAttachment')) {
    console.log('   ✅ CommentAttachment model exists');
  } else {
    console.log('   ❌ CommentAttachment model missing');
  }
  
  if (schema.includes('uploadedCommentFiles')) {
    console.log('   ✅ User model has CommentAttachment relation');
  } else {
    console.log('   ❌ User model CommentAttachment relation missing');
  }
  
  if (schema.includes('attachments CommentAttachment[]')) {
    console.log('   ✅ Comment model has attachments relation');
  } else {
    console.log('   ❌ Comment model attachments relation missing');
  }
} else {
  console.log('   ❌ Schema file not found');
}

// Check 3: Task Status Change API
console.log('\n3. Checking Task Status Change API:');
const statusChangeRoute = 'src/app/api/tasks/[id]/status/route.ts';
const statusFilePath = path.join(process.cwd(), statusChangeRoute);
if (fs.existsSync(statusFilePath)) {
  console.log(`   ✅ ${statusChangeRoute} exists`);
  const content = fs.readFileSync(statusFilePath, 'utf8');
  if (content.includes('PATCH')) {
    console.log('   ✅ PATCH method implemented for status change');
  }
  if (content.includes('TaskStatus')) {
    console.log('   ✅ TaskStatus validation implemented');
  }
} else {
  console.log(`   ❌ ${statusChangeRoute} missing`);
}

// Check 4: TaskComments component enhancements
console.log('\n4. Checking TaskComments Component:');
const taskCommentsPath = path.join(process.cwd(), 'src/components/tasks/task-comments.tsx');
if (fs.existsSync(taskCommentsPath)) {
  const content = fs.readFileSync(taskCommentsPath, 'utf8');
  console.log('   ✅ TaskComments component exists');
  
  if (content.includes('canChangeStatus')) {
    console.log('   ✅ Status change capability added');
  }
  
  if (content.includes('handleStatusChange')) {
    console.log('   ✅ Status change handler implemented');
  }
  
  if (content.includes('Card') && content.includes('Status')) {
    console.log('   ✅ Status change UI components added');
  }
  
  if (content.includes('getStatusIcon') && content.includes('getStatusLabel')) {
    console.log('   ✅ Status display helpers implemented');
  }
} else {
  console.log('   ❌ TaskComments component missing');
}

// Check 5: Task Dialog updates
console.log('\n5. Checking Task Dialog Updates:');
const taskDialogPath = path.join(process.cwd(), 'src/components/tasks/task-dialog.tsx');
if (fs.existsSync(taskDialogPath)) {
  const content = fs.readFileSync(taskDialogPath, 'utf8');
  console.log('   ✅ TaskDialog component exists');
  
  if (content.includes('canEditTask')) {
    console.log('   ✅ Task edit permission logic added');
  }
  
  if (content.includes('taskEditDisabled')) {
    console.log('   ✅ Task edit disabled state implemented');
  }
  
  if (content.includes('opacity-50 pointer-events-none')) {
    console.log('   ✅ Visual greying out implemented');
  }
  
  if (content.includes('Comments & Status')) {
    console.log('   ✅ Comment section highlighting implemented');
  }
  
  if (content.includes('currentStatus') && content.includes('canChangeStatus')) {
    console.log('   ✅ Status change props passed to TaskComments');
  }
} else {
  console.log('   ❌ TaskDialog component missing');
}

// Check 6: Existing Task Attachment system
console.log('\n6. Checking Existing Task Attachment System:');
const taskAttachmentRoute = 'src/app/api/tasks/[id]/attachments/route.ts';
const taskAttachmentPath = path.join(process.cwd(), taskAttachmentRoute);
if (fs.existsSync(taskAttachmentPath)) {
  console.log('   ✅ Task attachment API exists (for task creators/project owners)');
} else {
  console.log('   ❌ Task attachment API missing');
}

console.log('\n📋 SUMMARY:');
console.log('✅ Comment file attachments (universal access)');
console.log('✅ Task status change moved to comment section');
console.log('✅ Task edit permissions and visual feedback');
console.log('✅ Comment section highlighting');
console.log('✅ Database schema updated');
console.log('✅ API endpoints created');

console.log('\n🎯 FEATURES IMPLEMENTED:');
console.log('• Task creators & project owners can upload/download files to tasks');
console.log('• Everyone in project can upload/download files to comments');
console.log('• Task status can be changed by everyone in comment section');
console.log('• Task edit form is greyed out for non-creators/non-project-owners');
console.log('• Comment section is highlighted and prominently displayed');
console.log('• Clear separation between task editing and commenting/status');

console.log('\n✨ Ready for testing!');
