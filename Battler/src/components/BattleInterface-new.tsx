'use client';

import React, { useState, useEffect } from 'react';
import { BattleSession, SimulatedNation } from '@/types/simulation';

interface BattleInterfaceProps {
  session: BattleSession;
  currentNationId: string;
  onExecuteAction: (action: any) => void;
}

export default function BattleInterface({ session, currentNationId, onExecuteAction }: BattleInterfaceProps) {
  const [selectedCity, setSelectedCity] = useState(0);
  const [actionType, setActionType] = useState('');
  const [recruitmentUnits, setRecruitmentUnits] = useState({
    soldiers: 0,
    tanks: 0,
    aircraft: 0,
    ships: 0
  });
  const [purchaseType, setPurchaseType] = useState('infrastructure');
  const [purchaseAmount, setPurchaseAmount] = useState(100);

  const currentNation = session.participants.find(p => p.id === currentNationId);
  const enemy = session.participants.find(p => p.id !== currentNationId);

  if (!currentNation || !enemy) {
    return <div>Nation not found</div>;
  }

  const currentCity = currentNation.cities[selectedCity];
  const timeRemaining = session.turnTimer;

  // Calculate recruitment capacity
  const calculateRecruitmentCapacity = () => {
    const totalBarracks = currentNation.cities.reduce((sum, city) => sum + city.barracks, 0);
    const totalFactories = currentNation.cities.reduce((sum, city) => sum + city.factory, 0);
    const totalHangars = currentNation.cities.reduce((sum, city) => sum + city.hangar, 0);
    const totalDrydocks = currentNation.cities.reduce((sum, city) => sum + city.drydock, 0);

    return {
      soldiers: totalBarracks * 3000,
      tanks: totalFactories * 300,
      aircraft: totalHangars * 18,
      ships: totalDrydocks * 5
    };
  };

  const recruitmentCapacity = calculateRecruitmentCapacity();

  const handleRecruitment = () => {
    const action = {
      type: 'recruit',
      units: recruitmentUnits
    };
    onExecuteAction(action);
    setRecruitmentUnits({ soldiers: 0, tanks: 0, aircraft: 0, ships: 0 });
  };

  const handlePurchase = () => {
    const action = {
      type: 'purchase',
      cityId: selectedCity.toString(),
      purchaseType,
      item: purchaseType,
      amount: purchaseAmount
    };
    onExecuteAction(action);
    setPurchaseAmount(100);
  };

  const handleAttack = (attackType: string) => {
    const action = {
      type: 'attack',
      attackType,
      target: enemy.id
    };
    onExecuteAction(action);
  };

  const handlePolicyChange = (policyType: string, newPolicy: string) => {
    const action = {
      type: 'policy_change',
      policyType,
      newPolicy
    };
    onExecuteAction(action);
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Battle Header */}
      <div className="bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">Battle Simulation</h1>
          <div className="text-right">
            <div className="text-lg font-semibold text-white">Turn {session.currentTurn}</div>
            <div className="text-sm text-gray-400">Time remaining: {timeRemaining}s</div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-6 mt-6">
          {/* Your Nation */}
          <div className="border-2 border-blue-500 rounded-lg p-4 bg-gray-700">
            <h2 className="text-xl font-bold text-blue-400 mb-2">{currentNation.nation_name}</h2>
            <div className="mb-3">
              <div className="text-lg font-semibold text-yellow-400">
                MAPs: {currentNation.maps}/{currentNation.maxMaps}
              </div>
              <div className="text-xs text-gray-400">Military Action Points</div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm text-gray-300">
              <div>Soldiers: {currentNation.military.soldiers.toLocaleString()}</div>
              <div>Tanks: {currentNation.military.tanks.toLocaleString()}</div>
              <div>Aircraft: {currentNation.military.aircraft.toLocaleString()}</div>
              <div>Ships: {currentNation.military.ships.toLocaleString()}</div>
            </div>
            <div className="mt-2 text-sm text-gray-300">
              <div>Money: ${currentNation.resources.money.toLocaleString()}</div>
              <div>Gasoline: {currentNation.resources.gasoline.toLocaleString()}</div>
              <div>Munitions: {currentNation.resources.munitions.toLocaleString()}</div>
            </div>
          </div>

          {/* Enemy Nation */}
          <div className="border-2 border-red-500 rounded-lg p-4 bg-gray-700">
            <h2 className="text-xl font-bold text-red-400 mb-2">{enemy.nation_name}</h2>
            <div className="mb-3">
              <div className="text-lg font-semibold text-yellow-400">
                MAPs: {enemy.maps}/{enemy.maxMaps}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm text-gray-300">
              <div>Soldiers: {enemy.military.soldiers.toLocaleString()}</div>
              <div>Tanks: {enemy.military.tanks.toLocaleString()}</div>
              <div>Aircraft: {enemy.military.aircraft.toLocaleString()}</div>
              <div>Ships: {enemy.military.ships.toLocaleString()}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Military Actions */}
      <div className="bg-gray-800 rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-bold mb-4 text-white">Military Actions</h2>
        
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-2 text-gray-300">Attack Options</h3>
            <div className="grid grid-cols-3 gap-2">
              <button 
                onClick={() => handleAttack('ground')}
                disabled={currentNation.maps < 3}
                className={`w-full py-3 px-4 rounded-md text-sm font-medium transition-colors ${
                  currentNation.maps >= 3 
                    ? 'bg-red-600 text-white hover:bg-red-700' 
                    : 'bg-gray-500 text-gray-300 cursor-not-allowed'
                }`}
              >
                Ground Attack<br />
                <span className="text-xs">(3 MAPs)</span>
              </button>
              <button 
                onClick={() => handleAttack('air')}
                disabled={currentNation.maps < 4}
                className={`w-full py-3 px-4 rounded-md text-sm font-medium transition-colors ${
                  currentNation.maps >= 4 
                    ? 'bg-red-600 text-white hover:bg-red-700' 
                    : 'bg-gray-500 text-gray-300 cursor-not-allowed'
                }`}
              >
                Air Strike<br />
                <span className="text-xs">(4 MAPs)</span>
              </button>
              <button 
                onClick={() => handleAttack('naval')}
                disabled={currentNation.maps < 4}
                className={`w-full py-3 px-4 rounded-md text-sm font-medium transition-colors ${
                  currentNation.maps >= 4 
                    ? 'bg-red-600 text-white hover:bg-red-700' 
                    : 'bg-gray-500 text-gray-300 cursor-not-allowed'
                }`}
              >
                Naval Attack<br />
                <span className="text-xs">(4 MAPs)</span>
              </button>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2 text-gray-300">Recruitment</h3>
            <div className="text-sm text-gray-400 mb-2">
              Capacity per turn: {recruitmentCapacity.soldiers.toLocaleString()} soldiers, 
              {recruitmentCapacity.tanks.toLocaleString()} tanks, 
              {recruitmentCapacity.aircraft} aircraft, 
              {recruitmentCapacity.ships} ships
            </div>
            <div className="grid grid-cols-4 gap-2 mb-2">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Soldiers</label>
                <input
                  type="number"
                  value={recruitmentUnits.soldiers}
                  onChange={(e) => setRecruitmentUnits({...recruitmentUnits, soldiers: parseInt(e.target.value) || 0})}
                  max={recruitmentCapacity.soldiers}
                  className="w-full p-1 text-xs bg-gray-700 border border-gray-600 rounded text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Tanks</label>
                <input
                  type="number"
                  value={recruitmentUnits.tanks}
                  onChange={(e) => setRecruitmentUnits({...recruitmentUnits, tanks: parseInt(e.target.value) || 0})}
                  max={recruitmentCapacity.tanks}
                  className="w-full p-1 text-xs bg-gray-700 border border-gray-600 rounded text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Aircraft</label>
                <input
                  type="number"
                  value={recruitmentUnits.aircraft}
                  onChange={(e) => setRecruitmentUnits({...recruitmentUnits, aircraft: parseInt(e.target.value) || 0})}
                  max={recruitmentCapacity.aircraft}
                  className="w-full p-1 text-xs bg-gray-700 border border-gray-600 rounded text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Ships</label>
                <input
                  type="number"
                  value={recruitmentUnits.ships}
                  onChange={(e) => setRecruitmentUnits({...recruitmentUnits, ships: parseInt(e.target.value) || 0})}
                  max={recruitmentCapacity.ships}
                  className="w-full p-1 text-xs bg-gray-700 border border-gray-600 rounded text-white"
                />
              </div>
            </div>
            <button 
              onClick={handleRecruitment}
              className="bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 text-sm"
            >
              Recruit Units
            </button>
          </div>
        </div>
      </div>

      {/* City Management */}
      <div className="bg-gray-800 rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-bold mb-4 text-white">City Management</h2>
        
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2 text-gray-300">Select City</label>
          <select 
            value={selectedCity}
            onChange={(e) => setSelectedCity(parseInt(e.target.value))}
            className="w-full p-2 border border-gray-600 rounded-md text-sm bg-gray-700 text-white"
          >
            {currentNation.cities.map((city, index) => (
              <option key={index} value={index}>
                {city.name || `City ${index + 1}`} (Infra: {city.infrastructure}, Land: {city.land})
              </option>
            ))}
          </select>
        </div>

        {currentCity && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-sm text-gray-300">
                <h4 className="font-semibold text-white mb-2">Military Buildings</h4>
                <div>Barracks: {currentCity.barracks}/5</div>
                <div>Factories: {currentCity.factory}/5</div>
                <div>Hangars: {currentCity.hangar}/5</div>
                <div>Drydocks: {currentCity.drydock}/3</div>
              </div>
              <div className="text-sm text-gray-300">
                <h4 className="font-semibold text-white mb-2">Infrastructure</h4>
                <div>Infrastructure: {currentCity.infrastructure}</div>
                <div>Land: {currentCity.land}</div>
                <div>Powered: {currentCity.powered ? 'Yes' : 'No'}</div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-2">Purchase</h4>
              <div className="grid grid-cols-3 gap-2 mb-2">
                <select 
                  value={purchaseType}
                  onChange={(e) => setPurchaseType(e.target.value)}
                  className="p-2 border border-gray-600 rounded-md text-sm bg-gray-700 text-white"
                >
                  <option value="infrastructure">Infrastructure</option>
                  <option value="land">Land</option>
                  <option value="barracks">Barracks</option>
                  <option value="factory">Factory</option>
                  <option value="hangar">Hangar</option>
                  <option value="drydock">Drydock</option>
                </select>
                <input
                  type="number"
                  value={purchaseAmount}
                  onChange={(e) => setPurchaseAmount(parseInt(e.target.value) || 0)}
                  className="p-2 border border-gray-600 rounded-md text-sm bg-gray-700 text-white"
                  placeholder="Amount"
                />
                <button 
                  onClick={handlePurchase}
                  className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 text-sm"
                >
                  Purchase
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Policies & Settings */}
      <div className="bg-gray-800 rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-bold mb-4 text-white">Policies & Settings</h2>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-300">War Policy</label>
            <select 
              value={currentNation.war_policy}
              onChange={(e) => handlePolicyChange('war_policy', e.target.value)}
              className="w-full p-2 border border-gray-600 rounded-md text-sm bg-gray-700 text-white"
            >
              <option value="BLITZKRIEG">Blitzkrieg</option>
              <option value="FORTRESS">Fortress</option>
              <option value="GUARDIAN">Guardian</option>
              <option value="COVERT">Covert</option>
              <option value="ARCANE">Arcane</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-300">Domestic Policy</label>
            <select 
              value={currentNation.domestic_policy}
              onChange={(e) => handlePolicyChange('domestic_policy', e.target.value)}
              className="w-full p-2 border border-gray-600 rounded-md text-sm bg-gray-700 text-white"
            >
              <option value="IMPERIALISM">Imperialism</option>
              <option value="URBANIZATION">Urbanization</option>
              <option value="RAPID_EXPANSION">Rapid Expansion</option>
              <option value="TECHNOLOGICAL_ADVANCEMENT">Technological Advancement</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
