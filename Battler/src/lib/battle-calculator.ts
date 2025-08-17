/**
 * Politics & War Battle Calculator
 * Based on the Locutus battle simulation algorithms
 * Provides accurate battle victory probability calculations
 */

export interface BattleUnit {
  soldiers: number;
  tanks: number;
  aircraft: number;
  ships: number;
  munitions: number;
  gasoline: number;
  money: number;
  avgInfra: number;
  cities: number;
  isGroundControl: boolean;
  isAirControl: boolean;
  isBlockaded: boolean;
  isFortified: boolean;
  actionPoints: number;
  resistance: number;
}

export interface BattleResult {
  victoryType: VictoryType;
  roll: number;
  attackerLosses: UnitLosses;
  defenderLosses: UnitLosses;
  loot: number;
  infraDestroyed: number;
}

export interface UnitLosses {
  soldiers: number;
  tanks: number;
  aircraft: number;
  ships: number;
  munitions: number;
  gasoline: number;
}

export enum VictoryType {
  UTTERLY_FAILS = 0,
  PYRRHIC_VICTORY = 1,
  MODERATE_SUCCESS = 2,
  IMMENSE_TRIUMPH = 3
}

/**
 * Core battle calculation function from Locutus
 * Calculates battle outcome based on defending and attacking strength
 */
export function roll(defending: number, attacking: number): number {
  const minDef = defending * 0.4;
  const minAtt = attacking * 0.4;
  
  if (attacking <= minDef || attacking === 0) {
    return 0;
  }
  
  if (defending < minAtt) {
    return 3;
  }
  
  const defMean = (defending + minDef) * 0.5;
  const greater = attacking - defMean;
  const lessThan = defMean - minAtt;
  
  if (greater <= 0) {
    return 0;
  }
  
  if (lessThan <= 0) {
    return 3;
  }
  
  return 3 * greater / (greater + lessThan);
}

/**
 * Get victory type (0-3) based on battle roll
 */
export function getVictoryType(defending: number, attacking: number): VictoryType {
  return Math.max(0, Math.min(3, Math.round(roll(defending, attacking)))) as VictoryType;
}

/**
 * Calculate ground attack outcome
 */
export function calculateGroundAttack(
  attacker: BattleUnit,
  defender: BattleUnit,
  attackSoldiers: number,
  attackTanks: number,
  useMunitions: boolean = true
): BattleResult {
  // Calculate attack strength
  const attSoldStr = attackSoldiers * (useMunitions ? 1.75 : 1);
  const attTankStr = attackTanks * 40;
  const attStr = attSoldStr + attTankStr;
  
  // Calculate defense strength
  const defTankStr = Math.min(defender.tanks, defender.cities * 250) * 40;
  const defSoldStr = Math.max(50, defender.soldiers * (defender.munitions > 0 ? 1.75 : 1));
  const defStr = defSoldStr + defTankStr;
  
  // Calculate battle roll and victory type
  const battleRoll = roll(defStr, attStr);
  const victoryType = getVictoryType(defStr, attStr);
  
  // Calculate unit losses
  const attFactor = (1680 * (3 - battleRoll) + 1800 * battleRoll) / 3;
  const defFactor = 1680 + (1800 - attFactor);
  
  const defTankLoss = ((attTankStr * 0.7 + 1) / defFactor + (attSoldStr * 0.7 + 1) / 2250) * 1.33;
  const attTankLoss = ((defTankStr * 0.7 + 1) / attFactor + (defSoldStr * 0.7 + 1) / 2250) * (defender.isFortified ? 1.25 : 1) * 1.33;
  
  const attSoldLoss = ((defSoldStr * 0.7 + 1) / 22 + (defTankStr * 0.7 + 1) / 7.33) * (defender.isFortified ? 1.25 : 1) * 0.3125;
  const defSoldLoss = (attSoldStr * 0.7 + 1) / 22 + (attTankStr * 0.7 + 1) / 7.33 * 0.3125;
  
  // Calculate resource consumption with victory type scaling
  const baseAttMuni = (0.0002 * attackSoldiers) + 0.01 * attackTanks;
  const baseAttGas = 0.01 * attackTanks;
  const baseDefMuni = 0.01 * Math.min(defender.tanks, defender.cities * 250) + (defender.munitions > 0 ? 0.0002 * defender.soldiers : 0);
  const baseDefGas = 0.01 * Math.min(defender.tanks, defender.cities * 250);
  
  // Apply victory type scaling: 0.4 for UF, 0.7 for PV, 0.9 for MS, 1.0 for IT
  const consumptionScale = victoryType === 0 ? 0.4 : victoryType === 1 ? 0.7 : victoryType === 2 ? 0.9 : 1.0;
  
  const attMuni = baseAttMuni * consumptionScale;
  const attGas = baseAttGas * consumptionScale;
  const defMuni = baseDefMuni * consumptionScale;
  const defGas = baseDefGas * consumptionScale;
  
  // Calculate loot and infrastructure damage
  let loot = 0;
  let infraDestroyed = 0;
  
  if (victoryType > 0) {
    loot = Math.max(0, Math.min(
      Math.min(((attackSoldiers * 0.99) + (attackTanks * 22.625)) * victoryType, defender.money * 0.75),
      defender.money - 50000 * defender.cities
    ));
    
    infraDestroyed = Math.max(
      Math.min(
        ((attackSoldiers - (defender.soldiers * 0.5)) * 0.000606061 + (attackTanks - (defender.tanks * 0.5)) * 0.01) * 0.95 * (victoryType / 3),
        defender.avgInfra * 0.2 + 25
      ),
      0
    );
  }
  
  return {
    victoryType,
    roll: battleRoll,
    attackerLosses: {
      soldiers: Math.round(attSoldLoss),
      tanks: Math.round(attTankLoss),
      aircraft: 0,
      ships: 0,
      munitions: attMuni,
      gasoline: attGas
    },
    defenderLosses: {
      soldiers: Math.round(defSoldLoss),
      tanks: Math.round(defTankLoss),
      aircraft: 0,
      ships: 0,
      munitions: defMuni,
      gasoline: defGas
    },
    loot,
    infraDestroyed
  };
}

