'use client';

import React, { useState, useEffect } from 'react';

interface MultiplayerBattleInterfaceProps {
  battle: any;
  lobby: any;
  session?: any;
  onBattleAction: (action: any) => void;
}

export default function MultiplayerBattleInterface({ battle, lobby, session, onBattleAction }: MultiplayerBattleInterfaceProps) {
  const [loading, setLoading] = useState(false);
  const [selectedAction, setSelectedAction] = useState('');
  const [battleState, setBattleState] = useState(null);

  useEffect(() => {
    if (battle) {
      console.log('MultiplayerBattleInterface: Battle data received:', battle);
      setLoading(false);
    }
  }, [battle]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-gray-800 rounded-lg p-6 text-center">
          <div className="animate-pulse">
            <div className="text-lg text-white mb-4">Loading battle interface...</div>
            <div className="text-gray-400">Please wait while we set up your battle</div>
          </div>
        </div>
      </div>
    );
  }

  if (!battle) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-gray-800 rounded-lg p-6 text-center">
          <div className="text-lg text-red-400 mb-4">No Battle Data</div>
          <div className="text-gray-400">Battle data not available</div>
        </div>
      </div>
    );
  }

  const handleAction = async (actionType: string) => {
    setLoading(true);
    try {
      let actionData: any = {};
      
      // Create proper action structure based on type
      switch (actionType) {
        case 'ground_attack':
          actionData = {
            action: 'attack',
            details: {
              type: 'ground',
              target: getOpponentId(), // Get the opponent's ID
              unitsUsed: {
                soldiers: Math.min(1000, getCurrentPlayerMilitary()?.soldiers || 0),
                tanks: Math.min(100, getCurrentPlayerMilitary()?.tanks || 0)
              },
              useMunitions: true
            }
          };
          break;
        case 'air_attack':
          actionData = {
            action: 'attack',
            details: {
              type: 'air',
              target: getOpponentId(),
              unitsUsed: {
                aircraft: Math.min(10, getCurrentPlayerMilitary()?.aircraft || 0)
              },
              airstrikeTarget: 'aircraft' // Default to targeting aircraft
            }
          };
          break;
        case 'naval_attack':
          actionData = {
            action: 'attack',
            details: {
              type: 'naval',
              target: getOpponentId(),
              unitsUsed: {
                ships: Math.min(5, getCurrentPlayerMilitary()?.ships || 0)
              }
            }
          };
          break;
        case 'recruit_units':
          actionData = {
            action: 'recruit',
            details: {
              units: {
                soldiers: 500,
                tanks: 50,
                aircraft: 5,
                ships: 1
              }
            }
          };
          break;
        default:
          actionData = {
            action: actionType,
            details: {}
          };
      }

      await onBattleAction({
        ...actionData,
        battleId: battle.id,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error('Battle action failed:', error);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get opponent ID
  const getOpponentId = () => {
    // For now, just get the first player that's not the current user
    return lobby?.players?.find((p: any) => p.name !== getCurrentPlayerName())?.id || 'opponent';
  };

  // Helper function to get current player name (you'll need to pass this from session)
  const getCurrentPlayerName = () => {
    return session?.user?.name || 'Current Player';
  };

  // Helper function to get current player ID
  const getCurrentPlayerId = () => {
    const currentPlayerName = getCurrentPlayerName();
    return lobby?.players?.find((p: any) => p.name === currentPlayerName)?.id || 'unknown';
  };

  // Helper function to get current player's military stats
  const getCurrentPlayerMilitary = () => {
    const playerId = getCurrentPlayerId();
    const playerData = battle?.gameState?.players?.[playerId];
    return playerData?.military || {
      soldiers: 5000,
      tanks: 500,
      aircraft: 50,
      ships: 10
    }; // Fallback values
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Battle Header */}
      <div className="bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">Multiplayer Battle</h1>
          <div className="text-right">
            <div className="text-lg font-semibold text-green-400">Battle In Progress</div>
            <div className="text-sm text-gray-400">Battle ID: {battle.id}</div>
          </div>
        </div>
        
        <div className="mt-4 p-4 bg-gray-700 rounded-lg">
          <h3 className="text-lg font-semibold text-white mb-2">Battle Information</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-gray-300">Players: {battle.playerCount}</div>
              <div className="text-gray-300">Spectators: {battle.spectatorCount}</div>
            </div>
            <div>
              <div className="text-gray-300">Status: {battle.status}</div>
              <div className="text-gray-300">Started: {new Date(battle.startedAt).toLocaleTimeString()}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Players Overview */}
      <div className="bg-gray-800 rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-bold text-white mb-4">Battle Participants</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {lobby?.players?.map((player: any, index: number) => {
            const playerData = battle?.gameState?.players?.[player.id];
            const isCurrentPlayer = player.name === getCurrentPlayerName();
            
            return (
              <div key={player.id} className={`rounded-lg p-4 ${isCurrentPlayer ? 'bg-blue-700' : 'bg-gray-700'}`}>
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className={`text-lg font-semibold ${isCurrentPlayer ? 'text-blue-200' : 'text-blue-400'}`}>
                      {player.name} {isCurrentPlayer && '(You)'}
                    </h3>
                    {player.isHost && (
                      <span className="text-xs bg-yellow-600 text-black px-2 py-1 rounded">HOST</span>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-300">Player {index + 1}</div>
                    <div className="text-xs text-green-400">✓ Ready</div>
                  </div>
                </div>
                
                {/* Player stats */}
                <div className="mt-3 text-sm">
                  {playerData ? (
                    <div className="space-y-1">
                      <div className="text-gray-300">
                        <span className="text-red-400">❤️ Resistance:</span> {playerData.resistance}/100
                      </div>
                      <div className="text-gray-300">
                        <span className="text-blue-400">⚡ MAPs:</span> {playerData.maps}/12
                      </div>
                      <div className="text-gray-300">
                        <span className="text-green-400">👥 Soldiers:</span> {playerData.military?.soldiers?.toLocaleString() || 0}
                      </div>
                      <div className="text-gray-300">
                        <span className="text-yellow-400">🚗 Tanks:</span> {playerData.military?.tanks?.toLocaleString() || 0}
                      </div>
                      <div className="text-gray-300">
                        <span className="text-cyan-400">✈️ Aircraft:</span> {playerData.military?.aircraft?.toLocaleString() || 0}
                      </div>
                      <div className="text-gray-300">
                        <span className="text-purple-400">🚢 Ships:</span> {playerData.military?.ships?.toLocaleString() || 0}
                      </div>
                      <div className="text-gray-400 text-xs mt-2">
                        💰 ${playerData.resources?.money?.toLocaleString() || 0}
                      </div>
                    </div>
                  ) : (
                    <div className="text-gray-400">
                      <div>Nation: Loading...</div>
                      <div>Military Strength: Loading...</div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Battle Actions */}
      <div className="bg-gray-800 rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-bold text-white mb-4">Battle Actions</h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            onClick={() => handleAction('ground_attack')}
            disabled={loading || (battle?.gameState?.players?.[getCurrentPlayerId()]?.maps || 0) < 3}
            className="bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-3 rounded-lg font-medium transition-colors"
          >
            <div>Ground Attack</div>
            <div className="text-xs opacity-75">3 MAPs</div>
          </button>
          
          <button
            onClick={() => handleAction('air_attack')}
            disabled={loading || (battle?.gameState?.players?.[getCurrentPlayerId()]?.maps || 0) < 4}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-3 rounded-lg font-medium transition-colors"
          >
            <div>Air Attack</div>
            <div className="text-xs opacity-75">4 MAPs</div>
          </button>
          
          <button
            onClick={() => handleAction('naval_attack')}
            disabled={loading || (battle?.gameState?.players?.[getCurrentPlayerId()]?.maps || 0) < 4}
            className="bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-3 rounded-lg font-medium transition-colors"
          >
            <div>Naval Attack</div>
            <div className="text-xs opacity-75">4 MAPs</div>
          </button>
          
          <button
            onClick={() => handleAction('recruit_units')}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-4 py-3 rounded-lg font-medium transition-colors"
          >
            <div>Recruit Units</div>
            <div className="text-xs opacity-75">Build Army</div>
          </button>
        </div>

        {/* Current Player Status */}
        <div className="mt-4 p-3 bg-gray-700 rounded-lg">
          <div className="text-sm text-gray-300">
            <span className="text-white font-semibold">Your Status:</span> 
            MAPs: <span className="text-blue-400">{battle?.gameState?.players?.[getCurrentPlayerId()]?.maps || 0}/12</span>
            {' | '}
            Money: <span className="text-green-400">${battle?.gameState?.players?.[getCurrentPlayerId()]?.resources?.money?.toLocaleString() || 0}</span>
          </div>
        </div>
      </div>

      {/* Battle Log */}
      <div className="bg-gray-800 rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-bold text-white mb-4">Battle Log</h2>
        
        <div className="bg-gray-900 rounded-lg p-4 h-64 overflow-y-auto">
          <div className="text-sm text-gray-300 space-y-2">
            <div className="text-green-400">
              [{new Date(battle.startedAt).toLocaleTimeString()}] Battle started with {battle.playerCount} players
            </div>
            
            {/* Display battle history from game state */}
            {battle?.gameState?.battleHistory?.map((entry: any, index: number) => (
              <div key={entry.id || index} className="text-blue-400">
                [{new Date(entry.timestamp).toLocaleTimeString()}] 
                <span className="text-white font-semibold"> {entry.playerName}</span>
                <span className="text-gray-300"> performed {entry.battleAction || entry.action}</span>
                {entry.result && (
                  <div className="ml-4 text-gray-400 text-xs">
                    Result: {entry.result.outcome || 'Success'} 
                    {entry.result.description && ` - ${entry.result.description}`}
                  </div>
                )}
              </div>
            ))}
            
            <div className="text-blue-400">
              [{new Date().toLocaleTimeString()}] Waiting for player actions...
            </div>
          </div>
        </div>
      </div>

      {/* Current Turn Info */}
      <div className="bg-gray-800 rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-bold text-white mb-4">Turn Information</h2>
        
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-gray-700 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-yellow-400 mb-2">Current Turn</h3>
            <div className="text-2xl font-bold text-white">{battle?.gameState?.turn || 1}</div>
            <div className="text-sm text-gray-400">Turn timer: 60s</div>
          </div>
          
          <div className="bg-gray-700 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-yellow-400 mb-2">Your Status</h3>
            <div className="text-lg text-green-400">Ready to Act</div>
            {battle?.gameState?.players && (
              <div className="text-sm text-gray-400">
                MAPs: {battle.gameState.players[getCurrentPlayerId()]?.maps || 0}/12
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
