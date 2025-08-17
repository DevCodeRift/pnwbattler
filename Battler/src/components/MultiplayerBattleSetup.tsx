'use client';

import React, { useState } from 'react';
import { 
  MultiplayerSettings, 
  ResourceEconomyMode, 
  TurnCooldown, 
  UnitBuyingFrequency, 
  CityMode,
  SimulatedNation 
} from '@/types/simulation';

interface MultiplayerBattleSetupProps {
  onStartBattle: (settings: MultiplayerSettings, attackingNation: SimulatedNation, defendingNation: SimulatedNation) => void;
  attackingNation: SimulatedNation | null;
  defendingNation: SimulatedNation | null;
}

export default function MultiplayerBattleSetup({ onStartBattle, attackingNation, defendingNation }: MultiplayerBattleSetupProps) {
  const [settings, setSettings] = useState<MultiplayerSettings>({
    resourceEconomy: ResourceEconomyMode.UNLIMITED,
    turnCooldown: TurnCooldown.ONE_MINUTE,
    unitBuyingFrequency: UnitBuyingFrequency.EVERY_TURN,
    cityMode: CityMode.NATION_CITIES,
    maxMilitarizationSetup: {
      barracks: 5,
      hangars: 5,
      factories: 5,
      drydocks: 3
    }
  });

  const [customCounts, setCustomCounts] = useState({
    attacking: {
      soldiers: 100000,
      tanks: 10000,
      aircraft: 5000,
      ships: 1000
    },
    defending: {
      soldiers: 100000,
      tanks: 10000,
      aircraft: 5000,
      ships: 1000
    }
  });

  const [useCustomCounts, setUseCustomCounts] = useState(false);

  const handleStartBattle = () => {
    if (!attackingNation || !defendingNation) return;

    let finalAttacker = { ...attackingNation };
    let finalDefender = { ...defendingNation };

    // Apply city mode settings
    if (settings.cityMode === CityMode.MAX_MILITARIZATION) {
      // Update cities to have max militarization
      const maxMilitarizationCity = {
        id: '1',
        name: 'Military Base',
        infrastructure: 2000,
        land: 1000,
        powered: true,
        barracks: settings.maxMilitarizationSetup?.barracks || 5,
        factory: settings.maxMilitarizationSetup?.factories || 5,
        hangar: settings.maxMilitarizationSetup?.hangars || 5,
        drydock: settings.maxMilitarizationSetup?.drydocks || 3,
        // Set all other buildings to 0
        coal_power: 0, oil_power: 0, nuclear_power: 0, wind_power: 0,
        coal_mine: 0, oil_well: 0, uranium_mine: 0, iron_mine: 0,
        bauxite_mine: 0, lead_mine: 0, farm: 0,
        aluminum_refinery: 0, steel_mill: 0, oil_refinery: 0, munitions_factory: 0,
        police_station: 0, hospital: 0, recycling_center: 0, subway: 0,
        supermarket: 0, bank: 0, shopping_mall: 0, stadium: 0
      };

      finalAttacker.cities = [maxMilitarizationCity];
      finalDefender.cities = [{ ...maxMilitarizationCity, id: '2' }];

      // Update military buildings count
      finalAttacker.military = {
        ...finalAttacker.military,
        barracks: settings.maxMilitarizationSetup?.barracks || 5,
        factories: settings.maxMilitarizationSetup?.factories || 5,
        hangars: settings.maxMilitarizationSetup?.hangars || 5,
        drydocks: settings.maxMilitarizationSetup?.drydocks || 3
      };
      finalDefender.military = {
        ...finalDefender.military,
        barracks: settings.maxMilitarizationSetup?.barracks || 5,
        factories: settings.maxMilitarizationSetup?.factories || 5,
        hangars: settings.maxMilitarizationSetup?.hangars || 5,
        drydocks: settings.maxMilitarizationSetup?.drydocks || 3
      };
    }

    // Apply custom unit counts if enabled
    if (useCustomCounts) {
      finalAttacker.military = {
        ...finalAttacker.military,
        soldiers: customCounts.attacking.soldiers,
        tanks: customCounts.attacking.tanks,
        aircraft: customCounts.attacking.aircraft,
        ships: customCounts.attacking.ships
      };
      finalDefender.military = {
        ...finalDefender.military,
        soldiers: customCounts.defending.soldiers,
        tanks: customCounts.defending.tanks,
        aircraft: customCounts.defending.aircraft,
        ships: customCounts.defending.ships
      };
    }

    // Apply unlimited resources if selected
    if (settings.resourceEconomy === ResourceEconomyMode.UNLIMITED) {
      const unlimitedResources = {
        money: 999999999,
        oil: 999999,
        food: 999999,
        steel: 999999,
        aluminum: 999999,
        gasoline: 999999,
        munitions: 999999,
        uranium: 999999,
        coal: 999999,
        iron: 999999,
        bauxite: 999999,
        lead: 999999
      };
      finalAttacker.resources = unlimitedResources;
      finalDefender.resources = unlimitedResources;
    }

    const finalSettings: MultiplayerSettings = {
      ...settings,
      customNationCounts: useCustomCounts ? customCounts : undefined
    };

    onStartBattle(finalSettings, finalAttacker, finalDefender);
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 space-y-6">
      <h2 className="text-2xl font-bold text-white mb-4">Multiplayer Battle Setup</h2>

      {/* Resource Economy */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-300">
          Resource Economy
        </label>
        <select
          value={settings.resourceEconomy}
          onChange={(e) => setSettings(prev => ({ 
            ...prev, 
            resourceEconomy: e.target.value as ResourceEconomyMode 
          }))}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value={ResourceEconomyMode.UNLIMITED}>Unlimited Resources</option>
          <option value={ResourceEconomyMode.NATION_BASED}>Use Nation Resources</option>
        </select>
      </div>

      {/* Turn Cooldown */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-300">
          Turn Cooldown
        </label>
        <select
          value={settings.turnCooldown}
          onChange={(e) => setSettings(prev => ({ 
            ...prev, 
            turnCooldown: parseInt(e.target.value) as TurnCooldown 
          }))}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value={TurnCooldown.THIRTY_SECONDS}>30 seconds</option>
          <option value={TurnCooldown.ONE_MINUTE}>1 minute</option>
          <option value={TurnCooldown.TWO_MINUTES}>2 minutes</option>
          <option value={TurnCooldown.FIVE_MINUTES}>5 minutes</option>
        </select>
      </div>

      {/* Unit Buying Frequency */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-300">
          Unit Buying Frequency
        </label>
        <select
          value={settings.unitBuyingFrequency}
          onChange={(e) => setSettings(prev => ({ 
            ...prev, 
            unitBuyingFrequency: parseInt(e.target.value) as UnitBuyingFrequency 
          }))}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value={UnitBuyingFrequency.EVERY_TURN}>Every Turn</option>
          <option value={UnitBuyingFrequency.EVERY_TWO_TURNS}>Every 2 Turns</option>
          <option value={UnitBuyingFrequency.EVERY_THREE_TURNS}>Every 3 Turns</option>
          <option value={UnitBuyingFrequency.EVERY_FOUR_TURNS}>Every 4 Turns</option>
          <option value={UnitBuyingFrequency.EVERY_FIVE_TURNS}>Every 5 Turns</option>
        </select>
      </div>

      {/* City Mode */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-300">
          City Build Setup
        </label>
        <select
          value={settings.cityMode}
          onChange={(e) => setSettings(prev => ({ 
            ...prev, 
            cityMode: e.target.value as CityMode 
          }))}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value={CityMode.NATION_CITIES}>Use Nation City Builds</option>
          <option value={CityMode.MAX_MILITARIZATION}>Maximum Militarization</option>
        </select>
      </div>

      {/* Max Militarization Settings */}
      {settings.cityMode === CityMode.MAX_MILITARIZATION && (
        <div className="bg-gray-700 rounded-lg p-4 space-y-4">
          <h3 className="text-lg font-medium text-white">Max Militarization Setup</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Barracks (max 5)
              </label>
              <input
                type="number"
                min="0"
                max="5"
                value={settings.maxMilitarizationSetup?.barracks || 5}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  maxMilitarizationSetup: {
                    ...prev.maxMilitarizationSetup!,
                    barracks: parseInt(e.target.value)
                  }
                }))}
                className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Hangars (max 5)
              </label>
              <input
                type="number"
                min="0"
                max="5"
                value={settings.maxMilitarizationSetup?.hangars || 5}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  maxMilitarizationSetup: {
                    ...prev.maxMilitarizationSetup!,
                    hangars: parseInt(e.target.value)
                  }
                }))}
                className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Factories (max 5)
              </label>
              <input
                type="number"
                min="0"
                max="5"
                value={settings.maxMilitarizationSetup?.factories || 5}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  maxMilitarizationSetup: {
                    ...prev.maxMilitarizationSetup!,
                    factories: parseInt(e.target.value)
                  }
                }))}
                className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Drydocks (max 3)
              </label>
              <input
                type="number"
                min="0"
                max="3"
                value={settings.maxMilitarizationSetup?.drydocks || 3}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  maxMilitarizationSetup: {
                    ...prev.maxMilitarizationSetup!,
                    drydocks: parseInt(e.target.value)
                  }
                }))}
                className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* Custom Unit Counts */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="useCustomCounts"
            checked={useCustomCounts}
            onChange={(e) => setUseCustomCounts(e.target.checked)}
            className="rounded border-gray-600 text-blue-600 focus:ring-blue-500 focus:ring-offset-gray-800"
          />
          <label htmlFor="useCustomCounts" className="text-sm font-medium text-gray-300">
            Use Custom Unit Counts
          </label>
        </div>

        {useCustomCounts && (
          <div className="bg-gray-700 rounded-lg p-4 space-y-6">
            <h3 className="text-lg font-medium text-white">Custom Unit Counts</h3>
            
            {/* Attacking Side */}
            <div className="space-y-3">
              <h4 className="text-md font-medium text-blue-300">Attacking Side</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Soldiers</label>
                  <input
                    type="number"
                    min="0"
                    value={customCounts.attacking.soldiers}
                    onChange={(e) => setCustomCounts(prev => ({
                      ...prev,
                      attacking: { ...prev.attacking, soldiers: parseInt(e.target.value) || 0 }
                    }))}
                    className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Tanks</label>
                  <input
                    type="number"
                    min="0"
                    value={customCounts.attacking.tanks}
                    onChange={(e) => setCustomCounts(prev => ({
                      ...prev,
                      attacking: { ...prev.attacking, tanks: parseInt(e.target.value) || 0 }
                    }))}
                    className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Aircraft</label>
                  <input
                    type="number"
                    min="0"
                    value={customCounts.attacking.aircraft}
                    onChange={(e) => setCustomCounts(prev => ({
                      ...prev,
                      attacking: { ...prev.attacking, aircraft: parseInt(e.target.value) || 0 }
                    }))}
                    className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Ships</label>
                  <input
                    type="number"
                    min="0"
                    value={customCounts.attacking.ships}
                    onChange={(e) => setCustomCounts(prev => ({
                      ...prev,
                      attacking: { ...prev.attacking, ships: parseInt(e.target.value) || 0 }
                    }))}
                    className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Defending Side */}
            <div className="space-y-3">
              <h4 className="text-md font-medium text-red-300">Defending Side</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Soldiers</label>
                  <input
                    type="number"
                    min="0"
                    value={customCounts.defending.soldiers}
                    onChange={(e) => setCustomCounts(prev => ({
                      ...prev,
                      defending: { ...prev.defending, soldiers: parseInt(e.target.value) || 0 }
                    }))}
                    className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Tanks</label>
                  <input
                    type="number"
                    min="0"
                    value={customCounts.defending.tanks}
                    onChange={(e) => setCustomCounts(prev => ({
                      ...prev,
                      defending: { ...prev.defending, tanks: parseInt(e.target.value) || 0 }
                    }))}
                    className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Aircraft</label>
                  <input
                    type="number"
                    min="0"
                    value={customCounts.defending.aircraft}
                    onChange={(e) => setCustomCounts(prev => ({
                      ...prev,
                      defending: { ...prev.defending, aircraft: parseInt(e.target.value) || 0 }
                    }))}
                    className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Ships</label>
                  <input
                    type="number"
                    min="0"
                    value={customCounts.defending.ships}
                    onChange={(e) => setCustomCounts(prev => ({
                      ...prev,
                      defending: { ...prev.defending, ships: parseInt(e.target.value) || 0 }
                    }))}
                    className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Start Battle Button */}
      <button
        onClick={handleStartBattle}
        disabled={!attackingNation || !defendingNation}
        className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
      >
        {!attackingNation || !defendingNation 
          ? 'Please load both nations first' 
          : 'Start Multiplayer Battle'
        }
      </button>
    </div>
  );
}
