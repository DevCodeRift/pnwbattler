'use client';

import React, { useState, useEffect } from 'react';

interface MultiplayerBattleInterfaceProps {
  battle: any;
  lobby: any;
  onBattleAction: (action: any) => void;
}

export default function MultiplayerBattleInterface({ battle, lobby, onBattleAction }: MultiplayerBattleInterfaceProps) {
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
      await onBattleAction({
        type: actionType,
        battleId: battle.id,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error('Battle action failed:', error);
    } finally {
      setLoading(false);
    }
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
          {lobby?.players?.map((player: any, index: number) => (
            <div key={player.id} className="bg-gray-700 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold text-blue-400">{player.name}</h3>
                  {player.isHost && (
                    <span className="text-xs bg-yellow-600 text-black px-2 py-1 rounded">HOST</span>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-300">Player {index + 1}</div>
                  <div className="text-xs text-green-400">✓ Ready</div>
                </div>
              </div>
              
              {/* Player stats would go here */}
              <div className="mt-3 text-sm text-gray-400">
                <div>Nation: Loading...</div>
                <div>Military Strength: Loading...</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Battle Actions */}
      <div className="bg-gray-800 rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-bold text-white mb-4">Battle Actions</h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            onClick={() => handleAction('ground_attack')}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-4 py-3 rounded-lg font-medium transition-colors"
          >
            Ground Attack
          </button>
          
          <button
            onClick={() => handleAction('air_attack')}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-3 rounded-lg font-medium transition-colors"
          >
            Air Attack
          </button>
          
          <button
            onClick={() => handleAction('naval_attack')}
            disabled={loading}
            className="bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white px-4 py-3 rounded-lg font-medium transition-colors"
          >
            Naval Attack
          </button>
          
          <button
            onClick={() => handleAction('recruit_units')}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-4 py-3 rounded-lg font-medium transition-colors"
          >
            Recruit Units
          </button>
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
            <div className="text-blue-400">
              [{new Date().toLocaleTimeString()}] Waiting for player actions...
            </div>
            {/* Battle events would be displayed here */}
          </div>
        </div>
      </div>

      {/* Current Turn Info */}
      <div className="bg-gray-800 rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-bold text-white mb-4">Turn Information</h2>
        
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-gray-700 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-yellow-400 mb-2">Current Turn</h3>
            <div className="text-2xl font-bold text-white">1</div>
            <div className="text-sm text-gray-400">Turn timer: 60s</div>
          </div>
          
          <div className="bg-gray-700 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-yellow-400 mb-2">Your Status</h3>
            <div className="text-lg text-green-400">Ready to Act</div>
            <div className="text-sm text-gray-400">Waiting for your move</div>
          </div>
        </div>
      </div>
    </div>
  );
}
