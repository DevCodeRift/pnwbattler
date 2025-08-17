// Test script for Vercel deployment
const BASE_URL = 'https://www.pnwbattler.com';

async function testAPI() {
  console.log('🚀 Testing Vercel Deployment...\n');

  // Test 1: Get lobbies and battles
  console.log('1. Testing GET /api/multiplayer...');
  try {
    const response = await fetch(`${BASE_URL}/api/multiplayer?action=active-games`);
    const data = await response.json();
    console.log('✅ GET Response:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.log('❌ GET Error:', error.message);
  }

  // Test 2: Create a lobby
  console.log('\n2. Testing CREATE_LOBBY...');
  try {
    const createLobbyData = {
      action: 'create-lobby',
      hostName: 'TestHost',
      settings: {
        turnCooldown: 60,
        unitBuyFrequency: 2,
        cityMode: 'nation',
        economyMode: 'unlimited',
        maxUnits: {
          infantry: 1000,
          tanks: 500,
          aircraft: 200,
          ships: 100
        }
      }
    };

    const response = await fetch(`${BASE_URL}/api/multiplayer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(createLobbyData)
    });

    const data = await response.json();
    console.log('✅ CREATE_LOBBY Response:', JSON.stringify(data, null, 2));
    
    // Store lobby ID for next test
    global.testLobbyId = data.lobby?.id;
    
  } catch (error) {
    console.log('❌ CREATE_LOBBY Error:', error.message);
  }

  // Test 3: Join lobby (if we have a lobby ID)
  if (global.testLobbyId) {
    console.log('\n3. Testing JOIN_LOBBY...');
    try {
      const joinLobbyData = {
        action: 'join_lobby',
        lobbyId: global.testLobbyId,
        playerName: 'TestPlayer'
      };

      const response = await fetch(`${BASE_URL}/api/multiplayer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(joinLobbyData)
      });

      const data = await response.json();
      console.log('✅ JOIN_LOBBY Response:', JSON.stringify(data, null, 2));
      
    } catch (error) {
      console.log('❌ JOIN_LOBBY Error:', error.message);
    }
  }

  // Test 4: Get updated lobbies and battles
  console.log('\n4. Testing GET /api/multiplayer after changes...');
  try {
    const response = await fetch(`${BASE_URL}/api/multiplayer`);
    const data = await response.json();
    console.log('✅ Updated GET Response:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.log('❌ Updated GET Error:', error.message);
  }

  console.log('\n🎉 Test completed!');
}

// Run the test
testAPI().catch(console.error);
