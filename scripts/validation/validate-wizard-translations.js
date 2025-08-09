// Translation validation script for AI wizard step descriptions
// This script checks if all required wizard step description keys are present in all language files

const fs = require('fs');
const path = require('path');

console.log('🔍 AI WIZARD TRANSLATION VALIDATION');
console.log('=' .repeat(50));

// Required wizard step description keys
const requiredKeys = [
  'ai.wizard.welcomeDesc',
  'ai.wizard.analyzingDesc', 
  'ai.wizard.generatingTasksDesc',
  'ai.wizard.reviewTasksDesc',
  'ai.wizard.calendarIntegrationDesc',
  'ai.wizard.finalReviewDesc',
  'ai.wizard.creatingDesc',
  'ai.wizard.successDesc'
];

const languages = ['en', 'ru', 'uz'];

// Function to check if a nested key exists in an object
function hasNestedKey(obj, keyPath) {
  const keys = keyPath.split('.');
  let current = obj;
  
  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = current[key];
    } else {
      return false;
    }
  }
  
  return current !== undefined && current !== null && current !== '';
}

// Check each language file
languages.forEach(lang => {
  console.log(`\n📝 Checking ${lang.toUpperCase()} translations:`);
  
  try {
    const filePath = path.join(__dirname, `public/locales/${lang}/common.json`);
    
    if (!fs.existsSync(filePath)) {
      console.log(`❌ Translation file not found: ${filePath}`);
      return;
    }
    
    const content = fs.readFileSync(filePath, 'utf8');
    const translations = JSON.parse(content);
    
    let missingKeys = [];
    let presentKeys = [];
    
    requiredKeys.forEach(key => {
      if (hasNestedKey(translations, key)) {
        presentKeys.push(key);
        console.log(`✅ ${key}`);
      } else {
        missingKeys.push(key);
        console.log(`❌ ${key} - MISSING`);
      }
    });
    
    console.log(`\n📊 Summary for ${lang.toUpperCase()}:`);
    console.log(`   ✅ Present: ${presentKeys.length}/${requiredKeys.length}`);
    console.log(`   ❌ Missing: ${missingKeys.length}/${requiredKeys.length}`);
    
    if (missingKeys.length > 0) {
      console.log(`   🔧 Missing keys: ${missingKeys.join(', ')}`);
    }
    
  } catch (error) {
    console.log(`❌ Error reading ${lang} translations: ${error.message}`);
  }
});

console.log('\n🎯 VALIDATION COMPLETE');
console.log('=' .repeat(50));
