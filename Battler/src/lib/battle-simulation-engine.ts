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

    // Calculate attack results
    const attackerStrength = this.calculateMilitaryStrength(attacker, attackTypeEnum);
    const defenderStrength = this.calculateMilitaryStrength(target, attackTypeEnum);
    
    console.log('Battle strength:', { attacker: attackerStrength, defender: defenderStrength });
    
    const success = attackerStrength > defenderStrength * Math.random();
    const damage = success ? Math.floor(defenderStrength * 0.1) : 0;

    console.log('Attack result:', { success, damage });

    // Apply damage to target
    if (success && damage > 0) {
      this.applyMilitaryDamage(target, attackTypeEnum, damage);
    }

    session.updated_at = new Date().toISOString();
    console.log('Attack completed, remaining MAPs:', attacker.maps);
    return true;
  }

  /**
   * Calculate military strength for different attack types
   */
  private calculateMilitaryStrength(nation: SimulatedNation, attackType: AttackType): number {
    switch (attackType) {
      case AttackType.GROUND:
        return nation.military.soldiers + (nation.military.tanks * 40);
      case AttackType.AIR:
        return nation.military.aircraft * 50;
      case AttackType.NAVAL:
        return nation.military.ships * 100;
      default:
        return 0;
    }
  }

  /**
   * Apply military damage to a nation
   */
  private applyMilitaryDamage(nation: SimulatedNation, attackType: AttackType, damage: number): void {
    switch (attackType) {
      case AttackType.GROUND:
        const soldierLoss = Math.min(damage, nation.military.soldiers);
        nation.military.soldiers -= soldierLoss;
        break;
      case AttackType.AIR:
        const aircraftLoss = Math.min(Math.floor(damage / 50), nation.military.aircraft);
        nation.military.aircraft -= aircraftLoss;
        break;
      case AttackType.NAVAL:
        const shipLoss = Math.min(Math.floor(damage / 100), nation.military.ships);
        nation.military.ships -= shipLoss;
        break;
    }
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
    this.deductResources(nation, cost);
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
      this.deductResources(nation, cost);
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

  private deductResources(nation: SimulatedNation, cost: any): void {
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
