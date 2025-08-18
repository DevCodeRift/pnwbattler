'use client';

import React, { useState, useEffect } from 'react';
import { EnhancedBattleAnalyzer, type BattleAnalysis, type DetailedBattleResult } from '../lib/enhanced-battle-analyzer';
import { AttackType, type SimulatedNation } from '../types/simulation';

interface EnhancedMultiplayerBattleInterfaceProps {
  battle: any;
  lobby: any;
  session?: any;
  onBattleAction: (action: any) => void;
}

export default function EnhancedMultiplayerBattleInterface({ 
  battle, 
  lobby, 
  session, 
  onBattleAction 
}: EnhancedMultiplayerBattleInterfaceProps) {
  const [loading, setLoading] = useState(false);
  const [selectedAttackType, setSelectedAttackType] = useState<AttackType>(AttackType.GROUND);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [battleAnalysis, setBattleAnalysis] = useState<BattleAnalysis | null>(null);
  const [lastBattleResult, setLastBattleResult] = useState<DetailedBattleResult | null>(null);
  const [battleHistory, setBattleHistory] = useState<DetailedBattleResult[]>([]);

  // Get current player and opponent data
  const getCurrentPlayer = (): SimulatedNation | null => {
    if (!battle || !session) return null;
    return battle.participants.find((p: any) => p.discordId === session.user.discordId);
  };

  const getOpponent = (): SimulatedNation | null => {
    if (!battle || !session) return null;
    return battle.participants.find((p: any) => p.discordId !== session.user.discordId);
  };

  const currentPlayer = getCurrentPlayer();
  const opponent = getOpponent();

  // Update battle analysis when attack type changes
  useEffect(() => {
    if (currentPlayer && opponent) {
      // Throttle analysis calculations to prevent performance issues
      const timeoutId = setTimeout(() => {
        const analysis = EnhancedBattleAnalyzer.analyzeBattle(currentPlayer, opponent, selectedAttackType);
        setBattleAnalysis(analysis);
      }, 200); // 200ms delay to throttle calculations

      return () => clearTimeout(timeoutId);
    }
  }, [currentPlayer?.id, opponent?.id, selectedAttackType]); // Use stable IDs instead of objects

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-gray-800 rounded-lg p-6 text-center">
          <div className="animate-pulse">
            <div className="text-lg text-white mb-4">Processing battle...</div>
            <div className="text-gray-400">Please wait while we calculate results</div>
          </div>
        </div>
      </div>
    );
  }

  if (!battle || !currentPlayer || !opponent) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-gray-800 rounded-lg p-6 text-center">
          <div className="text-lg text-red-400 mb-4">Battle Setup Error</div>
          <div className="text-gray-400">Unable to load battle participants</div>
        </div>
      </div>
    );
  }

  const handleAttack = async () => {
    if (!battleAnalysis) return;
    
    setLoading(true);
    try {
      const actionData = {
        action: 'attack',
        details: {
          type: selectedAttackType,
          target: opponent.id,
          analysis: battleAnalysis
        }
      };

      await onBattleAction(actionData);
      
      // Add to battle history (this would normally come from the server response)
      // This is a placeholder for demonstration
      setBattleHistory(prev => [...prev, lastBattleResult].filter(Boolean) as DetailedBattleResult[]);
      
    } catch (error) {
      console.error('Attack failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation) {
      case 'highly_recommended': return 'text-green-400';
      case 'recommended': return 'text-blue-400';
      case 'risky': return 'text-yellow-400';
      case 'not_recommended': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getRecommendationIcon = (recommendation: string) => {
    switch (recommendation) {
      case 'highly_recommended': return '🎯';
      case 'recommended': return '✅';
      case 'risky': return '⚠️';
      case 'not_recommended': return '❌';
      default: return '❓';
    }
  };

  const formatPercentage = (value: number) => `${value.toFixed(1)}%`;

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Battle Header */}
      <div className="bg-gradient-to-r from-red-900/20 to-blue-900/20 rounded-lg p-6 border border-gray-700">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-2">⚔️ BATTLE ARENA ⚔️</h1>
          <div className="text-xl text-gray-300">
            <span className="text-red-400">{currentPlayer.nation_name}</span>
            <span className="mx-4 text-gray-500">VS</span>
            <span className="text-blue-400">{opponent.nation_name}</span>
          </div>
        </div>
      </div>

      {/* Player Status Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Current Player */}
        <div className="bg-red-900/20 rounded-lg p-6 border border-red-700/50">
          <h2 className="text-xl font-bold text-red-400 mb-4">🔥 Your Forces</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-300">Soldiers:</span>
              <span className="text-white font-mono">{currentPlayer.military.soldiers.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Tanks:</span>
              <span className="text-white font-mono">{currentPlayer.military.tanks.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Aircraft:</span>
              <span className="text-white font-mono">{currentPlayer.military.aircraft.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Ships:</span>
              <span className="text-white font-mono">{currentPlayer.military.ships.toLocaleString()}</span>
            </div>
            <div className="border-t border-red-700/50 pt-2 mt-2">
              <div className="flex justify-between">
                <span className="text-gray-300">Munitions:</span>
                <span className="text-white font-mono">{currentPlayer.resources.munitions.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Gasoline:</span>
                <span className="text-white font-mono">{currentPlayer.resources.gasoline.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">MAPs:</span>
                <span className="text-white font-mono">{currentPlayer.maps}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Opponent */}
        <div className="bg-blue-900/20 rounded-lg p-6 border border-blue-700/50">
          <h2 className="text-xl font-bold text-blue-400 mb-4">🛡️ Enemy Forces</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-300">Soldiers:</span>
              <span className="text-white font-mono">{opponent.military.soldiers.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Tanks:</span>
              <span className="text-white font-mono">{opponent.military.tanks.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Aircraft:</span>
              <span className="text-white font-mono">{opponent.military.aircraft.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Ships:</span>
              <span className="text-white font-mono">{opponent.military.ships.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Attack Selection */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h2 className="text-xl font-bold text-white mb-4">🎯 Select Attack Type</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {Object.values(AttackType).map((type) => (
            <button
              key={type}
              onClick={() => setSelectedAttackType(type)}
              className={`p-4 rounded-lg border-2 transition-all ${
                selectedAttackType === type
                  ? 'border-purple-500 bg-purple-900/20 text-purple-300'
                  : 'border-gray-600 bg-gray-700/20 text-gray-300 hover:border-gray-500'
              }`}
            >
              <div className="text-lg font-medium capitalize">{type.replace('_', ' ')}</div>
              <div className="text-sm text-gray-400 mt-1">
                {type === AttackType.GROUND && 'Soldiers & Tanks • 3 MAPs'}
                {type === AttackType.AIR && 'Aircraft • 4 MAPs'}
                {type === AttackType.NAVAL && 'Ships • 4 MAPs'}
              </div>
            </button>
          ))}
        </div>

        <button
          onClick={() => setShowAnalysis(!showAnalysis)}
          className="w-full p-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
        >
          {showAnalysis ? 'Hide Analysis' : 'Show Battle Analysis'}
        </button>
      </div>

      {/* Battle Analysis */}
      {showAnalysis && battleAnalysis && (
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 space-y-6">
          <h2 className="text-xl font-bold text-white">📊 Battle Analysis</h2>
          
          {/* Victory Probabilities */}
          <div className="bg-gray-900/50 rounded-lg p-4">
            <h3 className="text-lg font-medium text-white mb-3">🎲 Victory Probabilities</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">
                  {formatPercentage(battleAnalysis.victoryProbabilities.immenseTriumph)}
                </div>
                <div className="text-sm text-gray-300">Immense Triumph</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">
                  {formatPercentage(battleAnalysis.victoryProbabilities.moderateSuccess)}
                </div>
                <div className="text-sm text-gray-300">Moderate Success</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-400">
                  {formatPercentage(battleAnalysis.victoryProbabilities.pyrrhicVictory)}
                </div>
                <div className="text-sm text-gray-300">Pyrrhic Victory</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-400">
                  {formatPercentage(battleAnalysis.victoryProbabilities.utterFailure)}
                </div>
                <div className="text-sm text-gray-300">Utter Failure</div>
              </div>
            </div>
            
            <div className="mt-4 flex items-center justify-center">
              <div className={`text-lg font-medium ${getRecommendationColor(battleAnalysis.recommendation)}`}>
                {getRecommendationIcon(battleAnalysis.recommendation)} {battleAnalysis.recommendation.replace('_', ' ').toUpperCase()}
              </div>
            </div>
          </div>

          {/* Army Strength Comparison */}
          <div className="bg-gray-900/50 rounded-lg p-4">
            <h3 className="text-lg font-medium text-white mb-3">⚔️ Army Strength</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-xl font-bold text-red-400">
                  {battleAnalysis.armyStrengths.attacker.toLocaleString()}
                </div>
                <div className="text-sm text-gray-300">Your Army</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-white">
                  {battleAnalysis.armyStrengths.ratio.toFixed(2)}:1
                </div>
                <div className="text-sm text-gray-300">Strength Ratio</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-blue-400">
                  {battleAnalysis.armyStrengths.defender.toLocaleString()}
                </div>
                <div className="text-sm text-gray-300">Enemy Army</div>
              </div>
            </div>
          </div>

          {/* Estimated Casualties */}
          <div className="bg-gray-900/50 rounded-lg p-4">
            <h3 className="text-lg font-medium text-white mb-3">💀 Estimated Casualties</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-red-400 mb-2">Your Losses</h4>
                <div className="space-y-1 text-sm">
                  {selectedAttackType === AttackType.GROUND && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Soldiers:</span>
                        <span className="text-white">
                          {battleAnalysis.estimatedCasualties.attacker.soldiers.min}-{battleAnalysis.estimatedCasualties.attacker.soldiers.max}
                          <span className="text-gray-400"> (avg: {battleAnalysis.estimatedCasualties.attacker.soldiers.avg})</span>
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Tanks:</span>
                        <span className="text-white">
                          {battleAnalysis.estimatedCasualties.attacker.tanks.min}-{battleAnalysis.estimatedCasualties.attacker.tanks.max}
                          <span className="text-gray-400"> (avg: {battleAnalysis.estimatedCasualties.attacker.tanks.avg})</span>
                        </span>
                      </div>
                    </>
                  )}
                  {selectedAttackType === AttackType.AIR && (
                    <div className="flex justify-between">
                      <span className="text-gray-300">Aircraft:</span>
                      <span className="text-white">
                        {battleAnalysis.estimatedCasualties.attacker.aircraft.min}-{battleAnalysis.estimatedCasualties.attacker.aircraft.max}
                        <span className="text-gray-400"> (avg: {battleAnalysis.estimatedCasualties.attacker.aircraft.avg})</span>
                      </span>
                    </div>
                  )}
                  {selectedAttackType === AttackType.NAVAL && (
                    <div className="flex justify-between">
                      <span className="text-gray-300">Ships:</span>
                      <span className="text-white">
                        {battleAnalysis.estimatedCasualties.attacker.ships.min}-{battleAnalysis.estimatedCasualties.attacker.ships.max}
                        <span className="text-gray-400"> (avg: {battleAnalysis.estimatedCasualties.attacker.ships.avg})</span>
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <h4 className="font-medium text-blue-400 mb-2">Enemy Losses</h4>
                <div className="space-y-1 text-sm">
                  {selectedAttackType === AttackType.GROUND && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Soldiers:</span>
                        <span className="text-white">
                          {battleAnalysis.estimatedCasualties.defender.soldiers.min}-{battleAnalysis.estimatedCasualties.defender.soldiers.max}
                          <span className="text-gray-400"> (avg: {battleAnalysis.estimatedCasualties.defender.soldiers.avg})</span>
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Tanks:</span>
                        <span className="text-white">
                          {battleAnalysis.estimatedCasualties.defender.tanks.min}-{battleAnalysis.estimatedCasualties.defender.tanks.max}
                          <span className="text-gray-400"> (avg: {battleAnalysis.estimatedCasualties.defender.tanks.avg})</span>
                        </span>
                      </div>
                    </>
                  )}
                  {selectedAttackType === AttackType.AIR && (
                    <div className="flex justify-between">
                      <span className="text-gray-300">Aircraft:</span>
                      <span className="text-white">
                        {battleAnalysis.estimatedCasualties.defender.aircraft.min}-{battleAnalysis.estimatedCasualties.defender.aircraft.max}
                        <span className="text-gray-400"> (avg: {battleAnalysis.estimatedCasualties.defender.aircraft.avg})</span>
                      </span>
                    </div>
                  )}
                  {selectedAttackType === AttackType.NAVAL && (
                    <div className="flex justify-between">
                      <span className="text-gray-300">Ships:</span>
                      <span className="text-white">
                        {battleAnalysis.estimatedCasualties.defender.ships.min}-{battleAnalysis.estimatedCasualties.defender.ships.max}
                        <span className="text-gray-400"> (avg: {battleAnalysis.estimatedCasualties.defender.ships.avg})</span>
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Resource Consumption */}
          <div className="bg-gray-900/50 rounded-lg p-4">
            <h3 className="text-lg font-medium text-white mb-3">🛢️ Resource Consumption</h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-lg font-bold text-yellow-400">{battleAnalysis.resourceConsumption.munitions}</div>
                <div className="text-sm text-gray-300">Munitions</div>
              </div>
              <div>
                <div className="text-lg font-bold text-orange-400">{battleAnalysis.resourceConsumption.gasoline}</div>
                <div className="text-sm text-gray-300">Gasoline</div>
              </div>
              <div>
                <div className="text-lg font-bold text-purple-400">{battleAnalysis.resourceConsumption.maps}</div>
                <div className="text-sm text-gray-300">MAPs</div>
              </div>
            </div>
          </div>

          {/* Battle Factors */}
          {(battleAnalysis.battleFactors.attackerAdvantages.length > 0 || 
            battleAnalysis.battleFactors.defenderAdvantages.length > 0 || 
            battleAnalysis.battleFactors.warnings.length > 0) && (
            <div className="bg-gray-900/50 rounded-lg p-4">
              <h3 className="text-lg font-medium text-white mb-3">⚡ Battle Factors</h3>
              
              {battleAnalysis.battleFactors.attackerAdvantages.length > 0 && (
                <div className="mb-3">
                  <h4 className="font-medium text-green-400 mb-1">✅ Your Advantages:</h4>
                  <ul className="list-disc list-inside text-sm text-gray-300 ml-4">
                    {battleAnalysis.battleFactors.attackerAdvantages.map((advantage, i) => (
                      <li key={i}>{advantage}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {battleAnalysis.battleFactors.defenderAdvantages.length > 0 && (
                <div className="mb-3">
                  <h4 className="font-medium text-blue-400 mb-1">🛡️ Enemy Advantages:</h4>
                  <ul className="list-disc list-inside text-sm text-gray-300 ml-4">
                    {battleAnalysis.battleFactors.defenderAdvantages.map((advantage, i) => (
                      <li key={i}>{advantage}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {battleAnalysis.battleFactors.warnings.length > 0 && (
                <div>
                  <h4 className="font-medium text-red-400 mb-1">⚠️ Warnings:</h4>
                  <ul className="list-disc list-inside text-sm text-gray-300 ml-4">
                    {battleAnalysis.battleFactors.warnings.map((warning, i) => (
                      <li key={i}>{warning}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Attack Button */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <button
          onClick={handleAttack}
          disabled={loading}
          className={`w-full p-4 text-xl font-bold rounded-lg transition-all ${
            loading
              ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
              : 'bg-red-600 hover:bg-red-700 text-white hover:scale-105'
          }`}
        >
          {loading ? '⚔️ ATTACKING...' : `⚔️ LAUNCH ${selectedAttackType.toUpperCase()} ATTACK`}
        </button>
        
        {battleAnalysis && (
          <div className="mt-3 text-center text-sm">
            <span className={getRecommendationColor(battleAnalysis.recommendation)}>
              Success Chance: {formatPercentage(
                battleAnalysis.victoryProbabilities.immenseTriumph + battleAnalysis.victoryProbabilities.moderateSuccess
              )}
            </span>
          </div>
        )}
      </div>

      {/* Battle History */}
      {battleHistory.length > 0 && (
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h2 className="text-xl font-bold text-white mb-4">📜 Battle History</h2>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {battleHistory.map((result, index) => (
              <div key={index} className="bg-gray-900/50 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-white">Battle #{index + 1}</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    result.success ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'
                  }`}>
                    {result.outcome}
                  </span>
                </div>
                <div className="text-sm text-gray-300">
                  {result.analysis.tacticalSummary}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
