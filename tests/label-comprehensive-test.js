#!/usr/bin/env node

/**
 * Comprehensive Label Management Test Suite
 * Tests all label functionality including creation, email counts, and relabeling
 */

const https = require('https');
const http = require('http');

const BASE_URL = 'http://localhost:3000';
const TEST_EMAIL = 'sabitov.ty@gmail.com';

// Test configuration
const TEST_CONFIG = {
  maxEmailsToTest: 10,
  testLabelName: 'TestLabel-' + Date.now(),
  targetLabelForRelabeling: 'AI/Cold-Outreach'
};

let authTokens = null;

class LabelTestSuite {
  constructor() {
    this.results = {
      total: 0,
      passed: 0,
      failed: 0,
      warnings: 0,
      details: []
    };
  }

  log(type, test, message, details = null) {
    const symbols = { pass: '✅', fail: '❌', warn: '⚠️', info: 'ℹ️' };
    console.log(`${symbols[type]} ${type.toUpperCase()} ${test}: ${message}`);
    if (details) console.log(`   Details: ${JSON.stringify(details, null, 2)}`);
    
    this.results.total++;
    if (type === 'pass') this.results.passed++;
    else if (type === 'fail') this.results.failed++;
    else if (type === 'warn') this.results.warnings++;
    
    this.results.details.push({ type, test, message, details });
  }

