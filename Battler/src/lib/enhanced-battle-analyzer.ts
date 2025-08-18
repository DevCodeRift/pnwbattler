/**
 * Enhanced Battle Analysis System
 * Provides detailed pre-battle analysis including victory probabilities and casualty estimates
 */

import { SimulatedNation, AttackType } from '../types/simulation';

export interface BattleAnalysis {
  victoryProbabilities: {
    immenseTriumph: number;
    moderateSuccess: number;
    pyrrhicVictory: number;
    utterFailure: number;
  };
  estimatedCasualties: {
    attacker: {
      soldiers: { min: number; max: number; avg: number };
      tanks: { min: number; max: number; avg: number };
      aircraft: { min: number; max: number; avg: number };
      ships: { min: number; max: number; avg: number };
    };
    defender: {
      soldiers: { min: number; max: number; avg: number };
      tanks: { min: number; max: number; avg: number };
      aircraft: { min: number; max: number; avg: number };
      ships: { min: number; max: number; avg: number };
    };
  };
  armyStrengths: {
    attacker: number;
    defender: number;
    ratio: number;
  };
  resourceConsumption: {
    munitions: number;
    gasoline: number;
    maps: number;
  };
  battleFactors: {
    attackerAdvantages: string[];
    defenderAdvantages: string[];
    warnings: string[];
  };
  recommendation: 'highly_recommended' | 'recommended' | 'risky' | 'not_recommended';
}

export interface DetailedBattleResult {
  outcome: 'IT' | 'MS' | 'PV' | 'UF';
  attackerWins: number;
  success: boolean;
  rolls: {
    attacker: number[];
    defender: number[];
  };
  casualties: {
    attacker: { soldiers: number; tanks: number; aircraft: number; ships: number };
    defender: { soldiers: number; tanks: number; aircraft: number; ships: number };
  };
  resourcesUsed: {
    munitions: number;
    gasoline: number;
  };
  battleLog: string[];
  analysis: {
    strengthRatio: number;
    rollQuality: 'excellent' | 'good' | 'average' | 'poor';
    casualtyEfficiency: number;
    tacticalSummary: string;
  };
}

export class EnhancedBattleAnalyzer {
  /**
   * Analyze a potential battle before execution
   */
  static analyzeBattle(
    attacker: SimulatedNation, 
    defender: SimulatedNation, 
    attackType: AttackType
  ): BattleAnalysis {
    const armyStrengths = this.calculateArmyStrengths(attacker, defender, attackType);
    const victoryProbs = this.calculateVictoryProbabilities(armyStrengths);
    const casualtyEstimates = this.estimateCasualties(attacker, defender, attackType, victoryProbs);
    const resourceConsumption = this.calculateResourceConsumption(attacker, attackType);
    const battleFactors = this.analyzeBattleFactors(attacker, defender, attackType);
    const recommendation = this.getRecommendation(victoryProbs, armyStrengths, battleFactors);

    return {
      victoryProbabilities: victoryProbs,
      estimatedCasualties: casualtyEstimates,
      armyStrengths,
      resourceConsumption,
      battleFactors,
      recommendation
    };
  }

  /**
   * Calculate army strengths for different attack types
   */
  private static calculateArmyStrengths(
    attacker: SimulatedNation, 
    defender: SimulatedNation, 
    attackType: AttackType
  ) {
    let attackerStrength = 0;
    let defenderStrength = 0;

    switch (attackType) {
      case AttackType.GROUND:
        attackerStrength = this.calculateGroundArmyValue(attacker);
        defenderStrength = this.calculateGroundArmyValue(defender);
        break;
      case AttackType.AIR:
        attackerStrength = attacker.military.aircraft * 20;
        defenderStrength = defender.military.aircraft * 20;
        break;
      case AttackType.NAVAL:
        attackerStrength = attacker.military.ships * 100;
        defenderStrength = defender.military.ships * 100;
        break;
    }

    const ratio = defenderStrength > 0 ? attackerStrength / defenderStrength : attackerStrength > 0 ? 999 : 1;

    return {
      attacker: attackerStrength,
      defender: defenderStrength,
      ratio
    };
  }

