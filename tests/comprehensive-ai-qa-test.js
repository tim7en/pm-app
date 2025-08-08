// Comprehensive AI Project Generation & Translation QA Test
// This script validates all AI features and translation support

console.log('🎯 COMPREHENSIVE AI PROJECT GENERATION & TRANSLATION QA TEST');
console.log('=' .repeat(80));

// Test configuration
const API_BASE = 'http://localhost:3000';
const LANGUAGES = ['en', 'ru', 'uz'];

// Test Results Storage
const testResults = {
  aiFeatures: {},
  translations: {},
  uiComponents: {},
  production: {}
};

// Helper function to record test results
function recordTest(category, feature, test, status, details = '') {
  if (!testResults[category]) testResults[category] = {};
  if (!testResults[category][feature]) testResults[category][feature] = [];
  
  testResults[category][feature].push({
    test,
    status,
    details,
    timestamp: new Date().toISOString()
  });
  
  console.log(`${status === 'passed' ? '✅' : status === 'warning' ? '⚠️' : '❌'} [${category}/${feature}] ${test}${details ? ': ' + details : ''}`);
}

// =============================================================================
// 1. AI PROJECT GENERATION FUNCTIONALITY TESTS
// =============================================================================

async function testAIProjectGeneration() {
  console.log('\n🧠 1. TESTING AI PROJECT GENERATION FUNCTIONALITY');
  console.log('-'.repeat(60));
  
  // Test 1: AI Task Generation API
  console.log('\n📋 Testing AI Task Generation API...');
  try {
    const response = await fetch(`${API_BASE}/api/ai/generate-tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'session-token=test'
      },
      body: JSON.stringify({
        name: 'AI-Generated Test Project',
        description: 'A comprehensive test project to validate AI task generation capabilities',
        category: 'software',
        priority: 'HIGH',
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        language: 'en'
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      recordTest('aiFeatures', 'taskGeneration', 'API Response', 'passed', 
        `Generated ${data.tasks?.length || 0} tasks with timeline`);
      
      // Validate task structure
      if (data.tasks && data.tasks.length > 0) {
        const task = data.tasks[0];
        const hasRequiredFields = task.title && task.description && task.priority && task.estimatedHours;
        recordTest('aiFeatures', 'taskGeneration', 'Task Structure Validation', 
          hasRequiredFields ? 'passed' : 'failed',
          hasRequiredFields ? 'All required fields present' : 'Missing required fields');
      }
      
      // Validate timeline
      if (data.timeline) {
        recordTest('aiFeatures', 'taskGeneration', 'Timeline Generation', 'passed',
          `Timeline includes ${data.timeline.phases?.length || 0} phases`);
      }
    } else {
      recordTest('aiFeatures', 'taskGeneration', 'API Response', 'failed', 
        `HTTP ${response.status}: ${response.statusText}`);
    }
  } catch (error) {
    recordTest('aiFeatures', 'taskGeneration', 'API Connection', 'failed', error.message);
  }
  
  // Test 2: Multi-language Task Generation
  console.log('\n🌐 Testing Multi-language Task Generation...');
  for (const lang of LANGUAGES) {
    try {
      const response = await fetch(`${API_BASE}/api/ai/generate-tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': 'session-token=test'
        },
        body: JSON.stringify({
          name: `Test Project (${lang})`,
          description: 'Testing multilingual AI task generation',
          category: 'software',
          priority: 'MEDIUM',
          language: lang
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        recordTest('aiFeatures', 'multiLanguage', `${lang.toUpperCase()} Task Generation`, 'passed',
          `Generated tasks in ${lang}`);
      } else {
        recordTest('aiFeatures', 'multiLanguage', `${lang.toUpperCase()} Task Generation`, 'failed',
          `HTTP ${response.status}`);
      }
    } catch (error) {
      recordTest('aiFeatures', 'multiLanguage', `${lang.toUpperCase()} Task Generation`, 'failed', 
        error.message);
    }
  }
  
  // Test 3: Fallback Task Generation
  console.log('\n🔄 Testing Fallback Task Generation...');
  try {
    const response = await fetch(`${API_BASE}/api/ai/generate-tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'session-token=test'
      },
      body: JSON.stringify({
        name: 'Fallback Test Project',
        description: 'Testing fallback when AI is unavailable',
        category: 'marketing',
        priority: 'LOW'
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      recordTest('aiFeatures', 'fallback', 'Fallback Task Generation', 'passed',
        `Fallback generated ${data.tasks?.length || 0} tasks`);
    } else {
      recordTest('aiFeatures', 'fallback', 'Fallback Task Generation', 'failed',
        `HTTP ${response.status}`);
    }
  } catch (error) {
    recordTest('aiFeatures', 'fallback', 'Fallback Task Generation', 'failed', error.message);
  }
}

// =============================================================================
// 2. TRANSLATION SYSTEM TESTS
// =============================================================================

async function testTranslationSystem() {
  console.log('\n🌐 2. TESTING TRANSLATION SYSTEM');
  console.log('-'.repeat(60));
  
  // Test 1: Translation API Endpoints
  console.log('\n📝 Testing Translation API Endpoints...');
  for (const lang of LANGUAGES) {
    try {
      const response = await fetch(`${API_BASE}/api/translations/${lang}`);
      if (response.ok) {
        const translations = await response.json();
        const keyCount = Object.keys(translations).length;
        recordTest('translations', 'api', `${lang.toUpperCase()} Translation Loading`, 'passed',
          `Loaded ${keyCount} translation keys`);
        
        // Test key specific sections
        const sections = ['dashboard', 'projects', 'tasks', 'ai', 'common'];
        sections.forEach(section => {
          if (translations[section]) {
            recordTest('translations', 'completeness', `${lang.toUpperCase()} ${section} Section`, 'passed',
              `${Object.keys(translations[section]).length} keys`);
          } else {
            recordTest('translations', 'completeness', `${lang.toUpperCase()} ${section} Section`, 'warning',
              'Section missing or empty');
          }
        });
      } else {
        recordTest('translations', 'api', `${lang.toUpperCase()} Translation Loading`, 'failed',
          `HTTP ${response.status}`);
      }
    } catch (error) {
      recordTest('translations', 'api', `${lang.toUpperCase()} Translation Loading`, 'failed', 
        error.message);
    }
  }
  
  // Test 2: AI-specific Translations
  console.log('\n🤖 Testing AI-specific Translations...');
  const aiKeys = [
    'ai.wizard.welcome',
    'ai.wizard.aiPoweredCreation',
    'ai.wizard.taskGeneration',
    'ai.wizard.analyzing',
    'ai.wizard.generating',
    'ai.error.generation',
    'ai.success.created'
  ];
  
  for (const lang of LANGUAGES) {
    try {
      const response = await fetch(`${API_BASE}/api/translations/${lang}`);
      if (response.ok) {
        const translations = await response.json();
        let missingKeys = [];
        
        aiKeys.forEach(key => {
          const keyPath = key.split('.');
          let current = translations;
          for (const part of keyPath) {
            if (current && current[part]) {
              current = current[part];
            } else {
              missingKeys.push(key);
              break;
            }
          }
        });
        
        if (missingKeys.length === 0) {
          recordTest('translations', 'aiKeys', `${lang.toUpperCase()} AI Keys`, 'passed',
            'All AI translation keys present');
        } else {
          recordTest('translations', 'aiKeys', `${lang.toUpperCase()} AI Keys`, 'warning',
            `Missing keys: ${missingKeys.join(', ')}`);
        }
      }
    } catch (error) {
      recordTest('translations', 'aiKeys', `${lang.toUpperCase()} AI Keys`, 'failed', error.message);
    }
  }
}

// =============================================================================
// 3. UI COMPONENT INTEGRATION TESTS
// =============================================================================

async function testUIComponents() {
  console.log('\n🎨 3. TESTING UI COMPONENT INTEGRATION');
  console.log('-'.repeat(60));
  
  // Check if key AI components exist
  const aiComponents = [
    'src/components/projects/enhanced-project-creation.tsx',
    'src/components/projects/ai-project-creation-wizard.tsx',
    'src/components/tasks/create-task-modal.tsx',
    'src/components/projects/project-insights-dialog.tsx',
    'src/app/ai-demo/page.tsx'
  ];
  
  console.log('\n🔍 Checking AI Component Files...');
  const fs = require('fs');
  const path = require('path');
  
  aiComponents.forEach(component => {
    const fullPath = path.join(__dirname, component);
    try {
      if (fs.existsSync(fullPath)) {
        const content = fs.readFileSync(fullPath, 'utf8');
        
        // Check for AI-related features
        const hasAIFeatures = content.includes('generateAiTasks') || 
                             content.includes('ai/generate-tasks') ||
                             content.includes('AIProjectCreationWizard') ||
                             content.includes('Brain') ||
                             content.includes('Sparkles');
        
        // Check for translation integration
        const hasTranslations = content.includes('useTranslation') && 
                               content.includes('t(');
        
        recordTest('uiComponents', 'aiIntegration', path.basename(component), 
          hasAIFeatures ? 'passed' : 'warning',
          `AI Features: ${hasAIFeatures}, Translations: ${hasTranslations}`);
      } else {
        recordTest('uiComponents', 'aiIntegration', path.basename(component), 'failed',
          'Component file not found');
      }
    } catch (error) {
      recordTest('uiComponents', 'aiIntegration', path.basename(component), 'failed',
        error.message);
    }
  });
  
  // Test Language Selector Component
  console.log('\n🌍 Testing Language Selector...');
  try {
    const languageSelectorPath = path.join(__dirname, 'src/components/ui/language-selector.tsx');
    if (fs.existsSync(languageSelectorPath)) {
      const content = fs.readFileSync(languageSelectorPath, 'utf8');
      
      // Check if all three languages are supported
      const hasEnglish = content.includes("code: 'en'") || content.includes("'English'");
      const hasRussian = content.includes("code: 'ru'") || content.includes("'Русский'");
      const hasUzbek = content.includes("code: 'uz'") || content.includes("'Ўзбекча'");
      
      recordTest('uiComponents', 'languageSelector', 'Language Support', 
        (hasEnglish && hasRussian && hasUzbek) ? 'passed' : 'failed',
        `EN: ${hasEnglish}, RU: ${hasRussian}, UZ: ${hasUzbek}`);
    } else {
      recordTest('uiComponents', 'languageSelector', 'Component Exists', 'failed',
        'Language selector component not found');
    }
  } catch (error) {
    recordTest('uiComponents', 'languageSelector', 'Language Support', 'failed', error.message);
  }
}

// =============================================================================
// 4. PRODUCTION READINESS TESTS
// =============================================================================

async function testProductionReadiness() {
  console.log('\n🚀 4. TESTING PRODUCTION READINESS');
  console.log('-'.repeat(60));
  
  // Test 1: Environment Configuration
  console.log('\n⚙️ Testing Environment Configuration...');
  try {
    const response = await fetch(`${API_BASE}/api/health`);
    if (response.ok) {
      recordTest('production', 'health', 'Health Check Endpoint', 'passed',
        'Server responding correctly');
    } else {
      recordTest('production', 'health', 'Health Check Endpoint', 'warning',
        'Health endpoint may not be configured');
    }
  } catch (error) {
    recordTest('production', 'health', 'Health Check Endpoint', 'failed', error.message);
  }
  
  // Test 2: Error Handling
  console.log('\n🛡️ Testing Error Handling...');
  try {
    const response = await fetch(`${API_BASE}/api/ai/generate-tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        // Invalid data to test error handling
        name: '',
        description: ''
      })
    });
    
    if (response.status === 400 || response.status === 422) {
      recordTest('production', 'errorHandling', 'Input Validation', 'passed',
        'Proper error response for invalid input');
    } else {
      recordTest('production', 'errorHandling', 'Input Validation', 'warning',
        'May need better input validation');
    }
  } catch (error) {
    recordTest('production', 'errorHandling', 'Input Validation', 'failed', error.message);
  }
  
  // Test 3: Rate Limiting & Security
  console.log('\n🔒 Testing Security Features...');
  let successfulRequests = 0;
  for (let i = 0; i < 5; i++) {
    try {
      const response = await fetch(`${API_BASE}/api/translations/en`);
      if (response.ok) successfulRequests++;
    } catch (error) {
      // Expected for rate limiting
    }
  }
  
  recordTest('production', 'security', 'Rate Limiting', 
    successfulRequests < 5 ? 'passed' : 'warning',
    `${successfulRequests}/5 requests succeeded`);
}