/**
 * Calculate air attack outcome
 */
export function calculateAirAttack(
  attacker: BattleUnit,
  defender: BattleUnit,
  attackAircraft: number,
  target: 'air' | 'soldiers' | 'tanks' | 'ships' | 'infra'
): BattleResult {
  const defStr = Math.min(defender.aircraft, defender.cities * 15);
  const attStr = attackAircraft;
  
  const battleRoll = roll(defStr, attStr);
  const victoryType = getVictoryType(defStr, attStr);
  
  // Calculate losses using official P&W formulas
  const attAirLoss = (defStr * 0.7) / 54 * 9;
  const defAirLoss = (attStr * 0.7) / 54 * 9;
  
  // Calculate resource consumption with victory type scaling
  const baseAttGas = 0.25 * attackAircraft;
  const baseAttMuni = 0.25 * attackAircraft;
  const baseDefGas = 0.25 * defStr;
  const baseDefMuni = 0.25 * defStr;
  
  // Apply victory type scaling: 0.4 for UF, 0.7 for PV, 0.9 for MS, 1.0 for IT
  const consumptionScale = victoryType === 0 ? 0.4 : victoryType === 1 ? 0.7 : victoryType === 2 ? 0.9 : 1.0;
  
  const attGas = baseAttGas * consumptionScale;
  const attMuni = baseAttMuni * consumptionScale;
  const defGas = baseDefGas * consumptionScale;
  const defMuni = baseDefMuni * consumptionScale;
  
  // Calculate target damage based on victory type and target
  let targetDamage = 0;
  let infraDestroyed = 0;
  
  if (victoryType > 0) {
    infraDestroyed = Math.max(
      Math.min(
        (attackAircraft - (defStr * 0.5)) * 0.35353535 * 0.95 * (battleRoll / 3),
        defender.avgInfra * 0.5 + 100
      ),
      0
    ) / 3; // Not targeting infrastructure directly
    
    switch (target) {
      case 'soldiers':
        targetDamage = 0.58139534883720930232558139534884 * (battleRoll * Math.round(
          Math.max(
            Math.min(
              defender.soldiers,
              Math.min(defender.soldiers * 0.75 + 1000, (attackAircraft - defStr * 0.5) * 50 * 0.95)
            ),
            0
          )
        ) / 3);
        break;
      case 'tanks':
        targetDamage = 0.32558139534883720930232558139535 * (battleRoll * Math.round(
          Math.max(
            Math.min(
              defender.tanks,
              Math.min(defender.tanks * 0.75 + 10, (attackAircraft - defStr * 0.5) * 2.5 * 0.95)
            ),
            0
          )
        ) / 3);
        break;
      case 'ships':
        targetDamage = 0.82926829268292682926829268292683 * (battleRoll * Math.round(
          Math.max(
            Math.min(
              defender.ships,
              Math.min(defender.ships * 0.5 + 4, (attackAircraft - defStr * 0.5) * 0.0285 * 0.95)
            ),
            0
          )
        ) / 3);
        break;
    }
  }
  
  return {
    victoryType,
    roll: battleRoll,
    attackerLosses: {
      soldiers: 0,
      tanks: 0,
      aircraft: Math.round(attAirLoss),
      ships: 0,
      munitions: attMuni,
      gasoline: attGas
    },
    defenderLosses: {
      soldiers: target === 'soldiers' ? Math.round(targetDamage) : 0,
      tanks: target === 'tanks' ? Math.round(targetDamage) : 0,
      aircraft: Math.round(defAirLoss),
      ships: target === 'ships' ? Math.round(targetDamage) : 0,
      munitions: defMuni,
      gasoline: defGas
    },
    loot: 0,
    infraDestroyed
  };
}

