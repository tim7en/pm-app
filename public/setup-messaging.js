// Set workspace ID for testing messaging
localStorage.setItem('currentWorkspaceId', 'default-workspace');
console.log('✅ Workspace ID set for messaging tests');

// Also set a mock auth token for testing
const mockUser = {
  id: 'user-alice',
  email: 'alice@company.com',
  name: 'Alice Johnson',
  avatar: '/avatars/01.png'
};

localStorage.setItem('auth-user', JSON.stringify(mockUser));
console.log('✅ Mock user set for testing');

console.log('🚀 Ready to test messaging system!');
console.log('📝 Navigate to /messages to see team members and start chatting');
