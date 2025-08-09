// Translation Debug Test
// Test the translation hook directly in the browser console

console.log('🔍 TRANSLATION HOOK DEBUG TEST');

// Test API directly
fetch('/api/translations/en')
  .then(response => response.json())
  .then(data => {
    console.log('✅ API Response:', data);
    console.log('📊 Data type:', typeof data);
    console.log('🗝️ Keys:', Object.keys(data));
    console.log('📁 Projects section:', data.projects);
    console.log('📁 Common section:', data.common);
    
    // Test specific keys that are failing
    const testKeys = [
      'projects.description',
      'projects.category', 
      'projects.members',
      'projects.viewTasks',
      'common.back',
      'common.complete'
    ];
    
    console.log('\n🧪 Testing specific keys:');
    testKeys.forEach(key => {
      const value = key.split('.').reduce((obj, k) => obj && obj[k], data);
      console.log(`${value ? '✅' : '❌'} ${key}: ${value || 'MISSING'}`);
    });
  })
  .catch(error => {
    console.error('❌ API Error:', error);
  });

// You can run this script in the browser console to debug the translation API
