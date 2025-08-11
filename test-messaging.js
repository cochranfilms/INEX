#!/usr/bin/env node

/**
 * Test script for INEX messaging system
 * Run with: node test-messaging.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test configuration
const BASE_URL = 'http://localhost:3000';
const MESSAGES_API = `${BASE_URL}/api/messages`;
const MESSAGE_MANAGER_API = `${BASE_URL}/api/message-manager`;

// Test data
const testMessages = [
  {
    name: 'Zebadiah Henry',
    text: 'Hi team! I wanted to check on the progress of the INEX portal development. Everything looking good?',
    email: 'zeb@inexsystemsdesigns.com',
    priority: 'normal',
    category: 'client-feedback'
  },
  {
    name: 'Test User',
    text: 'This is a test message to verify the messaging system is working correctly.',
    email: 'test@example.com',
    priority: 'low',
    category: 'test'
  },
  {
    name: 'Urgent Client',
    text: 'We have an urgent request for additional features. Please respond ASAP.',
    email: 'urgent@client.com',
    priority: 'urgent',
    category: 'feature-request'
  }
];

// Utility functions
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
  console.log(`${prefix} [${timestamp}] ${message}`);
}

async function makeRequest(url, options = {}) {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });
    
    const data = await response.json();
    return { ok: response.ok, status: response.status, data };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}

// Test functions
async function testServerConnection() {
  log('Testing server connection...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/messages`);
    if (response.ok) {
      log('Server is running and responding', 'success');
      return true;
    } else {
      log(`Server responded with status: ${response.status}`, 'error');
      return false;
    }
  } catch (error) {
    log(`Server connection failed: ${error.message}`, 'error');
    log('Make sure the server is running with: node server.js', 'error');
    return false;
  }
}

async function testMessageCreation() {
  log('Testing message creation...');
  
  const results = [];
  
  for (const message of testMessages) {
    log(`Creating message from ${message.name}...`);
    
    const result = await makeRequest(MESSAGES_API, {
      method: 'POST',
      body: JSON.stringify(message)
    });
    
    if (result.ok) {
      log(`Message created successfully with ID: ${result.data.data.id}`, 'success');
      results.push(result.data.data);
    } else {
      log(`Failed to create message: ${result.error || result.data?.error}`, 'error');
    }
  }
  
  return results;
}

async function testMessageRetrieval() {
  log('Testing message retrieval...');
  
  const result = await makeRequest(MESSAGES_API);
  
  if (result.ok) {
    log(`Retrieved ${result.data.messages.length} messages`, 'success');
    return result.data.messages;
  } else {
    log(`Failed to retrieve messages: ${result.error || result.data?.error}`, 'error');
    return [];
  }
}

async function testMessageManagement() {
  log('Testing message management...');
  
  // First get messages
  const messages = await testMessageRetrieval();
  if (messages.length === 0) {
    log('No messages to test management with', 'error');
    return false;
  }
  
  const firstMessage = messages[0];
  log(`Testing management with message ID: ${firstMessage.id}`);
  
  // Test marking as read
  const readResult = await makeRequest(MESSAGE_MANAGER_API, {
    method: 'PUT',
    body: JSON.stringify({
      id: firstMessage.id,
      read: true
    })
  });
  
  if (readResult.ok) {
    log('Message marked as read successfully', 'success');
  } else {
    log(`Failed to mark message as read: ${readResult.error || readResult.data?.error}`, 'error');
  }
  
  // Test adding response
  const responseResult = await makeRequest(MESSAGE_MANAGER_API, {
    method: 'PUT',
    body: JSON.stringify({
      id: firstMessage.id,
      response: 'Thank you for your message! We are working on your request.',
      status: 'responded'
    })
  });
  
  if (responseResult.ok) {
    log('Response added successfully', 'success');
  } else {
    log(`Failed to add response: ${responseResult.error || responseResult.data?.error}`, 'error');
  }
  
  return true;
}

async function testFilePersistence() {
  log('Testing file persistence...');
  
  const messagesFile = 'inex-messages.json';
  const backupFiles = fs.readdirSync('.').filter(file => file.startsWith('inex-messages-backup-'));
  
  if (fs.existsSync(messagesFile)) {
    const messagesData = fs.readFileSync(messagesFile, 'utf8');
    const messages = JSON.parse(messagesData);
    log(`Messages file contains ${messages.length} messages`, 'success');
    
    if (backupFiles.length > 0) {
      log(`Backup files created: ${backupFiles.join(', ')}`, 'success');
    } else {
      log('No backup files found', 'error');
    }
    
    return true;
  } else {
    log('Messages file not found', 'error');
    return false;
  }
}

// Main test runner
async function runTests() {
  log('🚀 Starting INEX messaging system tests...');
  log(`Testing against: ${BASE_URL}`);
  log('');
  
  const tests = [
    { name: 'Server Connection', fn: testServerConnection },
    { name: 'Message Creation', fn: testMessageCreation },
    { name: 'Message Retrieval', fn: testMessageRetrieval },
    { name: 'Message Management', fn: testMessageManagement },
    { name: 'File Persistence', fn: testFilePersistence }
  ];
  
  let passed = 0;
  let total = tests.length;
  
  for (const test of tests) {
    log(`\n--- ${test.name} ---`);
    try {
      const result = await test.fn();
      if (result !== false) {
        passed++;
      }
    } catch (error) {
      log(`Test failed with error: ${error.message}`, 'error');
    }
  }
  
  log('\n--- Test Results ---');
  log(`Passed: ${passed}/${total}`, passed === total ? 'success' : 'error');
  
  if (passed === total) {
    log('🎉 All tests passed! The messaging system is working correctly.', 'success');
    log('\nNext steps:');
    log('1. Open dev-dashboard.html in your browser to manage messages');
    log('2. Open status.html to see the public status page with messaging');
    log('3. Test sending messages from the public page');
  } else {
    log('❌ Some tests failed. Check the errors above.', 'error');
  }
}

// Check if fetch is available (Node 18+)
if (typeof fetch === 'undefined') {
  log('❌ Fetch is not available. This script requires Node.js 18+ or a fetch polyfill.', 'error');
  log('Current Node version:', process.version);
  process.exit(1);
}

// Run tests
runTests().catch(error => {
  log(`Test runner failed: ${error.message}`, 'error');
  process.exit(1);
});
