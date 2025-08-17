"use strict";
/**
 * Politics & War Battle Calculator
 * Based on the Locutus battle simulation algorithms
 * Provides accurate battle victory probability calculations
 */
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VictoryType = void 0;
exports.roll = roll;
exports.getVictoryType = getVictoryType;
exports.calculateGroundAttack = calculateGroundAttack;
exports.calculateAirAttack = calculateAirAttack;
exports.calculateNavalAttack = calculateNavalAttack;
exports.calculateVictoryProbabilities = calculateVictoryProbabilities;
exports.calculateAssuredVictoryRequirement = calculateAssuredVictoryRequirement;
exports.getMaxTankStrength = getMaxTankStrength;
exports.getMaxAirStrength = getMaxAirStrength;
exports.getFortifyFactor = getFortifyFactor;
exports.simulateBattle = simulateBattle;
var VictoryType;
(function (VictoryType) {
    VictoryType[VictoryType["UTTERLY_FAILS"] = 0] = "UTTERLY_FAILS";
    VictoryType[VictoryType["PYRRHIC_VICTORY"] = 1] = "PYRRHIC_VICTORY";
    VictoryType[VictoryType["MODERATE_SUCCESS"] = 2] = "MODERATE_SUCCESS";
    VictoryType[VictoryType["IMMENSE_TRIUMPH"] = 3] = "IMMENSE_TRIUMPH";
})(VictoryType || (exports.VictoryType = VictoryType = {}));
/**
 * Core battle calculation function from Locutus
 * Calculates battle outcome based on defending and attacking strength
 */
