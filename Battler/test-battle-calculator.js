"use strict";
/**
 * Test the Locutus-based battle calculator
 */
Object.defineProperty(exports, "__esModule", { value: true });
var battle_calculator_1 = require("./src/lib/battle-calculator");
// Test data for battle calculations
var strongAttacker = {
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
var weakDefender = {
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
var rollResult = (0, battle_calculator_1.roll)(1000, 2000);
console.log("Roll(1000, 2000) = ".concat(rollResult));
// Test victory type calculation
console.log('\n2. Testing victory type:');
var victoryType = (0, battle_calculator_1.getVictoryType)(1000, 2000);
console.log("Victory Type: ".concat(victoryType, " (").concat(battle_calculator_1.VictoryType[victoryType], ")"));
// Test ground attack
console.log('\n3. Testing ground attack:');
var groundResult = (0, battle_calculator_1.calculateGroundAttack)(strongAttacker, weakDefender, strongAttacker.soldiers, strongAttacker.tanks, true);
console.log('Ground Attack Result:');
console.log("Victory Type: ".concat(battle_calculator_1.VictoryType[groundResult.victoryType]));
console.log("Roll: ".concat(groundResult.roll.toFixed(3)));
console.log('Attacker Losses:', groundResult.attackerLosses);
console.log('Defender Losses:', groundResult.defenderLosses);
console.log("Loot: $".concat(groundResult.loot.toFixed(0)));
console.log("Infrastructure Destroyed: ".concat(groundResult.infraDestroyed.toFixed(2)));
// Test air attack
console.log('\n4. Testing air attack:');
var airResult = (0, battle_calculator_1.calculateAirAttack)(strongAttacker, weakDefender, strongAttacker.aircraft, 'soldiers');
console.log('Air Attack Result:');
console.log("Victory Type: ".concat(battle_calculator_1.VictoryType[airResult.victoryType]));
console.log("Roll: ".concat(airResult.roll.toFixed(3)));
console.log('Attacker Losses:', airResult.attackerLosses);
console.log('Defender Losses:', airResult.defenderLosses);
// Test naval attack
console.log('\n5. Testing naval attack:');
var navalResult = (0, battle_calculator_1.calculateNavalAttack)(strongAttacker, weakDefender, strongAttacker.ships);
console.log('Naval Attack Result:');
console.log("Victory Type: ".concat(battle_calculator_1.VictoryType[navalResult.victoryType]));
console.log("Roll: ".concat(navalResult.roll.toFixed(3)));
console.log('Attacker Losses:', navalResult.attackerLosses);
console.log('Defender Losses:', navalResult.defenderLosses);
// Test victory probabilities
console.log('\n6. Testing victory probabilities:');
var probabilities = (0, battle_calculator_1.calculateVictoryProbabilities)(1000, 2000);
console.log('Victory Probabilities:', probabilities);
console.log('\n=== Test Complete ===');
