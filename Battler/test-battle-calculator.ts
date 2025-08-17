/**
 * Test the Locutus-based battle calculator
 */

import {
  BattleUnit,
  VictoryType,
  calculateGroundAttack,
  calculateAirAttack,
  calculateNavalAttack,
  calculateVictoryProbabilities,
  roll,
  getVictoryType
} from './src/lib/battle-calculator';

// Test data for battle calculations
const strongAttacker: BattleUnit = {
  soldiers: 100000,
  tanks: 5000,
  aircraft: 2000,
  ships: 1000,
  munitions: 10000,
  gasoline: 10000,
  money: 10000000,
  avgInfra: 2000,
  cities: 10,
  isGroundControl: false,
  isAirControl: false,
  isBlockaded: false,
  isFortified: false,
  actionPoints: 12,
  resistance: 100
};

const weakDefender: BattleUnit = {
  soldiers: 50000,
  tanks: 1000,
  aircraft: 500,
  ships: 200,
  munitions: 5000,
  gasoline: 5000,
  money: 5000000,
  avgInfra: 1000,
  cities: 5,
  isGroundControl: false,
  isAirControl: false,
  isBlockaded: false,
  isFortified: false,
  actionPoints: 12,
  resistance: 100
};

console.log('=== Locutus Battle Calculator Test ===');

// Test basic roll function
console.log('\n1. Testing roll function:');
const rollResult = roll(1000, 2000);
console.log(`Roll(1000, 2000) = ${rollResult}`);

// Test victory type calculation
console.log('\n2. Testing victory type:');
const victoryType = getVictoryType(1000, 2000);
console.log(`Victory Type: ${victoryType} (${VictoryType[victoryType]})`);

// Test ground attack
console.log('\n3. Testing ground attack:');
const groundResult = calculateGroundAttack(
  strongAttacker,
  weakDefender,
  strongAttacker.soldiers,
  strongAttacker.tanks,
  true
);

console.log('Ground Attack Result:');
console.log(`Victory Type: ${VictoryType[groundResult.victoryType]}`);
console.log(`Roll: ${groundResult.roll.toFixed(3)}`);
console.log('Attacker Losses:', groundResult.attackerLosses);
console.log('Defender Losses:', groundResult.defenderLosses);
console.log(`Loot: $${groundResult.loot.toFixed(0)}`);
console.log(`Infrastructure Destroyed: ${groundResult.infraDestroyed.toFixed(2)}`);

// Test air attack
console.log('\n4. Testing air attack:');
const airResult = calculateAirAttack(
  strongAttacker,
  weakDefender,
  strongAttacker.aircraft,
  'soldiers'
);

console.log('Air Attack Result:');
console.log(`Victory Type: ${VictoryType[airResult.victoryType]}`);
console.log(`Roll: ${airResult.roll.toFixed(3)}`);
console.log('Attacker Losses:', airResult.attackerLosses);
console.log('Defender Losses:', airResult.defenderLosses);

// Test naval attack
console.log('\n5. Testing naval attack:');
const navalResult = calculateNavalAttack(
  strongAttacker,
  weakDefender,
  strongAttacker.ships
);

console.log('Naval Attack Result:');
console.log(`Victory Type: ${VictoryType[navalResult.victoryType]}`);
console.log(`Roll: ${navalResult.roll.toFixed(3)}`);
console.log('Attacker Losses:', navalResult.attackerLosses);
console.log('Defender Losses:', navalResult.defenderLosses);

// Test victory probabilities
console.log('\n6. Testing victory probabilities:');
const probabilities = calculateVictoryProbabilities(1000, 2000);
console.log('Victory Probabilities:', probabilities);

console.log('\n=== Test Complete ===');
