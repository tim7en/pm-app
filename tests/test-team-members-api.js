const fetch = require('node-fetch');

async function testTeamMembersAPI() {
  try {
    console.log('🧪 Testing team members API...\n');
    
    // Test with the workspace that has 3 members
    const workspaceId = 'timur-workspace';
    
    console.log(`🔍 Testing with workspace: ${workspaceId}`);
    
    const response = await fetch(`http://localhost:3000/api/messages/team-members?workspaceId=${workspaceId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Note: This test won't work without proper session auth
      }
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers.raw());
    
    const data = await response.text();
    console.log('Response body:', data);
    
  } catch (error) {
    console.error('❌ Error testing API:', error);
  }
}

testTeamMembersAPI();
