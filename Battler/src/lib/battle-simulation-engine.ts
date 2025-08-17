import {
  BattleSession,
  SimulationSettings,
  SimulatedNation,
  MilitaryBuild,
  CityBuild,
  EconomyMode,
  MilitarizationLevel,
  DEFCON_BUILDS,
  ECONOMY_PRESETS,
  SpyOperation,
  CityUpgrade,
  MAP_CONSTANTS,
  BUILDING_LIMITS,
  AttackType,
  AttackAction,
  BattleAction
} from '../types/simulation';

export class BattleSimulationEngine {
  private sessions: Map<string, BattleSession> = new Map();
  private timers: Map<string, NodeJS.Timeout> = new Map();

  /**
   * Create a new battle simulation session
   */
  createSession(settings: SimulationSettings, hostNation: Partial<SimulatedNation>): BattleSession {
    const sessionId = this.generateSessionId();
    
    const host: SimulatedNation = {
      id: hostNation.id || 'host',
      nation_name: hostNation.nation_name || 'Host Nation',
      leader_name: hostNation.leader_name || 'Host Leader',
      cities: this.generateCities(settings, hostNation.cities),
      military: this.generateMilitary(settings, hostNation.military),
      resources: this.getEconomyResources(settings.economySettings),
      war_policy: 'BLITZKRIEG',
      domestic_policy: 'IMPERIALISM',
      government_type: 'DEMOCRACY',
      economic_policy: 'MARKET_ECONOMY',
      social_policy: 'LIBERTARIAN',
      score: this.calculateScore(hostNation),
      population: 0,
      land: 0,
      maps: MAP_CONSTANTS.STARTING_MAPS,
      maxMaps: MAP_CONSTANTS.MAX_MAPS
    };

    const session: BattleSession = {
      id: sessionId,
      mode: settings.battleMode,
      settings,
      participants: [host],
      currentTurn: 1,
      turnTimer: settings.turnCooldown,
      isActive: false,
      battleHistory: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    this.sessions.set(sessionId, session);
    return session;
  }

  /**
   * Join an existing battle session
   */
  joinSession(sessionId: string, nation: Partial<SimulatedNation>): boolean {
    const session = this.sessions.get(sessionId);
    if (!session || session.isActive) {
      return false;
    }

    const participant: SimulatedNation = {
      id: nation.id || `player_${session.participants.length}`,
      nation_name: nation.nation_name || `Player ${session.participants.length}`,
      leader_name: nation.leader_name || `Leader ${session.participants.length}`,
      cities: this.generateCities(session.settings, nation.cities),
      military: this.generateMilitary(session.settings, nation.military),
      resources: this.getEconomyResources(session.settings.economySettings),
      war_policy: 'BLITZKRIEG',
      domestic_policy: 'IMPERIALISM',
      government_type: 'DEMOCRACY',
      economic_policy: 'MARKET_ECONOMY',
      social_policy: 'LIBERTARIAN',
      score: this.calculateScore(nation),
      population: 0,
      land: 0,
      maps: MAP_CONSTANTS.STARTING_MAPS,
      maxMaps: MAP_CONSTANTS.MAX_MAPS
    };

    session.participants.push(participant);
    session.updated_at = new Date().toISOString();
    return true;
  }

  /**
   * Start a battle session
   */
  startSession(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session || session.isActive) {
      return false;
    }

    session.isActive = true;
    session.updated_at = new Date().toISOString();

    // Start turn timer
    this.startTurnTimer(sessionId);
    return true;
  }

  /**
   * Execute a battle action
   */
  executeBattleAction(sessionId: string, nationId: string, action: any): boolean {
    const session = this.sessions.get(sessionId);
    if (!session || !session.isActive) {
      return false;
    }

    const nation = session.participants.find(p => p.id === nationId);
    if (!nation) {
      return false;
    }

    switch (action.type) {
      case 'attack':
        return this.executeAttack(session, nation, action);
      case 'recruit':
        return this.executeRecruitment(session, nation, action);
      case 'spy':
        return this.executeSpyOperation(session, nation, action);
      case 'purchase':
        return this.executePurchase(session, nation, action);
      case 'policy_change':
        return this.executePolicyChange(session, nation, action);
      default:
        return false;
    }
  }

  /**
   * Process turn advancement - increment turn and grant MAPs
   */
  processTurn(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session || !session.isActive) {
      return false;
    }

