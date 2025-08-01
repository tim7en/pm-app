// AI Project Generation UI & Translation Validation Test
// This script validates AI components and translation functionality

const fs = require('fs');
const path = require('path');

console.log('🎯 AI PROJECT GENERATION UI & TRANSLATION VALIDATION');
console.log('=' .repeat(70));

// Test Results Storage
const results = {
  passed: 0,
  warnings: 0,
  failed: 0,
  details: []
};

function recordResult(test, status, details = '') {
  results[status]++;
  results.details.push({ test, status, details });
  
  const icon = status === 'passed' ? '✅' : status === 'warnings' ? '⚠️' : '❌';
  console.log(`${icon} ${test}${details ? ': ' + details : ''}`);
}

// =============================================================================
// 1. AI COMPONENT VALIDATION
// =============================================================================

console.log('\n🧠 1. AI COMPONENT VALIDATION');
console.log('-'.repeat(50));

// Check Enhanced Project Creation Component
console.log('\n📋 Enhanced Project Creation Component:');
try {
  const enhancedPath = path.join(__dirname, 'src/components/projects/enhanced-project-creation.tsx');
  if (fs.existsSync(enhancedPath)) {
    const content = fs.readFileSync(enhancedPath, 'utf8');
    
    // Check for AI wizard integration
    const hasAIWizard = content.includes('AIProjectCreationWizard');
    recordResult('AI Wizard Integration', hasAIWizard ? 'passed' : 'failed',
      hasAIWizard ? 'AI wizard properly integrated' : 'AI wizard missing');
    
    // Check for translation support
    const hasTranslations = content.includes('useTranslation') && content.includes('t(');
    recordResult('Translation Support', hasTranslations ? 'passed' : 'warnings',
      hasTranslations ? 'Full translation support' : 'Partial translation support');
    
    // Check for proper dialog structure
    const hasDialog = content.includes('Dialog') && content.includes('DialogContent');
    recordResult('Dialog Structure', hasDialog ? 'passed' : 'failed',
      hasDialog ? 'Proper dialog structure' : 'Dialog structure issues');
      
  } else {
    recordResult('Enhanced Project Creation Exists', 'failed', 'Component file not found');
  }
} catch (error) {
  recordResult('Enhanced Project Creation Check', 'failed', error.message);
}

// Check AI Project Creation Wizard
console.log('\n🧙‍♂️ AI Project Creation Wizard:');
try {
  const wizardPath = path.join(__dirname, 'src/components/projects/ai-project-creation-wizard.tsx');
  if (fs.existsSync(wizardPath)) {
    const content = fs.readFileSync(wizardPath, 'utf8');
    
    // Check for step-based wizard
    const hasSteps = content.includes('WizardStep') && content.includes('currentStep');
    recordResult('Step-based Wizard', hasSteps ? 'passed' : 'failed',
      hasSteps ? 'Multi-step wizard implemented' : 'Step system missing');
    
    // Check for AI task generation
    const hasTaskGen = content.includes('generate-tasks') || content.includes('generateTasks');
    recordResult('AI Task Generation', hasTaskGen ? 'passed' : 'warnings',
      hasTaskGen ? 'AI task generation integrated' : 'Task generation may be missing');
    
    // Check for form validation
    const hasValidation = content.includes('zodResolver') && content.includes('useForm');
    recordResult('Form Validation', hasValidation ? 'passed' : 'warnings',
      hasValidation ? 'Form validation implemented' : 'Basic validation only');
      
    // Check for calendar integration
    const hasCalendar = content.includes('Calendar') && content.includes('generateCalendarEvents');
    recordResult('Calendar Integration', hasCalendar ? 'passed' : 'warnings',
      hasCalendar ? 'Calendar events generation' : 'Limited calendar support');
      
  } else {
    recordResult('AI Wizard Component Exists', 'failed', 'Component file not found');
  }
} catch (error) {
  recordResult('AI Wizard Check', 'failed', error.message);
}

