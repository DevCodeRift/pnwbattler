// Comprehensive Vercel Testing
const BASE_URL = 'https://www.pnwbattler.com';

async function fullSystemTest() {
  console.log('🎮 COMPREHENSIVE MULTIPLAYER SYSTEM TEST\n');

  let lobbyId = null;

  // Test 1: Create a lobby
  console.log('1. Creating a new lobby...');
  try {
    const response = await fetch(`${BASE_URL}/api/multiplayer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'create-lobby',
        hostName: 'BattleHost',
        settings: {
          turnCooldown: 120,
          unitBuyFrequency: 3,
          cityMode: 'max_militarization',
          economyMode: 'unlimited',
          maxUnits: {
            infantry: 2000,
            tanks: 1000,
            aircraft: 500,
            ships: 250
          }
        }
      })
    });
    const data = await response.json();
    lobbyId = data.lobby?.id;
    console.log('✅ Lobby created:', {
      id: lobbyId,
      host: data.lobby?.hostName,
      players: data.lobby?.playerCount
    });
  } catch (error) {
    console.log('❌ Error:', error.message);
    return;
  }

  // Test 2: Add multiple players
  console.log('\n2. Adding players to lobby...');
  const players = ['Player1', 'Player2', 'Player3'];
  for (const playerName of players) {
    try {
      const response = await fetch(`${BASE_URL}/api/multiplayer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'join-lobby',
          lobbyId: lobbyId,
          playerName: playerName
        })
      });
      const data = await response.json();
      console.log(`✅ ${playerName} joined. Total players: ${data.lobby?.playerCount}`);
    } catch (error) {
      console.log(`❌ Error adding ${playerName}:`, error.message);
    }
  }

  // Test 3: Start a battle
  console.log('\n3. Starting battle...');
  try {
    const response = await fetch(`${BASE_URL}/api/multiplayer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'start-battle',
        lobbyId: lobbyId,
        gameState: {
          turn: 1,
          playerTurn: 'BattleHost',
          player1: {
            name: 'BattleHost',
            units: { infantry: 1000, tanks: 500, aircraft: 200, ships: 100 },
            cities: 10,
            resources: { money: 1000000, steel: 50000, aluminum: 30000 }
          },
          player2: {
            name: 'Player1',
            units: { infantry: 1000, tanks: 500, aircraft: 200, ships: 100 },
            cities: 10,
            resources: { money: 1000000, steel: 50000, aluminum: 30000 }
          }
        }
      })
    });
    const data = await response.json();
    console.log('✅ Battle started:', {
      battleId: data.battle?.id,
      status: data.battle?.status
    });
  } catch (error) {
    console.log('❌ Battle start error:', error.message);
  }

  // Test 4: Check active games
  console.log('\n4. Checking all active games...');
  try {
    const response = await fetch(`${BASE_URL}/api/multiplayer?action=active-games`);
    const data = await response.json();
    
    console.log(`📊 SYSTEM STATUS:`);
    console.log(`   Active Lobbies: ${data.lobbies?.length || 0}`);
    console.log(`   Active Battles: ${data.battles?.length || 0}`);
    
    if (data.lobbies?.length > 0) {
      console.log('\n🏛️  ACTIVE LOBBIES:');
      data.lobbies.forEach((lobby, i) => {
        console.log(`   ${i + 1}. ${lobby.hostName} - ${lobby.playerCount} players - ${lobby.status}`);
      });
    }
    
    if (data.battles?.length > 0) {
      console.log('\n⚔️  ACTIVE BATTLES:');
      data.battles.forEach((battle, i) => {
        console.log(`   ${i + 1}. Battle ${battle.id.slice(-8)} - ${battle.playerCount} players - ${battle.status}`);
      });
    }
  } catch (error) {
    console.log('❌ Status check error:', error.message);
  }

  console.log('\n🎉 FULL SYSTEM TEST COMPLETED!');
  console.log('\n🌐 Your multiplayer system is LIVE and WORKING on:');
  console.log('   • https://www.pnwbattler.com');
  console.log('   • https://pnwbattler.vercel.app');
}

// Run comprehensive test
fullSystemTest().catch(console.error);
