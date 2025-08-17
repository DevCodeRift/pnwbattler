'use client';

import React, { useState, useEffect } from 'react';
import EnhancedBattleInterface from '@/components/EnhancedBattleInterface';
import { BattleSession, SimulatedNation, EconomyMode, MilitarizationLevel } from '@/types/simulation';

export default function RealNationBattlePage() {
  const [battleSession, setBattleSession] = useState<BattleSession | null>(null);
  const [attackingNationId, setAttackingNationId] = useState('');
  const [defendingNationId, setDefendingNationId] = useState('');
  const [nations, setNations] = useState<{ attacking: SimulatedNation | null; defending: SimulatedNation | null }>({
    attacking: null,
    defending: null
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [timeRemaining, setTimeRemaining] = useState(30);
  const [isMockMode, setIsMockMode] = useState(false);

  // Timer effect
  useEffect(() => {
    if (!battleSession || timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          advanceTurn();
          return 30; // Reset timer
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [battleSession, timeRemaining]);

  const fetchNationData = async (nationId: string) => {
    try {
      console.log(`Fetching nation data for ID: ${nationId}`);
      
      const response = await fetch(`/api/nations?id=${nationId}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API response not ok:', response.status, errorText);
        throw new Error(`Failed to fetch nation data: ${response.status} ${errorText}`);
      }
      
      const result = await response.json();
      console.log('API Response for nation', nationId, ':', result);
      
      if (result.error) {
        console.error('API returned error:', result.error);
        throw new Error(result.error);
      }

      if (!result.nation) {
        console.error('No nation data in response:', result);
        throw new Error('No nation data found in response');
      }

      // Check if this is mock data and store the info
      if (result._mock) {
        console.log('Using mock data:', result._message);
        setIsMockMode(true);
      }

      return result.nation; // Extract the nation from the response
    } catch (error) {
      console.error('Error fetching nation data:', error);
      throw error;
    }
  };

  const convertToSimulatedNation = (nationData: any, nationalId: string): SimulatedNation => {
    console.log('Converting nation data:', nationData);
    
    // Handle case where nationData might be null or undefined
    if (!nationData) {
      console.error('No nation data received for ID:', nationalId);
      return createDefaultNation(nationalId);
    }

    // Convert P&W nation data to our SimulatedNation format
    const cities = nationData.cities || [];
    console.log('Nation cities:', cities);
    
    const simulatedCities = cities.map((city: any) => ({
      id: city.id?.toString() || Math.random().toString(),
      name: city.name || 'Unknown City',
      infrastructure: city.infrastructure || 1000,
      land: city.land || 500,
      powered: city.powered || true,
      // Military buildings
      barracks: city.barracks || 0,
      factory: city.factory || 0,
      hangar: city.hangar || 0,
      drydock: city.drydock || 0,
      // Infrastructure
      coal_power: city.coal_power || 0,
      oil_power: city.oil_power || 0,
      nuclear_power: city.nuclear_power || 0,
      wind_power: city.wind_power || 0,
      // Resource buildings
      coal_mine: city.coal_mine || 0,
      oil_well: city.oil_well || 0,
      uranium_mine: city.uranium_mine || 0,
      iron_mine: city.iron_mine || 0,
      bauxite_mine: city.bauxite_mine || 0,
      lead_mine: city.lead_mine || 0,
      farm: city.farm || 0,
      // Manufacturing
      aluminum_refinery: city.aluminum_refinery || 0,
      steel_mill: city.steel_mill || 0,
      oil_refinery: city.oil_refinery || 0,
      munitions_factory: city.munitions_factory || 0,
      // Civil
      police_station: city.police_station || 0,
      hospital: city.hospital || 0,
      recycling_center: city.recycling_center || 0,
      subway: city.subway || 0,
      // Commerce
      supermarket: city.supermarket || 0,
      bank: city.bank || 0,
      shopping_mall: city.shopping_mall || 0,
      stadium: city.stadium || 0
    }));

    // If no cities, create a default city
    if (simulatedCities.length === 0) {
      console.log('No cities found, creating default city');
      simulatedCities.push(createDefaultCity());
    }

    console.log('Military data:', {
      soldiers: nationData.soldiers,
      tanks: nationData.tanks,
      aircraft: nationData.aircraft,
      ships: nationData.ships
    });

    return {
      id: nationData.id?.toString() || nationalId,
      nation_name: nationData.nation_name || `Nation ${nationalId}`,
      leader_name: nationData.leader_name || 'Unknown Leader',
      cities: simulatedCities,
      military: {
        barracks: simulatedCities.reduce((sum: number, city: any) => sum + city.barracks, 0),
        factories: simulatedCities.reduce((sum: number, city: any) => sum + city.factory, 0),
        hangars: simulatedCities.reduce((sum: number, city: any) => sum + city.hangar, 0),
        drydocks: simulatedCities.reduce((sum: number, city: any) => sum + city.drydock, 0),
        soldiers: nationData.soldiers || 0,
        tanks: nationData.tanks || 0,
        aircraft: nationData.aircraft || 0,
        ships: nationData.ships || 0,
        missiles: nationData.missiles || 0,
        nukes: nationData.nukes || 0
      },
      resources: {
        money: nationData.money || 1000000,
        oil: nationData.oil || 1000,
        food: nationData.food || 1000,
        steel: nationData.steel || 1000,
        aluminum: nationData.aluminum || 1000,
        gasoline: nationData.gasoline || 1000,
        munitions: nationData.munitions || 1000,
        uranium: nationData.uranium || 100,
        coal: nationData.coal || 1000,
        iron: nationData.iron || 1000,
        bauxite: nationData.bauxite || 1000,
        lead: nationData.lead || 1000
      },
      war_policy: nationData.war_policy || 'Attrition',
      domestic_policy: nationData.domestic_policy || 'Manifest Destiny',
      government_type: nationData.government_type || 'Democracy',
      economic_policy: nationData.economic_policy || 'Capitalism',
      social_policy: nationData.social_policy || 'Liberal',
      score: nationData.score || 1000,
      population: nationData.population || 1000000,
      land: simulatedCities.reduce((sum: number, city: any) => sum + (city.land || 0), 0) || 10000, // Calculate total land from cities
      maps: 6, // Starting MAPs
      maxMaps: 12
    };
  };

  const createDefaultNation = (nationalId: string): SimulatedNation => ({
    id: nationalId,
    nation_name: `Nation ${nationalId}`,
    leader_name: 'Unknown Leader',
    cities: [createDefaultCity()],
    military: {
      barracks: 0, factories: 0, hangars: 0, drydocks: 0,
      soldiers: 0, tanks: 0, aircraft: 0, ships: 0,
      missiles: 0, nukes: 0
    },
    resources: {
      money: 1000000, oil: 1000, food: 1000, steel: 1000,
      aluminum: 1000, gasoline: 1000, munitions: 1000,
      uranium: 100, coal: 1000, iron: 1000, bauxite: 1000, lead: 1000
    },
    war_policy: 'Attrition', domestic_policy: 'Manifest Destiny',
    government_type: 'Democracy', economic_policy: 'Capitalism',
    social_policy: 'Liberal', score: 1000, population: 1000000,
    land: 10000, maps: 6, maxMaps: 12
  });

  const createDefaultCity = () => ({
    id: '1', name: 'Capital', infrastructure: 1000, land: 500, powered: true,
    barracks: 0, factory: 0, hangar: 0, drydock: 0,
    coal_power: 0, oil_power: 0, nuclear_power: 0, wind_power: 0,
    coal_mine: 0, oil_well: 0, uranium_mine: 0, iron_mine: 0,
    bauxite_mine: 0, lead_mine: 0, farm: 0,
    aluminum_refinery: 0, steel_mill: 0, oil_refinery: 0, munitions_factory: 0,
    police_station: 0, hospital: 0, recycling_center: 0, subway: 0,
    supermarket: 0, bank: 0, shopping_mall: 0, stadium: 0
  });

  const createBattleSession = async () => {
    if (!attackingNationId || !defendingNationId) {
      setError('Please enter both nation IDs');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Fetch both nations' data
      console.log('Fetching nation data for:', { attackingNationId, defendingNationId });
      
      const [attackerData, defenderData] = await Promise.all([
        fetchNationData(attackingNationId),
        fetchNationData(defendingNationId)
      ]);

      console.log('Received nation data:', { attackerData, defenderData });

      // Convert to our format
      const attacker = convertToSimulatedNation(attackerData, attackingNationId);
      const defender = convertToSimulatedNation(defenderData, defendingNationId);

      // Store nations in state for display
      setNations({ attacking: attacker, defending: defender });

      // Create battle session with attacker as host
      const createResponse = await fetch('/api/battle-simulation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'create_session',
          battleMode: 'open_lobby',
          turnCooldown: 60,
          turnsUntilRecruitment: 1,
          militarizationLevel: 'partial',
          economyMode: 'limited',
          spyOperationsEnabled: false,
          isPrivate: false,
          hostNation: attacker
        }),
      });

      if (!createResponse.ok) {
        const errorData = await createResponse.json();
        throw new Error(errorData.error || 'Failed to create battle session');
      }

      const createData = await createResponse.json();
      
      if (!createData.success || !createData.session) {
        throw new Error('Invalid response format');
      }

      const sessionId = createData.session.id;

      // Join defender to the session
      const joinResponse = await fetch('/api/battle-simulation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'join_session',
          sessionId: sessionId,
          nation: defender
        }),
      });

      if (!joinResponse.ok) {
        const errorData = await joinResponse.json();
        throw new Error(errorData.error || 'Failed to join defender to session');
      }

      const joinData = await joinResponse.json();
      
      if (!joinData.success) {
        throw new Error('Failed to join defender to session');
      }

      // Get the updated session with both participants
      const sessionResponse = await fetch('/api/battle-simulation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'get_session',
          sessionId: sessionId
        }),
      });

      if (!sessionResponse.ok) {
        const errorData = await sessionResponse.json();
        throw new Error(errorData.error || 'Failed to get updated session');
      }

      const sessionData = await sessionResponse.json();
      
      if (sessionData.session) {
        setBattleSession(sessionData.session);
        setTimeRemaining(30);
      } else {
        throw new Error('Invalid session response format');
      }

    } catch (error: any) {
      setError(`Error creating battle: ${error.message}`);
      console.error('Battle creation error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteAction = async (action: any) => {
    if (!battleSession) return;

    try {
      const response = await fetch('/api/battle-simulation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'execute_action',
          sessionId: battleSession.id,
          nationId: attackingNationId,
          actionData: action
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.session) {
          setBattleSession(result.session);
        }
      }
    } catch (error) {
      console.error('Error executing action:', error);
    }
  };

  const advanceTurn = async () => {
    if (!battleSession) return;

    try {
      const response = await fetch('/api/battle-simulation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'process_turn',
          sessionId: battleSession.id
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.session) {
          setBattleSession(result.session);
        }
      }
    } catch (error) {
      console.error('Error advancing turn:', error);
    }
  };

  if (battleSession) {
    return (
      <EnhancedBattleInterface
        session={battleSession}
        currentNationId={attackingNationId}
        timeRemaining={timeRemaining}
        onExecuteAction={handleExecuteAction}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
      <div className="bg-gray-800 rounded-lg p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold mb-6 text-center">Real Nation Battle Simulator</h1>
        
        {isMockMode && (
          <div className="mb-6 p-4 bg-yellow-900/50 border border-yellow-600 rounded-lg">
            <div className="flex items-center space-x-2">
              <span className="text-yellow-400">⚠️</span>
              <span className="text-yellow-200 font-medium">Demo Mode</span>
            </div>
            <p className="text-yellow-100 text-sm mt-1">
              Using sample nation data for demonstration. Available test nations: 145633, 662952, 701263
            </p>
          </div>
        )}
        
        {error && (
          <div className="bg-red-600 text-white p-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Attacking Nation ID
            </label>
            <input
              type="text"
              value={attackingNationId}
              onChange={(e) => setAttackingNationId(e.target.value)}
              placeholder="Enter nation ID (e.g., 123456)"
              className="w-full bg-gray-700 border border-gray-600 rounded p-3 text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Defending Nation ID
            </label>
            <input
              type="text"
              value={defendingNationId}
              onChange={(e) => setDefendingNationId(e.target.value)}
              placeholder="Enter nation ID (e.g., 789012)"
              className="w-full bg-gray-700 border border-gray-600 rounded p-3 text-white"
            />
          </div>

          <button
            onClick={createBattleSession}
            disabled={loading || !attackingNationId || !defendingNationId}
            className={`w-full py-3 rounded font-medium ${
              loading || !attackingNationId || !defendingNationId
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {loading ? 'Creating Battle...' : 'Start Battle Simulation'}
          </button>
        </div>

        <div className="mt-6 text-sm text-gray-400">
          <p className="mb-2">
            <strong>Note:</strong> This will fetch real nation data from Politics & War
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li>Military units (soldiers, tanks, aircraft, ships)</li>
            <li>City builds (barracks, factories, hangars, drydocks)</li>
            <li>Resources (money, munitions, gasoline, etc.)</li>
            <li>Nation policies and stats</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