  /**
   * Calculate ground army value using P&W formula
   */
  private static calculateGroundArmyValue(nation: SimulatedNation): number {
    const soldierValue = this.calculateSoldierArmyValue(nation);
    const tankValue = nation.resources.gasoline > 0 ? nation.military.tanks * 40 : 0;
    return soldierValue + tankValue;
  }

  /**
   * Calculate soldier army value component
   */
  private static calculateSoldierArmyValue(nation: SimulatedNation): number {
    const hasMunitions = nation.resources.munitions > 0;
    
    if (hasMunitions) {
      const maxArmedSoldiers = Math.min(nation.military.soldiers, nation.resources.munitions * 5000);
      const unarmedSoldiers = Math.max(0, nation.military.soldiers - maxArmedSoldiers);
      return (unarmedSoldiers * 1.0) + (maxArmedSoldiers * 1.75);
    } else {
      return nation.military.soldiers * 1.0;
    }
  }

  /**
   * Calculate victory probabilities based on army strength ratio
   */
  private static calculateVictoryProbabilities(armyStrengths: { attacker: number; defender: number; ratio: number }) {
    const { ratio } = armyStrengths;
    
    // Simulate 1000 battles to get accurate probabilities
    let itCount = 0, msCount = 0, pvCount = 0, ufCount = 0;
    
    for (let i = 0; i < 1000; i++) {
      const attackerRolls = this.simulateBattleRolls(armyStrengths.attacker);
      const defenderRolls = this.simulateBattleRolls(armyStrengths.defender);
      
      let attackerWins = 0;
      for (let j = 0; j < 3; j++) {
        if (attackerRolls[j] > defenderRolls[j]) {
          attackerWins++;
        }
      }
      
      if (attackerWins === 3) itCount++;
      else if (attackerWins === 2) msCount++;
      else if (attackerWins === 1) pvCount++;
      else ufCount++;
    }

    return {
      immenseTriumph: itCount / 10,
      moderateSuccess: msCount / 10,
      pyrrhicVictory: pvCount / 10,
      utterFailure: ufCount / 10
    };
  }

  /**
   * Simulate battle rolls for probability calculation
   */
  private static simulateBattleRolls(armyValue: number): number[] {
    return [
      armyValue * (0.4 + Math.random() * 0.6),
      armyValue * (0.4 + Math.random() * 0.6),
      armyValue * (0.4 + Math.random() * 0.6)
    ];
  }

  /**
   * Estimate casualties for different victory outcomes
   */
  private static estimateCasualties(
    attacker: SimulatedNation,
    defender: SimulatedNation,
    attackType: AttackType,
    victoryProbs: any
  ) {
    if (attackType === AttackType.GROUND) {
      return this.estimateGroundCasualties(attacker, defender, victoryProbs);
    } else {
      return this.estimateAirNavalCasualties(attacker, defender, attackType, victoryProbs);
    }
  }

