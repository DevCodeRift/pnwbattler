// Test script for lobby cleanup functionality
import { cleanupInactiveLobbies } from './src/lib/lobby-cleanup.js';

console.log('Testing lobby cleanup functionality...\n');

async function testCleanup() {
  try {
    // Test the cleanup function
    console.log('Running cleanup check...');
    const result = await cleanupInactiveLobbies();
    
    console.log('\n--- Cleanup Results ---');
    console.log(`Lobbies cleaned: ${result.cleaned}`);
    console.log(`Total found: ${result.totalFound || result.cleaned}`);
    
    if (result.lobbies && result.lobbies.length > 0) {
      console.log('\nCleaned lobbies:');
      result.lobbies.forEach(lobby => {
        console.log(`- ${lobby.hostName} (${lobby.id}) - inactive for ${lobby.inactiveFor} minutes`);
      });
    } else {
      console.log('No inactive lobbies found to clean up');
    }
    
    if (result.error) {
      console.error('Error during cleanup:', result.error);
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Also test the API endpoint
async function testCleanupAPI() {
  try {
    console.log('\n--- Testing Cleanup API ---');
    
    // Test GET endpoint (check for inactive lobbies)
    console.log('Checking for inactive lobbies...');
    const checkResponse = await fetch('http://localhost:3000/api/lobby-cleanup');
    const checkData = await checkResponse.json();
    
    console.log(`Found ${checkData.count} inactive lobbies`);
    if (checkData.inactiveLobbies && checkData.inactiveLobbies.length > 0) {
      checkData.inactiveLobbies.forEach(lobby => {
        console.log(`- ${lobby.hostName}: inactive for ${lobby.inactiveMinutes} minutes`);
      });
    }
    
    // Test POST endpoint (perform cleanup)
    console.log('\nPerforming cleanup...');
    const cleanupResponse = await fetch('http://localhost:3000/api/lobby-cleanup', {
      method: 'POST'
    });
    const cleanupData = await cleanupResponse.json();
    
    console.log(cleanupData.message);
    if (cleanupData.details && cleanupData.details.lobbies.length > 0) {
      console.log('Cleaned lobbies:');
      cleanupData.details.lobbies.forEach(lobby => {
        console.log(`- ${lobby.hostName}: was inactive for ${lobby.inactiveFor} minutes`);
      });
    }
    
  } catch (error) {
    console.error('API test failed:', error);
    console.log('Make sure the development server is running: npm run dev');
  }
}

// Run tests
console.log('1. Testing direct cleanup function...');
testCleanup().then(() => {
  console.log('\n2. Testing cleanup API endpoints...');
  return testCleanupAPI();
}).then(() => {
  console.log('\n✓ All tests completed');
}).catch(error => {
  console.error('Test suite failed:', error);
});
