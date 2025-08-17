'use client';

import React, { useState } from 'react';
import { SimulatedNation, MilitaryBuild } from '@/types/simulation';

interface UnitPurchaseInterfaceProps {
  player: SimulatedNation;
  canPurchase: boolean;
  onPurchase: (purchases: Partial<MilitaryBuild>) => void;
  turnTimer: number;
  nextBuyableIn?: number;
}

export default function UnitPurchaseInterface({ 
  player, 
  canPurchase, 
  onPurchase, 
  turnTimer,
  nextBuyableIn 
}: UnitPurchaseInterfaceProps) {
  const [purchases, setPurchases] = useState<Partial<MilitaryBuild>>({
    soldiers: 0,
    tanks: 0,
    aircraft: 0,
    ships: 0
  });

  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false);

  // Unit costs (simplified P&W costs)
  const unitCosts = {
    soldiers: { money: 2.5, munitions: 1 },
    tanks: { money: 50, steel: 1, gasoline: 1 },
    aircraft: { money: 100, aluminum: 2, gasoline: 2 },
    ships: { money: 150, steel: 3, gasoline: 2 }
  };

  const calculateTotalCosts = () => {
    const totals: Record<string, number> = {
      money: 0,
      steel: 0,
      aluminum: 0,
      gasoline: 0,
      munitions: 0
    };

    Object.entries(purchases).forEach(([unitType, amount]) => {
      if (amount && amount > 0) {
        const costs = unitCosts[unitType as keyof typeof unitCosts];
        Object.entries(costs).forEach(([resource, cost]) => {
          totals[resource] += cost * amount;
        });
      }
    });

    return totals;
  };

  const canAfford = () => {
    const costs = calculateTotalCosts();
    return Object.entries(costs).every(([resource, cost]) => {
      if (resource in player.resources) {
        return (player.resources as any)[resource] >= cost;
      }
      return true;
    });
  };

  const handlePurchase = () => {
    if (!canPurchase || !canAfford()) return;

    onPurchase(purchases);
    setPurchases({
      soldiers: 0,
      tanks: 0,
      aircraft: 0,
      ships: 0
    });
    setShowPurchaseDialog(false);
  };

  const hasUnitsSelected = Object.values(purchases).some(amount => amount && amount > 0);
  const totalCosts = calculateTotalCosts();

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-white">Unit Recruitment</h3>
        <div className="text-sm text-gray-300">
          Turn Timer: {Math.floor(turnTimer / 60)}:{(turnTimer % 60).toString().padStart(2, '0')}
        </div>
      </div>

      {/* Purchase Status */}
      <div className="mb-4 p-3 rounded-lg bg-gray-700">
        {canPurchase ? (
          <div className="text-green-400">✓ Ready to purchase units</div>
        ) : nextBuyableIn ? (
          <div className="text-yellow-400">
            ⏳ Next purchase available in {nextBuyableIn} turn{nextBuyableIn > 1 ? 's' : ''}
          </div>
        ) : (
          <div className="text-red-400">✗ Cannot purchase units this turn</div>
        )}
      </div>

      {/* Quick Unit Purchase Buttons */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <button
          onClick={() => setShowPurchaseDialog(true)}
          disabled={!canPurchase}
          className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors text-sm"
        >
          Purchase Units
        </button>
        <button
          onClick={() => {
            // Quick buy 1000 soldiers
            if (canPurchase) {
              onPurchase({ soldiers: 1000 });
            }
          }}
          disabled={!canPurchase || player.resources.money < 2500 || player.resources.munitions < 1000}
          className="px-3 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors text-sm"
        >
          Quick: 1K Soldiers
        </button>
      </div>

      {/* Current Resources */}
      <div className="text-xs text-gray-400 space-y-1">
        <div className="grid grid-cols-3 gap-2">
          <div>💰 ${player.resources.money.toLocaleString()}</div>
          <div>🔧 Steel: {player.resources.steel.toLocaleString()}</div>
          <div>⚙️ Aluminum: {player.resources.aluminum.toLocaleString()}</div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div>⛽ Gas: {player.resources.gasoline.toLocaleString()}</div>
          <div>💣 Munitions: {player.resources.munitions.toLocaleString()}</div>
          <div></div>
        </div>
      </div>

      {/* Purchase Dialog */}
      {showPurchaseDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-96 max-h-96 overflow-y-auto">
            <h3 className="text-lg font-bold text-white mb-4">Purchase Military Units</h3>
            
            <div className="space-y-4">
              {/* Soldiers */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Soldiers (${unitCosts.soldiers.money} + {unitCosts.soldiers.munitions} munitions each)
                </label>
                <input
                  type="number"
                  min="0"
                  value={purchases.soldiers || 0}
                  onChange={(e) => setPurchases(prev => ({ 
                    ...prev, 
                    soldiers: parseInt(e.target.value) || 0 
                  }))}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Tanks */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Tanks (${unitCosts.tanks.money} + {unitCosts.tanks.steel} steel + {unitCosts.tanks.gasoline} gas each)
                </label>
                <input
                  type="number"
                  min="0"
                  value={purchases.tanks || 0}
                  onChange={(e) => setPurchases(prev => ({ 
                    ...prev, 
                    tanks: parseInt(e.target.value) || 0 
                  }))}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Aircraft */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Aircraft (${unitCosts.aircraft.money} + {unitCosts.aircraft.aluminum} aluminum + {unitCosts.aircraft.gasoline} gas each)
                </label>
                <input
                  type="number"
                  min="0"
                  value={purchases.aircraft || 0}
                  onChange={(e) => setPurchases(prev => ({ 
                    ...prev, 
                    aircraft: parseInt(e.target.value) || 0 
                  }))}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Ships */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Ships (${unitCosts.ships.money} + {unitCosts.ships.steel} steel + {unitCosts.ships.gasoline} gas each)
                </label>
                <input
                  type="number"
                  min="0"
                  value={purchases.ships || 0}
                  onChange={(e) => setPurchases(prev => ({ 
                    ...prev, 
                    ships: parseInt(e.target.value) || 0 
                  }))}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Total Costs */}
              {hasUnitsSelected && (
                <div className="bg-gray-700 rounded-lg p-3">
                  <h4 className="text-sm font-medium text-white mb-2">Total Cost:</h4>
                  <div className="text-xs text-gray-300 space-y-1">
                    <div className="flex justify-between">
                      <span>Money:</span>
                      <span className={totalCosts.money > player.resources.money ? 'text-red-400' : 'text-green-400'}>
                        ${totalCosts.money.toLocaleString()}
                      </span>
                    </div>
                    {totalCosts.steel > 0 && (
                      <div className="flex justify-between">
                        <span>Steel:</span>
                        <span className={totalCosts.steel > player.resources.steel ? 'text-red-400' : 'text-green-400'}>
                          {totalCosts.steel.toLocaleString()}
                        </span>
                      </div>
                    )}
                    {totalCosts.aluminum > 0 && (
                      <div className="flex justify-between">
                        <span>Aluminum:</span>
                        <span className={totalCosts.aluminum > player.resources.aluminum ? 'text-red-400' : 'text-green-400'}>
                          {totalCosts.aluminum.toLocaleString()}
                        </span>
                      </div>
                    )}
                    {totalCosts.gasoline > 0 && (
                      <div className="flex justify-between">
                        <span>Gasoline:</span>
                        <span className={totalCosts.gasoline > player.resources.gasoline ? 'text-red-400' : 'text-green-400'}>
                          {totalCosts.gasoline.toLocaleString()}
                        </span>
                      </div>
                    )}
                    {totalCosts.munitions > 0 && (
                      <div className="flex justify-between">
                        <span>Munitions:</span>
                        <span className={totalCosts.munitions > player.resources.munitions ? 'text-red-400' : 'text-green-400'}>
                          {totalCosts.munitions.toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end space-x-2 pt-4">
                <button
                  onClick={() => setShowPurchaseDialog(false)}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePurchase}
                  disabled={!hasUnitsSelected || !canAfford() || !canPurchase}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                >
                  Purchase
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
