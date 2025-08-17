'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../stores';
import Link from 'next/link';

interface NationData {
  id: string;
  nation_name: string;
  leader_name: string;
  alliance_id: string;
  alliance?: {
    id: string;
    name: string;
    acronym: string;
    flag: string;
    color: string;
  };
  continent: string;
  war_policy: string;
  domestic_policy: string;
  color: string;
  num_cities: number;
  score: number;
  population: number;
  soldiers: number;
  tanks: number;
  aircraft: number;
  ships: number;
  missiles: number;
  nukes: number;
  money: number;
  coal: number;
  oil: number;
  uranium: number;
  iron: number;
  bauxite: number;
  lead: number;
  gasoline: number;
  munitions: number;
  steel: number;
  aluminum: number;
  food: number;
  wars_won: number;
  wars_lost: number;
  gross_national_income: number;
  gross_domestic_product: number;
  last_active: string;
  vacation_mode_turns: number;
  beige_turns: number;
  offensive_wars_count: number;
  defensive_wars_count: number;
}

interface MyGame {
  id: string;
  hostName: string;
  playerCount: number;
  status: 'WAITING' | 'IN_PROGRESS' | 'COMPLETED';
  myRole: {
    isHost: boolean;
    isReady: boolean;
  };
  battle?: {
    id: string;
    status: string;
  };
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const { pwNation, isVerified } = useAuthStore();
  const router = useRouter();
  const [nationData, setNationData] = useState<NationData | null>(null);
  const [myGames, setMyGames] = useState<MyGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!session || !isVerified) {
      router.push('/login');
      return;
    }

    if (!pwNation?.id) {
      router.push('/verify');
      return;
    }

    loadNationData();
    loadMyGames();
  }, [session, isVerified, pwNation]);

  const loadNationData = async () => {
    if (!pwNation?.id) return;

    try {
      const response = await fetch(`/api/nations?id=${pwNation.id}`);
      const data = await response.json();
      
      if (data.nation) {
        setNationData(data.nation);
      } else {
        setError('Failed to load nation data');
      }
    } catch (err) {
      console.error('Error loading nation data:', err);
      setError('Failed to load nation data');
    } finally {
      setLoading(false);
    }
  };

  const loadMyGames = async () => {
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
  };

  const formatNumber = (num: number) => {
    if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
    return num?.toLocaleString() || '0';
  };

  const formatMoney = (num: number) => {
    return '$' + formatNumber(num);
  };

  const getWarPolicyColor = (policy: string) => {
    const colors = {
      'ATTRITION': 'text-red-400',
      'TURTLE': 'text-green-400',
      'BLITZKRIEG': 'text-yellow-400',
      'FORTRESS': 'text-blue-400',
      'MONEYBAGS': 'text-purple-400',
      'PIRATE': 'text-orange-400',
      'TACTICIAN': 'text-cyan-400',
      'GUARDIAN': 'text-pink-400',
      'COVERT': 'text-indigo-400',
      'ARCANE': 'text-emerald-400'
    };
    return colors[policy as keyof typeof colors] || 'text-gray-400';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <div className="text-white text-lg">Loading nation data...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-red-400 text-xl">Error loading dashboard</div>
          <div className="text-gray-300">{error}</div>
          <button 
            onClick={() => window.location.reload()}
            className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg text-white"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-blue-400">P&W Battler Dashboard</h1>
            <div className="text-green-400 text-sm">
              ● Online
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Link 
              href="/battle/real"
              className="bg-red-600 hover:bg-red-700 px-6 py-2 rounded-lg font-semibold transition-colors"
            >
              🎯 Enter Battler
            </Link>
            <div className="text-gray-300">
              {session?.user?.name}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Nation Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Nation Info */}
          <div className="lg:col-span-2 bg-gray-800 rounded-lg p-6">
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-2xl font-bold">
                  {nationData?.nation_name?.[0]?.toUpperCase() || 'N'}
                </span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">{nationData?.nation_name}</h2>
                <p className="text-gray-300">Led by {nationData?.leader_name}</p>
                <div className="flex items-center space-x-4 mt-2">
                  <span className="text-sm bg-blue-600 px-2 py-1 rounded">
                    {nationData?.continent}
                  </span>
                  <span className={`text-sm font-semibold ${getWarPolicyColor(nationData?.war_policy || '')}`}>
                    {nationData?.war_policy?.replace('_', ' ')}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">{nationData?.num_cities}</div>
                <div className="text-gray-400 text-sm">Cities</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">{formatNumber(nationData?.score || 0)}</div>
                <div className="text-gray-400 text-sm">Score</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-400">{formatNumber(nationData?.population || 0)}</div>
                <div className="text-gray-400 text-sm">Population</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-400">{formatMoney(nationData?.money || 0)}</div>
                <div className="text-gray-400 text-sm">Money</div>
              </div>
            </div>
          </div>

          {/* Alliance Info */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-xl font-bold text-white mb-4">Alliance</h3>
            {nationData?.alliance ? (
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-8 bg-gray-700 rounded flex items-center justify-center">
                    <span className="text-xs font-bold">
                      {nationData.alliance.acronym}
                    </span>
                  </div>
                  <div>
                    <div className="font-semibold">{nationData.alliance.name}</div>
                    <div className="text-gray-400 text-sm">Member</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-gray-400">
                <div className="text-center py-4">
                  <div className="text-4xl mb-2">🏴‍☠️</div>
                  <div>No Alliance</div>
                  <div className="text-sm">Independent Nation</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Military Overview */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-xl font-bold text-white mb-6">Military Forces</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            <div className="text-center p-4 bg-gray-700 rounded-lg">
              <div className="text-2xl mb-2">👥</div>
              <div className="text-lg font-bold text-green-400">{formatNumber(nationData?.soldiers || 0)}</div>
              <div className="text-gray-400 text-sm">Soldiers</div>
            </div>
            <div className="text-center p-4 bg-gray-700 rounded-lg">
              <div className="text-2xl mb-2">🚗</div>
              <div className="text-lg font-bold text-yellow-400">{formatNumber(nationData?.tanks || 0)}</div>
              <div className="text-gray-400 text-sm">Tanks</div>
            </div>
            <div className="text-center p-4 bg-gray-700 rounded-lg">
              <div className="text-2xl mb-2">✈️</div>
              <div className="text-lg font-bold text-cyan-400">{formatNumber(nationData?.aircraft || 0)}</div>
              <div className="text-gray-400 text-sm">Aircraft</div>
            </div>
            <div className="text-center p-4 bg-gray-700 rounded-lg">
              <div className="text-2xl mb-2">🚢</div>
              <div className="text-lg font-bold text-blue-400">{formatNumber(nationData?.ships || 0)}</div>
              <div className="text-gray-400 text-sm">Ships</div>
            </div>
            <div className="text-center p-4 bg-gray-700 rounded-lg">
              <div className="text-2xl mb-2">🚀</div>
              <div className="text-lg font-bold text-orange-400">{formatNumber(nationData?.missiles || 0)}</div>
              <div className="text-gray-400 text-sm">Missiles</div>
            </div>
            <div className="text-center p-4 bg-gray-700 rounded-lg">
              <div className="text-2xl mb-2">☢️</div>
              <div className="text-lg font-bold text-red-400">{formatNumber(nationData?.nukes || 0)}</div>
              <div className="text-gray-400 text-sm">Nukes</div>
            </div>
            <div className="text-center p-4 bg-gray-700 rounded-lg">
              <div className="text-2xl mb-2">🕵️</div>
              <div className="text-lg font-bold text-purple-400">???</div>
              <div className="text-gray-400 text-sm">Spies</div>
            </div>
          </div>
        </div>

        {/* Resources & Economics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-xl font-bold text-white mb-4">Resources</h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 bg-gray-700 rounded">
                <div className="text-lg font-bold text-yellow-600">{formatNumber(nationData?.oil || 0)}</div>
                <div className="text-xs text-gray-400">Oil</div>
              </div>
              <div className="text-center p-3 bg-gray-700 rounded">
                <div className="text-lg font-bold text-green-600">{formatNumber(nationData?.gasoline || 0)}</div>
                <div className="text-xs text-gray-400">Gasoline</div>
              </div>
              <div className="text-center p-3 bg-gray-700 rounded">
                <div className="text-lg font-bold text-red-600">{formatNumber(nationData?.munitions || 0)}</div>
                <div className="text-xs text-gray-400">Munitions</div>
              </div>
              <div className="text-center p-3 bg-gray-700 rounded">
                <div className="text-lg font-bold text-gray-400">{formatNumber(nationData?.steel || 0)}</div>
                <div className="text-xs text-gray-400">Steel</div>
              </div>
              <div className="text-center p-3 bg-gray-700 rounded">
                <div className="text-lg font-bold text-blue-400">{formatNumber(nationData?.aluminum || 0)}</div>
                <div className="text-xs text-gray-400">Aluminum</div>
              </div>
              <div className="text-center p-3 bg-gray-700 rounded">
                <div className="text-lg font-bold text-orange-400">{formatNumber(nationData?.food || 0)}</div>
                <div className="text-xs text-gray-400">Food</div>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-xl font-bold text-white mb-4">Economics</h3>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-400">National Income:</span>
                <span className="text-green-400 font-bold">{formatMoney(nationData?.gross_national_income || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">GDP:</span>
                <span className="text-green-400 font-bold">{formatMoney(nationData?.gross_domestic_product || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Treasury:</span>
                <span className="text-yellow-400 font-bold">{formatMoney(nationData?.money || 0)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* My Active Games */}
        {myGames.length > 0 && (
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-xl font-bold text-white mb-4">My Active Games</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {myGames.map((game) => (
                <div key={game.id} className="bg-gray-700 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-semibold text-white">{game.hostName}'s Game</h4>
                      <div className="text-sm text-gray-400">
                        {game.playerCount} players • {game.myRole.isHost ? 'Host' : 'Player'}
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded ${
                      game.status === 'IN_PROGRESS' ? 'bg-green-600' : 
                      game.status === 'WAITING' ? 'bg-yellow-600' : 'bg-gray-600'
                    }`}>
                      {game.status.replace('_', ' ')}
                    </span>
                  </div>
                  
                  <Link 
                    href={game.battle ? `/battle/real?battleId=${game.battle.id}` : `/battle/real?lobbyId=${game.id}`}
                    className="block w-full bg-blue-600 hover:bg-blue-700 text-center py-2 rounded text-sm font-semibold transition-colors"
                  >
                    {game.battle ? '⚔️ Join Battle' : '👥 Join Lobby'}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* War Statistics */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-xl font-bold text-white mb-4">War Statistics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">{nationData?.wars_won || 0}</div>
              <div className="text-gray-400">Wars Won</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-400">{nationData?.wars_lost || 0}</div>
              <div className="text-gray-400">Wars Lost</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-400">{nationData?.offensive_wars_count || 0}</div>
              <div className="text-gray-400">Offensive Wars</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">{nationData?.defensive_wars_count || 0}</div>
              <div className="text-gray-400">Defensive Wars</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
