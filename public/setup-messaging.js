// Set workspace ID for testing messaging
localStorage.setItem('currentWorkspaceId', 'cmdqzh3ge0004tt04g2odsrgf');
console.log('✅ Workspace ID set for messaging tests');

// Also set a mock auth token for testing
const mockUser = {
  id: 'alice-user-id', // This will be updated when we check the actual user IDs
  email: 'alice@company.com',
  name: 'Alice Johnson',
  avatar: '/avatars/01.png'
};

localStorage.setItem('auth-user', JSON.stringify(mockUser));
console.log('✅ Mock user set for testing');

console.log('🚀 Ready to test messaging system!');
console.log('📝 Navigate to /messages to see team members and start chatting');
console.log('🔑 Test credentials:');
console.log('   Alice: alice@company.com / password123');
console.log('   Bob: bob@company.com / password123');
