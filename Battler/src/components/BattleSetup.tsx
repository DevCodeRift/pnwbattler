'use client';

import React, { useState } from 'react';
import { BattleMode, EconomyMode, MilitarizationLevel, TURN_COOLDOWNS, ECONOMY_PRESETS } from '@/types/simulation';

interface BattleSetupProps {
  onCreateBattle: (settings: any) => void;
}

export default function BattleSetup({ onCreateBattle }: BattleSetupProps) {
  const [battleMode, setBattleMode] = useState<BattleMode>(BattleMode.AI);
  const [turnCooldown, setTurnCooldown] = useState(60);
  const [turnsUntilRecruitment, setTurnsUntilRecruitment] = useState(1);
  const [militarizationLevel, setMilitarizationLevel] = useState<MilitarizationLevel>(MilitarizationLevel.PARTIAL);
  const [economyMode, setEconomyMode] = useState<EconomyMode>(EconomyMode.LIMITED);
  const [spyOperationsEnabled, setSpyOperationsEnabled] = useState(true);
  const [isPrivate, setIsPrivate] = useState(false);
  const [inviteNationId, setInviteNationId] = useState('');
  const [inviteMessage, setInviteMessage] = useState('');
  const [customMilitary, setCustomMilitary] = useState({
    barracks: 0,
    factories: 0,
    hangars: 5,
    drydocks: 0
  });
  const [customResources, setCustomResources] = useState(ECONOMY_PRESETS.LIMITED);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const settings = {
      battleMode,
      turnCooldown,
      turnsUntilRecruitment,
      militarizationLevel,
      customMilitary: militarizationLevel === MilitarizationLevel.CUSTOM ? customMilitary : undefined,
      economyMode,
      customResources: economyMode === EconomyMode.LIMITED ? customResources : undefined,
      spyOperationsEnabled,
      isPrivate,
      inviteNationId: battleMode === BattleMode.PRIVATE_INVITE ? inviteNationId : undefined,
      inviteMessage: battleMode === BattleMode.PRIVATE_INVITE ? inviteMessage : undefined
    };

    onCreateBattle(settings);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-gray-800 rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-6 text-white">Create Battle Simulation</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Battle Mode */}
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-300">Battle Mode</label>
            <select 
              value={battleMode} 
              onChange={(e) => setBattleMode(e.target.value as BattleMode)}
              className="w-full p-2 border border-gray-600 rounded-md bg-gray-700 text-white"
            >
              <option value={BattleMode.AI}>Test Battle vs AI</option>
              <option value={BattleMode.OPEN_LOBBY}>Open Lobby</option>
              <option value={BattleMode.PRIVATE_INVITE}>Private Invite</option>
            </select>
          </div>

          {/* Turn Settings */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">Turn Cooldown</label>
              <select 
                value={turnCooldown.toString()} 
                onChange={(e) => setTurnCooldown(parseInt(e.target.value))}
                className="w-full p-2 border border-gray-600 rounded-md bg-gray-700 text-white"
              >
                {TURN_COOLDOWNS.map(cooldown => (
                  <option key={cooldown} value={cooldown.toString()}>
                    {cooldown === 30 ? '30 seconds' :
                     cooldown === 60 ? '1 minute' :
                     cooldown === 120 ? '2 minutes' :
                     '5 minutes'}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">Turns Until Recruitment</label>
              <input
                type="number"
                min="1"
                max="10"
                value={turnsUntilRecruitment}
                onChange={(e) => setTurnsUntilRecruitment(parseInt(e.target.value))}
                className="w-full p-2 border border-gray-600 rounded-md bg-gray-700 text-white"
              />
            </div>
          </div>

          {/* Militarization Level */}
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-300">Militarization Level</label>
            <select 
              value={militarizationLevel} 
              onChange={(e) => setMilitarizationLevel(e.target.value as MilitarizationLevel)}
              className="w-full p-2 border border-gray-600 rounded-md bg-gray-700 text-white"
            >
              <option value={MilitarizationLevel.ZERO}>Zero (0/0/0/0)</option>
              <option value={MilitarizationLevel.PARTIAL}>Partial (0/2/5/0)</option>
              <option value={MilitarizationLevel.MAXED}>Maxed (5/5/5/3)</option>
              <option value={MilitarizationLevel.CUSTOM}>Custom</option>
            </select>
          </div>

          {/* Custom Military Build */}
          {militarizationLevel === MilitarizationLevel.CUSTOM && (
            <div className="bg-gray-700 p-4 rounded-lg">
              <h3 className="text-lg font-medium mb-4 text-white">Custom Military Build (per city)</h3>
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-300">Barracks</label>
                  <input
                    type="number"
                    min="0"
                    max="5"
                    value={customMilitary.barracks}
                    onChange={(e) => setCustomMilitary({...customMilitary, barracks: parseInt(e.target.value)})}
                    className="w-full p-2 border border-gray-600 rounded-md bg-gray-600 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-300">Factories</label>
                  <input
                    type="number"
                    min="0"
                    max="5"
                    value={customMilitary.factories}
                    onChange={(e) => setCustomMilitary({...customMilitary, factories: parseInt(e.target.value)})}
                    className="w-full p-2 border border-gray-600 rounded-md bg-gray-600 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-300">Hangars</label>
                  <input
                    type="number"
                    min="0"
                    max="5"
                    value={customMilitary.hangars}
                    onChange={(e) => setCustomMilitary({...customMilitary, hangars: parseInt(e.target.value)})}
                    className="w-full p-2 border border-gray-600 rounded-md bg-gray-600 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-300">Drydocks</label>
                  <input
                    type="number"
                    min="0"
                    max="3"
                    value={customMilitary.drydocks}
                    onChange={(e) => setCustomMilitary({...customMilitary, drydocks: parseInt(e.target.value)})}
                    className="w-full p-2 border border-gray-600 rounded-md bg-gray-600 text-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Economy Settings */}
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-300">Economy Mode</label>
            <select 
              value={economyMode} 
              onChange={(e) => setEconomyMode(e.target.value as EconomyMode)}
              className="w-full p-2 border border-gray-600 rounded-md bg-gray-700 text-white"
            >
              <option value={EconomyMode.UNLIMITED}>Unlimited Economy</option>
              <option value={EconomyMode.LIMITED}>Limited Resources</option>
              <option value={EconomyMode.MINIMAL}>Minimal Resources</option>
            </select>
          </div>

          {/* Custom Resources */}
          {economyMode === EconomyMode.LIMITED && (
            <div className="bg-gray-700 p-4 rounded-lg">
              <h3 className="text-lg font-medium mb-4 text-white">Starting Resources</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-300">Money</label>
                  <input
                    type="number"
                    value={customResources.money}
                    onChange={(e) => setCustomResources({...customResources, money: parseInt(e.target.value)})}
                    className="w-full p-2 border border-gray-600 rounded-md bg-gray-600 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-300">Aluminum</label>
                  <input
                    type="number"
                    value={customResources.aluminum}
                    onChange={(e) => setCustomResources({...customResources, aluminum: parseInt(e.target.value)})}
                    className="w-full p-2 border border-gray-600 rounded-md bg-gray-600 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-300">Gasoline</label>
                  <input
                    type="number"
                    value={customResources.gasoline}
                    onChange={(e) => setCustomResources({...customResources, gasoline: parseInt(e.target.value)})}
                    className="w-full p-2 border border-gray-600 rounded-md bg-gray-600 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-300">Munitions</label>
                  <input
                    type="number"
                    value={customResources.munitions}
                    onChange={(e) => setCustomResources({...customResources, munitions: parseInt(e.target.value)})}
                    className="w-full p-2 border border-gray-600 rounded-md bg-gray-600 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-300">Steel</label>
                  <input
                    type="number"
                    value={customResources.steel}
                    onChange={(e) => setCustomResources({...customResources, steel: parseInt(e.target.value)})}
                    className="w-full p-2 border border-gray-600 rounded-md bg-gray-600 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-300">Food</label>
                  <input
                    type="number"
                    value={customResources.food}
                    onChange={(e) => setCustomResources({...customResources, food: parseInt(e.target.value)})}
                    className="w-full p-2 border border-gray-600 rounded-md bg-gray-600 text-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Additional Options */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="spy-ops"
                checked={spyOperationsEnabled}
                onChange={(e) => setSpyOperationsEnabled(e.target.checked)}
                className="w-4 h-4"
              />
              <label htmlFor="spy-ops" className="text-sm font-medium text-gray-300">Enable Spy Operations</label>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="private"
                checked={isPrivate}
                onChange={(e) => setIsPrivate(e.target.checked)}
                className="w-4 h-4"
              />
              <label htmlFor="private" className="text-sm font-medium text-gray-300">Private Match</label>
            </div>
          </div>

          {/* Private Invite Settings */}
          {battleMode === BattleMode.PRIVATE_INVITE && (
            <div className="bg-gray-700 p-4 rounded-lg">
              <h3 className="text-lg font-medium mb-4 text-white">Invitation Settings</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-300">Nation ID to Invite</label>
                  <input
                    type="text"
                    placeholder="Enter nation ID"
                    value={inviteNationId}
                    onChange={(e) => setInviteNationId(e.target.value)}
                    className="w-full p-2 border border-gray-600 rounded-md bg-gray-600 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-300">Custom Invitation Message</label>
                  <textarea
                    placeholder="Enter custom message (optional)"
                    value={inviteMessage}
                    onChange={(e) => setInviteMessage(e.target.value)}
                    rows={3}
                    className="w-full p-2 border border-gray-600 rounded-md bg-gray-600 text-white"
                  />
                </div>
              </div>
            </div>
          )}

          <button 
            type="submit" 
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 transition-colors"
          >
            Create Battle Simulation
          </button>
        </form>
      </div>
    </div>
  );
}