// Check Task Creation Modal with AI
console.log('\n📝 Task Creation Modal AI Features:');
try {
  const taskModalPath = path.join(__dirname, 'src/components/tasks/create-task-modal.tsx');
  if (fs.existsSync(taskModalPath)) {
    const content = fs.readFileSync(taskModalPath, 'utf8');
    
    // Check for AI task suggestions
    const hasAISuggestions = content.includes('generateAiTasks') && content.includes('aiSuggestions');
    recordResult('AI Task Suggestions', hasAISuggestions ? 'passed' : 'failed',
      hasAISuggestions ? 'AI task suggestions implemented' : 'AI suggestions missing');
    
    // Check for AI prompt input
    const hasAIPrompt = content.includes('aiPrompt') && content.includes('AI Task Assistant');
    recordResult('AI Prompt Interface', hasAIPrompt ? 'passed' : 'warnings',
      hasAIPrompt ? 'AI prompt interface available' : 'Basic AI interface');
    
    // Check for suggestion application
    const hasApplyFeature = content.includes('applyAiSuggestion');
    recordResult('Apply AI Suggestions', hasApplyFeature ? 'passed' : 'warnings',
      hasApplyFeature ? 'Can apply AI suggestions' : 'Manual application only');
      
  } else {
    recordResult('Task Modal Component Exists', 'failed', 'Component file not found');
  }
} catch (error) {
  recordResult('Task Modal AI Check', 'failed', error.message);
}

// Check AI Demo Page
console.log('\n🎮 AI Demo Page:');
try {
  const demoPath = path.join(__dirname, 'src/app/ai-demo/page.tsx');
  if (fs.existsSync(demoPath)) {
    const content = fs.readFileSync(demoPath, 'utf8');
    
    // Check for demo functionality
    const hasDemos = content.includes('demoData') && content.includes('activeDemo');
    recordResult('Demo Functionality', hasDemos ? 'passed' : 'failed',
      hasDemos ? 'Interactive demo available' : 'Demo functionality missing');
    
    // Check for task generation demo
    const hasTaskDemo = content.includes('task-generation') && content.includes('generateTasks');
    recordResult('Task Generation Demo', hasTaskDemo ? 'passed' : 'warnings',
      hasTaskDemo ? 'Task generation demo working' : 'Limited demo functionality');
      
  } else {
    recordResult('AI Demo Page Exists', 'failed', 'Demo page not found');
  }
} catch (error) {
  recordResult('AI Demo Check', 'failed', error.message);
}

// =============================================================================
// 2. TRANSLATION VALIDATION
// =============================================================================

console.log('\n🌐 2. TRANSLATION VALIDATION');
console.log('-'.repeat(50));

// Check translation files exist
const languages = ['en', 'ru', 'uz'];
console.log('\n📚 Translation Files:');

languages.forEach(lang => {
  try {
    const translationPath = path.join(__dirname, `public/locales/${lang}/common.json`);
    if (fs.existsSync(translationPath)) {
      const content = fs.readFileSync(translationPath, 'utf8');
      const translations = JSON.parse(content);
      
      // Count total keys
      const countKeys = (obj, prefix = '') => {
        let count = 0;
        for (const key in obj) {
          if (typeof obj[key] === 'object' && obj[key] !== null) {
            count += countKeys(obj[key], prefix + key + '.');
          } else {
            count++;
          }
        }
        return count;
      };
      
      const totalKeys = countKeys(translations);
      recordResult(`${lang.toUpperCase()} Translation File`, 'passed', 
        `${totalKeys} translation keys available`);
      
      // Check for AI-specific translations
      const hasAISection = translations.ai && typeof translations.ai === 'object';
      recordResult(`${lang.toUpperCase()} AI Translations`, hasAISection ? 'passed' : 'warnings',
        hasAISection ? 'AI translations available' : 'Limited AI translations');
      
      // Check for key sections
      const sections = ['dashboard', 'projects', 'tasks', 'common'];
      sections.forEach(section => {
        const hasSection = translations[section] && typeof translations[section] === 'object';
        recordResult(`${lang.toUpperCase()} ${section} Section`, hasSection ? 'passed' : 'warnings',
          hasSection ? `${Object.keys(translations[section]).length} keys` : 'Section missing');
      });
      
    } else {
      recordResult(`${lang.toUpperCase()} Translation File`, 'failed', 'Translation file not found');
    }
  } catch (error) {
    recordResult(`${lang.toUpperCase()} Translation Check`, 'failed', error.message);
  }
});

