// AI Wizard Debug Test - Run this in browser console to test wizard functionality
// This script helps debug the AI project wizard by simulating user interactions

console.log('🧙‍♂️ AI Wizard Debug Test Loaded');

// Helper function to find React components
const findReactComponent = (element) => {
  for (const key in element) {
    if (key.startsWith('__reactInternalInstance$') || key.startsWith('__reactFiber$')) {
      return element[key];
    }
  }
  return null;
};

// Debug functions
window.debugWizard = {
  // Log current wizard state
  logState: () => {
    console.log('📊 Current Wizard State:');
    const wizardElement = document.querySelector('[data-testid="ai-wizard"]') || 
                          document.querySelector('.max-w-4xl');
    if (wizardElement) {
      console.log('✅ Wizard element found');
      const reactComponent = findReactComponent(wizardElement);
      if (reactComponent) {
        console.log('⚛️ React component found');
      }
    } else {
      console.log('❌ Wizard element not found');
    }
  },

  // Simulate clicking the AI generation button
  clickGenerateButton: () => {
    console.log('🖱️ Looking for generate button...');
    const buttons = Array.from(document.querySelectorAll('button'));
    const generateButton = buttons.find(btn => 
      btn.textContent.includes('Start AI Generation') || 
      btn.textContent.includes('Generate') ||
      btn.textContent.includes('AI')
    );
    
    if (generateButton) {
      console.log('✅ Found generate button:', generateButton.textContent);
      generateButton.click();
      console.log('🚀 Button clicked!');
    } else {
      console.log('❌ Generate button not found');
      console.log('Available buttons:', buttons.map(b => b.textContent));
    }
  },

  // Check for console errors
  checkErrors: () => {
    console.log('🔍 Checking for errors...');
    // This will show any React errors or warnings
    setTimeout(() => {
      console.log('✅ Error check complete - see console for any React errors');
    }, 1000);
  },

  // Fill sample project data
  fillSampleData: () => {
    console.log('📝 Filing sample project data...');
    
    // Fill project name
    const nameInput = document.querySelector('input[name="name"]') || 
                     document.querySelector('input[placeholder*="name"]');
    if (nameInput) {
      nameInput.value = 'Test E-commerce Platform';
      nameInput.dispatchEvent(new Event('input', { bubbles: true }));
      console.log('✅ Project name filled');
    }
    
    // Fill description
    const descInput = document.querySelector('textarea[name="description"]') || 
                     document.querySelector('textarea[placeholder*="description"]');
    if (descInput) {
      descInput.value = 'Build a modern e-commerce platform with React, Node.js, and PostgreSQL. Include user authentication, product catalog, shopping cart, payment processing, and admin dashboard.';
      descInput.dispatchEvent(new Event('input', { bubbles: true }));
      console.log('✅ Project description filled');
    }
    
    console.log('📋 Sample data filled - now click Next to advance');
  },

  // Run full test sequence
  runFullTest: async () => {
    console.log('🚀 Starting full AI wizard test...');
    
    // Step 1: Fill sample data
    window.debugWizard.fillSampleData();
    
    // Step 2: Wait a moment then click next
    setTimeout(() => {
      const nextButton = Array.from(document.querySelectorAll('button'))
        .find(btn => btn.textContent.includes('Next'));
      if (nextButton) {
        nextButton.click();
        console.log('➡️ Clicked Next button');
        
        // Step 3: Wait for AI analysis step then click generate
        setTimeout(() => {
          window.debugWizard.clickGenerateButton();
        }, 1000);
      }
    }, 1000);
  }
};

// Instructions
console.log(`
🎯 AI WIZARD DEBUG COMMANDS:
• debugWizard.logState() - Check wizard state
• debugWizard.fillSampleData() - Fill sample project data  
• debugWizard.clickGenerateButton() - Click AI generation button
• debugWizard.checkErrors() - Check for console errors
• debugWizard.runFullTest() - Run complete test sequence

💡 TESTING STEPS:
1. Open the AI wizard (Create Project → AI-Powered Creation)
2. Run: debugWizard.runFullTest()
3. Watch console for detailed logging
4. Check for any errors or issues

🔧 TROUBLESHOOTING:
- If buttons don't work, check React state updates
- Look for console errors during generation
- Verify mock data is loading correctly
- Check network tab for any failed requests
`);

// Auto-detect if wizard is open
if (document.querySelector('.max-w-4xl') || document.querySelector('[role="dialog"]')) {
  console.log('🎉 AI Wizard detected! Ready for testing.');
  console.log('💡 Try: debugWizard.runFullTest()');
} else {
  console.log('📝 Open the AI wizard first, then run the debug commands.');
}
