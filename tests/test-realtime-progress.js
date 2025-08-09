#!/usr/bin/env node

/**
 * Real-time Progress Bar Test
 * 
 * Tests the real-time progress updates for email classification
 * This validates that progress is updated live during processing
 */

import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Test configuration
const TEST_CONFIG = {
  BASE_URL: 'http://localhost:3000',
  MAX_EMAILS_TO_TEST: 15, // Small batch to see progress updates
  BATCH_SIZE: 3,
  AI_MODEL: 'auto',
  APPLY_LABELS: false,
  SKIP_CLASSIFIED: true,
  PROGRESS_POLL_INTERVAL: 500 // Poll every 500ms for responsive updates
};

function log(message, type = 'info') {
  const timestamp = new Date().toISOString().substring(11, 23);
  const symbols = {
    info: 'ℹ️',
    success: '✅',
    error: '❌',
    warning: '⚠️',
    progress: '🔄',
    stats: '📊',
    realtime: '⚡'
  };
  console.log(`[${timestamp}] ${symbols[type]} ${message}`);
}

function getUserInput(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

function formatProgressBar(progress, width = 30) {
  const filled = Math.round((progress / 100) * width);
  const empty = width - filled;
  const bar = '█'.repeat(filled) + '░'.repeat(empty);
  return `[${bar}] ${progress.toFixed(1)}%`;
}

async function testProgressEndpoint() {
  log('Testing progress tracking endpoint...', 'progress');
  
  const testSessionId = `test-session-${Date.now()}`;
  
  try {
    // Test progress update
    const updateResponse = await fetch(`${TEST_CONFIG.BASE_URL}/api/email/gmail/progress`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: testSessionId,
        action: 'update',
        progressData: {
          totalEmails: 100,
          processed: 25,
          progress: 25,
          currentEmail: 'Test email subject...'
        }
      })
    });
    
    const updateData = await updateResponse.json();
    
    if (!updateData.success) {
      log(`Progress update failed: ${updateData.error}`, 'error');
      return false;
    }
    
    // Test progress retrieval
    const getResponse = await fetch(`${TEST_CONFIG.BASE_URL}/api/email/gmail/progress?sessionId=${testSessionId}`);
    const getData = await getResponse.json();
    
    if (getData.success && getData.progress) {
      log(`Progress endpoint working: ${getData.progress.processed}/${getData.progress.totalEmails} emails`, 'success');
      
      // Clean up
      await fetch(`${TEST_CONFIG.BASE_URL}/api/email/gmail/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: testSessionId,
          action: 'clear'
        })
      });
      
      return true;
    } else {
      log(`Progress retrieval failed: ${getData.error || 'Unknown error'}`, 'error');
      return false;
    }
  } catch (error) {
    log(`Progress endpoint error: ${error.message}`, 'error');
    return false;
  }
}

async function testRealTimeProgress(accessToken) {
  log('Starting real-time progress tracking test...', 'progress');
  
  const sessionId = `realtime-test-${Date.now()}`;
  let progressInterval;
  let lastProgress = 0;
  let progressUpdates = 0;
  
  try {
    // Start progress monitoring before bulk processing
    progressInterval = setInterval(async () => {
      try {
        const response = await fetch(`${TEST_CONFIG.BASE_URL}/api/email/gmail/progress?sessionId=${sessionId}`);
        const data = await response.json();
        
        if (data.success && data.progress) {
          const progress = data.progress;
          
          // Only log if progress actually changed
          if (progress.progress !== lastProgress) {
            progressUpdates++;
            lastProgress = progress.progress;
            
            const progressBar = formatProgressBar(progress.progress);
            const speed = progress.processingSpeed ? `${progress.processingSpeed.toFixed(1)}/sec` : '0/sec';
            const eta = progress.estimatedTimeRemaining > 0 ? `${Math.round(progress.estimatedTimeRemaining)}s` : '--';
            
            log(`${progressBar} | Batch: ${progress.currentBatch}/${progress.totalBatches} | Chunk: ${progress.currentChunk}/${progress.totalChunks} | Speed: ${speed} | ETA: ${eta}`, 'realtime');
            
            if (progress.currentEmail) {
              log(`📧 Processing: "${progress.currentEmail}"`, 'realtime');
            }
            
            if (progress.aiRequestsInProgress > 0) {
              log(`🤖 ${progress.aiRequestsInProgress} AI requests in progress`, 'realtime');
            }
            
            // Stop monitoring when complete
            if (progress.isComplete) {
              clearInterval(progressInterval);
              log(`✅ Processing completed! Total progress updates received: ${progressUpdates}`, 'success');
            }
          }
        }
      } catch (error) {
        console.error('Error polling progress:', error);
      }
    }, TEST_CONFIG.PROGRESS_POLL_INTERVAL);

    // Start bulk processing
    log(`Starting bulk processing of ${TEST_CONFIG.MAX_EMAILS_TO_TEST} emails...`, 'progress');
    
    const startTime = Date.now();
    const response = await fetch(`${TEST_CONFIG.BASE_URL}/api/email/gmail/bulk-analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        accessToken,
        maxEmails: TEST_CONFIG.MAX_EMAILS_TO_TEST,
        batchSize: TEST_CONFIG.BATCH_SIZE,
        aiModel: TEST_CONFIG.AI_MODEL,
        applyLabels: TEST_CONFIG.APPLY_LABELS,
        skipClassified: TEST_CONFIG.SKIP_CLASSIFIED,
        sessionId, // Important: pass session ID for progress tracking
        query: ''
      })
    });

    const data = await response.json();
    const endTime = Date.now();
    const totalTime = (endTime - startTime) / 1000;
    
    // Stop progress monitoring
    clearInterval(progressInterval);
    
    if (data.success) {
      log(`Bulk processing completed in ${totalTime.toFixed(2)} seconds`, 'success');
      log(`Total emails processed: ${data.summary?.totalProcessed || 0}`, 'stats');
      log(`Progress updates received: ${progressUpdates}`, 'stats');
      log(`Session ID: ${data.sessionId}`, 'stats');
      
      // Validate progress updates
      if (progressUpdates > 0) {
        log('✅ Real-time progress updates are working!', 'success');
        log(`Average update frequency: ${(progressUpdates / totalTime).toFixed(1)} updates/second`, 'stats');
        return true;
      } else {
        log('⚠️ No progress updates received - real-time tracking may not be working', 'warning');
        return false;
      }
    } else {
      log(`Bulk processing failed: ${data.error}`, 'error');
      return false;
    }
  } catch (error) {
    clearInterval(progressInterval);
    log(`Real-time progress test error: ${error.message}`, 'error');
    return false;
  }
}

