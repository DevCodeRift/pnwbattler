'use client';

import React, { useState, useEffect } from 'react';
import { BattleSession, SimulatedNation, AttackType } from '@/types/simulation';

interface EnhancedBattleInterfaceProps {
  session: BattleSession;
  currentNationId: string;
  timeRemaining: number;
  onExecuteAction: (action: any) => void;
}

export default function EnhancedBattleInterface({ session, currentNationId, timeRemaining, onExecuteAction }: EnhancedBattleInterfaceProps) {
  const [selectedAction, setSelectedAction] = useState('');
  const [battleOdds, setBattleOdds] = useState({ IT: 0, MS: 0, PV: 0, UF: 0 });
  const [lastBattleResult, setLastBattleResult] = useState<any>(null);
  const [showTimeline, setShowTimeline] = useState(false);

  const currentNation = session.participants.find(p => p.id === currentNationId);
  const enemy = session.participants.find(p => p.id !== currentNationId);

  // Update last battle result when session changes
  useEffect(() => {
    if (session.battleHistory && session.battleHistory.length > 0) {
      const latestBattle = session.battleHistory[session.battleHistory.length - 1];
      setLastBattleResult({
        outcome: latestBattle.outcome,
        attackerLosses: latestBattle.attackerLosses,
        defenderLosses: latestBattle.defenderLosses,
        timestamp: latestBattle.timestamp,
        attackType: latestBattle.attackType,
        attackerName: latestBattle.attackerName,
        defenderName: latestBattle.defenderName
      });
    }
  }, [session]);

  // Calculate battle odds based on army values
  const calculateBattleOdds = (attackType: string) => {
    if (!currentNation || !enemy) return { IT: 0, MS: 0, PV: 0, UF: 0 };
    
    // Simplified odds calculation - in reality this would use the P&W algorithm
    const attackerStrength = calculateArmyStrength(currentNation, attackType);
    const defenderStrength = calculateArmyStrength(enemy, attackType);
    const ratio = attackerStrength / Math.max(defenderStrength, 1);
    
    if (ratio > 3) return { IT: 95, MS: 4, PV: 1, UF: 0 };
    if (ratio > 2) return { IT: 70, MS: 20, PV: 8, UF: 2 };
    if (ratio > 1.5) return { IT: 45, MS: 30, PV: 20, UF: 5 };
    if (ratio > 1) return { IT: 25, MS: 35, PV: 30, UF: 10 };
    if (ratio > 0.7) return { IT: 10, MS: 25, PV: 35, UF: 30 };
    if (ratio > 0.5) return { IT: 5, MS: 15, PV: 30, UF: 50 };
    return { IT: 0, MS: 5, PV: 15, UF: 80 };
  };

  const calculateArmyStrength = (nation: SimulatedNation, attackType: string) => {
    switch (attackType) {
      case 'ground':
        const hasMunitions = nation.resources.munitions > 0;
        const soldierValue = nation.military.soldiers * (hasMunitions ? 1.75 : 1.0);
        const tankValue = nation.military.tanks * 40;
        return soldierValue + tankValue;
      case 'air':
        return nation.military.aircraft * 200;
      case 'naval':
        return nation.military.ships * 150;
      default:
        return 0;
    }
  };

  useEffect(() => {
    if (selectedAction && currentNation && enemy) {
      setBattleOdds(calculateBattleOdds(selectedAction));
    }
  }, [selectedAction, currentNation, enemy]);

  if (!currentNation || !enemy) {
    return <div>Nation not found</div>;
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const getMapCost = (actionType: string) => {
    switch (actionType) {
      case 'ground': return 3;
      case 'air': return 4;
      case 'naval': return 4;
      case 'missile': return 8;
      case 'nuke': return 12;
      case 'fortify': return 3;
      default: return 0;
    }
  };

  const canPerformAction = (actionType: string) => {
    const cost = getMapCost(actionType);
    return currentNation.maps >= cost;
  };

  const handleActionSelect = (actionType: string) => {
    setSelectedAction(actionType);
  };

  const executeAction = () => {
    if (!selectedAction) return;
    
    if (selectedAction === 'ground' || selectedAction === 'air' || selectedAction === 'naval') {
      const action = {
        type: 'attack',
        attackType: selectedAction,
        target: enemy.id
      };
      onExecuteAction(action);
    }
    setSelectedAction('');
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl font-bold">War Type: Battle Simulation</h1>
              <p className="text-gray-400 text-sm">Start Date: {new Date().toLocaleDateString()}</p>
            </div>
            <div className="text-right">
              <p className="text-gray-400 text-sm">Turns Left</p>
              <p className="text-2xl font-bold text-green-400">{60 - session.currentTurn}/60</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Attacker (You) */}
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-12 h-8 bg-blue-600 rounded flex items-center justify-center">
                <span className="text-xs font-bold">🇺🇸</span>
              </div>
              <div>
                <h3 className="font-bold text-blue-400">{currentNation.nation_name}</h3>
                <p className="text-gray-400 text-sm">You</p>
              </div>
            </div>

            {/* Resources */}
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-purple-400">Resistance</span>
                <span className="text-purple-400">Opponent&apos;s Resistance</span>
              </div>
              <div className="flex space-x-2">
                <div className="flex-1 bg-green-600 h-4 rounded flex items-center justify-center">
                  <span className="text-xs font-bold">100/100</span>
                </div>
                <div className="flex-1 bg-green-600 h-4 rounded flex items-center justify-center">
                  <span className="text-xs font-bold">100/100</span>
                </div>
              </div>
            </div>

            {/* MAPs */}
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-blue-400">MAPs</span>
                <span className="text-blue-400">Opponent&apos;s MAPs</span>
              </div>
              <div className="flex space-x-2">
                <div className="flex-1 bg-green-600 h-8 rounded flex items-center justify-center">
                  <span className="font-bold">{currentNation.maps}/12</span>
                </div>
                <div className="flex-1 bg-green-600 h-8 rounded flex items-center justify-center">
                  <span className="font-bold">{enemy.maps}/12</span>
                </div>
              </div>
            </div>

            {/* Units */}
            <div className="mb-6">
              <h4 className="text-lg font-bold mb-3">Units</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="flex justify-between mb-1">
                    <span>👥 {formatNumber(currentNation.military.soldiers)}</span>
                    <span>🏗️ {formatNumber(currentNation.military.tanks)}</span>
                  </div>
                  <div className="flex justify-between mb-1">
                    <span>✈️ {currentNation.military.aircraft}</span>
                    <span>🚢 {currentNation.military.ships}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex justify-between mb-1">
                    <span>{formatNumber(enemy.military.soldiers)} 👥</span>
                    <span>{formatNumber(enemy.military.tanks)} 🏗️</span>
                  </div>
                  <div className="flex justify-between mb-1">
                    <span>{enemy.military.aircraft} ✈️</span>
                    <span>{enemy.military.ships} 🚢</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Select an option</label>
              <select 
                className="w-full bg-gray-700 border border-gray-600 rounded p-2"
                value={selectedAction}
                onChange={(e) => handleActionSelect(e.target.value)}
              >
                <option value="">Select an option</option>
                <option value="ground" disabled={!canPerformAction('ground')}>
                  Ground Battle (3 MAPs)
                </option>
                <option value="air" disabled={!canPerformAction('air')}>
                  Airstrike (4 MAPs)
                </option>
                <option value="naval" disabled={!canPerformAction('naval')}>
                  Naval Battle (4 MAPs)
                </option>
                <option value="missile" disabled={!canPerformAction('missile')}>
                  Launch Missile (8 MAPs)
                </option>
                <option value="nuke" disabled={!canPerformAction('nuke')}>
                  Launch Nuke (12 MAPs)
                </option>
                <option value="fortify" disabled={!canPerformAction('fortify')}>
                  Fortify (3 MAPs)
                </option>
                <option value="espionage">Espionage (0 MAPs)</option>
                <option value="peace">Offer Peace</option>
              </select>
            </div>

            {/* Battle Odds */}
            {selectedAction && (selectedAction === 'ground' || selectedAction === 'air' || selectedAction === 'naval') && (
              <div className="mb-6">
                <h4 className="text-lg font-bold mb-3">Your Military Advisors Give the following odds for this battle:</h4>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <span className="w-32 text-sm">Utter Failure</span>
                    <div className="flex-1 bg-gray-700 h-6 rounded overflow-hidden">
                      <div 
                        className="bg-red-500 h-full flex items-center justify-end pr-2"
                        style={{ width: `${battleOdds.UF}%` }}
                      >
                        <span className="text-xs font-bold">{battleOdds.UF}%</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <span className="w-32 text-sm">Pyrrhic Victory</span>
                    <div className="flex-1 bg-gray-700 h-6 rounded overflow-hidden">
                      <div 
                        className="bg-orange-500 h-full flex items-center justify-end pr-2"
                        style={{ width: `${battleOdds.PV}%` }}
                      >
                        <span className="text-xs font-bold">{battleOdds.PV}%</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <span className="w-32 text-sm">Moderate Success</span>
                    <div className="flex-1 bg-gray-700 h-6 rounded overflow-hidden">
                      <div 
                        className="bg-yellow-500 h-full flex items-center justify-end pr-2"
                        style={{ width: `${battleOdds.MS}%` }}
                      >
                        <span className="text-xs font-bold">{battleOdds.MS}%</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <span className="w-32 text-sm">Immense Triumph</span>
                    <div className="flex-1 bg-gray-700 h-6 rounded overflow-hidden">
                      <div 
                        className="bg-green-500 h-full flex items-center justify-end pr-2"
                        style={{ width: `${battleOdds.IT}%` }}
                      >
                        <span className="text-xs font-bold">{battleOdds.IT}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Attacker Resources and Military */}
            <div className="mb-6 space-y-4">
              <div>
                <h4 className="text-lg font-bold mb-2">Resources</h4>
                <div className="space-y-2 text-sm">
                  <div>Money: ${formatNumber(currentNation.resources.money)}</div>
                  <div>Munitions: {currentNation.resources.munitions}</div>
                  <div>Gasoline: {currentNation.resources.gasoline}</div>
                </div>
              </div>
              
              <div>
                <h4 className="text-lg font-bold mb-2">Military</h4>
                <div className="space-y-2 text-sm">
                  <div>👥 Soldiers: {formatNumber(currentNation.military.soldiers)}</div>
                  <div>🏗️ Tanks: {formatNumber(currentNation.military.tanks)}</div>
                  <div>✈️ Aircraft: {currentNation.military.aircraft}</div>
                  <div>🚢 Ships: {currentNation.military.ships}</div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-4">
              {selectedAction && (
                <button
                  onClick={executeAction}
                  disabled={!canPerformAction(selectedAction)}
                  className={`px-6 py-2 rounded font-medium ${
                    canPerformAction(selectedAction)
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {selectedAction === 'ground' && 'Launch Ground Battle'}
                  {selectedAction === 'air' && 'Launch Airstrike'}
                  {selectedAction === 'naval' && 'Launch Naval Battle'}
                  {selectedAction === 'missile' && 'Launch Missile'}
                  {selectedAction === 'nuke' && 'Launch Nuke'}
                  {selectedAction === 'fortify' && 'Fortify'}
                  {selectedAction === 'espionage' && 'Conduct Espionage'}
                  {selectedAction === 'peace' && 'Offer Peace'}
                </button>
              )}
              <button 
                className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded font-medium"
                onClick={() => setShowTimeline(true)}
              >
                📊 War Timeline
              </button>
            </div>
          </div>

          {/* Defender */}
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-12 h-8 bg-red-600 rounded flex items-center justify-center">
                <span className="text-xs font-bold">🇹🇷</span>
              </div>
              <div>
                <h3 className="font-bold text-red-400">{enemy.nation_name}</h3>
                <p className="text-gray-400 text-sm">Opponent</p>
              </div>
            </div>

            {/* Battle Results */}
            {lastBattleResult && (
              <div className="mb-6 p-4 bg-gray-700 rounded-lg">
                <h4 className="text-lg font-bold mb-2">Last Battle Result</h4>
                <div className="text-sm space-y-1">
                  <p>Outcome: <span className="font-bold text-green-400">{lastBattleResult.outcome}</span></p>
                  <p>Attacker Losses: {lastBattleResult.attackerLosses?.soldiers || 0} soldiers, {lastBattleResult.attackerLosses?.tanks || 0} tanks</p>
                  <p>Defender Losses: {lastBattleResult.defenderLosses?.soldiers || 0} soldiers, {lastBattleResult.defenderLosses?.tanks || 0} tanks</p>
                </div>
              </div>
            )}

            {/* Resources Display */}
            <div className="space-y-4">
              <div>
                <h4 className="text-lg font-bold mb-2">Resources</h4>
                <div className="space-y-2 text-sm">
                  <div>Money: ${formatNumber(enemy.resources.money)}</div>
                  <div>Munitions: {enemy.resources.munitions}</div>
                  <div>Gasoline: {enemy.resources.gasoline}</div>
                </div>
              </div>
              
              <div>
                <h4 className="text-lg font-bold mb-2">Military</h4>
                <div className="space-y-2 text-sm">
                  <div>👥 Soldiers: {formatNumber(enemy.military.soldiers)}</div>
                  <div>🏗️ Tanks: {formatNumber(enemy.military.tanks)}</div>
                  <div>✈️ Aircraft: {enemy.military.aircraft}</div>
                  <div>🚢 Ships: {enemy.military.ships}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* War Timeline Modal */}
      {showTimeline && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">War Timeline</h2>
              <button 
                onClick={() => setShowTimeline(false)}
                className="text-gray-400 hover:text-white text-xl"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              {session.battleHistory && session.battleHistory.length > 0 ? (
                session.battleHistory.slice().reverse().map((battle, index) => (
                  <div key={battle.id} className="bg-gray-700 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-bold text-lg">
                          Turn {battle.turn}: {battle.attackType.charAt(0).toUpperCase() + battle.attackType.slice(1)} Attack
                        </h3>
                        <p className="text-gray-400 text-sm">
                          {new Date(battle.timestamp).toLocaleString()}
                        </p>
                      </div>
                      <div className={`px-3 py-1 rounded text-sm font-bold ${
                        battle.outcome === 'Immense Triumph' ? 'bg-green-600' :
                        battle.outcome === 'Moderate Success' ? 'bg-yellow-600' :
                        battle.outcome === 'Pyrrhic Victory' ? 'bg-orange-600' :
                        'bg-red-600'
                      }`}>
                        {battle.outcome}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-semibold text-blue-400 mb-2">
                          {battle.attackerName} (Attacker)
                        </h4>
                        <div className="text-sm space-y-1">
                          {battle.attackerLosses.soldiers && (
                            <p>👥 Lost {battle.attackerLosses.soldiers.toLocaleString()} soldiers</p>
                          )}
                          {battle.attackerLosses.tanks && (
                            <p>🏗️ Lost {battle.attackerLosses.tanks.toLocaleString()} tanks</p>
                          )}
                          {battle.attackerLosses.aircraft && (
                            <p>✈️ Lost {battle.attackerLosses.aircraft.toLocaleString()} aircraft</p>
                          )}
                          {battle.attackerLosses.ships && (
                            <p>🚢 Lost {battle.attackerLosses.ships.toLocaleString()} ships</p>
                          )}
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold text-red-400 mb-2">
                          {battle.defenderName} (Defender)
                        </h4>
                        <div className="text-sm space-y-1">
                          {battle.defenderLosses.soldiers && (
                            <p>👥 Lost {battle.defenderLosses.soldiers.toLocaleString()} soldiers</p>
                          )}
                          {battle.defenderLosses.tanks && (
                            <p>🏗️ Lost {battle.defenderLosses.tanks.toLocaleString()} tanks</p>
                          )}
                          {battle.defenderLosses.aircraft && (
                            <p>✈️ Lost {battle.defenderLosses.aircraft.toLocaleString()} aircraft</p>
                          )}
                          {battle.defenderLosses.ships && (
                            <p>🚢 Lost {battle.defenderLosses.ships.toLocaleString()} ships</p>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Detailed Battle Calculations */}
                    <div className="mt-4 pt-4 border-t border-gray-600">
                      <h4 className="font-semibold text-cyan-400 mb-3">Battle Calculations</h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <h5 className="font-semibold text-blue-400 mb-2">Attacker Forces</h5>
                          <div className="space-y-1">
                            {(battle.battleCalculations.attackerUnitsUsed.soldiers || 0) > 0 && (
                              <p>👥 {(battle.battleCalculations.attackerUnitsUsed.soldiers || 0).toLocaleString()} soldiers</p>
                            )}
                            {(battle.battleCalculations.attackerUnitsUsed.tanks || 0) > 0 && (
                              <p>🏗️ {(battle.battleCalculations.attackerUnitsUsed.tanks || 0).toLocaleString()} tanks</p>
                            )}
                            {(battle.battleCalculations.attackerUnitsUsed.aircraft || 0) > 0 && (
                              <p>✈️ {(battle.battleCalculations.attackerUnitsUsed.aircraft || 0).toLocaleString()} aircraft</p>
                            )}
                            {(battle.battleCalculations.attackerUnitsUsed.ships || 0) > 0 && (
                              <p>🚢 {(battle.battleCalculations.attackerUnitsUsed.ships || 0).toLocaleString()} ships</p>
                            )}
                            <p className="text-cyan-300 font-semibold">
                              Total Strength: {battle.battleCalculations.attackerStrength.toLocaleString()}
                            </p>
                          </div>
                        </div>
                        
                        <div>
                          <h5 className="font-semibold text-red-400 mb-2">Defender Forces</h5>
                          <div className="space-y-1">
                            {(battle.battleCalculations.defenderUnitsDefending.soldiers || 0) > 0 && (
                              <p>👥 {(battle.battleCalculations.defenderUnitsDefending.soldiers || 0).toLocaleString()} soldiers</p>
                            )}
                            {(battle.battleCalculations.defenderUnitsDefending.tanks || 0) > 0 && (
                              <p>🏗️ {(battle.battleCalculations.defenderUnitsDefending.tanks || 0).toLocaleString()} tanks</p>
                            )}
                            {(battle.battleCalculations.defenderUnitsDefending.aircraft || 0) > 0 && (
                              <p>✈️ {(battle.battleCalculations.defenderUnitsDefending.aircraft || 0).toLocaleString()} aircraft</p>
                            )}
                            {(battle.battleCalculations.defenderUnitsDefending.ships || 0) > 0 && (
                              <p>🚢 {(battle.battleCalculations.defenderUnitsDefending.ships || 0).toLocaleString()} ships</p>
                            )}
                            <p className="text-cyan-300 font-semibold">
                              Total Strength: {battle.battleCalculations.defenderStrength.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-4 space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-purple-400 font-semibold">Strength Ratio:</span>
                          <span className="text-white">
                            {battle.battleCalculations.strengthRatio.toFixed(2)}:1 
                            {battle.battleCalculations.strengthRatio > 1 ? ' (Advantage: Attacker)' : ' (Advantage: Defender)'}
                          </span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-purple-400 font-semibold">Best Battle Roll:</span>
                          <span className="text-white">{battle.battleCalculations.rollResults.bestRoll.toLocaleString()}</span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-purple-400 font-semibold">Resource Bonuses:</span>
                          <span className="text-white">
                            {battle.battleCalculations.hadMunitions ? '💥 Munitions' : ''}
                            {battle.battleCalculations.hadMunitions && battle.battleCalculations.hadGasoline ? ' + ' : ''}
                            {battle.battleCalculations.hadGasoline ? '⛽ Gasoline' : ''}
                            {!battle.battleCalculations.hadMunitions && !battle.battleCalculations.hadGasoline ? 'None' : ''}
                          </span>
                        </div>
                        
                        {battle.attackType === 'ground' && (
                          <div className="mt-3 p-2 bg-gray-600 rounded">
                            <p className="text-xs text-gray-300">
                              <strong>P&W Formula:</strong> Army Value = Soldiers × {battle.battleCalculations.hadMunitions ? '1.75' : '1.0'} + Tanks × {battle.battleCalculations.hadMunitions && battle.battleCalculations.hadGasoline ? '40' : '0'}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {(battle.resourcesUsed.munitions || battle.resourcesUsed.gasoline) && (
                      <div className="mt-3 pt-3 border-t border-gray-600">
                        <h4 className="font-semibold text-purple-400 mb-1">Resources Used</h4>
                        <div className="text-sm">
                          {battle.resourcesUsed.munitions && (
                            <span className="mr-4">💥 {battle.resourcesUsed.munitions.toLocaleString()} munitions</span>
                          )}
                          {battle.resourcesUsed.gasoline && (
                            <span>⛽ {battle.resourcesUsed.gasoline.toLocaleString()} gasoline</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-400 py-8">
                  <p>No battles have occurred yet.</p>
                  <p className="text-sm mt-2">Launch an attack to see battle results here!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
