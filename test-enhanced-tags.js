// Test script to verify enhanced tag system functionality
const BASE_URL = 'http://localhost:5000';

async function testCountryAliases() {
  console.log('Testing Country Aliases...\n');
  
  const testInputs = [
    { input: 'America', expected: 'USA' },
    { input: 'United States', expected: 'USA' },
    { input: 'U.S.', expected: 'USA' },
    { input: 'japan', expected: 'Japan' },
    { input: 'uk', expected: 'England' }
  ];
  
  for (const test of testInputs) {
    console.log(`Testing: "${test.input}" → Expected: "${test.expected}"`);
    // This would need actual API endpoint testing
  }
}

async function testCityTags() {
  console.log('\nTesting City Tags...\n');
  
  const cities = [
    { name: 'Tokyo', country: 'JP' },
    { name: 'Las Vegas', country: 'US' },
    { name: 'New York', country: 'US' },
    { name: 'Paris', country: 'FR' },
    { name: 'Unknown City', country: 'XX' } // Test fallback
  ];
  
  for (const city of cities) {
    try {
      const response = await fetch(`${BASE_URL}/api/cities/tags/${city.name}/${city.country}`);
      const data = await response.json();
      
      console.log(`\n${city.name}, ${city.country}:`);
      console.log(`  Tags found: ${data.tags ? data.tags.length : 0}`);
      console.log(`  Is default: ${data.isDefault}`);
      
      if (data.tags && data.tags.length > 0) {
        console.log(`  Sample tags: ${data.tags.slice(0, 3).join(', ')}`);
      }
    } catch (error) {
      console.error(`  Error: ${error.message}`);
    }
  }
}

async function testConversationFlow() {
  console.log('\n\nTesting Conversation Flow with "America"...\n');
  
  try {
    // Start conversation
    const startResponse = await fetch(`${BASE_URL}/api/conversation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    const conversation = await startResponse.json();
    console.log('Conversation started:', conversation.id);
    
    // Send "America" as destination
    const messageResponse = await fetch(`${BASE_URL}/api/conversation/${conversation.id}/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'America' })
    });
    const result = await messageResponse.json();
    console.log('Response to "America":', result.response?.substring(0, 100) + '...');
    console.log('Detected destination:', result.extractedInfo?.destination);
    
  } catch (error) {
    console.error('Error in conversation flow:', error.message);
  }
}

async function runTests() {
  console.log('=== Enhanced Tag System Test Suite ===\n');
  await testCountryAliases();
  await testCityTags();
  await testConversationFlow();
  console.log('\n=== Tests Complete ===');
}

// Run tests if server is available
setTimeout(runTests, 2000);