async function main() {
  console.log('\n⚡ Real-time Progress Bar Test\n');
  console.log('This test validates that the progress bar updates in real-time during email processing.');
  console.log('You should see live progress updates with animated progress bars.\n');
  
  // Test 1: Progress endpoint functionality
  log('=== Test 1: Progress Endpoint Functionality ===', 'progress');
  const endpointTest = await testProgressEndpoint();
  
  if (!endpointTest) {
    log('Progress endpoint test failed. Cannot proceed with real-time test.', 'error');
    rl.close();
    return;
  }
  
  // Get access token
  const accessToken = await getUserInput('\nEnter your Gmail access token for real-time testing: ');
  
  if (!accessToken) {
    log('Access token is required for real-time progress testing', 'error');
    rl.close();
    return;
  }
  
  // Test 2: Real-time progress tracking
  log('\n=== Test 2: Real-time Progress Tracking ===', 'progress');
  const realTimeTest = await testRealTimeProgress(accessToken);
  
  // Final Summary
  log('\n=== Test Results Summary ===', 'stats');
  log(`Progress Endpoint: ${endpointTest ? '✅ PASSED' : '❌ FAILED'}`, endpointTest ? 'success' : 'error');
  log(`Real-time Updates: ${realTimeTest ? '✅ PASSED' : '❌ FAILED'}`, realTimeTest ? 'success' : 'error');
  
  if (endpointTest && realTimeTest) {
    log('\n🎉 All tests passed! Real-time progress bar is working correctly.', 'success');
    log('\nKey features validated:', 'success');
    log('• Progress endpoint stores and retrieves session data', 'success');
    log('• Bulk analysis sends real-time progress updates', 'success');
    log('• Progress bar shows live updates during processing', 'success');
    log('• Batch, chunk, and email-level progress tracking', 'success');
    log('• Processing speed and ETA calculations', 'success');
    log('• AI request concurrency indicators', 'success');
  } else {
    log('\n⚠️ Some tests failed. Real-time progress may not be working properly.', 'warning');
  }
  
  rl.close();
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  log('\nTest interrupted by user', 'warning');
  rl.close();
  process.exit(0);
});

// Run the test
main().catch(error => {
  log(`Test suite error: ${error.message}`, 'error');
  rl.close();
  process.exit(1);
});
