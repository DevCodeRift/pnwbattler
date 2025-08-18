'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import EnhancedMultiplayerBattleInterface from '../../../components/EnhancedMultiplayerBattleInterface';
import { AttackType, EconomyMode, MilitarizationLevel } from '../../../types/simulation';

export default function EnhancedBattlePage() {
  const { data: session, status } = useSession();
  const [battleSession, setBattleSession] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create a demo battle session
  const createDemoSession = async () => {
    if (!session) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/enhanced-multiplayer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'create_session',
          settings: {
            economySettings: {
              mode: EconomyMode.LIMITED,
              resources: {
                money: 1000000,
                oil: 10000,
                food: 10000,
                steel: 5000,
                aluminum: 5000,
                gasoline: 3000,
                munitions: 2000,
                uranium: 100,
                coal: 5000,
                iron: 5000,
                bauxite: 5000,
                lead: 1000
              }
            },
            militarySettings: {
              level: MilitarizationLevel.MAXED,
              allowCustom: true
            },
            turnSettings: {
              maxTurns: 50,
              turnDuration: 120, // 2 minutes
              unitBuyingFrequency: 1
            }
          },
          hostNation: {
            nation_name: session.user?.name || 'Player 1',
            leader_name: session.user?.name || 'Leader 1',
            military: {
              soldiers: 25000,
              tanks: 2500,
              aircraft: 150,
              ships: 75,
              missiles: 10,
              nukes: 2
            },
            cities: [
              {
                id: 1,
                name: 'Capital City',
                infrastructure: 2000,
                land: 1500,
                buildings: {
                  barracks: 5,
                  factories: 5,
                  hangars: 5,
                  drydocks: 3,
                  farms: 10,
                  mines: 15,
                  oil_wells: 8,
                  power_plants: 12,
                  recycling_centers: 5,
                  subway: 1,
                  supermarket: 1,
                  bank: 1,
                  shopping_mall: 1,
                  stadium: 1,
                  police_station: 1,
                  hospital: 1,
                  school: 1
                }
              }
            ],
            resources: {
              money: 1000000,
              oil: 10000,
              food: 10000,
              steel: 5000,
              aluminum: 5000,
              gasoline: 3000,
              munitions: 2000,
              uranium: 100,
              coal: 5000,
              iron: 5000,
              bauxite: 5000,
              lead: 1000
            },
            maps: 12
          },
          multiplayerSettings: {
            maxPlayers: 2,
            allowSpectators: false,
            isRanked: false
          }
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Add an AI opponent for demo purposes
        const enhancedSession = {
          ...data.session,
          participants: [
            ...data.session.participants,
            {
              id: 'ai_opponent',
              nation_name: 'AI Empire',
              leader_name: 'AI Commander',
              military: {
                soldiers: 30000,
                tanks: 3000,
                aircraft: 180,
                ships: 90,
                missiles: 12,
                nukes: 3
              },
              cities: [
                {
                  id: 1,
                  name: 'AI Capital',
                  infrastructure: 2200,
                  land: 1600,
                  buildings: {
                    barracks: 5,
                    factories: 5,
                    hangars: 5,
                    drydocks: 3,
                    farms: 12,
                    mines: 18,
                    oil_wells: 10,
                    power_plants: 15,
                    recycling_centers: 6,
                    subway: 1,
                    supermarket: 1,
                    bank: 1,
                    shopping_mall: 1,
                    stadium: 1,
                    police_station: 1,
                    hospital: 1,
                    school: 1
                  }
                }
              ],
              resources: {
                money: 1200000,
                oil: 12000,
                food: 12000,
                steel: 6000,
                aluminum: 6000,
                gasoline: 3500,
                munitions: 2500,
                uranium: 120,
                coal: 6000,
                iron: 6000,
                bauxite: 6000,
                lead: 1200
              },
              maps: 12,
              isAI: true
            }
          ]
        };

        setBattleSession(enhancedSession);
      } else {
        setError(data.error || 'Failed to create session');
      }
    } catch (err) {
      console.error('Error creating demo session:', err);
      setError('Failed to create demo session');
    } finally {
      setLoading(false);
    }
  };

  const handleBattleAction = async (action: any) => {
    if (!battleSession) return;

    try {
      const response = await fetch('/api/enhanced-multiplayer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'execute_action',
          sessionId: battleSession.id,
          ...action
        }),
      });

      const data = await response.json();

      if (data.success && data.session) {
        setBattleSession(data.session);
      } else {
        setError(data.error || 'Action failed');
      }
    } catch (err) {
      console.error('Error executing battle action:', err);
      setError('Failed to execute action');
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-4">Authentication Required</h1>
          <p className="text-gray-400 mb-6">Please log in to access the enhanced battle system.</p>
          <a
            href="/login"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
          >
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-white">Enhanced Battle System</h1>
            <p className="text-gray-400">Advanced multiplayer warfare with detailed analysis</p>
          </div>
          <div className="text-right">
            <p className="text-gray-300">Welcome, {session.user?.name}</p>
            <p className="text-sm text-gray-500">Enhanced PnW Battle Simulator v2.0</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        {!battleSession ? (
          <div className="max-w-4xl mx-auto">
            {/* Welcome Section */}
            <div className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 rounded-lg p-8 mb-8 border border-gray-700">
              <h2 className="text-3xl font-bold text-white mb-4">🚀 Enhanced Battle System</h2>
              <div className="text-gray-300 space-y-3 mb-6">
                <p>Experience the most advanced Politics & War battle simulation with:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>📊 Pre-Battle Analysis:</strong> See victory probabilities and casualty estimates before attacking</li>
                  <li><strong>⚔️ Detailed Battle Logs:</strong> Comprehensive post-battle analysis with tactical insights</li>
                  <li><strong>🎯 Real P&W Mechanics:</strong> Exact casualty formulas and battle calculations</li>
                  <li><strong>📈 Battle Analytics:</strong> Track performance, efficiency, and battle history</li>
                  <li><strong>🛡️ Smart Recommendations:</strong> AI-powered attack suggestions based on analysis</li>
                  <li><strong>💀 Casualty Predictions:</strong> Min/max/average casualty estimates for both sides</li>
                </ul>
              </div>
              
              <button
                onClick={createDemoSession}
                disabled={loading}
                className={`w-full p-4 text-xl font-bold rounded-lg transition-all ${
                  loading
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white hover:scale-105'
                }`}
              >
                {loading ? '🔄 Creating Demo Battle...' : '⚔️ START ENHANCED BATTLE DEMO'}
              </button>
            </div>

            {/* Features Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <div className="text-3xl mb-3">📊</div>
                <h3 className="text-xl font-bold text-white mb-2">Victory Analysis</h3>
                <p className="text-gray-400 text-sm">
                  Get detailed probability breakdowns for Immense Triumph, Moderate Success, Pyrrhic Victory, and Utter Failure outcomes.
                </p>
              </div>

              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <div className="text-3xl mb-3">💀</div>
                <h3 className="text-xl font-bold text-white mb-2">Casualty Estimates</h3>
                <p className="text-gray-400 text-sm">
                  See minimum, maximum, and average casualty predictions for both armies using exact P&W formulas.
                </p>
              </div>

              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <div className="text-3xl mb-3">🎯</div>
                <h3 className="text-xl font-bold text-white mb-2">Smart Recommendations</h3>
                <p className="text-gray-400 text-sm">
                  AI analyzes battle factors and provides recommendations: Highly Recommended, Recommended, Risky, or Not Recommended.
                </p>
              </div>

              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <div className="text-3xl mb-3">⚔️</div>
                <h3 className="text-xl font-bold text-white mb-2">Real Battle Mechanics</h3>
                <p className="text-gray-400 text-sm">
                  Uses actual Politics & War casualty formulas, army value calculations, and battle roll mechanics.
                </p>
              </div>

              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <div className="text-3xl mb-3">📈</div>
                <h3 className="text-xl font-bold text-white mb-2">Battle Analytics</h3>
                <p className="text-gray-400 text-sm">
                  Track win/loss ratios, damage efficiency, favorite attack types, and detailed battle history.
                </p>
              </div>

              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <div className="text-3xl mb-3">🛢️</div>
                <h3 className="text-xl font-bold text-white mb-2">Resource Management</h3>
                <p className="text-gray-400 text-sm">
                  See exact resource consumption for munitions, gasoline, and MAPs before committing to attacks.
                </p>
              </div>
            </div>

            {error && (
              <div className="mt-6 bg-red-900/20 border border-red-500/30 rounded-lg p-4">
                <div className="text-red-400 font-medium">Error</div>
                <div className="text-red-200 text-sm">{error}</div>
              </div>
            )}
          </div>
        ) : (
          <EnhancedMultiplayerBattleInterface
            battle={battleSession}
            lobby={null}
            session={session}
            onBattleAction={handleBattleAction}
          />
        )}
      </div>
    </div>
  );
}