    session.currentTurn++;
    
    // Grant MAPs to all participants
    session.participants.forEach(nation => {
      nation.maps = Math.min(nation.maps + MAP_CONSTANTS.MAPS_PER_TURN, nation.maxMaps);
    });

    session.updated_at = new Date().toISOString();
    return true;
  }

  /**
   * Get MAP cost for different attack types
   */
  private getAttackCost(attackType: AttackType): number {
    switch (attackType) {
      case AttackType.GROUND:
        return MAP_CONSTANTS.GROUND_ATTACK_COST;
      case AttackType.AIR:
        return MAP_CONSTANTS.AIR_ATTACK_COST;
      case AttackType.NAVAL:
        return MAP_CONSTANTS.NAVAL_ATTACK_COST;
      default:
        return 0;
    }
  }

  /**
   * Check if nation has enough MAPs for an action
   */
  private hasEnoughMaps(nation: SimulatedNation, cost: number): boolean {
    return nation.maps >= cost;
  }

  /**
   * Deduct MAPs from nation
   */
  private deductMaps(nation: SimulatedNation, cost: number): boolean {
    if (!this.hasEnoughMaps(nation, cost)) {
      return false;
    }
    nation.maps -= cost;
    return true;
  }

  /**
   * Execute an attack action
   */
  private executeAttack(session: BattleSession, attacker: SimulatedNation, action: any): boolean {
    console.log('Executing attack:', { attackerMaps: attacker.maps, action });
    
    const attackType = action.attackType;
    const targetId = action.target;
    
    // Convert string to AttackType enum
    let attackTypeEnum: AttackType;
    switch (attackType) {
      case 'ground':
        attackTypeEnum = AttackType.GROUND;
        break;
      case 'air':
        attackTypeEnum = AttackType.AIR;
        break;
      case 'naval':
        attackTypeEnum = AttackType.NAVAL;
        break;
      default:
        console.log('Invalid attack type:', attackType);
        return false;
    }
    
    const mapCost = this.getAttackCost(attackTypeEnum);
    console.log('Attack cost:', mapCost, 'Available maps:', attacker.maps);
    
    // Check if attacker has enough MAPs
    if (!this.deductMaps(attacker, mapCost)) {
      console.log('Not enough MAPs for attack');
      return false;
    }

    const target = session.participants.find(p => p.id === targetId);
    if (!target) {
      console.log('Target not found:', targetId);
      return false;
    }

    // Calculate battle results with mutual losses
    const battleResult = this.calculateBattleResult(attacker, target, attackTypeEnum);
    
    console.log('Battle result:', battleResult);

    // Apply losses to both attacker and defender
    this.applyBattleLosses(attacker, battleResult.attackerLosses);
    this.applyBattleLosses(target, battleResult.defenderLosses);

    // Deduct resources used in attack
    this.deductResources(attacker, battleResult.resourcesUsed);

    // Add battle result to history
    if (!session.battleHistory) {
      session.battleHistory = [];
    }
    
    // Convert outcome code to full name
    const outcomeMap = {
      'IT': 'Immense Triumph' as const,
      'MS': 'Moderate Success' as const,
      'PV': 'Pyrrhic Victory' as const,
      'UF': 'Utter Failure' as const
    };
    
    const historyEntry = {
      id: `battle_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      turn: session.currentTurn,
      timestamp: new Date().toISOString(),
      attackerName: attacker.nation_name,
      defenderName: target.nation_name,
      attackType: attackType.toLowerCase() as 'ground' | 'air' | 'naval',
      outcome: outcomeMap[battleResult.outcome as keyof typeof outcomeMap],
      attackerLosses: battleResult.attackerLosses,
      defenderLosses: battleResult.defenderLosses,
      resourcesUsed: battleResult.resourcesUsed,
      battleCalculations: battleResult.battleCalculations || {
        attackerUnitsUsed: { soldiers: 0, tanks: 0, aircraft: 0, ships: 0 },
        defenderUnitsDefending: { soldiers: 0, tanks: 0, aircraft: 0, ships: 0 },
        attackerStrength: 0,
        defenderStrength: 0,
        strengthRatio: 1,
        rollResults: { roll1: 0, roll2: 0, roll3: 0, bestRoll: 0 },
        hadMunitions: false,
        hadGasoline: false
      }
    };
    
    session.battleHistory.push(historyEntry);

    session.updated_at = new Date().toISOString();
    console.log('Attack completed, remaining MAPs:', attacker.maps);
    return true;
  }

  /**
   * Calculate battle results using actual P&W battle mechanics
   */
  private calculateBattleResult(attacker: SimulatedNation, defender: SimulatedNation, attackType: AttackType) {
    // Only ground battles use the detailed casualty formulas provided
    if (attackType !== AttackType.GROUND) {
      return this.calculateNonGroundBattle(attacker, defender, attackType);
    }

    // Calculate army values for ground battle
    const attackerArmyValue = this.calculateGroundArmyValue(attacker);
    const defenderArmyValue = this.calculateGroundArmyValue(defender);
    
    console.log('Ground army values:', { attacker: attackerArmyValue, defender: defenderArmyValue });
    
    // Perform 3 battle rolls (0.4x to 1.0x army value)
    const attackerRolls = this.performBattleRolls(attackerArmyValue);
    const defenderRolls = this.performBattleRolls(defenderArmyValue);
    
    // Count wins for attacker
    let attackerWins = 0;
    for (let i = 0; i < 3; i++) {
      if (attackerRolls[i] > defenderRolls[i]) {
        attackerWins++;
      }
    }
    
    // Determine battle outcome
    let outcome: 'IT' | 'MS' | 'PV' | 'UF';
    if (attackerWins === 3) outcome = 'IT'; // Immense Triumph
    else if (attackerWins === 2) outcome = 'MS'; // Moderate Success  
    else if (attackerWins === 1) outcome = 'PV'; // Pyrrhic Victory
    else outcome = 'UF'; // Utter Failure
    
    // Calculate losses using actual P&W formulas
    const { attackerLosses, defenderLosses } = this.calculatePnWGroundCasualties(
      attacker, defender, attackerArmyValue, defenderArmyValue, attackerWins >= 2
    );
    
    // Calculate resource consumption
    const resourcesUsed = this.calculateResourceConsumption(attacker, attackType);
    
    // Prepare detailed battle calculations
    const battleCalculations = {
      attackerUnitsUsed: {
        soldiers: attacker.military.soldiers,
        tanks: attacker.military.tanks
      },
      defenderUnitsDefending: {
        soldiers: defender.military.soldiers,
        tanks: defender.military.tanks
      },
      attackerStrength: attackerArmyValue,
      defenderStrength: defenderArmyValue,
      strengthRatio: attackerArmyValue / Math.max(defenderArmyValue, 1),
      rollResults: {
        roll1: attackerRolls[0],
        roll2: attackerRolls[1],
        roll3: attackerRolls[2],
        bestRoll: Math.max(...attackerRolls)
      },
      hadMunitions: attacker.resources.munitions > 0,
      hadGasoline: attacker.resources.gasoline > 0
    };
    
    console.log('Battle outcome:', outcome, 'Attacker wins:', attackerWins);
    
    return {
      success: attackerWins >= 2, // MS or IT considered success
      outcome,
      attackerWins,
      attackerLosses,
      defenderLosses,
      resourcesUsed,
      battleCalculations,
      rolls: { attacker: attackerRolls, defender: defenderRolls }
    };
  }

  /**
   * Calculate ground army value using P&W formula: 
   * Army Value = Unarmed Soldiers * 1 + Armed Soldiers * 1.75 + Tanks * 40
   */
  private calculateGroundArmyValue(nation: SimulatedNation): number {
    const hasMunitions = nation.resources.munitions > 0;
    const hasGasoline = nation.resources.gasoline > 0;
    
    let armyValue = 0;
    
    // Calculate soldiers with/without munitions
    if (hasMunitions) {
      // All soldiers can be armed with available munitions
      const maxArmedSoldiers = Math.min(nation.military.soldiers, nation.resources.munitions * 5000);
      const unarmedSoldiers = Math.max(0, nation.military.soldiers - maxArmedSoldiers);
      
      armyValue += unarmedSoldiers * 1.0;      // Unarmed soldiers
      armyValue += maxArmedSoldiers * 1.75;    // Armed soldiers
    } else {
      // No munitions = all soldiers unarmed
      armyValue += nation.military.soldiers * 1.0;
    }
    
    // Tanks need both munitions AND gasoline
    if (hasMunitions && hasGasoline) {
      armyValue += nation.military.tanks * 40;
    }
    // If no resources, tanks contribute nothing (can't operate)
    
    return Math.max(armyValue, 1); // Minimum value of 1
  }

  /**
   * Calculate P&W ground battle casualties using exact formulas
   */
  private calculatePnWGroundCasualties(
    attacker: SimulatedNation, 
    defender: SimulatedNation, 
    attackerArmyValue: number,
    defenderArmyValue: number,
    attackerWins: boolean
  ) {
    // Calculate component army values for detailed casualty calculations
    const attackerSoldierValue = this.calculateSoldierArmyValue(attacker);
    const attackerTankValue = attacker.military.tanks * 40;
    const defenderSoldierValue = this.calculateSoldierArmyValue(defender);
    const defenderTankValue = defender.military.tanks * 40;
    
    // Generate random rolls for each component (40% to 100% of army value)
    const ATSR = attackerSoldierValue * (0.4 + Math.random() * 0.6); // Attacking Tank Soldier Roll
    const ATTR = attackerTankValue * (0.4 + Math.random() * 0.6);    // Attacking Tank Tank Roll
    const DTSR = defenderSoldierValue * (0.4 + Math.random() * 0.6); // Defending Tank Soldier Roll
    const DTTR = defenderTankValue * (0.4 + Math.random() * 0.6);    // Defending Tank Tank Roll
    
    console.log('Battle rolls:', { ATSR, ATTR, DTSR, DTTR, attackerWins });
    
    // Calculate tank casualties based on P&W formulas
    let attackerTankCasualties = 0;
    let defenderTankCasualties = 0;
    
    if (attackerWins) {
      // Attacker wins
      attackerTankCasualties = (DTSR * 0.0004060606) + (DTTR * 0.00066666666);
      defenderTankCasualties = (ATSR * 0.00043225806) + (ATTR * 0.00070967741);
    } else {
      // Defender wins
      attackerTankCasualties = (DTSR * 0.00043225806) + (DTTR * 0.00070967741);
      defenderTankCasualties = (ATSR * 0.0004060606) + (ATTR * 0.00066666666);
    }
    
    // Calculate soldier casualties (same formula regardless of winner)
    const attackerSoldierCasualties = (DTSR * 0.0084) + (DTTR * 0.0092);
    const defenderSoldierCasualties = (ATSR * 0.0084) + (ATTR * 0.0092);
    
    // Apply casualties with bounds checking
    const attackerLosses = {
      soldiers: Math.min(Math.floor(attackerSoldierCasualties), attacker.military.soldiers),
      tanks: Math.min(Math.floor(attackerTankCasualties), attacker.military.tanks)
    };
    
    const defenderLosses = {
      soldiers: Math.min(Math.floor(defenderSoldierCasualties), defender.military.soldiers),
      tanks: Math.min(Math.floor(defenderTankCasualties), defender.military.tanks)
    };
    
    console.log('Calculated casualties:', { attackerLosses, defenderLosses });
    
    return { attackerLosses, defenderLosses };
  }

  /**
   * Calculate soldier army value component
   */
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

  /**
   * Handle non-ground battles with simplified mechanics
   */
  private calculateNonGroundBattle(attacker: SimulatedNation, defender: SimulatedNation, attackType: AttackType) {
    // Use simplified army value calculation for air/naval
    const attackerArmyValue = this.calculateAirNavalArmyValue(attacker, attackType);
    const defenderArmyValue = this.calculateAirNavalArmyValue(defender, attackType);
    
    const attackerRolls = this.performBattleRolls(attackerArmyValue);
    const defenderRolls = this.performBattleRolls(defenderArmyValue);
    
    let attackerWins = 0;
    for (let i = 0; i < 3; i++) {
      if (attackerRolls[i] > defenderRolls[i]) {
        attackerWins++;
      }
    }
    
    let outcome: 'IT' | 'MS' | 'PV' | 'UF';
    if (attackerWins === 3) outcome = 'IT';
    else if (attackerWins === 2) outcome = 'MS';
    else if (attackerWins === 1) outcome = 'PV';
    else outcome = 'UF';
    
    // Use simplified casualties for air/naval battles
    const { attackerLosses, defenderLosses } = this.calculateBattleLosses(
      attacker, defender, attackType, outcome
    );
    
    const resourcesUsed = this.calculateResourceConsumption(attacker, attackType);
    
    // Prepare detailed battle calculations for air/naval
    const battleCalculations = {
      attackerUnitsUsed: {
        soldiers: attackType === AttackType.AIR ? 0 : 0,
        tanks: 0,
        aircraft: attackType === AttackType.AIR ? attacker.military.aircraft : 0,
        ships: attackType === AttackType.NAVAL ? attacker.military.ships : 0
      },
      defenderUnitsDefending: {
        soldiers: 0,
        tanks: 0,
        aircraft: attackType === AttackType.AIR ? defender.military.aircraft : 0,
        ships: attackType === AttackType.NAVAL ? defender.military.ships : 0
      },
      attackerStrength: attackerArmyValue,
      defenderStrength: defenderArmyValue,
      strengthRatio: attackerArmyValue / Math.max(defenderArmyValue, 1),
      rollResults: {
        roll1: attackerRolls[0],
        roll2: attackerRolls[1],
        roll3: attackerRolls[2],
        bestRoll: Math.max(...attackerRolls)
      },
      hadMunitions: attacker.resources.munitions > 0,
      hadGasoline: attacker.resources.gasoline > 0
    };
    
    return {
      success: attackerWins >= 2,
      outcome,
      attackerWins,
      attackerLosses,
      defenderLosses,
      resourcesUsed,
      battleCalculations,
      rolls: { attacker: attackerRolls, defender: defenderRolls }
    };
  }

  /**
   * Calculate army value for air/naval battles
   */
  private calculateAirNavalArmyValue(nation: SimulatedNation, attackType: AttackType): number {
    const hasMunitions = nation.resources.munitions > 0;
    const hasGasoline = nation.resources.gasoline > 0;
    
    let armyValue = 0;
    
    switch (attackType) {
      case AttackType.AIR:
        // Planes need munitions and gasoline
        if (hasMunitions && hasGasoline) {
          armyValue += nation.military.aircraft * 200;
        } else {
          armyValue += nation.military.aircraft * 20;
        }
        break;
        
      case AttackType.NAVAL:
        // Ships need munitions and gasoline
        if (hasMunitions && hasGasoline) {
          armyValue += nation.military.ships * 150;
        } else {
          armyValue += nation.military.ships * 15;
        }
        break;
    }
    
    return Math.max(armyValue, 1);
  }

  /**
   * Perform 3 battle rolls (0.4x to 1.0x army value)
   */
  private performBattleRolls(armyValue: number): number[] {
    const rolls: number[] = [];
    for (let i = 0; i < 3; i++) {
      const rollMultiplier = 0.4 + (Math.random() * 0.6); // 0.4 to 1.0
      rolls.push(armyValue * rollMultiplier);
    }
    return rolls;
  }

  /**
   * Calculate battle losses based on outcome and P&W mechanics
   */
  private calculateBattleLosses(
    attacker: SimulatedNation, 
    defender: SimulatedNation, 
    attackType: AttackType, 
    outcome: 'IT' | 'MS' | 'PV' | 'UF'
  ) {
    // Base casualty rates based on outcome
    let attackerCasualtyRate: number;
    let defenderCasualtyRate: number;
    
    switch (outcome) {
      case 'IT': // Immense Triumph
        attackerCasualtyRate = 0.01 + (Math.random() * 0.02); // 1-3%
        defenderCasualtyRate = 0.08 + (Math.random() * 0.12); // 8-20%
        break;
      case 'MS': // Moderate Success
        attackerCasualtyRate = 0.02 + (Math.random() * 0.03); // 2-5%
        defenderCasualtyRate = 0.05 + (Math.random() * 0.08); // 5-13%
        break;
      case 'PV': // Pyrrhic Victory
        attackerCasualtyRate = 0.04 + (Math.random() * 0.06); // 4-10%
        defenderCasualtyRate = 0.03 + (Math.random() * 0.05); // 3-8%
        break;
      case 'UF': // Utter Failure
        attackerCasualtyRate = 0.08 + (Math.random() * 0.15); // 8-23%
        defenderCasualtyRate = 0.01 + (Math.random() * 0.02); // 1-3%
        break;
    }
    
    const attackerLosses = this.calculateSpecificUnitLosses(attacker, attackType, attackerCasualtyRate);
    const defenderLosses = this.calculateSpecificUnitLosses(defender, attackType, defenderCasualtyRate);
    
    return { attackerLosses, defenderLosses };
  }

  /**
   * Calculate specific unit losses based on attack type and casualty rate
   */
  private calculateSpecificUnitLosses(nation: SimulatedNation, attackType: AttackType, casualtyRate: number): Partial<MilitaryBuild> {
    const losses: Partial<MilitaryBuild> = {};
    
    switch (attackType) {
      case AttackType.GROUND:
        // Ground battles target soldiers and tanks primarily
        losses.soldiers = Math.floor(nation.military.soldiers * casualtyRate * (0.8 + Math.random() * 0.4));
        losses.tanks = Math.floor(nation.military.tanks * casualtyRate * (0.6 + Math.random() * 0.4));
        break;
        
      case AttackType.AIR:
        // Air battles target aircraft first, then can target ground units
        losses.aircraft = Math.floor(nation.military.aircraft * casualtyRate);
        // If air superiority, can target ground units too
        if (casualtyRate > 0.05) { // Significant defeat
          losses.soldiers = Math.floor(nation.military.soldiers * casualtyRate * 0.2);
          losses.tanks = Math.floor(nation.military.tanks * casualtyRate * 0.1);
        }
        break;
        
      case AttackType.NAVAL:
        // Naval battles target ships primarily
        losses.ships = Math.floor(nation.military.ships * casualtyRate);
        // Some coastal defenses might be affected
        losses.soldiers = Math.floor(nation.military.soldiers * casualtyRate * 0.1);
        break;
    }
    
    return losses;
  }

  /**
   * Calculate resource consumption based on P&W mechanics
   */
  private calculateResourceConsumption(attacker: SimulatedNation, attackType: AttackType): { munitions: number; gasoline: number } {
    let munitions = 0;
    let gasoline = 0;
    
    switch (attackType) {
      case AttackType.GROUND:
        // Soldiers with munitions: 5,000 soldiers = 1 munition unit
        const soldiersWithMunitions = Math.min(attacker.military.soldiers, attacker.resources.munitions * 5000);
        munitions += Math.ceil(soldiersWithMunitions / 5000);
        
        // Tanks: 100 tanks = 1 munition + 1 gasoline
        const tanksInBattle = Math.min(attacker.military.tanks, Math.min(attacker.resources.munitions * 100, attacker.resources.gasoline * 100));
        munitions += Math.ceil(tanksInBattle / 100);
        gasoline += Math.ceil(tanksInBattle / 100);
        break;
        
      case AttackType.AIR:
        // Each plane uses 0.25 gas + 0.25 munitions per attack
        const planesInBattle = Math.min(attacker.military.aircraft, Math.min(attacker.resources.munitions * 4, attacker.resources.gasoline * 4));
        munitions += Math.ceil(planesInBattle * 0.25);
        gasoline += Math.ceil(planesInBattle * 0.25);
        break;
        
      case AttackType.NAVAL:
        // Each ship uses 1.75 munitions + 1 gasoline per attack
        const shipsInBattle = Math.min(attacker.military.ships, Math.min(attacker.resources.munitions / 1.75, attacker.resources.gasoline));
        munitions += Math.ceil(shipsInBattle * 1.75);
        gasoline += Math.ceil(shipsInBattle * 1);
        break;
    }
    
    return { munitions, gasoline };
  }

  /**
   * Apply battle losses to a nation's military
   */
  private applyBattleLosses(nation: SimulatedNation, losses: Partial<MilitaryBuild>): void {
    if (losses.soldiers) {
      nation.military.soldiers = Math.max(0, nation.military.soldiers - losses.soldiers);
    }
    if (losses.tanks) {
      nation.military.tanks = Math.max(0, nation.military.tanks - losses.tanks);
    }
    if (losses.aircraft) {
      nation.military.aircraft = Math.max(0, nation.military.aircraft - losses.aircraft);
    }
    if (losses.ships) {
      nation.military.ships = Math.max(0, nation.military.ships - losses.ships);
    }
  }

  /**
   * Deduct resources from nation
   */
  private deductResources(nation: SimulatedNation, resourcesUsed: { munitions: number; gasoline: number }): void {
    nation.resources.munitions = Math.max(0, nation.resources.munitions - resourcesUsed.munitions);
    nation.resources.gasoline = Math.max(0, nation.resources.gasoline - resourcesUsed.gasoline);
  }




  /**
   * Calculate recruitment capacity based on city builds
   */
  private calculateRecruitmentCapacity(nation: SimulatedNation): {
    soldiers: number;
    tanks: number;
    aircraft: number;
    ships: number;
  } {
    const totalBarracks = nation.cities.reduce((sum, city) => sum + city.barracks, 0);
    const totalFactories = nation.cities.reduce((sum, city) => sum + city.factory, 0);
    const totalHangars = nation.cities.reduce((sum, city) => sum + city.hangar, 0);
    const totalDrydocks = nation.cities.reduce((sum, city) => sum + city.drydock, 0);

    return {
      soldiers: totalBarracks * 3000, // 3000 soldiers per barracks per turn
      tanks: totalFactories * 300,    // 300 tanks per factory per turn  
      aircraft: totalHangars * 18,    // 18 aircraft per hangar per turn
      ships: totalDrydocks * 5        // 5 ships per drydock per turn
    };
  }

  /**
   * Execute recruitment action
   */
  private executeRecruitment(session: BattleSession, nation: SimulatedNation, action: any): boolean {
    // Check if recruitment is allowed this turn
    if (session.currentTurn % session.settings.turnsUntilRecruitment !== 0) {
      return false;
    }

    const { unitType, amount } = action;
    const capacity = this.calculateRecruitmentCapacity(nation);
    const maxRecruit = capacity[unitType as keyof typeof capacity] || 0;

    if (amount > maxRecruit) {
      return false;
    }

    // Check resource costs (simplified)
    const cost = this.calculateRecruitmentCost(unitType, amount);
    if (!this.canAfford(nation, cost)) {
      return false;
    }

    // Deduct resources and add units
    this.deductMoney(nation, cost);
    nation.military[unitType as keyof MilitaryBuild] += amount;

    session.updated_at = new Date().toISOString();
    return true;
  }

  /**
   * Execute spy operation
   */
  private executeSpyOperation(session: BattleSession, nation: SimulatedNation, action: any): boolean {
    // Implement spy logic
    return true;
  }

  /**
   * Execute purchase action with building limits
   */
  private executePurchase(session: BattleSession, nation: SimulatedNation, action: any): boolean {
    const { cityId, type, item, amount } = action;
    const cityIndex = parseInt(cityId);
    const city = nation.cities[cityIndex];
    
    if (!city) return false;

    // Check building limits
    if (item === 'barracks' && city.barracks + amount > BUILDING_LIMITS.MAX_BARRACKS) {
      return false;
    }
    if (item === 'factory' && city.factory + amount > BUILDING_LIMITS.MAX_FACTORIES) {
      return false;
    }
    if (item === 'hangar' && city.hangar + amount > BUILDING_LIMITS.MAX_HANGARS) {
      return false;
    }
    if (item === 'drydock' && city.drydock + amount > BUILDING_LIMITS.MAX_DRYDOCKS) {
      return false;
    }

    const cost = this.calculatePurchaseCost(type, item, amount);
    
    if (this.canAfford(nation, cost)) {
      this.deductMoney(nation, cost);
      this.addToCity(city, type, item, amount);
      session.updated_at = new Date().toISOString();
      return true;
    }

    return false;
  }

  /**
   * Execute policy change
   */
  private executePolicyChange(session: BattleSession, nation: SimulatedNation, action: any): boolean {
    const { policyType, newPolicy } = action;
    
    if (policyType === 'war_policy') {
      nation.war_policy = newPolicy;
    } else if (policyType === 'domestic_policy') {
      nation.domestic_policy = newPolicy;
    } else {
      return false;
    }

    session.updated_at = new Date().toISOString();
    return true;
  }

  /**
   * Generate cities based on settings and copy from host if provided
   */
  private generateCities(settings: SimulationSettings, hostCities?: CityBuild[]): CityBuild[] {
    const numCities = 10; // Default to 10 cities
    const cities: CityBuild[] = [];

    for (let i = 0; i < numCities; i++) {
      let cityBuild: CityBuild;
      
      // Copy from host cities if available
      if (hostCities && hostCities[i]) {
        cityBuild = { ...hostCities[i] };
      } else {
        // Apply militarization settings
        const defconBuild = this.getDefconBuild(settings.militarizationLevel);
        
        cityBuild = {
          id: `city_${i}`,
          name: `City ${i + 1}`,
          nation_id: 'temp',
          infrastructure: 1000,
          land: 1000,
          powered: true,
          // Power
          coal_power: 0,
          oil_power: 0,
          nuclear_power: 0,
          wind_power: 0,
          // Resources
          coal_mine: 1,
          oil_well: 1,
          uranium_mine: 0,
          iron_mine: 1,
          bauxite_mine: 1,
          lead_mine: 1,
          farm: 1,
          // Manufacturing
          aluminum_refinery: 1,
          steel_mill: 1,
          oil_refinery: 1,
          munitions_factory: 1,
          // Civil
          police_station: 1,
          hospital: 1,
          recycling_center: 1,
          subway: 1,
          supermarket: 1,
          bank: 1,
          shopping_mall: 1,
          stadium: 1,
          // Military (apply build limits)
          barracks: Math.min(defconBuild.barracks, BUILDING_LIMITS.MAX_BARRACKS),
          factory: Math.min(defconBuild.factories, BUILDING_LIMITS.MAX_FACTORIES),
          hangar: Math.min(defconBuild.hangars, BUILDING_LIMITS.MAX_HANGARS),
          drydock: Math.min(defconBuild.drydocks, BUILDING_LIMITS.MAX_DRYDOCKS)
        };
      }
      
      cities.push(cityBuild);
    }

    return cities;
  }

  /**
   * Generate military units based on settings and host build
   */
  private generateMilitary(settings: SimulationSettings, hostMilitary?: Partial<MilitaryBuild>): MilitaryBuild {
    if (hostMilitary) {
      return {
        barracks: hostMilitary.barracks || 0,
        factories: hostMilitary.factories || 0,
        hangars: hostMilitary.hangars || 0,
        drydocks: hostMilitary.drydocks || 0,
        soldiers: hostMilitary.soldiers || 0,
        tanks: hostMilitary.tanks || 0,
        aircraft: hostMilitary.aircraft || 0,
        ships: hostMilitary.ships || 0,
        missiles: hostMilitary.missiles || 0,
        nukes: hostMilitary.nukes || 0
      };
    }

    const defconBuild = this.getDefconBuild(settings.militarizationLevel);
    
    return {
      barracks: defconBuild.barracks,
      factories: defconBuild.factories,
      hangars: defconBuild.hangars,
      drydocks: defconBuild.drydocks,
      soldiers: 10000,
      tanks: 250,
      aircraft: 45,
      ships: 15,
      missiles: 0,
      nukes: 0
    };
  }

  // Helper methods (keeping existing implementations)
  private generateSessionId(): string {
    return Math.random().toString(36).substring(2, 15);
  }

  private getDefconBuild(level: MilitarizationLevel) {
    return DEFCON_BUILDS[level] || DEFCON_BUILDS[MilitarizationLevel.ZERO];
  }

  private getEconomyResources(settings: any) {
    const mode = settings.mode as EconomyMode;
    return ECONOMY_PRESETS[mode] || ECONOMY_PRESETS[EconomyMode.UNLIMITED];
  }

  private calculateScore(nation: any): number {
    return 1000; // Simplified
  }

  private startTurnTimer(sessionId: string): void {
    // Implementation for turn timer
  }

  private calculateRecruitmentCost(unitType: string, amount: number): any {
    // Return resource cost for recruitment
    return { money: amount * 100 };
  }

  private canAfford(nation: SimulatedNation, cost: any): boolean {
    return nation.resources.money >= (cost.money || 0);
  }

  private deductMoney(nation: SimulatedNation, cost: any): void {
    nation.resources.money -= (cost.money || 0);
  }

  private calculatePurchaseCost(type: string, item: string, amount: number): any {
    return { money: amount * 50000 }; // Simplified cost
  }

  private addToCity(city: CityBuild, type: string, item: string, amount: number): void {
    if (item in city) {
      (city as any)[item] += amount;
    }
  }

  // Public getters
  getSession(sessionId: string): BattleSession | undefined {
    return this.sessions.get(sessionId);
  }

  getAllSessions(): BattleSession[] {
    return Array.from(this.sessions.values());
  }

  deleteSession(sessionId: string): boolean {
    if (this.timers.has(sessionId)) {
      clearTimeout(this.timers.get(sessionId));
      this.timers.delete(sessionId);
    }
    return this.sessions.delete(sessionId);
  }
}

// Export singleton instance
export const battleEngine = new BattleSimulationEngine();