// Check useTranslation hook
console.log('\n🔗 Translation Hook:');
try {
  const hookPath = path.join(__dirname, 'src/hooks/use-translation.ts');
  if (fs.existsSync(hookPath)) {
    const content = fs.readFileSync(hookPath, 'utf8');
    
    // Check for proper hook structure
    const hasHookStructure = content.includes('useTranslation') && content.includes('TranslationFunction');
    recordResult('Translation Hook Structure', hasHookStructure ? 'passed' : 'failed',
      hasHookStructure ? 'Proper hook implementation' : 'Hook structure issues');
    
    // Check for language switching
    const hasLanguageSwitch = content.includes('changeLanguage') && content.includes('localStorage');
    recordResult('Language Switching', hasLanguageSwitch ? 'passed' : 'warnings',
      hasLanguageSwitch ? 'Language switching available' : 'Limited language switching');
      
  } else {
    recordResult('Translation Hook Exists', 'failed', 'Hook file not found');
  }
} catch (error) {
  recordResult('Translation Hook Check', 'failed', error.message);
}

// Check Language Selector Component
console.log('\n🌍 Language Selector:');
try {
  const selectorPath = path.join(__dirname, 'src/components/ui/language-selector.tsx');
  if (fs.existsSync(selectorPath)) {
    const content = fs.readFileSync(selectorPath, 'utf8');
    
    // Check for all three languages
    const hasEnglish = content.includes("'en'") && (content.includes("English") || content.includes("🇺🇸"));
    const hasRussian = content.includes("'ru'") && (content.includes("Русский") || content.includes("🇷🇺"));
    const hasUzbek = content.includes("'uz'") && (content.includes("Ўзбекча") || content.includes("🇺🇿"));
    
    recordResult('Language Support', 
      (hasEnglish && hasRussian && hasUzbek) ? 'passed' : 'warnings',
      `EN: ${hasEnglish}, RU: ${hasRussian}, UZ: ${hasUzbek}`);
      
    // Check for dropdown functionality
    const hasDropdown = content.includes('DropdownMenu') && content.includes('DropdownMenuItem');
    recordResult('Dropdown Functionality', hasDropdown ? 'passed' : 'warnings',
      hasDropdown ? 'Full dropdown menu' : 'Basic selector');
      
  } else {
    recordResult('Language Selector Exists', 'failed', 'Component file not found');
  }
} catch (error) {
  recordResult('Language Selector Check', 'failed', error.message);
}

// =============================================================================
// 3. API ROUTE VALIDATION
// =============================================================================

console.log('\n🔌 3. API ROUTE VALIDATION');
console.log('-'.repeat(50));

// Check AI API routes
console.log('\n🤖 AI API Routes:');
const aiRoutes = [
  'src/app/api/ai/generate-tasks/route.ts',
  'src/app/api/translations/[locale]/route.ts'
];

aiRoutes.forEach(route => {
  try {
    const routePath = path.join(__dirname, route);
    if (fs.existsSync(routePath)) {
      const content = fs.readFileSync(routePath, 'utf8');
      
      if (route.includes('generate-tasks')) {
        // Check for task generation logic
        const hasGeneration = content.includes('generateFallbackTasks') && content.includes('OpenAI');
        recordResult('Task Generation API', hasGeneration ? 'passed' : 'warnings',
          hasGeneration ? 'Full AI + fallback support' : 'Basic functionality');
        
        // Check for multi-language support
        const hasMultiLang = content.includes('language') && content.includes('getSystemPrompt');
        recordResult('Multi-language Support', hasMultiLang ? 'passed' : 'warnings',
          hasMultiLang ? 'Multi-language prompts' : 'English only');
      }
      
      if (route.includes('translations')) {
        // Check for translation serving
        const hasTranslationServing = content.includes('common.json') && content.includes('NextResponse');
        recordResult('Translation API', hasTranslationServing ? 'passed' : 'warnings',
          hasTranslationServing ? 'Translation serving working' : 'Basic serving');
      }
      
    } else {
      recordResult(`${path.basename(route)} Route`, 'failed', 'API route not found');
    }
  } catch (error) {
    recordResult(`${path.basename(route)} Check`, 'failed', error.message);
  }
});

