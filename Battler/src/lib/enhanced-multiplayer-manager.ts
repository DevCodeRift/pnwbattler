/**
 * Enhanced Multiplayer Manager with Battle Analysis Integration
 * Provides comprehensive battle management with detailed analysis and logging
 */

import { BattleSimulationEngine } from './battle-simulation-engine';
import { EnhancedBattleAnalyzer, type BattleAnalysis, type DetailedBattleResult } from './enhanced-battle-analyzer';
import { AttackType, type SimulatedNation, type BattleSession } from '../types/simulation';

export interface EnhancedBattleAction {
  action: 'attack' | 'recruit' | 'purchase' | 'end_turn';
  details: {
    type?: AttackType;
    target?: string;
    analysis?: BattleAnalysis;
    units?: any;
    purchases?: any;
  };
}

export interface EnhancedBattleSession extends BattleSession {
  battleAnalytics: {
    totalBattles: number;
    playerStats: Record<string, {
      wins: number;
      losses: number;
      totalDamageDealt: number;
      totalDamageReceived: number;
      favoriteAttackType: AttackType;
      bestVictoryType: string;
    }>;
    battleHistory: DetailedBattleResult[];
  };
  preAttackAnalyses: BattleAnalysis[];
}

export class EnhancedMultiplayerManager {
  private battleEngine: BattleSimulationEngine;
  private sessions: Map<string, EnhancedBattleSession> = new Map();

  constructor() {
    this.battleEngine = new BattleSimulationEngine();
  }

  /**
   * Create an enhanced battle session with analytics
   */
  createEnhancedSession(
    sessionId: string,
    settings: any,
    hostNation: Partial<SimulatedNation>,
    multiplayerSettings?: any
  ): EnhancedBattleSession {
    const baseSession = this.battleEngine.createSession(settings, hostNation, multiplayerSettings);
    
    const enhancedSession: EnhancedBattleSession = {
      ...baseSession,
      battleAnalytics: {
        totalBattles: 0,
        playerStats: {},
        battleHistory: []
      },
      preAttackAnalyses: []
    };

    this.sessions.set(sessionId, enhancedSession);
    return enhancedSession;
  }

  /**
   * Get pre-battle analysis for an attack
   */
  getPreBattleAnalysis(
    sessionId: string,
    attackerId: string,
    targetId: string,
    attackType: AttackType
  ): BattleAnalysis | null {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    const attacker = session.participants.find(p => p.id === attackerId);
    const defender = session.participants.find(p => p.id === targetId);
    
    if (!attacker || !defender) return null;

    const analysis = EnhancedBattleAnalyzer.analyzeBattle(attacker, defender, attackType);
    
    // Store analysis for later reference
    session.preAttackAnalyses.push(analysis);
    
    return analysis;
  }

