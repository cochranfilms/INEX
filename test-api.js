#!/usr/bin/env node

/**
 * Test script for the status-update API endpoint
 * Run this to test if your API is working correctly
 */

const testAPI = async () => {
  console.log('🧪 Testing Status Update API...\n');
  
  const testData = {
    progress: 25,
    phase: 'Design',
    status: 'Design phase initiated - working on brand guidelines',
    update: 'Dec 18 - Brand research completed',
    update_status: 'Complete'
  };
  
  console.log('📤 Sending test data:', JSON.stringify(testData, null, 2));
  
  try {
    const response = await fetch('http://localhost:3000/api/status-update', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });
    
    console.log('\n📥 Response Status:', response.status);
    console.log('📥 Response Headers:', Object.fromEntries(response.headers.entries()));
    
    const responseText = await response.text();
    console.log('📥 Response Body:', responseText);
    
    if (response.ok) {
      try {
        const result = JSON.parse(responseText);
        console.log('\n✅ API Test Successful!');
        console.log('Result:', result);
      } catch (e) {
        console.log('\n⚠️ Response is not valid JSON');
      }
    } else {
      console.log('\n❌ API Test Failed');
      console.log('HTTP Status:', response.status);
    }
    
  } catch (error) {
    console.log('\n💥 Network Error:', error.message);
    console.log('\n💡 Make sure your local server is running on port 3000');
    console.log('💡 Or update the URL to match your local setup');
  }
};

// Run the test
testAPI().catch(console.error);