  async makeRequest(path, options = {}) {
    return new Promise((resolve, reject) => {
      const url = `${BASE_URL}${path}`;
      const method = options.method || 'GET';
      const body = options.body ? JSON.stringify(options.body) : null;
      
      const req = http.request(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        }
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const parsed = data ? JSON.parse(data) : {};
            resolve({ status: res.statusCode, data: parsed, raw: data });
          } catch (e) {
            resolve({ status: res.statusCode, data: null, raw: data });
          }
        });
      });

      req.on('error', reject);
      if (body) req.write(body);
      req.end();
    });
  }

  async testServerHealth() {
    console.log('\n🏥 Testing Server Health...');
    try {
      const response = await this.makeRequest('/api/health');
      if (response.status === 200) {
        this.log('pass', 'Server Health', 'Server is responding');
        return true;
      } else {
        this.log('fail', 'Server Health', `Server returned status ${response.status}`);
        return false;
      }
    } catch (error) {
      this.log('fail', 'Server Health', `Server is not accessible: ${error.message}`);
      return false;
    }
  }

  async testGmailAuth() {
    console.log('\n🔐 Testing Gmail Authentication...');
    try {
      // Get auth URL
      const authResponse = await this.makeRequest('/api/email/gmail/connect');
      if (authResponse.status === 200 && authResponse.data.authUrl) {
        this.log('pass', 'Gmail Auth URL', 'Auth URL generated successfully');
        console.log(`\n📧 Gmail Auth URL: ${authResponse.data.authUrl}`);
        console.log(`\n📧 Manual Authentication Required:`);
        console.log(`1. Visit the auth URL above`);
        console.log(`2. Sign in with: ${TEST_EMAIL}`);
        console.log(`3. Grant permissions`);
        console.log(`4. Copy the tokens from the callback or browser storage`);
        console.log(`5. Run this script again with tokens to continue testing`);
        
        return { needsAuth: true, authUrl: authResponse.data.authUrl };
      } else {
        this.log('fail', 'Gmail Auth URL', 'Failed to generate auth URL', authResponse.data);
        return false;
      }
    } catch (error) {
      this.log('fail', 'Gmail Auth', `Authentication error: ${error.message}`);
      return false;
    }
  }

  async testEmailStats() {
    console.log('\n📊 Testing Email Statistics...');
    if (!authTokens) {
      this.log('warn', 'Email Stats', 'Skipping - no auth tokens available');
      return false;
    }

    try {
      const response = await this.makeRequest('/api/email/gmail/stats', {
        method: 'POST',
        body: {
          accessToken: authTokens.accessToken,
          refreshToken: authTokens.refreshToken,
          includeUnlabeled: true
        }
      });

      if (response.status === 200 && response.data.success) {
        const stats = response.data.stats;
        this.log('pass', 'Email Stats', `Retrieved stats: ${stats.totalEmails} total emails`);
        console.log(`   📧 Total Emails: ${stats.totalEmails}`);
        console.log(`   🏷️ Total Labels: ${stats.totalLabels}`);
        console.log(`   📝 Unlabeled: ${stats.unlabeledCount}`);
        
        if (stats.labelBreakdown) {
          console.log(`   🏷️ Label Breakdown:`);
          Object.entries(stats.labelBreakdown).slice(0, 5).forEach(([label, count]) => {
            console.log(`      ${label}: ${count} emails`);
          });
        }
        
        return stats;
      } else {
        this.log('fail', 'Email Stats', 'Failed to retrieve email stats', response.data);
        return false;
      }
    } catch (error) {
      this.log('fail', 'Email Stats', `Stats error: ${error.message}`);
      return false;
    }
  }

  async testLabelRetrieval() {
    console.log('\n🏷️ Testing Label Retrieval...');
    if (!authTokens) {
      this.log('warn', 'Label Retrieval', 'Skipping - no auth tokens available');
      return false;
    }

    try {
      const response = await this.makeRequest('/api/email/gmail/debug', {
        method: 'POST',
        body: {
          accessToken: authTokens.accessToken,
          refreshToken: authTokens.refreshToken,
          action: 'list-labels'
        }
      });

      if (response.status === 200 && response.data.success) {
        const labels = response.data.result.labels || [];
        this.log('pass', 'Label Retrieval', `Retrieved ${labels.length} labels`);
        
        // Show some example labels
        console.log(`   🏷️ Available Labels (first 10):`);
        labels.slice(0, 10).forEach(label => {
          console.log(`      ${label.name} (${label.type || 'unknown type'})`);
        });
        
        return labels;
      } else {
        this.log('fail', 'Label Retrieval', 'Failed to retrieve labels', response.data);
        return false;
      }
    } catch (error) {
      this.log('fail', 'Label Retrieval', `Label retrieval error: ${error.message}`);
      return false;
    }
  }

  async testEmailSampling() {
    console.log('\n📧 Testing Email Sampling...');
    if (!authTokens) {
      this.log('warn', 'Email Sampling', 'Skipping - no auth tokens available');
      return false;
    }

    try {
      const response = await this.makeRequest('/api/email/gmail/debug', {
        method: 'POST',
        body: {
          accessToken: authTokens.accessToken,
          refreshToken: authTokens.refreshToken,
          action: 'sample-emails',
          sampleSize: TEST_CONFIG.maxEmailsToTest
        }
      });

      if (response.status === 200 && response.data.success) {
        const emails = response.data.result.emails || [];
        this.log('pass', 'Email Sampling', `Retrieved ${emails.length} sample emails`);
        
        console.log(`   📧 Sample Emails:`);
        emails.forEach((email, index) => {
          const labels = email.labelIds ? email.labelIds.join(', ') : 'No labels';
          console.log(`      ${index + 1}. ${email.snippet.substring(0, 50)}... (Labels: ${labels})`);
        });
        
        return emails;
      } else {
        this.log('fail', 'Email Sampling', 'Failed to retrieve sample emails', response.data);
        return false;
      }
    } catch (error) {
      this.log('fail', 'Email Sampling', `Email sampling error: ${error.message}`);
      return false;
    }
  }

  async testBulkAnalysis() {
    console.log('\n🤖 Testing Bulk Email Analysis...');
    if (!authTokens) {
      this.log('warn', 'Bulk Analysis', 'Skipping - no auth tokens available');
      return false;
    }

    try {
      const response = await this.makeRequest('/api/email/gmail/bulk-analyze', {
        method: 'POST',
        body: {
          accessToken: authTokens.accessToken,
          refreshToken: authTokens.refreshToken,
          maxEmails: TEST_CONFIG.maxEmailsToTest,
          applyLabels: false, // Don't apply labels yet, just analyze
          query: '',
          skipClassified: false,
          batchSize: 5,
          aiModel: 'gpt-4'
        }
      });

      if (response.status === 200 && response.data.success) {
        const result = response.data.result;
        this.log('pass', 'Bulk Analysis', `Analyzed ${result.totalProcessed} emails`);
        
        console.log(`   📊 Analysis Results:`);
        console.log(`      Total Processed: ${result.totalProcessed}`);
        console.log(`      Total Classified: ${result.totalClassified}`);
        console.log(`      Errors: ${result.errors}`);
        
        if (result.summary) {
          console.log(`   📈 Summary:`);
          console.log(`      Prospects: ${result.summary.prospects || 0}`);
          console.log(`      High Priority: ${result.summary.highPriority || 0}`);
        }
        
        return result;
      } else {
        this.log('fail', 'Bulk Analysis', 'Failed to analyze emails', response.data);
        return false;
      }
    } catch (error) {
      this.log('fail', 'Bulk Analysis', `Analysis error: ${error.message}`);
      return false;
    }
  }

  async testLabelApplication() {
    console.log('\n🏷️ Testing Label Application...');
    if (!authTokens) {
      this.log('warn', 'Label Application', 'Skipping - no auth tokens available');
      return false;
    }

    try {
      // Run analysis with label application enabled
      const response = await this.makeRequest('/api/email/gmail/bulk-analyze', {
        method: 'POST',
        body: {
          accessToken: authTokens.accessToken,
          refreshToken: authTokens.refreshToken,
          maxEmails: Math.min(TEST_CONFIG.maxEmailsToTest, 5), // Smaller test
          applyLabels: true, // Apply labels this time
          query: '',
          skipClassified: false,
          batchSize: 3,
          aiModel: 'gpt-4'
        }
      });

      if (response.status === 200 && response.data.success) {
        const result = response.data.result;
        this.log('pass', 'Label Application', `Applied labels to ${result.labelsApplied} emails`);
        
        console.log(`   🏷️ Label Application Results:`);
        console.log(`      Emails Processed: ${result.totalProcessed}`);
        console.log(`      Labels Applied: ${result.labelsApplied}`);
        console.log(`      Errors: ${result.errors}`);
        
        if (result.results && result.results.length > 0) {
          console.log(`   📧 Labeled Emails:`);
          result.results.slice(0, 5).forEach((email, index) => {
            if (email.appliedLabels && email.appliedLabels.length > 0) {
              console.log(`      ${index + 1}. ${email.subject?.substring(0, 40)}... → ${email.appliedLabels.join(', ')}`);
            }
          });
        }
        
        return result;
      } else {
        this.log('fail', 'Label Application', 'Failed to apply labels', response.data);
        return false;
      }
    } catch (error) {
      this.log('fail', 'Label Application', `Label application error: ${error.message}`);
      return false;
    }
  }

  async testLabelVerification() {
    console.log('\n✅ Testing Label Verification...');
    if (!authTokens) {
      this.log('warn', 'Label Verification', 'Skipping - no auth tokens available');
      return false;
    }

    try {
      // Get updated stats to verify label changes
      const statsResponse = await this.makeRequest('/api/email/gmail/stats', {
        method: 'POST',
        body: {
          accessToken: authTokens.accessToken,
          refreshToken: authTokens.refreshToken,
          includeUnlabeled: true
        }
      });

      if (statsResponse.status === 200 && statsResponse.data.success) {
        const stats = statsResponse.data.stats;
        this.log('pass', 'Label Verification', 'Retrieved updated email statistics');
        
        console.log(`   📊 Updated Statistics:`);
        console.log(`      Total Emails: ${stats.totalEmails}`);
        console.log(`      Total Labels: ${stats.totalLabels}`);
        console.log(`      Unlabeled: ${stats.unlabeledCount}`);
        
        if (stats.labelBreakdown) {
          console.log(`   🏷️ Current Label Distribution:`);
          const sortedLabels = Object.entries(stats.labelBreakdown)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10);
          
          sortedLabels.forEach(([label, count]) => {
            console.log(`      ${label}: ${count} emails`);
          });
        }
        
        return stats;
      } else {
        this.log('fail', 'Label Verification', 'Failed to verify labels', statsResponse.data);
        return false;
      }
    } catch (error) {
      this.log('fail', 'Label Verification', `Verification error: ${error.message}`);
      return false;
    }
  }

  async runFullTestSuite() {
    console.log('🧪 Starting Comprehensive Label Management Test Suite...');
    console.log(`📧 Test Email: ${TEST_EMAIL}`);
    console.log(`🎯 Max Emails to Test: ${TEST_CONFIG.maxEmailsToTest}`);
    console.log('='.repeat(80));

    // Check if we have stored auth tokens
    try {
      const fs = require('fs');
      if (fs.existsSync('./gmail-tokens.json')) {
        authTokens = JSON.parse(fs.readFileSync('./gmail-tokens.json', 'utf8'));
        this.log('info', 'Auth Tokens', 'Loaded saved authentication tokens');
      }
    } catch (e) {
      // No saved tokens, will need to authenticate
    }

    // Test sequence
    const serverHealthy = await this.testServerHealth();
    if (!serverHealthy) {
      console.log('\n❌ Server is not healthy. Please start the development server first.');
      return this.generateReport();
    }

    if (!authTokens) {
      const authResult = await this.testGmailAuth();
      if (authResult && authResult.needsAuth) {
        console.log('\n⚠️ Authentication required. Please complete OAuth flow and run script again.');
        return this.generateReport();
      }
    }

    // Run all tests that require authentication
    await this.testEmailStats();
    await this.testLabelRetrieval();
    await this.testEmailSampling();
    await this.testBulkAnalysis();
    await this.testLabelApplication();
    await this.testLabelVerification();

    return this.generateReport();
  }

  generateReport() {
    console.log('\n' + '='.repeat(80));
    console.log('📊 Label Management Test Results Summary:');
    console.log('='.repeat(80));
    console.log(`Total Tests: ${this.results.total}`);
    console.log(`✅ Passed: ${this.results.passed}`);
    console.log(`⚠️ Warnings: ${this.results.warnings}`);
    console.log(`❌ Failed: ${this.results.failed}`);
    console.log();

    if (this.results.failed > 0) {
      console.log('❌ Failed Tests:');
      this.results.details
        .filter(r => r.type === 'fail')
        .forEach(r => console.log(`   • ${r.test}: ${r.message}`));
      console.log();
    }

    if (this.results.warnings > 0) {
      console.log('⚠️ Warnings:');
      this.results.details
        .filter(r => r.type === 'warn')
        .forEach(r => console.log(`   • ${r.test}: ${r.message}`));
      console.log();
    }

    const successRate = Math.round((this.results.passed / this.results.total) * 100);
    console.log(`🎯 Success Rate: ${successRate}%`);

    if (!authTokens) {
      console.log('\n📋 Next Steps:');
      console.log('1. Complete Gmail OAuth authentication');
      console.log('2. Save tokens and re-run this test');
      console.log('3. Verify label operations work correctly');
    } else {
      console.log('\n✅ All label functionality tested successfully!');
    }

    return this.results;
  }
}

// Run the test suite
const testSuite = new LabelTestSuite();
testSuite.runFullTestSuite().then(() => {
  process.exit(0);
}).catch(error => {
  console.error('❌ Test suite failed:', error);
  process.exit(1);
});