  /**
   * Estimate ground battle casualties using P&W formulas
   */
  private static estimateGroundCasualties(
    attacker: SimulatedNation,
    defender: SimulatedNation,
    victoryProbs: any
  ) {
    const attackerSoldierValue = this.calculateSoldierArmyValue(attacker);
    const attackerTankValue = attacker.military.tanks * 40;
    const defenderSoldierValue = this.calculateSoldierArmyValue(defender);
    const defenderTankValue = defender.military.tanks * 40;

    // Calculate average casualties across different outcomes
    const avgATSR = attackerSoldierValue * 0.7; // Average roll
    const avgATTR = attackerTankValue * 0.7;
    const avgDTSR = defenderSoldierValue * 0.7;
    const avgDTTR = defenderTankValue * 0.7;

    // Calculate casualties for winning scenario
    const winTankCas = (avgDTSR * 0.0004060606) + (avgDTTR * 0.00066666666);
    const winSoldierCas = (avgDTSR * 0.0084) + (avgDTTR * 0.0092);

    // Calculate casualties for losing scenario
    const loseTankCas = (avgDTSR * 0.00043225806) + (avgDTTR * 0.00070967741);
    const loseSoldierCas = (avgDTSR * 0.0084) + (avgDTTR * 0.0092);

    // Weight by victory probabilities
    const successRate = (victoryProbs.immenseTriumph + victoryProbs.moderateSuccess) / 100;
    
    const attackerTankCas = (winTankCas * successRate) + (loseTankCas * (1 - successRate));
    const attackerSoldierCas = winSoldierCas; // Same formula regardless

    const defenderTankCas = (loseTankCas * successRate) + (winTankCas * (1 - successRate));
    const defenderSoldierCas = (avgATSR * 0.0084) + (avgATTR * 0.0092);

    return {
      attacker: {
        soldiers: { 
          min: Math.floor(attackerSoldierCas * 0.7), 
          max: Math.floor(attackerSoldierCas * 1.3), 
          avg: Math.floor(attackerSoldierCas) 
        },
        tanks: { 
          min: Math.floor(attackerTankCas * 0.7), 
          max: Math.floor(attackerTankCas * 1.3), 
          avg: Math.floor(attackerTankCas) 
        },
        aircraft: { min: 0, max: 0, avg: 0 },
        ships: { min: 0, max: 0, avg: 0 }
      },
      defender: {
        soldiers: { 
          min: Math.floor(defenderSoldierCas * 0.7), 
          max: Math.floor(defenderSoldierCas * 1.3), 
          avg: Math.floor(defenderSoldierCas) 
        },
        tanks: { 
          min: Math.floor(defenderTankCas * 0.7), 
          max: Math.floor(defenderTankCas * 1.3), 
          avg: Math.floor(defenderTankCas) 
        },
        aircraft: { min: 0, max: 0, avg: 0 },
        ships: { min: 0, max: 0, avg: 0 }
      }
    };
  }

  /**
   * Estimate air/naval casualties using simplified rates
   */
  private static estimateAirNavalCasualties(
    attacker: SimulatedNation,
    defender: SimulatedNation,
    attackType: AttackType,
    victoryProbs: any
  ) {
    const successRate = (victoryProbs.immenseTriumph + victoryProbs.moderateSuccess) / 100;
    
    // Base casualty rates
    const attackerCasRate = successRate > 0.5 ? 0.025 : 0.14; // 2.5% if likely to win, 14% if likely to lose
    const defenderCasRate = successRate > 0.5 ? 0.14 : 0.04; // 14% if attacker likely to win, 4% if defender likely to win

    if (attackType === AttackType.AIR) {
      const attackerCas = Math.floor(attacker.military.aircraft * attackerCasRate);
      const defenderCas = Math.floor(defender.military.aircraft * defenderCasRate);
      
      return {
        attacker: {
          soldiers: { min: 0, max: 0, avg: 0 },
          tanks: { min: 0, max: 0, avg: 0 },
          aircraft: { min: Math.floor(attackerCas * 0.7), max: Math.floor(attackerCas * 1.3), avg: attackerCas },
          ships: { min: 0, max: 0, avg: 0 }
        },
        defender: {
          soldiers: { min: 0, max: 0, avg: 0 },
          tanks: { min: 0, max: 0, avg: 0 },
          aircraft: { min: Math.floor(defenderCas * 0.7), max: Math.floor(defenderCas * 1.3), avg: defenderCas },
          ships: { min: 0, max: 0, avg: 0 }
        }
      };
    } else { // Naval
      const attackerCas = Math.floor(attacker.military.ships * attackerCasRate);
      const defenderCas = Math.floor(defender.military.ships * defenderCasRate);
      
      return {
        attacker: {
          soldiers: { min: 0, max: 0, avg: 0 },
          tanks: { min: 0, max: 0, avg: 0 },
          aircraft: { min: 0, max: 0, avg: 0 },
          ships: { min: Math.floor(attackerCas * 0.7), max: Math.floor(attackerCas * 1.3), avg: attackerCas }
        },
        defender: {
          soldiers: { min: 0, max: 0, avg: 0 },
          tanks: { min: 0, max: 0, avg: 0 },
          aircraft: { min: 0, max: 0, avg: 0 },
          ships: { min: Math.floor(defenderCas * 0.7), max: Math.floor(defenderCas * 1.3), avg: defenderCas }
        }
      };
    }
  }

