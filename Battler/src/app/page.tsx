'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useAuthStore } from '../stores';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import vercelMultiplayerManager from '../lib/vercel-multiplayer-manager';

interface Lobby {
  id: string;
  hostName: string;
  playerCount: number;
  spectatorCount: number;
  status: 'WAITING' | 'IN_PROGRESS' | 'COMPLETED';
  settings: any;
  createdAt: string;
}

interface Battle {
  id: string;
  playerCount: number;
  spectatorCount: number;
  status: string;
  startedAt: string;
}

interface MyGame {
  id: string;
  hostName: string;
  playerCount: number;
  spectatorCount: number;
  status: 'WAITING' | 'IN_PROGRESS' | 'COMPLETED';
  settings: any;
  createdAt: string;
  battle?: {
    id: string;
    status: string;
    startedAt: string;
  };
  myRole: {
    isHost: boolean;
    isReady: boolean;
    name: string;
  };
}

export default function HomePage() {
  const { data: session } = useSession();
  const { pwNation, isVerified } = useAuthStore();
  const router = useRouter();
  const [activeLobbies, setActiveLobbies] = useState<Lobby[]>([]);

  // Redirect authenticated and verified users to dashboard
  useEffect(() => {
    if (session && isVerified && pwNation) {
      router.push('/dashboard');
    }
  }, [session, isVerified, pwNation, router]);

  // Add cleanup on component unmount
  useEffect(() => {
    return () => {
      console.log('HomePage: Cleaning up on unmount');
      // Disconnect multiplayer manager when leaving the page
      if (typeof window !== 'undefined') {
        vercelMultiplayerManager.disconnect();
      }
    };
  }, []);
  const [activeBattles, setActiveBattles] = useState<Battle[]>([]);
  const [myGames, setMyGames] = useState<MyGame[]>([]);
  const [onlineCount, setOnlineCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);

  const loadMyGames = useCallback(async () => {
    if (!session?.user) return;

    try {
      const response = await fetch('/api/multiplayer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get-my-games' })
      });
      
      const data = await response.json();
      if (data.myGames) {
        setMyGames(data.myGames);
      }
    } catch (error) {
      console.error('Failed to load my games:', error);
    }
  }, [session?.user]);

  useEffect(() => {
    // Prevent multiple initializations
    if (hasInitialized) return;
    
    console.log('HomePage: Initializing multiplayer connection');
    setHasInitialized(true);

    // Connect to multiplayer server with throttling
    const connectWithDelay = setTimeout(() => {
      vercelMultiplayerManager.connect();
    }, 500); // Add delay to prevent immediate connection

    // Load user's games if logged in
    if (session?.user) {
      const loadGamesTimeout = setTimeout(() => {
        loadMyGames();
      }, 1000); // Delay loading games
      
      return () => clearTimeout(loadGamesTimeout);
    }

    return () => {
      clearTimeout(connectWithDelay);
    };
  }, [session?.user, loadMyGames, hasInitialized]);

  useEffect(() => {
    // Set up event listeners only once
    const handleConnected = () => {
      console.log('HomePage: Connected to multiplayer');
      setIsConnected(true);
      
      // Throttle initial data loading
      setTimeout(() => {
        vercelMultiplayerManager.getActiveGames();
        if (session?.user) {
          loadMyGames();
        }
      }, 1000);
    };

    const handleDisconnected = () => {
      console.log('HomePage: Disconnected from multiplayer');
      setIsConnected(false);
    };

    const handleActiveGames = (data: { lobbies?: Lobby[]; battles?: Battle[] }) => {
      try {
        const lobbies = data?.lobbies || [];
        const battles = data?.battles || [];
        
        setActiveLobbies(lobbies);
        setActiveBattles(battles);
        setOnlineCount(
          lobbies.reduce((acc, lobby) => acc + lobby.playerCount + lobby.spectatorCount, 0) +
          battles.reduce((acc, battle) => acc + battle.playerCount + battle.spectatorCount, 0)
        );
      } catch (error) {
        console.error('Error handling active games:', error);
      }
    };

    const handleLobbyUpdated = (lobby: Lobby) => {
      try {
        setActiveLobbies(prev => {
          const index = prev.findIndex(l => l.id === lobby.id);
          if (index >= 0) {
            const newLobbies = [...prev];
            newLobbies[index] = lobby;
            return newLobbies;
          } else {
            return [...prev, lobby];
          }
        });
      } catch (error) {
        console.error('Error handling lobby update:', error);
      }
    };

    const handleLobbyCreated = (lobby: Lobby) => {
      try {
        setActiveLobbies(prev => [...prev, lobby]);
      } catch (error) {
        console.error('Error handling lobby created:', error);
      }
    };

    const handleLobbyClosed = ({ lobbyId }: { lobbyId: string }) => {
      try {
        setActiveLobbies(prev => prev.filter(l => l.id !== lobbyId));
      } catch (error) {
        console.error('Error handling lobby closed:', error);
      }
    };

    const handleBattleCreated = (battle: Battle) => {
      try {
        setActiveBattles(prev => [...prev, battle]);
      } catch (error) {
        console.error('Error handling battle created:', error);
      }
    };

    // Add event listeners
    vercelMultiplayerManager.on('connected', handleConnected);
    vercelMultiplayerManager.on('disconnected', handleDisconnected);
    vercelMultiplayerManager.on('active-games', handleActiveGames);
    vercelMultiplayerManager.on('lobby-updated', handleLobbyUpdated);
    vercelMultiplayerManager.on('lobby-created', handleLobbyCreated);
    vercelMultiplayerManager.on('lobby-closed', handleLobbyClosed);
    vercelMultiplayerManager.on('battle-created', handleBattleCreated);

    // Reduced frequency polling to prevent performance issues
    const interval = setInterval(() => {
      if (vercelMultiplayerManager.isConnected && isConnected) {
        vercelMultiplayerManager.getActiveGames();
      }
    }, 60000); // Increased from 45 seconds to 60 seconds

    // Cleanup function
    return () => {
      clearInterval(interval);
      vercelMultiplayerManager.off('connected', handleConnected);
      vercelMultiplayerManager.off('disconnected', handleDisconnected);
      vercelMultiplayerManager.off('active-games', handleActiveGames);
      vercelMultiplayerManager.off('lobby-updated', handleLobbyUpdated);
      vercelMultiplayerManager.off('lobby-created', handleLobbyCreated);
      vercelMultiplayerManager.off('lobby-closed', handleLobbyClosed);
      vercelMultiplayerManager.off('battle-created', handleBattleCreated);
    };
  }, [isConnected]); // Minimal dependencies

  // Separate effect for loading user's games
  useEffect(() => {
    if (session?.user?.name) {
      loadMyGames();
    }
  }, [session?.user?.name]);

  const joinLobby = async (lobbyId: string, asSpectator = false) => {
    if (!session?.user?.name) {
      alert('Please log in to join games');
      return;
    }
    
    console.log('🏠 Home page joining lobby:', { lobbyId, asSpectator });
    
    try {
      // Use the vercel multiplayer manager to join
      await vercelMultiplayerManager.joinLobby(lobbyId, session.user.name, asSpectator);
      
      // Redirect to the Real Nation Battle page where the lobby view will be shown
      console.log('🔄 Redirecting to /battle/real after joining lobby');
      window.location.href = '/battle/real';
    } catch (error) {
      console.error('Failed to join lobby from home page:', error);
      alert('Failed to join lobby. Please try again.');
    }
  };

  const joinBattle = (battleId: string) => {
    if (!session?.user?.name) {
      alert('Please log in to spectate battles');
      return;
    }
    // Navigate to battle page with spectator mode
    window.location.href = `/battle/real?spectate=${battleId}`;
  };

  const joinMyGame = (game: MyGame) => {
    if (!session?.user?.name) {
      alert('Please log in to join games');
      return;
    }
    
    if (game.status === 'IN_PROGRESS' && game.battle) {
      // Battle is in progress, go directly to battle
      console.log('🎮 Joining active battle:', game.battle.id);
      window.location.href = '/battle/real';
    } else {
      // Lobby is waiting, go to lobby
      console.log('🏛️ Rejoining lobby:', game.id);
      window.location.href = '/battle/real';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-800 to-purple-800 rounded-lg p-6 border border-gray-600">
        <h1 className="text-3xl font-bold text-white mb-2">
          Welcome to PW Battle Simulator
        </h1>
        <p className="text-blue-100">
          {session 
            ? `Welcome back, ${session.user?.name}! Ready for multiplayer battle?`
            : 'Login with Discord to start battling other Politics & War players!'
          }
        </p>
        <div className="mt-4 flex items-center space-x-4">
          <div className={`flex items-center text-sm ${isConnected ? 'text-green-300' : 'text-red-300'}`}>
            <div className={`w-2 h-2 rounded-full mr-2 ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
            {isConnected ? 'Connected to multiplayer' : 'Connecting...'}
          </div>
          <div className="text-blue-200 text-sm">
            {onlineCount} players online
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/battle/quick" className="bg-gray-700 rounded-lg p-4 border border-gray-600 hover:bg-gray-600 transition-colors cursor-pointer">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-2xl">⚔️</span>
            </div>
            <div>
              <h3 className="text-white font-semibold">Quick Battle</h3>
              <p className="text-gray-300 text-sm">Single player practice</p>
            </div>
          </div>
        </Link>

        <Link href="/battle/real" className="bg-gray-700 rounded-lg p-4 border border-gray-600 hover:bg-gray-600 transition-colors cursor-pointer">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🛠️</span>
            </div>
            <div>
              <h3 className="text-white font-semibold">Create Match</h3>
              <p className="text-gray-300 text-sm">Host multiplayer game</p>
            </div>
          </div>
        </Link>

        <div className="bg-gray-700 rounded-lg p-4 border border-gray-600 hover:bg-gray-600 transition-colors cursor-pointer">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🎯</span>
            </div>
            <div>
              <h3 className="text-white font-semibold">Join Match</h3>
              <p className="text-gray-300 text-sm">Find active lobbies below</p>
            </div>
          </div>
        </div>

        <Link href="/leaderboard" className="bg-gray-700 rounded-lg p-4 border border-gray-600 hover:bg-gray-600 transition-colors cursor-pointer">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-yellow-600 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🏆</span>
            </div>
            <div>
              <h3 className="text-white font-semibold">Leaderboard</h3>
              <p className="text-gray-300 text-sm">See rankings</p>
            </div>
          </div>
        </Link>
      </div>

      {/* My Active Games Section */}
      {session?.user && myGames.length > 0 && (
        <div className="bg-gradient-to-r from-green-800 to-blue-800 rounded-lg border border-gray-600">
          <div className="p-4 border-b border-gray-600">
            <h2 className="text-xl font-bold text-white flex items-center">
              <span className="mr-2">🎮</span>
              My Active Games ({myGames.length})
            </h2>
            <p className="text-green-100 text-sm mt-1">Jump back into your ongoing matches</p>
          </div>
          <div className="p-4">
            <div className="space-y-3">
              {myGames.map((game) => (
                <div key={game.id} className="bg-gray-700 rounded-lg p-4 flex items-center justify-between border border-gray-600">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${
                        game.status === 'IN_PROGRESS' 
                          ? game.battle ? 'bg-red-400' : 'bg-yellow-400'
                          : 'bg-green-400'
                      }`}></div>
                      <div>
                        <h3 className="text-white font-semibold">
                          {game.hostName}&apos;s Game
                          {game.myRole.isHost && <span className="ml-2 text-xs bg-yellow-600 text-black px-2 py-1 rounded">HOST</span>}
                        </h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-300">
                          <span>{game.playerCount}/2 players</span>
                          <span>•</span>
                          <span>
                            {game.status === 'IN_PROGRESS' && game.battle 
                              ? `Battle in progress`
                              : game.status === 'IN_PROGRESS'
                              ? `Setting up battle`
                              : `Waiting for players`
                            }
                          </span>
                          {!game.myRole.isReady && game.status === 'WAITING' && (
                            <>
                              <span>•</span>
                              <span className="text-yellow-400">Not ready</span>
                            </>
                          )}
                        </div>
                        <p className="text-gray-400 text-xs mt-1">
                          Created {new Date(game.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => joinMyGame(game)}
                      className={`px-4 py-2 rounded font-medium text-sm transition-colors ${
                        game.status === 'IN_PROGRESS' && game.battle
                          ? 'bg-red-600 hover:bg-red-700 text-white'
                          : 'bg-blue-600 hover:bg-blue-700 text-white'
                      }`}
                    >
                      {game.status === 'IN_PROGRESS' && game.battle
                        ? '⚔️ Enter Battle'
                        : '🏛️ Enter Lobby'
                      }
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - Active Games */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Lobbies */}
          <div className="bg-gray-700 rounded-lg border border-gray-600">
            <div className="p-4 border-b border-gray-600">
              <h2 className="text-lg font-semibold text-white flex items-center">
                <span className="mr-2">🏛️</span>
                Active Lobbies ({activeLobbies.length})
              </h2>
            </div>
            <div className="p-4">
              {activeLobbies.length === 0 ? (
                <div className="text-center text-gray-400 py-8">
                  <span className="text-4xl mb-4 block">🎮</span>
                  <p className="text-lg mb-2">No active lobbies</p>
                  <p className="text-sm">Create a new game to get started!</p>
                  <Link href="/battle/real" className="mt-4 inline-block bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded transition-colors">
                    Create Lobby
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {activeLobbies.map((lobby) => (
                    <div key={lobby.id} className="bg-gray-600 rounded-lg p-4 flex items-center justify-between">
                      <div>
                        <h3 className="text-white font-semibold">{lobby.hostName}&apos;s Game</h3>
                        <p className="text-gray-300 text-sm">
                          {lobby.playerCount}/2 players • {lobby.spectatorCount} spectators
                        </p>
                        <p className="text-gray-400 text-xs">
                          Created {new Date(lobby.createdAt).toLocaleTimeString()}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => joinLobby(lobby.id, false)}
                          disabled={lobby.playerCount >= 2}
                          className={`px-3 py-1 rounded text-sm ${
                            lobby.playerCount >= 2
                              ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
                              : 'bg-green-600 hover:bg-green-700 text-white'
                          }`}
                        >
                          {lobby.playerCount >= 2 ? 'Full' : 'Join'}
                        </button>
                        <button
                          onClick={() => joinLobby(lobby.id, true)}
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
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

          {/* Active Battles */}
          <div className="bg-gray-700 rounded-lg border border-gray-600">
            <div className="p-4 border-b border-gray-600">
              <h2 className="text-lg font-semibold text-white flex items-center">
                <span className="mr-2">⚔️</span>
                Active Battles ({activeBattles.length})
              </h2>
            </div>
            <div className="p-4">
              {activeBattles.length === 0 ? (
                <div className="text-center text-gray-400 py-8">
                  <span className="text-4xl mb-4 block">⚔️</span>
                  <p className="text-lg mb-2">No battles in progress</p>
                  <p className="text-sm">Battles will appear here when players start fighting</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {activeBattles.map((battle) => (
                    <div key={battle.id} className="bg-gray-600 rounded-lg p-4 flex items-center justify-between">
                      <div>
                        <h3 className="text-white font-semibold">Battle #{battle.id.slice(-6)}</h3>
                        <p className="text-gray-300 text-sm">
                          {battle.playerCount} players • {battle.spectatorCount} spectators watching
                        </p>
                        <p className="text-gray-400 text-xs">
                          Started {new Date(battle.startedAt).toLocaleTimeString()}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => joinBattle(battle.id)}
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
                        >
                          Watch Live
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Stats & Info */}
        <div className="space-y-6">
          {/* Account Status */}
          {session && (
            <div className="bg-gray-700 rounded-lg border border-gray-600">
              <div className="p-4 border-b border-gray-600">
                <h2 className="text-lg font-semibold text-white flex items-center">
                  <span className="mr-2">👤</span>
                  Account Status
                </h2>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Discord Account:</span>
                  <span className="text-green-400 flex items-center">
                    <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
                    Connected
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">P&W Verification:</span>
                  <span className={`flex items-center ${isVerified ? 'text-green-400' : 'text-yellow-400'}`}>
                    <span className={`w-2 h-2 rounded-full mr-2 ${isVerified ? 'bg-green-400' : 'bg-yellow-400'}`}></span>
                    {isVerified ? 'Verified' : 'Pending'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Nation Linked:</span>
                  <span className={`flex items-center ${pwNation ? 'text-green-400' : 'text-red-400'}`}>
                    <span className={`w-2 h-2 rounded-full mr-2 ${pwNation ? 'bg-green-400' : 'bg-red-400'}`}></span>
                    {pwNation ? pwNation.nation_name : 'Not Linked'}
                  </span>
                </div>
                
                {!isVerified && (
                  <div className="mt-4 p-3 bg-yellow-900/30 border border-yellow-600/30 rounded">
                    <p className="text-yellow-200 text-sm">
                      <span className="font-semibold">Action Required:</span> Verify your Politics & War account to access all features.
                    </p>
                    <Link 
                      href="/verify"
                      className="mt-2 inline-block text-yellow-400 hover:text-yellow-300 text-sm font-medium transition-colors"
                    >
                      Verify Now →
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Multiplayer Status */}
          <div className="bg-gray-700 rounded-lg border border-gray-600">
            <div className="p-4 border-b border-gray-600">
              <h3 className="text-lg font-semibold text-white">Multiplayer Status</h3>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-300">Server Status:</span>
                <span className={`flex items-center ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
                  <span className={`w-2 h-2 rounded-full mr-2 ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></span>
                  {isConnected ? 'Online' : 'Offline'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Players Online:</span>
                <span className="text-white font-semibold">{onlineCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Active Lobbies:</span>
                <span className="text-white font-semibold">{activeLobbies.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Active Battles:</span>
                <span className="text-white font-semibold">{activeBattles.length}</span>
              </div>
            </div>
          </div>

          {/* Quick Tips */}
          <div className="bg-gray-700 rounded-lg border border-gray-600">
            <div className="p-4 border-b border-gray-600">
              <h3 className="text-lg font-semibold text-white">Multiplayer Tips</h3>
            </div>
            <div className="p-4">
              <div className="space-y-3 text-sm">
                <div className="flex items-start space-x-2">
                  <span className="text-blue-400 mt-1">🎮</span>
                  <p className="text-gray-300">
                    Create a lobby to host your own multiplayer battle
                  </p>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="text-blue-400 mt-1">👥</span>
                  <p className="text-gray-300">
                    Join as a spectator to watch battles without participating
                  </p>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="text-blue-400 mt-1">⏰</span>
                  <p className="text-gray-300">
                    Configure turn timers and resource settings when creating games
                  </p>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="text-blue-400 mt-1">💾</span>
                  <p className="text-gray-300">
                    Games auto-save progress so you can resume later
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Server Status Footer */}
      <div className="bg-gray-700 rounded-lg border border-gray-600 p-4">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <div className={`w-2 h-2 rounded-full mr-2 ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
              <span className="text-gray-300">Multiplayer Server: {isConnected ? 'Online' : 'Offline'}</span>
            </div>
            <div className="text-gray-400">
              Last Update: Just now
            </div>
          </div>
          <div className="text-gray-400">
            Version 2.0.0 | <a href="#" className="text-blue-400 hover:text-blue-300">Report Issues</a>
          </div>
        </div>
      </div>
    </div>
  );
}
