'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import Pusher from 'pusher-js';

// Multiplayer Settings Interface
interface MultiplayerSettings {
  maxPlayers: number;
  turnTimer: number;
  unitBuyFrequency: number;
  cityMode: 'NATION_CITIES' | 'MAX_MILITARIZATION';
  economyType: 'LIMITED' | 'UNLIMITED';
  maxUnits: {
    infantry: number;
    tanks: number;
    aircraft: number;
    ships: number;
  };
}

interface OnlineUser {
  id: string;
  username: string;
  avatar?: string;
  lastSeen: string;
}

function RealBattleContent() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const [gameState, setGameState] = useState<'setup' | 'lobby' | 'battle' | 'spectating'>('setup');
  const [currentLobby, setCurrentLobby] = useState<any>(null);
  const [currentBattle, setBattle] = useState<any>(null);
  const [lobbies, setLobbies] = useState<any[]>([]);
  const [battles, setBattles] = useState<any[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [pusherClient, setPusherClient] = useState<Pusher | null>(null);
  const pusherRef = useRef<Pusher | null>(null);

  // Form state for creating lobby
  const [hostName, setHostName] = useState(session?.user?.name || '');
  const [settings, setSettings] = useState<MultiplayerSettings>({
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
  });

  // Debug effect to track state changes
  useEffect(() => {
    console.log('=== STATE CHANGE DETECTED ===');
    console.log('gameState changed to:', gameState);
    console.log('currentLobby changed to:', currentLobby ? `ID: ${currentLobby.id}, Players: ${currentLobby.playerCount}` : 'null');
  }, [gameState, currentLobby]);

  // Initialize Pusher and load initial data
  useEffect(() => {
    // Initialize Pusher
    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    });
    setPusherClient(pusher);
    pusherRef.current = pusher;

    // Subscribe to multiplayer channel for lobby updates
    const multiplayerChannel = pusher.subscribe('multiplayer');
    
    multiplayerChannel.bind('lobby-created', (data: any) => {
      console.log('Lobby created:', data);
      setLobbies(prev => [data, ...prev]);
    });

    multiplayerChannel.bind('lobby-updated', (data: any) => {
      console.log('Lobby updated:', data);
      setLobbies(prev => prev.map(lobby => 
        lobby.id === data.id ? data : lobby
      ));
    });

    multiplayerChannel.bind('lobby-closed', (data: any) => {
      console.log('Lobby closed:', data.lobbyId);
      setLobbies(prev => prev.filter(lobby => lobby.id !== data.lobbyId));
    });

    multiplayerChannel.bind('battle-created', (data: any) => {
      console.log('Battle created:', data);
      setBattles(prev => [data, ...prev]);
    });

    // Check if user is already in a lobby
    if (session?.user) {
      checkForExistingLobby();
    }

    // Load initial data
    loadActiveGames();
    loadOnlineUsers();

    // Set up periodic data refresh (less frequent since we have real-time updates)
    const interval = setInterval(() => {
      loadActiveGames();
      loadOnlineUsers();
    }, 30000); // Refresh every 30 seconds as fallback

    // Set up heartbeat for online presence
    const heartbeatInterval = setInterval(() => {
      if (session?.user) {
        updateOnlineStatus();
      }
    }, 60000); // Update presence every minute

    // Set up periodic lobby cleanup (less frequent)
    const cleanupInterval = setInterval(() => {
      // Trigger cleanup via API call every 2 minutes
      fetch('/api/lobby-cleanup', { method: 'POST' })
        .then(response => response.json())
        .then(data => {
          if (data.details?.cleanedLobbies > 0) {
            console.log(`Cleaned up ${data.details.cleanedLobbies} inactive lobbies`);
          }
        })
        .catch(error => console.error('Cleanup failed:', error));
    }, 120000); // Cleanup every 2 minutes

    return () => {
      clearInterval(interval);
      clearInterval(heartbeatInterval);
      clearInterval(cleanupInterval);
      pusher.unsubscribe('multiplayer');
      pusher.disconnect();
    };
  }, [session]);

  // Update host name when session changes
  useEffect(() => {
    if (session?.user?.name) {
      setHostName(session.user.name);
    }
  }, [session]);

  // Handle spectating from URL
  useEffect(() => {
    const spectateId = searchParams.get('spectate');
    if (spectateId) {
      setGameState('spectating');
      if (session?.user?.name) {
        joinAsSpectator(spectateId);
      }
    }
  }, [searchParams, session]);

  const loadActiveGames = async () => {
    try {
      const response = await fetch('/api/multiplayer?action=active-games');
      const data = await response.json();
      setLobbies(data.lobbies || []);
      setBattles(data.battles || []);
    } catch (error) {
      console.error('Failed to load active games:', error);
    }
  };

  const loadOnlineUsers = async () => {
    try {
      const response = await fetch('/api/online-users');
      const data = await response.json();
      setOnlineUsers(data.users || []);
    } catch (error) {
      console.error('Failed to load online users:', error);
    }
  };

  const updateOnlineStatus = async () => {
    try {
      await fetch('/api/online-users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      console.error('Failed to update online status:', error);
    }
  };

  const checkForExistingLobby = async () => {
    try {
      const response = await fetch('/api/multiplayer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get-my-lobby'
        })
      });

      const data = await response.json();
      if (data.lobby) {
        console.log('Found existing lobby, rejoining:', data.lobby);
        setCurrentLobby(data.lobby);
        setGameState('lobby');
        
        // Subscribe to lobby-specific events
        if (pusherClient) {
          subscribeToLobbyEvents(data.lobby.id);
        }
      }
    } catch (error) {
      console.error('Failed to check for existing lobby:', error);
    }
  };

  const subscribeToLobbyEvents = (lobbyId: string) => {
    const pusher = pusherRef.current || pusherClient;
    if (!pusher) {
      console.log('No pusher client available for lobby events');
      return;
    }
    
    console.log('Subscribing to lobby events for lobby:', lobbyId);
    const lobbyChannel = pusher.subscribe(`lobby-${lobbyId}`);
    
    lobbyChannel.bind('player-joined', (eventData: any) => {
      console.log('Player joined lobby event received:', eventData);
      setCurrentLobby((prev: any) => {
        console.log('Current lobby state before update:', prev);
        console.log('Lobby ID match check:', { 
          eventLobbyId: eventData.lobbyId, 
          currentLobbyId: prev?.id, 
          subscribedLobbyId: lobbyId 
        });
        
        // If we have the full lobby data, use it
        if (eventData.lobby) {
          console.log('Using full lobby data from event:', eventData.lobby);
          return eventData.lobby;
        }
        
        // Fallback: update the current lobby if it matches
        if (prev && (prev.id === eventData.lobbyId || prev.id === lobbyId)) {
          const updatedLobby = {
            ...prev,
            players: eventData.player ? [...prev.players, eventData.player] : prev.players,
            playerCount: eventData.player ? prev.playerCount + 1 : prev.playerCount
          };
          console.log('Updated lobby with fallback logic:', updatedLobby);
          return updatedLobby;
        }
        
        // If no current lobby but we have event data for the right lobby
        if (!prev && eventData.lobbyId === lobbyId && eventData.lobby) {
          console.log('Setting lobby from event when no current lobby:', eventData.lobby);
          return eventData.lobby;
        }
        
        console.log('No lobby update needed, returning previous state');
        return prev;
      });
    });

    lobbyChannel.bind('player-left', (eventData: any) => {
      console.log('Player left lobby:', eventData);
      setCurrentLobby((prev: any) => {
        // If we have the full lobby data, use it
        if (eventData.lobby) {
          return eventData.lobby;
        }
        // Fallback: update the current lobby if it matches
        if (prev && (prev.id === eventData.lobbyId || prev.id === lobbyId)) {
          return {
            ...prev,
            players: prev.players.filter((p: any) => p.id !== eventData.playerId),
            playerCount: Math.max(0, prev.playerCount - 1)
          };
        }
        return prev;
      });
    });

    lobbyChannel.bind('player-ready-changed', (eventData: any) => {
      console.log('Player ready status changed:', eventData);
      setCurrentLobby((prev: any) => {
        if (prev && prev.id === eventData.lobby.id) {
          return eventData.lobby;
        }
        return prev;
      });
    });

    lobbyChannel.bind('battle-started', (eventData: any) => {
      console.log('Battle started in lobby:', eventData);
      setBattle(eventData.battle);
      setGameState('battle');
    });

    lobbyChannel.bind('lobby-closed', (eventData: any) => {
      console.log('Lobby was closed:', eventData);
      setCurrentLobby(null);
      setGameState('setup');
      setError(eventData.message || 'Lobby was closed');
    });
  };

  const createLobby = async () => {
    if (!hostName.trim()) {
      setError('Please enter a host name');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/multiplayer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create-lobby',
          hostName: hostName.trim(),
          settings
        })
      });

      const data = await response.json();
      
      if (response.ok && data.lobby) {
        setCurrentLobby(data.lobby);
        setGameState('lobby');
        
        // Subscribe to lobby-specific events
        subscribeToLobbyEvents(data.lobby.id);
        
        await loadActiveGames(); // Refresh the lobby list
      } else {
        setError(data.error || 'Failed to create lobby');
      }
    } catch (error) {
      setError('Network error while creating lobby');
      console.error('Create lobby error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Simple test function to verify button clicks work
  const testButtonClick = () => {
    console.log('🧪 TEST BUTTON CLICKED - Button functionality is working!');
    alert('Button click test successful!');
  };

  const joinLobby = async (lobbyId: string) => {
    console.log('🚀 JOIN LOBBY FUNCTION CALLED!', { lobbyId, userName: session?.user?.name });
    
    if (!session?.user?.name) {
      setError('Please log in to join lobbies');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/multiplayer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'join-lobby',
          lobbyId,
          playerName: session.user.name
        })
      });

      const data = await response.json();
      
      console.log('Join lobby response:', data);
      
      if (response.ok && data.lobby) {
        console.log('=== JOIN LOBBY SUCCESS ===');
        console.log('API Response data:', data);
        console.log('About to set currentLobby to:', data.lobby);
        console.log('About to set gameState to: lobby');
        console.log('Current gameState before update:', gameState);
        console.log('Current currentLobby before update:', currentLobby);
        
        setCurrentLobby(data.lobby);
        setGameState('lobby');
        
        // Check state after setting (with a small delay to account for React's async updates)
        setTimeout(() => {
          console.log('=== STATE CHECK AFTER UPDATE ===');
          console.log('gameState after update should be lobby, is:', gameState);
          console.log('currentLobby after update:', currentLobby);
        }, 100);
        
        // Subscribe to lobby-specific events
        subscribeToLobbyEvents(data.lobby.id);
        
        if (data.rejoined) {
          console.log('Successfully rejoined lobby');
        } else {
          console.log('Successfully joined new lobby');
        }
        
        await loadActiveGames();
      } else {
        console.error('Join lobby failed:', data);
        setError(data.error || 'Failed to join lobby');
      }
    } catch (error) {
      console.error('=== JOIN LOBBY ERROR ===');
      console.error('Error during join lobby:', error);
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      setError('Network error while joining lobby');
      console.error('Join lobby error:', error);
    } finally {
      console.log('=== JOIN LOBBY FINALLY ===');
      console.log('Setting loading to false');
      setLoading(false);
    }
  };

  const startBattle = async () => {
    if (!currentLobby) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/multiplayer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'start-battle',
          lobbyId: currentLobby.id,
          gameState: {
            turn: 1,
            playerTurn: currentLobby.hostName,
            player1: {
              name: currentLobby.hostName,
              units: settings.maxUnits,
              cities: settings.cityMode === 'NATION_CITIES' ? 10 : 20,
              resources: settings.economyType === 'UNLIMITED' ? 
                { money: 1000000, steel: 50000, aluminum: 30000 } :
                { money: 100000, steel: 5000, aluminum: 3000 }
            },
            player2: {
              name: 'Player2', // This would be the actual second player's name
              units: settings.maxUnits,
              cities: settings.cityMode === 'NATION_CITIES' ? 10 : 20,
              resources: settings.economyType === 'UNLIMITED' ? 
                { money: 1000000, steel: 50000, aluminum: 30000 } :
                { money: 100000, steel: 5000, aluminum: 3000 }
            }
          }
        })
      });

      const data = await response.json();
      
      if (response.ok && data.battle) {
        setBattle(data.battle);
        setGameState('battle');
        await loadActiveGames();
      } else {
        setError(data.error || 'Failed to start battle');
      }
    } catch (error) {
      setError('Network error while starting battle');
      console.error('Start battle error:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleReady = async () => {
    if (!currentLobby) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/multiplayer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'toggle-ready',
          lobbyId: currentLobby.id
        })
      });

      const data = await response.json();
      
      if (response.ok && data.lobby) {
        setCurrentLobby(data.lobby);
        console.log(`Ready status toggled to: ${data.isReady}`);
      } else {
        setError(data.error || 'Failed to toggle ready status');
      }
    } catch (error) {
      setError('Network error while toggling ready status');
      console.error('Toggle ready error:', error);
    } finally {
      setLoading(false);
    }
  };

  const joinAsSpectator = async (battleId: string) => {
    // Spectator functionality would be implemented here
    console.log('Joining as spectator for battle:', battleId);
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Authentication Required</h1>
          <p className="text-gray-300 mb-6">Please log in to access multiplayer battles</p>
          <button 
            onClick={() => window.location.href = '/'}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Debug Panel */}
        <div className="bg-purple-800 rounded p-2 mb-4 text-sm">
          <p>Debug State - GameState: {gameState} | Has Lobby: {!!currentLobby} | Session: {session?.user?.name}</p>
          {currentLobby && <p>Current Lobby: ID={currentLobby.id}, Players={currentLobby.playerCount}</p>}
          <p>Session Status: {session ? 'Authenticated' : 'Not authenticated'} | Loading: {loading}</p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-600 text-white p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        <div className="flex gap-6">
          {/* Main Content */}
          <div className="flex-1">
            {gameState === 'setup' && (
              <div>
                <h1 className="text-3xl font-bold mb-8">Create Multiplayer Battle</h1>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Create New Lobby */}
              <div className="bg-gray-800 rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Create New Lobby</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Host Name</label>
                    <input
                      type="text"
                      value={hostName}
                      onChange={(e) => setHostName(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                      placeholder="Enter your name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Turn Timer (seconds)</label>
                    <select
                      value={settings.turnTimer}
                      onChange={(e) => setSettings(prev => ({ ...prev, turnTimer: Number(e.target.value) }))}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                    >
                      <option value={30}>30 seconds</option>
                      <option value={60}>1 minute</option>
                      <option value={120}>2 minutes</option>
                      <option value={300}>5 minutes</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Unit Buy Frequency</label>
                    <select
                      value={settings.unitBuyFrequency}
                      onChange={(e) => setSettings(prev => ({ ...prev, unitBuyFrequency: Number(e.target.value) }))}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                    >
                      <option value={1}>Every turn</option>
                      <option value={2}>Every 2 turns</option>
                      <option value={3}>Every 3 turns</option>
                      <option value={4}>Every 4 turns</option>
                      <option value={5}>Every 5 turns</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">City Mode</label>
                    <select
                      value={settings.cityMode}
                      onChange={(e) => setSettings(prev => ({ ...prev, cityMode: e.target.value as any }))}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                    >
                      <option value="NATION_CITIES">Nation Cities</option>
                      <option value="MAX_MILITARIZATION">Max Militarization</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Economy Type</label>
                    <select
                      value={settings.economyType}
                      onChange={(e) => setSettings(prev => ({ ...prev, economyType: e.target.value as any }))}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                    >
                      <option value="UNLIMITED">Unlimited Resources</option>
                      <option value="LIMITED">Limited Resources</option>
                    </select>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium mb-2">Starting Units</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-gray-300 mb-1">Infantry</label>
                        <input
                          type="number"
                          value={settings.maxUnits.infantry}
                          onChange={(e) => setSettings(prev => ({ 
                            ...prev, 
                            maxUnits: { ...prev.maxUnits, infantry: Number(e.target.value) }
                          }))}
                          className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-300 mb-1">Tanks</label>
                        <input
                          type="number"
                          value={settings.maxUnits.tanks}
                          onChange={(e) => setSettings(prev => ({ 
                            ...prev, 
                            maxUnits: { ...prev.maxUnits, tanks: Number(e.target.value) }
                          }))}
                          className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-300 mb-1">Aircraft</label>
                        <input
                          type="number"
                          value={settings.maxUnits.aircraft}
                          onChange={(e) => setSettings(prev => ({ 
                            ...prev, 
                            maxUnits: { ...prev.maxUnits, aircraft: Number(e.target.value) }
                          }))}
                          className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-300 mb-1">Ships</label>
                        <input
                          type="number"
                          value={settings.maxUnits.ships}
                          onChange={(e) => setSettings(prev => ({ 
                            ...prev, 
                            maxUnits: { ...prev.maxUnits, ships: Number(e.target.value) }
                          }))}
                          className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={createLobby}
                    disabled={loading}
                    className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white px-6 py-3 rounded-lg font-semibold"
                  >
                    {loading ? 'Creating...' : 'Create Lobby'}
                  </button>
                </div>
              </div>

              {/* Join Existing Games */}
              <div className="bg-gray-800 rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Join Existing Games</h2>
                
                {/* Waiting Lobbies */}
                <div className="mb-6">
                  <h3 className="text-lg font-medium mb-3">Open Lobbies ({lobbies.length})</h3>
                  
                  {/* Debug Test Button */}
                  <div className="mb-4 p-2 bg-red-800 rounded">
                    <button 
                      onClick={testButtonClick}
                      className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm"
                    >
                      Test Button Click (Debug)
                    </button>
                  </div>
                  
                  {lobbies.length === 0 ? (
                    <p className="text-gray-400">No open lobbies available</p>
                  ) : (
                    <div className="space-y-2">
                      {lobbies.map((lobby) => (
                        <div key={lobby.id} className="bg-gray-700 rounded p-3">
                          <div className="flex justify-between items-center">
                            <div>
                              <h4 className="font-medium">{lobby.hostName}&apos;s Game</h4>
                              <p className="text-sm text-gray-300">
                                Players: {lobby.playerCount}/{settings.maxPlayers} | 
                                Created: {new Date(lobby.createdAt).toLocaleTimeString()}
                              </p>
                            </div>
                            <button
                              onClick={() => {
                                console.log('🔘 JOIN BUTTON CLICKED!', { lobbyId: lobby.id, loading, disabled: loading || lobby.playerCount >= settings.maxPlayers });
                                joinLobby(lobby.id);
                              }}
                              disabled={loading || lobby.playerCount >= settings.maxPlayers}
                              className="bg-green-600 hover:bg-green-700 disabled:opacity-50 px-4 py-2 rounded text-sm"
                            >
                              Join
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Active Battles for Spectating */}
                <div>
                  <h3 className="text-lg font-medium mb-3">Active Battles ({battles.length})</h3>
                  {battles.length === 0 ? (
                    <p className="text-gray-400">No active battles to spectate</p>
                  ) : (
                    <div className="space-y-2">
                      {battles.map((battle) => (
                        <div key={battle.id} className="bg-gray-700 rounded p-3">
                          <div className="flex justify-between items-center">
                            <div>
                              <h4 className="font-medium">Battle #{battle.id.slice(-8)}</h4>
                              <p className="text-sm text-gray-300">
                                Players: {battle.playerCount} | 
                                Spectators: {battle.spectatorCount} |
                                Started: {new Date(battle.startedAt).toLocaleTimeString()}
                              </p>
                            </div>
                            <button
                              onClick={() => window.location.href = `/battle/real?spectate=${battle.id}`}
                              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-sm"
                            >
                              Spectate
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {gameState === 'lobby' && currentLobby && (
          <div>
            <h1 className="text-3xl font-bold mb-8">Lobby: {currentLobby.hostName}&apos;s Game</h1>
            {/* Debug info */}
            <div className="bg-blue-800 rounded p-2 mb-4 text-sm">
              <p>Debug - GameState: {gameState} | Lobby ID: {currentLobby.id} | Player Count: {currentLobby.playerCount}</p>
              <p>Debug - Players: {JSON.stringify(currentLobby.players?.map((p: any) => ({ name: p.name, isHost: p.isHost, isReady: p.isReady })))}</p>
            </div>
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">Players ({currentLobby.playerCount}/{settings.maxPlayers})</h3>
                <div className="space-y-2">
                  {currentLobby.players?.map((player: any) => (
                    <div key={player.id} className="bg-gray-700 rounded p-4 flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="font-medium">{player.name}</span>
                        {player.isHost && (
                          <span className="bg-yellow-600 text-xs px-2 py-1 rounded">HOST</span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        {player.isReady ? (
                          <span className="bg-green-600 text-xs px-2 py-1 rounded flex items-center">
                            ✓ Ready
                          </span>
                        ) : (
                          <span className="bg-red-600 text-xs px-2 py-1 rounded">
                            Not Ready
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                  {currentLobby.playerCount < settings.maxPlayers && (
                    <div className="bg-gray-700 rounded p-4 text-yellow-300">
                      Waiting for more players...
                    </div>
                  )}
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">Game Settings</h3>
                <div className="bg-gray-700 rounded p-4 text-sm">
                  <p>Turn Timer: {settings.turnTimer}s</p>
                  <p>Unit Buy Frequency: Every {settings.unitBuyFrequency} turn(s)</p>
                  <p>City Mode: {settings.cityMode}</p>
                  <p>Economy: {settings.economyType}</p>
                </div>
              </div>

              {/* Ready Toggle for Current Player */}
              <div className="mb-6">
                <button
                  onClick={toggleReady}
                  disabled={loading}
                  className={`px-6 py-3 rounded-lg font-semibold ${
                    currentLobby.players?.find((p: any) => p.name === session?.user?.name)?.isReady
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-green-600 hover:bg-green-700'
                  } disabled:opacity-50`}
                >
                  {loading ? 'Updating...' : 
                   currentLobby.players?.find((p: any) => p.name === session?.user?.name)?.isReady
                     ? 'Cancel Ready'
                     : 'Ready Up!'
                  }
                </button>
              </div>

              <div className="flex gap-4">
                {/* Only host can start battle and only when all players are ready */}
                {currentLobby.players?.find((p: any) => p.name === session?.user?.name)?.isHost && (
                  <button
                    onClick={startBattle}
                    disabled={loading || currentLobby.playerCount < 2 || !currentLobby.players?.every((p: any) => p.isReady)}
                    className="bg-green-600 hover:bg-green-700 disabled:opacity-50 px-6 py-3 rounded-lg font-semibold"
                  >
                    {loading ? 'Starting...' : 'Start Battle'}
                  </button>
                )}
                <button
                  onClick={() => setGameState('setup')}
                  className="bg-gray-600 hover:bg-gray-700 px-6 py-3 rounded-lg font-semibold"
                >
                  Leave Lobby
                </button>
              </div>

              {/* Status Messages */}
              {currentLobby.playerCount < 2 && (
                <p className="text-yellow-300 mt-4">Need at least 2 players to start the battle</p>
              )}
              {currentLobby.playerCount >= 2 && !currentLobby.players?.every((p: any) => p.isReady) && (
                <p className="text-yellow-300 mt-4">
                  Waiting for all players to ready up: {currentLobby.players?.filter((p: any) => !p.isReady).map((p: any) => p.name).join(', ')}
                </p>
              )}
              {currentLobby.playerCount >= 2 && currentLobby.players?.every((p: any) => p.isReady) && (
                <p className="text-green-300 mt-4">✓ All players ready! Host can start the battle.</p>
              )}
            </div>
          </div>
        )}

        {gameState === 'battle' && currentBattle && (
          <div>
            <h1 className="text-3xl font-bold mb-8">Battle in Progress</h1>
            <div className="bg-gray-800 rounded-lg p-6">
              <p className="text-green-400 text-xl mb-4">Battle Started Successfully!</p>
              <p className="text-gray-300 mb-4">Battle ID: {currentBattle.id}</p>
              <p className="text-gray-300 mb-6">The battle interface would be loaded here with real-time updates.</p>
              
              <button
                onClick={() => setGameState('setup')}
                className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-semibold"
              >
                Back to Lobby List
              </button>
            </div>
          </div>
        )}

        {gameState === 'spectating' && (
          <div>
            <h1 className="text-3xl font-bold mb-8">Spectating Battle</h1>
            <div className="bg-gray-800 rounded-lg p-6">
              <p className="text-blue-400 text-xl mb-4">Spectator Mode</p>
              <p className="text-gray-300 mb-6">Live battle view would be displayed here.</p>
              
              <button
                onClick={() => setGameState('setup')}
                className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-semibold"
              >
                Back to Lobby List
              </button>
            </div>
          </div>
        )}
        </div>

        {/* Online Users Sidebar */}
        <div className="w-80 bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <span className="w-3 h-3 bg-green-500 rounded-full mr-2 animate-pulse"></span>
            Online Users ({onlineUsers.length})
          </h2>
          
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {onlineUsers.length === 0 ? (
              <p className="text-gray-400 text-sm">No users online</p>
            ) : (
              onlineUsers.map((user) => (
                <div key={user.id} className="flex items-center space-x-3 p-2 bg-gray-700 rounded-lg">
                  {user.avatar ? (
                    <img 
                      src={`https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`}
                      alt={user.username}
                      className="w-8 h-8 rounded-full"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                      <span className="text-xs font-semibold">{user.username.charAt(0).toUpperCase()}</span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{user.username}</p>
                    <p className="text-xs text-gray-400">
                      Last seen: {new Date(user.lastSeen).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}

export default function RealBattlePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading multiplayer interface...</p>
        </div>
      </div>
    }>
      <RealBattleContent />
    </Suspense>
  );
}
