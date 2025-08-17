'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import EnhancedBattleInterface from './EnhancedBattleInterface';
import { BattleSession, SimulatedNation, AttackType, BattleMode, EconomyMode, MilitarizationLevel } from '@/types/simulation';

interface MultiplayerBattleInterfaceProps {
  battle: {
    id: string;
    playerCount: number;
    spectatorCount: number;
    status: string;
    startedAt: string;
  };
  lobby: {
    id: string;
    hostName: string;
    players: Array<{
      id: string;
      name: string;
      isHost: boolean;
      isReady: boolean;
    }>;
    settings: any;
  };
  onBattleAction: (action: any) => void;
}

export default function MultiplayerBattleInterface({ battle, lobby, onBattleAction }: MultiplayerBattleInterfaceProps) {
  const { data: session } = useSession();
  const [battleSession, setBattleSession] = useState<BattleSession | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(60);

  useEffect(() => {
    // Convert multiplayer battle data to BattleSession format
    if (battle && lobby && session?.user) {
      const currentUserId = (session.user as any).discordId;
      const currentPlayer = lobby.players.find(p => p.id === currentUserId);
      const otherPlayer = lobby.players.find(p => p.id !== currentUserId);

      if (currentPlayer && otherPlayer) {
        // Create simulated nations from lobby players with game settings
        const createSimulatedNation = (player: any, isCurrentPlayer: boolean): SimulatedNation => ({
          id: player.id,
          nation_name: player.name,
          leader_name: player.name,
          war_policy: 'TURTLE',
          domestic_policy: 'MANIFEST_DESTINY',
          government_type: 'DEMOCRACY',
          economic_policy: 'FREE_MARKET',
          social_policy: 'LIBERAL',
          land: 10000,
          cities: Array(lobby.settings?.cityMode === 'NATION_CITIES' ? 10 : 20).fill(null).map((_, index) => ({
            id: `city_${index}`,
            name: `City ${index + 1}`,
            nation_id: player.id,
            infrastructure: 2000,
            land: 500,
            powered: true,
            coal_power: 1,
            oil_power: 0,
            nuclear_power: 0,
            wind_power: 0,
            coal_mine: 0,
            oil_well: 1,
            uranium_mine: 0,
            lead_mine: 0,
            iron_mine: 1,
            bauxite_mine: 0,
            farm: 1,
            aluminum_refinery: 0,
            steel_mill: 1,
            oil_refinery: 1,
            munitions_factory: 0,
            police_station: 0,
            hospital: 0,
            recycling_center: 0,
            subway: 0,
            supermarket: 0,
            bank: 0,
            shopping_mall: 0,
            stadium: 0,
            barracks: lobby.settings?.maxMilitarizationSetup?.barracks || 5,
            factory: lobby.settings?.maxMilitarizationSetup?.factories || 5,
            hangar: lobby.settings?.maxMilitarizationSetup?.hangars || 5,
            drydock: lobby.settings?.maxMilitarizationSetup?.drydocks || 3
          })),
          military: {
            barracks: lobby.settings?.maxMilitarizationSetup?.barracks || 5,
            factories: lobby.settings?.maxMilitarizationSetup?.factories || 5,
            hangars: lobby.settings?.maxMilitarizationSetup?.hangars || 5,
            drydocks: lobby.settings?.maxMilitarizationSetup?.drydocks || 3,
            soldiers: lobby.settings?.maxUnits || 100000,
            tanks: Math.floor((lobby.settings?.maxUnits || 100000) * 0.1),
            aircraft: Math.floor((lobby.settings?.maxUnits || 100000) * 0.05),
            ships: Math.floor((lobby.settings?.maxUnits || 100000) * 0.01),
            missiles: 0,
            nukes: 0
          },
          resources: lobby.settings?.economyType === 'UNLIMITED' ? {
            money: 1000000,
            coal: 10000,
            oil: 10000,
            uranium: 1000,
            lead: 1000,
            iron: 50000,
            bauxite: 10000,
            gasoline: 10000,
            munitions: 10000,
            steel: 50000,
            aluminum: 30000,
            food: 10000
          } : {
            money: 100000,
            coal: 1000,
            oil: 1000,
            uranium: 100,
            lead: 100,
            iron: 5000,
            bauxite: 1000,
            gasoline: 1000,
            munitions: 1000,
            steel: 5000,
            aluminum: 3000,
            food: 1000
          },
          maps: 12, // Standard MAPs per turn
          maxMaps: 12,
          resistance: 100,
          battleEffects: {
            groundControl: false,
            airSuperiority: false
          },
          score: 10000,
          population: 1000000
        });

        const currentNation = createSimulatedNation(currentPlayer, true);
        const enemyNation = createSimulatedNation(otherPlayer, false);

        const mockBattleSession: BattleSession = {
          id: battle.id,
          mode: BattleMode.MULTIPLAYER,
          settings: {
            battleMode: BattleMode.MULTIPLAYER,
            turnCooldown: lobby.settings?.turnTimer || 60,
            turnsUntilRecruitment: lobby.settings?.unitBuyingFrequency || 1,
            militarizationLevel: MilitarizationLevel.CUSTOM,
            economySettings: {
              mode: lobby.settings?.economyType === 'UNLIMITED' ? EconomyMode.UNLIMITED : EconomyMode.LIMITED,
              resources: lobby.settings?.economyType === 'UNLIMITED' ? {
                money: 1000000,
                coal: 10000,
                oil: 10000,
                uranium: 1000,
                lead: 1000,
                iron: 50000,
                bauxite: 10000,
                gasoline: 10000,
                munitions: 10000,
                steel: 50000,
                aluminum: 30000,
                food: 10000
              } : {
                money: 100000,
                coal: 1000,
                oil: 1000,
                uranium: 100,
                lead: 100,
                iron: 5000,
                bauxite: 1000,
                gasoline: 1000,
                munitions: 1000,
                steel: 5000,
                aluminum: 3000,
                food: 1000
              }
            },
            spyOperationsEnabled: false,
            isPrivate: true
          },
          participants: [currentNation, enemyNation],
          currentTurn: 1,
          turnTimer: lobby.settings?.turnTimer || 60,
          turnStartTime: Date.now(),
          lastUnitBuyTurn: {},
          isActive: true,
          battleHistory: [],
          created_at: battle.startedAt,
          updated_at: new Date().toISOString()
        };

        setBattleSession(mockBattleSession);
      }
    }
  }, [battle, lobby, session]);

  useEffect(() => {
    // Setup turn timer
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          // Handle turn advancement
          return lobby.settings?.turnTimer || 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [lobby.settings?.turnTimer]);

  const handleBattleAction = async (action: any) => {
    console.log('Battle action:', action);
    
    // Send action to multiplayer API
    try {
      const response = await fetch('/api/multiplayer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'battle-action',
          battleId: battle.id,
          battleAction: action
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        // Update battle session with response
        onBattleAction(action);
      } else {
        console.error('Battle action failed:', data.error);
      }
    } catch (error) {
      console.error('Network error during battle action:', error);
    }
  };

  if (!battleSession || !session?.user) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-gray-800 rounded-lg p-6 text-center">
          <p className="text-gray-300 text-lg">Loading battle interface...</p>
        </div>
      </div>
    );
  }

  const currentUserId = (session.user as any).discordId;

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="bg-gray-800 rounded-lg p-4 mb-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">Multiplayer Battle</h1>
          <div className="text-right">
            <div className="text-lg font-semibold text-white">Battle ID: {battle.id}</div>
            <div className="text-sm text-gray-400">Status: {battle.status}</div>
          </div>
        </div>
      </div>

      <EnhancedBattleInterface
        session={battleSession}
        currentNationId={currentUserId}
        timeRemaining={timeRemaining}
        onExecuteAction={handleBattleAction}
      />
    </div>
  );
}