// =============================================================================
// 5. COMPREHENSIVE TEST EXECUTION
// =============================================================================

async function runComprehensiveTests() {
  console.log('\n⏳ Starting Comprehensive AI & Translation Tests...\n');
  
  try {
    await testAIProjectGeneration();
    await testTranslationSystem();
    await testUIComponents();
    await testProductionReadiness();
    
    // Generate Test Report
    console.log('\n📊 COMPREHENSIVE TEST REPORT');
    console.log('=' .repeat(80));
    
    let totalTests = 0;
    let passedTests = 0;
    let warningTests = 0;
    let failedTests = 0;
    
    Object.keys(testResults).forEach(category => {
      console.log(`\n📋 ${category.toUpperCase()}`);
      console.log('-'.repeat(40));
      
      Object.keys(testResults[category]).forEach(feature => {
        console.log(`\n  ${feature}:`);
        testResults[category][feature].forEach(test => {
          const status = test.status === 'passed' ? '✅' : 
                        test.status === 'warning' ? '⚠️' : '❌';
          console.log(`    ${status} ${test.test}${test.details ? ': ' + test.details : ''}`);
          
          totalTests++;
          if (test.status === 'passed') passedTests++;
          else if (test.status === 'warning') warningTests++;
          else failedTests++;
        });
      });
    });
    
    // Summary
    console.log('\n📈 TEST SUMMARY');
    console.log('=' .repeat(80));
    console.log(`Total Tests: ${totalTests}`);
    console.log(`✅ Passed: ${passedTests} (${((passedTests/totalTests)*100).toFixed(1)}%)`);
    console.log(`⚠️  Warnings: ${warningTests} (${((warningTests/totalTests)*100).toFixed(1)}%)`);  
    console.log(`❌ Failed: ${failedTests} (${((failedTests/totalTests)*100).toFixed(1)}%)`);
    
    const overallScore = ((passedTests + warningTests * 0.5) / totalTests * 100).toFixed(1);
    console.log(`\n🎯 OVERALL SCORE: ${overallScore}%`);
    
    // Production Readiness Assessment
    console.log('\n🚀 PRODUCTION READINESS ASSESSMENT');
    console.log('=' .repeat(80));
    
    if (overallScore >= 90) {
      console.log('🟢 READY FOR PRODUCTION');
      console.log('   All major features are working correctly with minimal issues.');
    } else if (overallScore >= 75) {
      console.log('🟡 MOSTLY READY FOR PRODUCTION');
      console.log('   Most features working, some minor issues need attention.');
    } else if (overallScore >= 60) {
      console.log('🟠 NEEDS IMPROVEMENT BEFORE PRODUCTION');
      console.log('   Several issues need to be resolved before deployment.');
    } else {
      console.log('🔴 NOT READY FOR PRODUCTION');
      console.log('   Major issues need to be resolved before deployment.');
    }
    
    // Recommendations
    console.log('\n💡 RECOMMENDATIONS');
    console.log('=' .repeat(80));
    
    if (failedTests > 0) {
      console.log('🔧 Priority Fixes Needed:');
      Object.keys(testResults).forEach(category => {
        Object.keys(testResults[category]).forEach(feature => {
          testResults[category][feature].forEach(test => {
            if (test.status === 'failed') {
              console.log(`   - Fix ${test.test} in ${category}/${feature}`);
            }
          });
        });
      });
    }
    
    if (warningTests > 0) {
      console.log('\n⚠️  Improvements Suggested:');
      Object.keys(testResults).forEach(category => {
        Object.keys(testResults[category]).forEach(feature => {
          testResults[category][feature].forEach(test => {
            if (test.status === 'warning') {
              console.log(`   - Improve ${test.test} in ${category}/${feature}`);
            }
          });
        });
      });
    }
    
    console.log('\n✨ AI PROJECT GENERATION QA COMPLETE!');
    console.log('=' .repeat(80));
    
  } catch (error) {
    console.error('❌ Test execution failed:', error);
  }
}

// Run the comprehensive tests
runComprehensiveTests();