/**
 * Calculate naval attack outcome
 */
export function calculateNavalAttack(
  attacker: BattleUnit,
  defender: BattleUnit,
  attackShips: number
): BattleResult {
  const defShips = defender.ships;
  const attShips = attackShips;
  
  const battleRoll = roll(defShips, attShips);
  const victoryType = getVictoryType(defShips, attShips);
  
  // Calculate losses using official P&W formulas
  const attShipLoss = 0.441666 * (defender.isFortified ? 1.25 : 1) * 12 * (defShips * 0.7) / 35;
  const defShipLoss = 0.441666 * 12 * (attShips * 0.7) / 35;
  
  // Calculate resource consumption with victory type scaling
  const baseAttGas = 2 * attackShips;
  const baseAttMuni = 3 * attackShips;
  const baseDefGas = 2 * defShips;
  const baseDefMuni = 3 * defShips;
  
  // Apply victory type scaling: 0.4 for UF, 0.7 for PV, 0.9 for MS, 1.0 for IT
  const consumptionScale = victoryType === 0 ? 0.4 : victoryType === 1 ? 0.7 : victoryType === 2 ? 0.9 : 1.0;
  
  const attGas = baseAttGas * consumptionScale;
  const attMuni = baseAttMuni * consumptionScale;
  const defGas = baseDefGas * consumptionScale;
  const defMuni = baseDefMuni * consumptionScale;
  
  // Calculate infrastructure damage
  let infraDestroyed = 0;
  if (victoryType > 0) {
    infraDestroyed = Math.max(
      Math.min(
        (attackShips - (defShips * 0.5)) * 2.625 * 0.95 * (battleRoll / 3),
        defender.avgInfra * 0.5 + 25
      ),
      0
    );
  }
  
  return {
    victoryType,
    roll: battleRoll,
    attackerLosses: {
      soldiers: 0,
      tanks: 0,
      aircraft: 0,
      ships: Math.round(attShipLoss),
      munitions: attMuni,
      gasoline: attGas
    },
    defenderLosses: {
      soldiers: 0,
      tanks: 0,
      aircraft: 0,
      ships: Math.round(defShipLoss),
      munitions: defMuni,
      gasoline: defGas
    },
    loot: 0,
    infraDestroyed
  };
}

/**
 * Calculate the probability of achieving each victory type
 */
export function calculateVictoryProbabilities(defending: number, attacking: number): {
  utterly_fails: number;
  pyrrhic_victory: number;
  moderate_success: number;
  immense_triumph: number;
} {
  const rollValue = roll(defending, attacking);
  
  // The roll function returns a value between 0-3, but actual battles have some randomness
  // We can estimate probabilities based on how close we are to each threshold
  const probabilities = {
    utterly_fails: 0,
    pyrrhic_victory: 0,
    moderate_success: 0,
    immense_triumph: 0
  };
  
  if (rollValue <= 0.5) {
    probabilities.utterly_fails = 1;
  } else if (rollValue <= 1.5) {
    probabilities.pyrrhic_victory = 1;
  } else if (rollValue <= 2.5) {
    probabilities.moderate_success = 1;
  } else {
    probabilities.immense_triumph = 1;
  }
  
  // Add some smoothing for borderline cases
  const fraction = rollValue % 1;
  if (fraction > 0.3 && fraction < 0.7) {
    const currentType = Math.floor(rollValue);
    const nextType = Math.ceil(rollValue);
    
    if (currentType !== nextType) {
      const currentProb = 1 - (fraction - 0.3) / 0.4;
      const nextProb = (fraction - 0.3) / 0.4;
      
      // Reset probabilities
      Object.keys(probabilities).forEach(key => {
        probabilities[key as keyof typeof probabilities] = 0;
      });
      
      const typeNames = ['utterly_fails', 'pyrrhic_victory', 'moderate_success', 'immense_triumph'];
      probabilities[typeNames[currentType] as keyof typeof probabilities] = currentProb;
      probabilities[typeNames[nextType] as keyof typeof probabilities] = nextProb;
    }
  }
  
  return probabilities;
}