  /**
   * Calculate resource consumption for the attack
   */
  private static calculateResourceConsumption(attacker: SimulatedNation, attackType: AttackType) {
    const mapCosts = {
      [AttackType.GROUND]: 3,
      [AttackType.AIR]: 4,
      [AttackType.NAVAL]: 4
    };

    let munitions = 0;
    let gasoline = 0;

    if (attackType === AttackType.GROUND) {
      // Estimate munitions usage based on armed soldiers
      const armedSoldiers = Math.min(attacker.military.soldiers, attacker.resources.munitions * 5000);
      munitions = Math.ceil(armedSoldiers / 5000);
      
      // Estimate gasoline usage for tanks
      gasoline = Math.min(attacker.military.tanks * 0.1, attacker.resources.gasoline);
    } else if (attackType === AttackType.AIR) {
      gasoline = Math.min(attacker.military.aircraft * 2, attacker.resources.gasoline);
    } else if (attackType === AttackType.NAVAL) {
      gasoline = Math.min(attacker.military.ships * 5, attacker.resources.gasoline);
    }

    return {
      munitions,
      gasoline,
      maps: mapCosts[attackType]
    };
  }

  /**
   * Analyze battle factors and advantages
   */
  private static analyzeBattleFactors(
    attacker: SimulatedNation,
    defender: SimulatedNation,
    attackType: AttackType
  ) {
    const advantages: string[] = [];
    const defenderAdvantages: string[] = [];
    const warnings: string[] = [];

    // Check resources
    if (attackType === AttackType.GROUND) {
      if (attacker.resources.munitions <= 0) {
        warnings.push("No munitions - soldiers will fight unarmed (reduced effectiveness)");
      } else {
        advantages.push("Armed soldiers with munitions");
      }
      
      if (attacker.resources.gasoline <= 0) {
        warnings.push("No gasoline - tanks cannot operate");
      } else {
        advantages.push("Tanks operational with gasoline");
      }
    }

    // Check MAPs
    if (attacker.maps < 3) {
      warnings.push("Insufficient MAPs for ground attack");
    }
    if (attacker.maps < 4 && (attackType === AttackType.AIR || attackType === AttackType.NAVAL)) {
      warnings.push(`Insufficient MAPs for ${attackType} attack`);
    }

    // Army size comparison
    const armyStrengths = this.calculateArmyStrengths(attacker, defender, attackType);
    if (armyStrengths.ratio > 2) {
      advantages.push("Significant army advantage");
    } else if (armyStrengths.ratio > 1.5) {
      advantages.push("Moderate army advantage");
    } else if (armyStrengths.ratio < 0.5) {
      defenderAdvantages.push("Defender has significant army advantage");
      warnings.push("Enemy significantly outnumbers you");
    } else if (armyStrengths.ratio < 0.75) {
      defenderAdvantages.push("Defender has moderate army advantage");
    }

    return {
      attackerAdvantages: advantages,
      defenderAdvantages,
      warnings
    };
  }

  /**
   * Get battle recommendation based on analysis
   */
  private static getRecommendation(
    victoryProbs: any,
    armyStrengths: any,
    battleFactors: any
  ): 'highly_recommended' | 'recommended' | 'risky' | 'not_recommended' {
    const successRate = victoryProbs.immenseTriumph + victoryProbs.moderateSuccess;
    const hasWarnings = battleFactors.warnings.length > 0;
    
    if (successRate >= 80 && !hasWarnings) {
      return 'highly_recommended';
    } else if (successRate >= 60 && battleFactors.warnings.length <= 1) {
      return 'recommended';
    } else if (successRate >= 40 || (successRate >= 30 && battleFactors.warnings.length <= 1)) {
      return 'risky';
    } else {
      return 'not_recommended';
    }
  }
}
