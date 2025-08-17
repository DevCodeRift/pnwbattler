'use client';

import React, { useState, useEffect } from 'react';
import BattleSetup from '@/components/BattleSetup';
import BattleInterface from '@/components/BattleInterface';
import { BattleSession } from '@/types/simulation';

export default function CreateBattlePage() {
  const [currentSession, setCurrentSession] = useState<BattleSession | null>(null);
  const [sessionId, setSessionId] = useState<string>('');
  const [currentNationId, setCurrentNationId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [openLobbies, setOpenLobbies] = useState<any[]>([]);

  useEffect(() => {
    loadOpenLobbies();
  }, []);

  const loadOpenLobbies = async () => {
    try {
      const response = await fetch('/api/battle-simulation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get_open_lobbies' })
      });
      const data = await response.json();
      if (data.lobbies) {
        setOpenLobbies(data.lobbies);
      }
    } catch (error) {
      console.error('Failed to load open lobbies:', error);
    }
  };

  const createBattle = async (settings: any) => {
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/battle-simulation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'create_session',
          ...settings,
          hostNation: {
            id: 'player1',
            nation_name: 'Your Nation',
            leader_name: 'Your Leader'
          }
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSessionId(data.session.id);
        setCurrentNationId('player1');
        
        // Auto-start if it's an AI battle
        if (settings.battleMode === 'ai') {
          await startBattle(data.session.id);
        }
      } else {
        setError(data.error || 'Failed to create battle');
      }
    } catch (error) {
      setError('Failed to create battle');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const joinBattle = async (lobbyId: string) => {
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/battle-simulation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'join_session',
          sessionId: lobbyId,
          nation: {
            id: 'player2',
            nation_name: 'Your Nation',
            leader_name: 'Your Leader'
          }
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSessionId(lobbyId);
        setCurrentNationId('player2');
        await startBattle(lobbyId);
      } else {
        setError(data.error || 'Failed to join battle');
      }
    } catch (error) {
      setError('Failed to join battle');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const startBattle = async (battleSessionId: string) => {
    try {
      const response = await fetch('/api/battle-simulation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'start_session',
          sessionId: battleSessionId
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        await loadSession(battleSessionId);
      }
    } catch (error) {
      console.error('Failed to start battle:', error);
    }
  };

  const loadSession = async (battleSessionId: string) => {
    try {
      const response = await fetch('/api/battle-simulation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'get_session',
          sessionId: battleSessionId
        })
      });
      
      const data = await response.json();
      
      if (data.session) {
        setCurrentSession(data.session);
      }
    } catch (error) {
      console.error('Failed to load session:', error);
    }
  };

  const executeAction = async (action: any) => {
    if (!currentSession || !currentNationId) return;
    
    try {
      const response = await fetch('/api/battle-simulation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'execute_action',
          sessionId: currentSession.id,
          nationId: currentNationId,
          battleAction: action
        })
      });
      
      const data = await response.json();
      
      if (data.success && data.session) {
        setCurrentSession(data.session);
      }
    } catch (error) {
      console.error('Failed to execute action:', error);
    }
  };

  if (currentSession) {
    return (
      <div className="min-h-screen bg-gray-900">
        <BattleInterface 
          session={currentSession}
          currentNationId={currentNationId}
          onExecuteAction={executeAction}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg">
            <div className="text-center">Creating battle...</div>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 mx-6">
          {error}
        </div>
      )}

      <div className="max-w-7xl mx-auto p-6">
        <div className="border-b border-gray-700 pb-4 mb-8">
          <h1 className="text-3xl font-bold text-white">Create Battle Simulation</h1>
          <p className="text-gray-400 mt-2">Set up realistic Politics & War battle scenarios</p>
        </div>
        
        {/* Open Lobbies */}
        {openLobbies.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">Join Open Lobbies</h2>
            <div className="grid gap-4">
              {openLobbies.map((lobby) => (
                <div key={lobby.id} className="bg-gray-800 rounded-lg shadow-lg p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-semibold text-white">Battle Lobby</div>
                      <div className="text-sm text-gray-400">
                        {lobby.participants}/2 players • {lobby.settings.turnCooldown}s turns
                      </div>
                      <div className="text-sm text-gray-400">
                        Economy: {lobby.settings.economyMode} • 
                        Military: {lobby.settings.militarizationLevel} • 
                        Spies: {lobby.settings.spyOperationsEnabled ? 'Enabled' : 'Disabled'}
                      </div>
                    </div>
                    <button 
                      onClick={() => joinBattle(lobby.id)}
                      className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                    >
                      Join Battle
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Battle Setup */}
        <BattleSetup onCreateBattle={createBattle} />
      </div>
    </div>
  );
}