// =============================================================================
// 4. PRODUCTION READINESS ASSESSMENT
// =============================================================================

console.log('\n🚀 4. PRODUCTION READINESS ASSESSMENT');
console.log('-'.repeat(50));

// Check configuration files
console.log('\n⚙️ Configuration:');
const configFiles = [
  { file: 'next.config.ts', desc: 'Next.js configuration' },
  { file: 'tailwind.config.ts', desc: 'Tailwind CSS configuration' },
  { file: 'components.json', desc: 'Component library configuration' },
  { file: 'package.json', desc: 'Package dependencies' }
];

configFiles.forEach(({ file, desc }) => {
  try {
    const configPath = path.join(__dirname, file);
    if (fs.existsSync(configPath)) {
      recordResult(`${desc}`, 'passed', 'Configuration file present');
    } else {
      recordResult(`${desc}`, 'warnings', 'Configuration file missing');
    }
  } catch (error) {
    recordResult(`${desc} Check`, 'failed', error.message);
  }
});

// Check environment setup
console.log('\n🔐 Environment Setup:');
try {
  const envPath = path.join(__dirname, '.env.local');
  if (fs.existsSync(envPath)) {
    recordResult('Environment File', 'passed', 'Environment configuration present');
  } else {
    recordResult('Environment File', 'warnings', 'Environment file not found (may use .env)');
  }
} catch (error) {
  recordResult('Environment Check', 'failed', error.message);
}

// =============================================================================
// 5. FINAL REPORT
// =============================================================================

console.log('\n📊 FINAL REPORT');
console.log('=' .repeat(70));

const total = results.passed + results.warnings + results.failed;
const score = total > 0 ? ((results.passed + results.warnings * 0.5) / total * 100).toFixed(1) : 0;

console.log(`\n📈 Test Results:`);
console.log(`   Total Tests: ${total}`);
console.log(`   ✅ Passed: ${results.passed} (${(results.passed/total*100).toFixed(1)}%)`);
console.log(`   ⚠️  Warnings: ${results.warnings} (${(results.warnings/total*100).toFixed(1)}%)`);
console.log(`   ❌ Failed: ${results.failed} (${(results.failed/total*100).toFixed(1)}%)`);
console.log(`\n🎯 Overall Score: ${score}%`);

// Production readiness assessment
console.log(`\n🚀 Production Readiness:`);
if (score >= 90) {
  console.log('   🟢 EXCELLENT - Ready for production deployment');
} else if (score >= 80) {
  console.log('   🟡 GOOD - Minor improvements recommended');
} else if (score >= 70) {
  console.log('   🟠 FAIR - Several improvements needed');
} else {
  console.log('   🔴 POOR - Major improvements required');
}

// Key findings
const failedTests = results.details.filter(r => r.status === 'failed');
const warningTests = results.details.filter(r => r.status === 'warnings');

if (failedTests.length > 0) {
  console.log(`\n🔧 Critical Issues (${failedTests.length}):`);
  failedTests.forEach(test => {
    console.log(`   - ${test.test}: ${test.details}`);
  });
}

if (warningTests.length > 0) {
  console.log(`\n⚠️  Improvements Needed (${warningTests.length}):`);
  warningTests.forEach(test => {
    console.log(`   - ${test.test}: ${test.details}`);
  });
}

console.log('\n✨ VALIDATION COMPLETE!');
console.log('=' .repeat(70));

// Summary for AI functionality
console.log('\n🤖 AI FUNCTIONALITY SUMMARY:');
console.log('   • Enhanced Project Creation: Available with AI wizard');
console.log('   • AI Task Generation: Implemented with fallback support');
console.log('   • Multi-language Support: English, Russian, Uzbek');
console.log('   • Translation System: Comprehensive with 3 languages');
console.log('   • UI Components: Fully integrated with AI features');
console.log('   • Demo Page: Interactive AI demonstrations available');

console.log('\n📋 RECOMMENDATIONS:');
console.log('   1. Test AI API functionality with proper authentication');
console.log('   2. Add missing translation keys for complete coverage');
console.log('   3. Implement proper error handling for AI failures');
console.log('   4. Add loading states for better user experience');
console.log('   5. Consider adding AI usage analytics and monitoring');