function roll(defending, attacking) {
    var minDef = defending * 0.4;
    var minAtt = attacking * 0.4;
    if (attacking <= minDef || attacking === 0) {
        return 0;
    }
    if (defending < minAtt) {
        return 3;
    }
    var defMean = (defending + minDef) * 0.5;
    var greater = attacking - defMean;
    var lessThan = defMean - minAtt;
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
function getVictoryType(defending, attacking) {
    return Math.max(0, Math.min(3, Math.round(roll(defending, attacking))));
}
/**
 * Calculate ground attack outcome
 */
function calculateGroundAttack(attacker, defender, attackSoldiers, attackTanks, useMunitions) {
    if (useMunitions === void 0) { useMunitions = true; }
    // Calculate attack strength
    var attSoldStr = attackSoldiers * (useMunitions ? 1.75 : 1);
    var attTankStr = attackTanks * 40;
    var attStr = attSoldStr + attTankStr;
    // Calculate defense strength
    var defTankStr = Math.min(defender.tanks, defender.cities * 250) * 40;
    var defSoldStr = Math.max(50, defender.soldiers * (defender.munitions > 0 ? 1.75 : 1));
    var defStr = defSoldStr + defTankStr;
    // Calculate battle roll and victory type
    var battleRoll = roll(defStr, attStr);
    var victoryType = getVictoryType(defStr, attStr);
    // Calculate unit losses
    var attFactor = (1680 * (3 - battleRoll) + 1800 * battleRoll) / 3;
    var defFactor = 1680 + (1800 - attFactor);
    var defTankLoss = ((attTankStr * 0.7 + 1) / defFactor + (attSoldStr * 0.7 + 1) / 2250) * 1.33;
    var attTankLoss = ((defTankStr * 0.7 + 1) / attFactor + (defSoldStr * 0.7 + 1) / 2250) * (defender.isFortified ? 1.25 : 1) * 1.33;
    var attSoldLoss = ((defSoldStr * 0.7 + 1) / 22 + (defTankStr * 0.7 + 1) / 7.33) * (defender.isFortified ? 1.25 : 1) * 0.3125;
    var defSoldLoss = (attSoldStr * 0.7 + 1) / 22 + (attTankStr * 0.7 + 1) / 7.33 * 0.3125;
    // Calculate resource consumption
    var attMuni = (0.0002 * attackSoldiers) + 0.01 * attackTanks;
    var attGas = 0.01 * attackTanks;
    var defMuni = 0.01 * Math.min(defender.tanks, defender.cities * 250) + (defender.munitions > 0 ? 0.0002 * defender.soldiers : 0);
    var defGas = 0.01 * Math.min(defender.tanks, defender.cities * 250);
    // Calculate loot and infrastructure damage
    var loot = 0;
    var infraDestroyed = 0;
    if (victoryType > 0) {
        loot = Math.max(0, Math.min(Math.min(((attackSoldiers * 0.99) + (attackTanks * 22.625)) * victoryType, defender.money * 0.75), defender.money - 50000 * defender.cities));
        infraDestroyed = Math.max(Math.min(((attackSoldiers - (defender.soldiers * 0.5)) * 0.000606061 + (attackTanks - (defender.tanks * 0.5)) * 0.01) * 0.95 * (victoryType / 3), defender.avgInfra * 0.2 + 25), 0);
    }
    return {
        victoryType: victoryType,
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
        loot: loot,
        infraDestroyed: infraDestroyed
    };
}
/**
 * Calculate air attack outcome
 */
function calculateAirAttack(attacker, defender, attackAircraft, target) {
    var defStr = Math.min(defender.aircraft, defender.cities * 15);
    var attStr = attackAircraft;
    var battleRoll = roll(defStr, attStr);
    var victoryType = getVictoryType(defStr, attStr);
    // Calculate losses
    var attAirLoss = (defStr * 0.7 + 1) / 140;
    var defAirLoss = (attStr * 0.7 + 1) / 140;
    // Calculate resource consumption
    var attGas = 0.25 * attackAircraft;
    var attMuni = 0.25 * attackAircraft;
    var defGas = 0.25 * defStr;
    var defMuni = 0.25 * defStr;
    // Calculate target damage based on victory type and target
    var targetDamage = 0;
    var infraDestroyed = 0;
    if (victoryType > 0) {
        infraDestroyed = Math.max(Math.min((attackAircraft - (defStr * 0.5)) * 0.35353535 * 0.95 * (battleRoll / 3), defender.avgInfra * 0.5 + 100), 0) / 3; // Not targeting infrastructure directly
        switch (target) {
            case 'soldiers':
                targetDamage = 0.58139534883720930232558139534884 * (battleRoll * Math.round(Math.max(Math.min(defender.soldiers, Math.min(defender.soldiers * 0.75 + 1000, (attackAircraft - defStr * 0.5) * 50 * 0.95)), 0)) / 3);
                break;
            case 'tanks':
                targetDamage = 0.32558139534883720930232558139535 * (battleRoll * Math.round(Math.max(Math.min(defender.tanks, Math.min(defender.tanks * 0.75 + 10, (attackAircraft - defStr * 0.5) * 2.5 * 0.95)), 0)) / 3);
                break;
            case 'ships':
                targetDamage = 0.82926829268292682926829268292683 * (battleRoll * Math.round(Math.max(Math.min(defender.ships, Math.min(defender.ships * 0.5 + 4, (attackAircraft - defStr * 0.5) * 0.0285 * 0.95)), 0)) / 3);
                break;
        }
    }
    return {
        victoryType: victoryType,
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
        infraDestroyed: infraDestroyed
    };
}
/**
 * Calculate naval attack outcome
 */
function calculateNavalAttack(attacker, defender, attackShips) {
    var defShips = defender.ships;
    var attShips = attackShips;
    var battleRoll = roll(defShips, attShips);
    var victoryType = getVictoryType(defShips, attShips);
    // Calculate losses
    var attShipLoss = (defShips * 0.7 + 1) / 375;
    var defShipLoss = (attShips * 0.7 + 1) / 375;
    // Calculate resource consumption
    var attGas = 2 * attackShips;
    var attMuni = 3 * attackShips;
    var defGas = 2 * defShips;
    var defMuni = 3 * defShips;
    // Calculate infrastructure damage
    var infraDestroyed = 0;
    if (victoryType > 0) {
        infraDestroyed = Math.max(Math.min((attackShips - (defShips * 0.5)) * 2.625 * 0.95 * (battleRoll / 3), defender.avgInfra * 0.5 + 25), 0);
    }
    return {
        victoryType: victoryType,
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
        infraDestroyed: infraDestroyed
    };
}
/**
 * Calculate the probability of achieving each victory type
 */
function calculateVictoryProbabilities(defending, attacking) {
    var rollValue = roll(defending, attacking);
    // The roll function returns a value between 0-3, but actual battles have some randomness
    // We can estimate probabilities based on how close we are to each threshold
    var probabilities = {
        utterly_fails: 0,
        pyrrhic_victory: 0,
        moderate_success: 0,
        immense_triumph: 0
    };
    if (rollValue <= 0.5) {
        probabilities.utterly_fails = 1;
    }
    else if (rollValue <= 1.5) {
        probabilities.pyrrhic_victory = 1;
    }
    else if (rollValue <= 2.5) {
        probabilities.moderate_success = 1;
    }
    else {
        probabilities.immense_triumph = 1;
    }
    // Add some smoothing for borderline cases
    var fraction = rollValue % 1;
    if (fraction > 0.3 && fraction < 0.7) {
        var currentType = Math.floor(rollValue);
        var nextType = Math.ceil(rollValue);
        if (currentType !== nextType) {
            var currentProb = 1 - (fraction - 0.3) / 0.4;
            var nextProb = (fraction - 0.3) / 0.4;
            // Reset probabilities
            Object.keys(probabilities).forEach(function (key) {
                probabilities[key] = 0;
            });
            var typeNames = ['utterly_fails', 'pyrrhic_victory', 'moderate_success', 'immense_triumph'];
            probabilities[typeNames[currentType]] = currentProb;
            probabilities[typeNames[nextType]] = nextProb;
        }
    }
    return probabilities;
}
/**
 * Calculate assured victory strength requirements
 */
function calculateAssuredVictoryRequirement(defenseStrength) {
    return Math.ceil(defenseStrength * 2.5);
}
/**
 * Calculate maximum possible tank strength for a nation
 */
function getMaxTankStrength(tanks, cities) {
    return Math.min(tanks, cities * 250);
}
/**
 * Calculate maximum possible air strength for a nation
 */
function getMaxAirStrength(aircraft, cities) {
    return Math.min(aircraft, cities * 15);
}
/**
 * Calculate fortification bonus
 */
function getFortifyFactor(isFortified) {
    return isFortified ? 1.25 : 1;
}
/**
 * Simulate a complete battle sequence
 */
function simulateBattle(attackerUnits, defenderUnits, battlePlan) {
    var results = [];
    // Create working copies of units
    var attacker = __assign({}, attackerUnits);
    var defender = __assign({}, defenderUnits);
    // Execute ground attacks
    for (var _i = 0, _a = battlePlan.groundAttacks; _i < _a.length; _i++) {
        var attack = _a[_i];
        if (attacker.actionPoints >= 3) {
            var result = calculateGroundAttack(attacker, defender, attack.soldiers, attack.tanks, attack.useMunitions);
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
    for (var _b = 0, _c = battlePlan.airAttacks; _b < _c.length; _b++) {
        var attack = _c[_b];
        if (attacker.actionPoints >= 4) {
            var result = calculateAirAttack(attacker, defender, attack.aircraft, attack.target);
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
    for (var _d = 0, _e = battlePlan.navalAttacks; _d < _e.length; _d++) {
        var attack = _e[_d];
        if (attacker.actionPoints >= 4) {
            var result = calculateNavalAttack(attacker, defender, attack.ships);
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
