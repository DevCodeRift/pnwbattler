// Demo script to show lobby cleanup in action
console.log('=== Lobby Cleanup Demo ===\n');

async function createTestLobby(hostName) {
  try {
    const response = await fetch('http://localhost:3000/api/multiplayer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'create-lobby',
        hostName: hostName,
        settings: {
          maxPlayers: 2,
          turnTimer: 60,
          unitBuyFrequency: 1,
          cityMode: 'NATION_CITIES',
          economyType: 'UNLIMITED',
          maxUnits: {
            infantry: 1000,
            tanks: 500,
            aircraft: 200,
            ships: 100
          }
        }
      })
    });
    
    const data = await response.json();
    if (data.lobby) {
      console.log(`✓ Created test lobby: ${hostName} (ID: ${data.lobby.id})`);
      return data.lobby.id;
    } else {
      console.error('Failed to create lobby:', data.error);
      return null;
    }
  } catch (error) {
    console.error('Error creating lobby:', error);
    return null;
  }
}

async function checkActiveLobbies() {
  try {
    const response = await fetch('http://localhost:3000/api/multiplayer?action=active-games');
    const data = await response.json();
    
    console.log(`\nActive lobbies: ${data.lobbies?.length || 0}`);
    if (data.lobbies && data.lobbies.length > 0) {
      data.lobbies.forEach(lobby => {
        console.log(`- ${lobby.hostName} (${lobby.playerCount} players, created: ${new Date(lobby.createdAt).toLocaleTimeString()})`);
      });
    }
    
    return data.lobbies || [];
  } catch (error) {
    console.error('Error checking lobbies:', error);
    return [];
  }
}

async function runDemo() {
  console.log('1. Creating test lobbies...');
  
  // Create a few test lobbies
  const lobby1 = await createTestLobby('TestHost1');
  const lobby2 = await createTestLobby('TestHost2');
  const lobby3 = await createTestLobby('TestHost3');
  
  console.log('\n2. Checking initial state...');
  await checkActiveLobbies();
  
  console.log('\n3. Checking for inactive lobbies (should be none yet)...');
  try {
    const checkResponse = await fetch('http://localhost:3000/api/lobby-cleanup');
    const checkData = await checkResponse.json();
    console.log(checkData.message);
  } catch (error) {
    console.error('Error checking inactive lobbies:', error);
  }
  
  console.log('\n4. Waiting 30 seconds to simulate inactivity...');
  console.log('(In production, lobbies need 5 minutes of inactivity)');
  
  // For demo purposes, we'll show how to manually set a lobby as inactive
  // In real use, you would wait 5+ minutes
  
  setTimeout(async () => {
    console.log('\n5. Manually triggering cleanup check...');
    try {
      const cleanupResponse = await fetch('http://localhost:3000/api/lobby-cleanup', {
        method: 'POST'
      });
      const cleanupData = await cleanupResponse.json();
      console.log(cleanupData.message);
      
      console.log('\n6. Checking lobbies after cleanup...');
      await checkActiveLobbies();
      
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }, 30000);
}

// Instructions
console.log('This demo will:');
console.log('1. Create test lobbies');
console.log('2. Show current active lobbies');
console.log('3. Check for inactive lobbies');
console.log('4. Wait and then trigger cleanup');
console.log('5. Show results\n');

console.log('Make sure the development server is running (npm run dev) before starting...\n');

// Start demo
runDemo().catch(error => {
  console.error('Demo failed:', error);
});