/**
 * Calculate assured victory strength requirements
 */
export function calculateAssuredVictoryRequirement(defenseStrength: number): number {
  return Math.ceil(defenseStrength * 2.5);
}

/**
 * Calculate maximum possible tank strength for a nation
 */
export function getMaxTankStrength(tanks: number, cities: number): number {
  return Math.min(tanks, cities * 250);
}

/**
 * Calculate maximum possible air strength for a nation
 */
export function getMaxAirStrength(aircraft: number, cities: number): number {
  return Math.min(aircraft, cities * 15);
}

/**
 * Calculate fortification bonus
 */
export function getFortifyFactor(isFortified: boolean): number {
  return isFortified ? 1.25 : 1;
}

/**
 * Simulate a complete battle sequence
 */
export function simulateBattle(
  attackerUnits: BattleUnit,
  defenderUnits: BattleUnit,
  battlePlan: {
    groundAttacks: Array<{ soldiers: number; tanks: number; useMunitions: boolean }>;
    airAttacks: Array<{ aircraft: number; target: 'air' | 'soldiers' | 'tanks' | 'ships' | 'infra' }>;
    navalAttacks: Array<{ ships: number }>;
  }
): BattleResult[] {
  const results: BattleResult[] = [];
  
  // Create working copies of units
  const attacker = { ...attackerUnits };
  const defender = { ...defenderUnits };
  
  // Execute ground attacks
  for (const attack of battlePlan.groundAttacks) {
    if (attacker.actionPoints >= 3) {
      const result = calculateGroundAttack(attacker, defender, attack.soldiers, attack.tanks, attack.useMunitions);
      results.push(result);
      
      // Apply losses and effects
      attacker.soldiers -= result.attackerLosses.soldiers;
      attacker.tanks -= result.attackerLosses.tanks;
      attacker.munitions -= result.attackerLosses.munitions;
      attacker.gasoline -= result.attackerLosses.gasoline;
      attacker.money += result.loot;
      attacker.actionPoints -= 3;
      
      defender.soldiers -= result.defenderLosses.soldiers;
      defender.tanks -= result.defenderLosses.tanks;
      defender.munitions -= result.defenderLosses.munitions;
      defender.gasoline -= result.defenderLosses.gasoline;
      defender.money -= result.loot;
      defender.avgInfra -= result.infraDestroyed / defender.cities;
      
      if (result.victoryType > 0) {
        defender.isGroundControl = false;
      }
      if (result.victoryType === 3) {
        attacker.isGroundControl = true;
      }
    }
  }
  
  // Execute air attacks
  for (const attack of battlePlan.airAttacks) {
    if (attacker.actionPoints >= 4) {
      const result = calculateAirAttack(attacker, defender, attack.aircraft, attack.target);
      results.push(result);
      
      // Apply losses and effects
      attacker.aircraft -= result.attackerLosses.aircraft;
      attacker.munitions -= result.attackerLosses.munitions;
      attacker.gasoline -= result.attackerLosses.gasoline;
      attacker.actionPoints -= 4;
      
      defender.aircraft -= result.defenderLosses.aircraft;
      defender.soldiers -= result.defenderLosses.soldiers;
      defender.tanks -= result.defenderLosses.tanks;
      defender.ships -= result.defenderLosses.ships;
      defender.munitions -= result.defenderLosses.munitions;
      defender.gasoline -= result.defenderLosses.gasoline;
      defender.avgInfra -= result.infraDestroyed / defender.cities;
      
      if (result.victoryType > 0) {
        defender.isAirControl = false;
      }
      if (result.victoryType === 3) {
        attacker.isAirControl = true;
      }
    }
  }
  
  // Execute naval attacks
  for (const attack of battlePlan.navalAttacks) {
    if (attacker.actionPoints >= 4) {
      const result = calculateNavalAttack(attacker, defender, attack.ships);
      results.push(result);
      
      // Apply losses and effects
      attacker.ships -= result.attackerLosses.ships;
      attacker.munitions -= result.attackerLosses.munitions;
      attacker.gasoline -= result.attackerLosses.gasoline;
      attacker.actionPoints -= 4;
      
      defender.ships -= result.defenderLosses.ships;
      defender.munitions -= result.defenderLosses.munitions;
      defender.gasoline -= result.defenderLosses.gasoline;
      defender.avgInfra -= result.infraDestroyed / defender.cities;
    }
  }
  
  return results;
}
