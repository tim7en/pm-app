// Debug script to test task reassignment functionality
const fs = require('fs');
const path = require('path');

console.log('🔍 Debugging Task Reassignment Issues\n');

// 1. Check if reassignment dialog has proper multi-assignee support
const checkReassignDialog = () => {
  console.log('📋 Checking Task Reassign Dialog...');
  const dialogPath = path.join(__dirname, 'src', 'components', 'tasks', 'task-reassign-dialog.tsx');
  
  if (fs.existsSync(dialogPath)) {
    const content = fs.readFileSync(dialogPath, 'utf8');
    
    // Check for PUT request logic (our new approach)
    const putMatch = content.match(/method:\s*['"]PUT['"]/)
    if (putMatch) {
      console.log('✅ PUT request found for replacing assignees')
      return true
    } else {
      console.log('❌ PUT request not found for replacing assignees')
    }
    
    // Check POST request logic
    const postMatch = content.match(/selectedAssigneeIds\.length\s*>\s*0/);
    if (postMatch) {
      console.log('✅ POST request logic found for adding assignees');
    } else {
      console.log('❌ POST request logic not found');
    }
    
    return true;
  } else {
    console.log('❌ Task reassign dialog file not found');
    return false;
  }
};

// 2. Check API endpoint implementation
const checkAPIEndpoint = () => {
  console.log('\n🔌 Checking API Endpoint...');
  const endpointPath = path.join(__dirname, 'src', 'app', 'api', 'tasks', '[id]', 'assignees', 'route.ts');
  
  if (fs.existsSync(endpointPath)) {
    const content = fs.readFileSync(endpointPath, 'utf8');
    
    // Check POST logic - should replace existing assignees
    const postLogic = content.includes('Filter out users who are already assigned');
    if (postLogic) {
      console.log('⚠️ POST endpoint only adds new assignees (doesn\'t replace)');
      console.log('💡 Issue found: POST should replace all assignees for reassignment, not just add new ones');
    } else {
      console.log('✅ POST endpoint logic looks correct');
    }
    
    // Check DELETE logic
    const deleteLogic = content.includes('DELETE') && content.includes('userIds');
    if (deleteLogic) {
      console.log('✅ DELETE endpoint accepts userIds');
    } else {
      console.log('❌ DELETE endpoint missing userIds support');
    }
    
    return true;
  } else {
    console.log('❌ API endpoint file not found');
    return false;
  }
};

// 3. Check if there's a proper "replace assignees" endpoint
const checkReplaceLogic = () => {
  console.log('\n🔄 Checking Assignee Replacement Logic...');
  
  const endpointPath = path.join(__dirname, 'src', 'app', 'api', 'tasks', '[id]', 'assignees', 'route.ts');
  
  if (fs.existsSync(endpointPath)) {
    const content = fs.readFileSync(endpointPath, 'utf8');
    
    // Look for PUT endpoint or replacement logic
    const putEndpoint = content.includes('export async function PUT');
    if (putEndpoint) {
      console.log('✅ PUT endpoint found for replacing assignees');
    } else {
      console.log('❌ No PUT endpoint found');
      console.log('💡 Suggestion: Need PUT endpoint for full assignee replacement or modify POST to replace instead of add');
    }
    
    // Check if POST handles replacement
    const replacementLogic = content.includes('Replace all assignees') || content.includes('deleteMany');
    if (replacementLogic) {
      console.log('✅ POST endpoint has replacement logic');
    } else {
      console.log('❌ POST endpoint lacks replacement logic');
    }
    
    return true;
  }
  
  return false;
};

// Main execution
console.log('='.repeat(60));
const dialogCheck = checkReassignDialog();
const endpointCheck = checkAPIEndpoint();
const replaceCheck = checkReplaceLogic();

console.log('\n📊 DIAGNOSIS SUMMARY:');
console.log('='.repeat(60));

if (dialogCheck && endpointCheck && replaceCheck) {
  console.log('🔍 Key Issues Identified:');
  console.log('1. DELETE request in dialog may not include userIds for current assignees');
  console.log('2. POST endpoint only adds assignees instead of replacing them');
  console.log('3. Need proper "replace all assignees" functionality');
  
  console.log('\n🛠️ RECOMMENDED FIXES:');
  console.log('1. Fix DELETE request to include current assignees when removing all');
  console.log('2. Add PUT endpoint for replacing assignees OR modify POST to replace');
  console.log('3. Update dialog to use proper replace logic for reassignment');
} else {
  console.log('❌ Could not complete full diagnosis - missing files');
}