  /**
   * Execute an enhanced battle action with detailed logging
   */
  async executeEnhancedBattleAction(
    sessionId: string,
    playerId: string,
    action: EnhancedBattleAction
  ): Promise<{
    success: boolean;
    result?: DetailedBattleResult;
    error?: string;
    updatedSession?: EnhancedBattleSession;
  }> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return { success: false, error: 'Session not found' };
    }

    const player = session.participants.find(p => p.id === playerId);
    if (!player) {
      return { success: false, error: 'Player not found' };
    }

    try {
      switch (action.action) {
        case 'attack':
          return await this.executeEnhancedAttack(session, player, action);
        case 'recruit':
          return this.executeRecruitment(session, player, action);
        case 'purchase':
          return this.executePurchase(session, player, action);
        case 'end_turn':
          return this.executeEndTurn(session, player);
        default:
          return { success: false, error: 'Unknown action type' };
      }
    } catch (error) {
      console.error('Enhanced battle action failed:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Execute enhanced attack with detailed battle result
   */
  private async executeEnhancedAttack(
    session: EnhancedBattleSession,
    attacker: SimulatedNation,
    action: EnhancedBattleAction
  ): Promise<{
    success: boolean;
    result?: DetailedBattleResult;
    error?: string;
    updatedSession?: EnhancedBattleSession;
  }> {
    if (!action.details.type || !action.details.target) {
      return { success: false, error: 'Attack type and target required' };
    }

    const defender = session.participants.find(p => p.id === action.details.target);
    if (!defender) {
      return { success: false, error: 'Target not found' };
    }

    // Get or use provided analysis
    const analysis = action.details.analysis || 
      EnhancedBattleAnalyzer.analyzeBattle(attacker, defender, action.details.type);

    // Check if attack is possible
    const mapCosts = {
      [AttackType.GROUND]: 3,
      [AttackType.AIR]: 4,
      [AttackType.NAVAL]: 4
    };

    if (attacker.maps < mapCosts[action.details.type]) {
      return { success: false, error: 'Insufficient MAPs for attack' };
    }

    // Execute the battle using the enhanced simulation
    const battleResult = await this.simulateEnhancedBattle(
      attacker,
      defender,
      action.details.type,
      analysis
    );

    // Apply results
    this.applyBattleResults(session, attacker, defender, battleResult);

    // Update analytics
    this.updateBattleAnalytics(session, attacker.id, defender.id, battleResult);

    session.battleAnalytics.totalBattles++;
    session.battleAnalytics.battleHistory.push(battleResult);

    return {
      success: true,
      result: battleResult,
      updatedSession: session
    };
  }

  /**
   * Simulate enhanced battle with detailed logging
   */
  private async simulateEnhancedBattle(
    attacker: SimulatedNation,
    defender: SimulatedNation,
    attackType: AttackType,
    analysis: BattleAnalysis
  ): Promise<DetailedBattleResult> {
    const battleLog: string[] = [];
    
    battleLog.push(`🔥 BATTLE INITIATED: ${attackType.toUpperCase()} ATTACK`);
    battleLog.push(`⚔️  ${attacker.nation_name} vs ${defender.nation_name}`);
    
    if (attackType === AttackType.GROUND) {
      return this.simulateGroundBattle(attacker, defender, analysis, battleLog);
    } else {
      return this.simulateAirNavalBattle(attacker, defender, attackType, analysis, battleLog);
    }
  }

  /**
   * Simulate ground battle with P&W mechanics
   */
  private simulateGroundBattle(
    attacker: SimulatedNation,
    defender: SimulatedNation,
    analysis: BattleAnalysis,
    battleLog: string[]
  ): DetailedBattleResult {
    // Army strength calculation
    const attackerArmyValue = this.calculateGroundArmyValue(attacker);
    const defenderArmyValue = this.calculateGroundArmyValue(defender);

    battleLog.push(`📊 ARMY STRENGTH ANALYSIS:`);
    battleLog.push(`   ${attacker.nation_name}: ${attackerArmyValue.toLocaleString()} army value`);
    battleLog.push(`   ${defender.nation_name}: ${defenderArmyValue.toLocaleString()} army value`);
    battleLog.push(`   Strength Ratio: ${analysis.armyStrengths.ratio.toFixed(2)} (${analysis.armyStrengths.ratio > 1 ? 'Attacker Advantage' : 'Defender Advantage'})`);

    // Battle rolls
    const attackerRolls = this.performBattleRolls(attackerArmyValue);
    const defenderRolls = this.performBattleRolls(defenderArmyValue);

    battleLog.push(`🎲 BATTLE ROLLS (3 rounds):`);
    let attackerWins = 0;
    for (let i = 0; i < 3; i++) {
      const attackerWon = attackerRolls[i] > defenderRolls[i];
      if (attackerWon) attackerWins++;
      
      battleLog.push(`   Round ${i + 1}: ${attacker.nation_name} ${attackerRolls[i].toLocaleString()} vs ${defender.nation_name} ${defenderRolls[i].toLocaleString()} - ${attackerWon ? attacker.nation_name : defender.nation_name} WINS`);
    }

    // Determine outcome
    let outcome: 'IT' | 'MS' | 'PV' | 'UF';
    let outcomeDescription: string;
    if (attackerWins === 3) {
      outcome = 'IT';
      outcomeDescription = 'IMMENSE TRIUMPH! Complete domination!';
    } else if (attackerWins === 2) {
      outcome = 'MS';
      outcomeDescription = 'MODERATE SUCCESS! Clear victory achieved.';
    } else if (attackerWins === 1) {
      outcome = 'PV';
      outcomeDescription = 'PYRRHIC VICTORY! Barely managed to succeed.';
    } else {
      outcome = 'UF';
      outcomeDescription = 'UTTER FAILURE! Attack completely repelled.';
    }

    battleLog.push(`🏆 BATTLE OUTCOME: ${outcome} - ${outcomeDescription}`);

    // Calculate casualties using P&W formulas
    const casualties = this.calculateGroundCasualties(
      attacker, defender, attackerArmyValue, defenderArmyValue, attackerWins >= 2
    );

    battleLog.push(`💀 CASUALTIES:`);
    battleLog.push(`   ${attacker.nation_name} Losses: ${casualties.attacker.soldiers.toLocaleString()} soldiers, ${casualties.attacker.tanks.toLocaleString()} tanks`);
    battleLog.push(`   ${defender.nation_name} Losses: ${casualties.defender.soldiers.toLocaleString()} soldiers, ${casualties.defender.tanks.toLocaleString()} tanks`);

    // Resource consumption
    const resourcesUsed = {
      munitions: Math.ceil(Math.min(attacker.military.soldiers, attacker.resources.munitions * 5000) / 5000),
      gasoline: Math.min(attacker.military.tanks * 0.1, attacker.resources.gasoline)
    };

    battleLog.push(`🛢️  RESOURCES CONSUMED:`);
    battleLog.push(`   Munitions: ${resourcesUsed.munitions}`);
    battleLog.push(`   Gasoline: ${resourcesUsed.gasoline}`);
    battleLog.push(`   MAPs Used: 3`);

    // Tactical analysis
    const casualtyEfficiency = this.calculateCasualtyEfficiency(casualties.attacker, casualties.defender);
    const rollQuality = this.assessRollQuality(attackerRolls, attackerArmyValue);
    const tacticalSummary = this.generateTacticalSummary(outcome, analysis.armyStrengths.ratio, casualtyEfficiency, rollQuality);

    battleLog.push(`📈 TACTICAL ANALYSIS:`);
    battleLog.push(`   Casualty Exchange Ratio: ${casualtyEfficiency.toFixed(2)}`);
    battleLog.push(`   Roll Performance: ${rollQuality.toUpperCase()}`);
    battleLog.push(`   Summary: ${tacticalSummary}`);

    return {
      outcome,
      attackerWins,
      success: attackerWins >= 2,
      rolls: { attacker: attackerRolls, defender: defenderRolls },
      casualties,
      resourcesUsed,
      battleLog,
      analysis: {
        strengthRatio: analysis.armyStrengths.ratio,
        rollQuality,
        casualtyEfficiency,
        tacticalSummary
      }
    };
  }

  /**
   * Simulate air/naval battle
   */
  private simulateAirNavalBattle(
    attacker: SimulatedNation,
    defender: SimulatedNation,
    attackType: AttackType,
    analysis: BattleAnalysis,
    battleLog: string[]
  ): DetailedBattleResult {
    // Simplified air/naval simulation
    const successRate = (analysis.victoryProbabilities.immenseTriumph + analysis.victoryProbabilities.moderateSuccess) / 100;
    const randomRoll = Math.random();
    const success = randomRoll < successRate;
    
    let outcome: 'IT' | 'MS' | 'PV' | 'UF';
    if (success) {
      outcome = randomRoll < successRate * 0.3 ? 'IT' : 'MS';
    } else {
      outcome = randomRoll < successRate + 0.2 ? 'PV' : 'UF';
    }

    battleLog.push(`🎯 ${attackType.toUpperCase()} BATTLE SIMULATION`);
    battleLog.push(`🎲 Battle Roll: ${(randomRoll * 100).toFixed(1)}% (needed ${(successRate * 100).toFixed(1)}% for success)`);
    battleLog.push(`🏆 OUTCOME: ${outcome}`);

    // Calculate simplified casualties
    const casualties = {
      attacker: {
        soldiers: 0,
        tanks: 0,
        aircraft: attackType === AttackType.AIR ? Math.floor(attacker.military.aircraft * (success ? 0.02 : 0.08)) : 0,
        ships: attackType === AttackType.NAVAL ? Math.floor(attacker.military.ships * (success ? 0.02 : 0.08)) : 0
      },
      defender: {
        soldiers: 0,
        tanks: 0,
        aircraft: attackType === AttackType.AIR ? Math.floor(defender.military.aircraft * (success ? 0.08 : 0.02)) : 0,
        ships: attackType === AttackType.NAVAL ? Math.floor(defender.military.ships * (success ? 0.08 : 0.02)) : 0
      }
    };

    const resourcesUsed = {
      munitions: 0,
      gasoline: attackType === AttackType.AIR ? 
        Math.min(attacker.military.aircraft * 2, attacker.resources.gasoline) :
        Math.min(attacker.military.ships * 5, attacker.resources.gasoline)
    };

    battleLog.push(`💀 CASUALTIES:`);
    if (attackType === AttackType.AIR) {
      battleLog.push(`   ${attacker.nation_name} Aircraft Lost: ${casualties.attacker.aircraft}`);
      battleLog.push(`   ${defender.nation_name} Aircraft Lost: ${casualties.defender.aircraft}`);
    } else {
      battleLog.push(`   ${attacker.nation_name} Ships Lost: ${casualties.attacker.ships}`);
      battleLog.push(`   ${defender.nation_name} Ships Lost: ${casualties.defender.ships}`);
    }

    return {
      outcome,
      attackerWins: success ? 2 : 0,
      success,
      rolls: { attacker: [randomRoll * 100], defender: [successRate * 100] },
      casualties,
      resourcesUsed,
      battleLog,
      analysis: {
        strengthRatio: analysis.armyStrengths.ratio,
        rollQuality: 'average' as const,
        casualtyEfficiency: 1,
        tacticalSummary: `${attackType} attack ${success ? 'succeeded' : 'failed'} with ${(randomRoll * 100).toFixed(1)}% roll.`
      }
    };
  }

  // Helper methods (implementing the same logic as in battle simulation engine)
  private calculateGroundArmyValue(nation: SimulatedNation): number {
    const soldierValue = this.calculateSoldierArmyValue(nation);
    const tankValue = nation.resources.gasoline > 0 ? nation.military.tanks * 40 : 0;
    return soldierValue + tankValue;
  }

  private calculateSoldierArmyValue(nation: SimulatedNation): number {
    const hasMunitions = nation.resources.munitions > 0;
    
    if (hasMunitions) {
      const maxArmedSoldiers = Math.min(nation.military.soldiers, nation.resources.munitions * 5000);
      const unarmedSoldiers = Math.max(0, nation.military.soldiers - maxArmedSoldiers);
      return (unarmedSoldiers * 1.0) + (maxArmedSoldiers * 1.75);
    } else {
      return nation.military.soldiers * 1.0;
    }
  }

  private performBattleRolls(armyValue: number): number[] {
    return [
      armyValue * (0.4 + Math.random() * 0.6),
      armyValue * (0.4 + Math.random() * 0.6),
      armyValue * (0.4 + Math.random() * 0.6)
    ];
  }

  private calculateGroundCasualties(
    attacker: SimulatedNation,
    defender: SimulatedNation,
    attackerArmyValue: number,
    defenderArmyValue: number,
    attackerWins: boolean
  ) {
    const attackerSoldierValue = this.calculateSoldierArmyValue(attacker);
    const attackerTankValue = attacker.military.tanks * 40;
    const defenderSoldierValue = this.calculateSoldierArmyValue(defender);
    const defenderTankValue = defender.military.tanks * 40;

    const ATSR = attackerSoldierValue * (0.4 + Math.random() * 0.6);
    const ATTR = attackerTankValue * (0.4 + Math.random() * 0.6);
    const DTSR = defenderSoldierValue * (0.4 + Math.random() * 0.6);
    const DTTR = defenderTankValue * (0.4 + Math.random() * 0.6);

    let attackerTankCasualties, defenderTankCasualties;
    
    if (attackerWins) {
      attackerTankCasualties = (DTSR * 0.0004060606) + (DTTR * 0.00066666666);
      defenderTankCasualties = (ATSR * 0.00043225806) + (ATTR * 0.00070967741);
    } else {
      attackerTankCasualties = (DTSR * 0.00043225806) + (DTTR * 0.00070967741);
      defenderTankCasualties = (ATSR * 0.0004060606) + (ATTR * 0.00066666666);
    }

    const attackerSoldierCasualties = (DTSR * 0.0084) + (DTTR * 0.0092);
    const defenderSoldierCasualties = (ATSR * 0.0084) + (ATTR * 0.0092);

    return {
      attacker: {
        soldiers: Math.min(Math.floor(attackerSoldierCasualties), attacker.military.soldiers),
        tanks: Math.min(Math.floor(attackerTankCasualties), attacker.military.tanks),
        aircraft: 0,
        ships: 0
      },
      defender: {
        soldiers: Math.min(Math.floor(defenderSoldierCasualties), defender.military.soldiers),
        tanks: Math.min(Math.floor(defenderTankCasualties), defender.military.tanks),
        aircraft: 0,
        ships: 0
      }
    };
  }

  private calculateCasualtyEfficiency(attackerLosses: any, defenderLosses: any): number {
    const attackerValue = (attackerLosses.soldiers * 1.75) + (attackerLosses.tanks * 40) + (attackerLosses.aircraft * 20) + (attackerLosses.ships * 100);
    const defenderValue = (defenderLosses.soldiers * 1.75) + (defenderLosses.tanks * 40) + (defenderLosses.aircraft * 20) + (defenderLosses.ships * 100);
    
    if (attackerValue === 0) return defenderValue > 0 ? 999 : 1;
    if (defenderValue === 0) return 0;
    
    return defenderValue / attackerValue;
  }

  private assessRollQuality(rolls: number[], maxPossible: number): 'excellent' | 'good' | 'average' | 'poor' {
    const averageRoll = rolls.reduce((a, b) => a + b, 0) / rolls.length;
    const expectedAverage = maxPossible * 0.7;
    const performance = averageRoll / expectedAverage;
    
    if (performance >= 1.2) return 'excellent';
    if (performance >= 1.05) return 'good';
    if (performance >= 0.95) return 'average';
    return 'poor';
  }

  private generateTacticalSummary(outcome: string, strengthRatio: number, casualtyEfficiency: number, rollQuality: string): string {
    let summary = '';
    
    if (outcome === 'IT' || outcome === 'MS') {
      summary = 'Victory achieved! ';
      if (strengthRatio > 2) {
        summary += 'Overwhelming force advantage secured the win.';
      } else if (rollQuality === 'excellent') {
        summary += 'Exceptional tactical execution overcame the enemy.';
      } else if (casualtyEfficiency > 2) {
        summary += 'Efficient battle tactics minimized losses.';
      } else {
        summary += 'Hard-fought victory through determination.';
      }
    } else {
      summary = 'Defeat suffered. ';
      if (strengthRatio < 0.5) {
        summary += 'Enemy force advantage proved decisive.';
      } else if (rollQuality === 'poor') {
        summary += 'Poor battlefield performance led to failure.';
      } else if (casualtyEfficiency < 0.5) {
        summary += 'Heavy casualties undermined the attack.';
      } else {
        summary += 'Close battle that could have gone either way.';
      }
    }
    
    return summary;
  }

  private applyBattleResults(
    session: EnhancedBattleSession,
    attacker: SimulatedNation,
    defender: SimulatedNation,
    result: DetailedBattleResult
  ) {
    // Apply casualties
    attacker.military.soldiers -= result.casualties.attacker.soldiers;
    attacker.military.tanks -= result.casualties.attacker.tanks;
    attacker.military.aircraft -= result.casualties.attacker.aircraft;
    attacker.military.ships -= result.casualties.attacker.ships;

    defender.military.soldiers -= result.casualties.defender.soldiers;
    defender.military.tanks -= result.casualties.defender.tanks;
    defender.military.aircraft -= result.casualties.defender.aircraft;
    defender.military.ships -= result.casualties.defender.ships;

    // Apply resource consumption
    attacker.resources.munitions -= result.resourcesUsed.munitions;
    attacker.resources.gasoline -= result.resourcesUsed.gasoline;
    attacker.maps -= 3; // Ground attack cost
  }

  private updateBattleAnalytics(
    session: EnhancedBattleSession,
    attackerId: string,
    defenderId: string,
    result: DetailedBattleResult
  ) {
    // Initialize player stats if not exists
    if (!session.battleAnalytics.playerStats[attackerId]) {
      session.battleAnalytics.playerStats[attackerId] = {
        wins: 0,
        losses: 0,
        totalDamageDealt: 0,
        totalDamageReceived: 0,
        favoriteAttackType: AttackType.GROUND,
        bestVictoryType: 'UF'
      };
    }

    if (!session.battleAnalytics.playerStats[defenderId]) {
      session.battleAnalytics.playerStats[defenderId] = {
        wins: 0,
        losses: 0,
        totalDamageDealt: 0,
        totalDamageReceived: 0,
        favoriteAttackType: AttackType.GROUND,
        bestVictoryType: 'UF'
      };
    }

    // Update stats
    const attackerStats = session.battleAnalytics.playerStats[attackerId];
    const defenderStats = session.battleAnalytics.playerStats[defenderId];

    if (result.success) {
      attackerStats.wins++;
      defenderStats.losses++;
    } else {
      attackerStats.losses++;
      defenderStats.wins++;
    }

    // Calculate damage values
    const attackerDamage = this.calculateDamageValue(result.casualties.defender);
    const defenderDamage = this.calculateDamageValue(result.casualties.attacker);

    attackerStats.totalDamageDealt += attackerDamage;
    attackerStats.totalDamageReceived += defenderDamage;
    defenderStats.totalDamageDealt += defenderDamage;
    defenderStats.totalDamageReceived += attackerDamage;
  }

  private calculateDamageValue(casualties: any): number {
    return (casualties.soldiers * 1.75) + 
           (casualties.tanks * 40) + 
           (casualties.aircraft * 20) + 
           (casualties.ships * 100);
  }

  private executeRecruitment(session: EnhancedBattleSession, player: SimulatedNation, action: EnhancedBattleAction) {
    // Implementation for unit recruitment
    return { success: true, updatedSession: session };
  }

  private executePurchase(session: EnhancedBattleSession, player: SimulatedNation, action: EnhancedBattleAction) {
    // Implementation for unit/building purchases
    return { success: true, updatedSession: session };
  }

  private executeEndTurn(session: EnhancedBattleSession, player: SimulatedNation) {
    // Implementation for ending turn
    return { success: true, updatedSession: session };
  }

  /**
   * Get session with analytics
   */
  getEnhancedSession(sessionId: string): EnhancedBattleSession | null {
    return this.sessions.get(sessionId) || null;
  }

  /**
   * Get battle analytics for a session
   */
  getBattleAnalytics(sessionId: string) {
    const session = this.sessions.get(sessionId);
    return session?.battleAnalytics || null;
  }
}
