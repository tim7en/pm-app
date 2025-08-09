// Test script to check translation API
const fs = require('fs');
const path = require('path');

console.log('🧪 TRANSLATION API TEST');
console.log('=' .repeat(50));

// Test 1: Check if translation files exist
console.log('\n1. Checking translation files:');
const languages = ['en', 'ru', 'uz'];

languages.forEach(lang => {
  const filePath = path.join(__dirname, `public/locales/${lang}/common.json`);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(content);
    console.log(`✅ ${lang.toUpperCase()}: ${Object.keys(data).length} sections`);
    
    // Check if projects section exists
    if (data.projects) {
      console.log(`   📁 Projects section: ${Object.keys(data.projects).length} keys`);
      
      // Check for specific missing keys
      const requiredKeys = ['members', 'viewTasks', 'editProject', 'addToFavorites', 'deleteProject'];
      const missingKeys = requiredKeys.filter(key => !data.projects[key]);
      
      if (missingKeys.length > 0) {
        console.log(`   ⚠️  Missing keys: ${missingKeys.join(', ')}`);
      } else {
        console.log(`   ✅ All required keys present`);
      }
    } else {
      console.log(`   ❌ Projects section missing`);
    }
  } else {
    console.log(`❌ ${lang.toUpperCase()}: File not found`);
  }
});

// Test 2: Check if API would work (simulate)
console.log('\n2. Translation data structure:');
const enPath = path.join(__dirname, 'public/locales/en/common.json');
if (fs.existsSync(enPath)) {
  const enData = JSON.parse(fs.readFileSync(enPath, 'utf8'));
  
  // Test key access
  const testKeys = [
    'projects.members',
    'projects.viewTasks', 
    'projects.editProject',
    'projects.addToFavorites',
    'projects.deleteProject'
  ];
  
  testKeys.forEach(key => {
    const value = key.split('.').reduce((obj, k) => obj && obj[k], enData);
    console.log(`${value ? '✅' : '❌'} ${key}: ${value || 'MISSING'}`);
  });
}

console.log('\n🎯 TEST COMPLETE');
