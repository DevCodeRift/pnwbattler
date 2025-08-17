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
  CityUpgrade
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
      cities: this.generateCities(settings),
      military: this.generateMilitary(settings),
      resources: this.getEconomyResources(settings.economySettings),
      war_policy: 'BLITZKRIEG',
      domestic_policy: 'IMPERIALISM',
      government_type: 'DEMOCRACY',
      economic_policy: 'MARKET_ECONOMY',
      social_policy: 'LIBERTARIAN',
      score: this.calculateScore(hostNation),
      population: 0,
      land: 0
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
   * Join an existing session
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
      cities: this.generateCities(session.settings),
      military: this.generateMilitary(session.settings),
      resources: this.getEconomyResources(session.settings.economySettings),
      war_policy: 'BLITZKRIEG',
      domestic_policy: 'IMPERIALISM',
      government_type: 'DEMOCRACY',
      economic_policy: 'MARKET_ECONOMY',
      social_policy: 'LIBERTARIAN',
      score: this.calculateScore(nation),
      population: 0,
      land: 0
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
    if (!session || session.participants.length < 2) {
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
   * Generate cities based on settings
   */
  private generateCities(settings: SimulationSettings): CityBuild[] {
    const numCities = 10; // Default to 10 cities
    const cities: CityBuild[] = [];

    for (let i = 0; i < numCities; i++) {
      const city: CityBuild = {
        infrastructure: 2000,
        land: 2000,
        powered: true,
        // Power plants
        coal_power: 0,
        oil_power: 0,
        nuclear_power: 1,
        wind_power: 0,
        // Raw resources
        coal_mine: 0,
        oil_well: 0,
        uranium_mine: 0,
        iron_mine: 0,
        bauxite_mine: 0,
        lead_mine: 0,
        farm: 0,
        // Manufacturing
        aluminum_refinery: 0,
        steel_mill: 0,
        oil_refinery: 0,
        munitions_factory: 0,
        // Civil
        police_station: 1,
        hospital: 5,
        recycling_center: 3,
        subway: 1,
        // Commerce
        supermarket: 4,
        bank: 5,
        shopping_mall: 4,
        stadium: 3,
        // Military
        barracks: 0,
        factory: 0,
        hangar: 0,
        drydock: 0
      };

      // Apply militarization level
      this.applyMilitarization(city, settings);
      cities.push(city);
    }

    return cities;
  }

  /**
   * Apply militarization to a city
   */
  private applyMilitarization(city: CityBuild, settings: SimulationSettings): void {
    let build;
    
    switch (settings.militarizationLevel) {
      case MilitarizationLevel.ZERO:
        build = { barracks: 0, factories: 0, hangars: 0, drydocks: 0 };
        break;
      case MilitarizationLevel.PARTIAL:
        build = DEFCON_BUILDS.PEACETIME_MIXED;
        break;
      case MilitarizationLevel.MAXED:
        build = DEFCON_BUILDS.FULL_WAR;
        break;
      case MilitarizationLevel.CUSTOM:
        build = settings.customMilitary || DEFCON_BUILDS.PEACETIME_MIXED;
        break;
      default:
        build = DEFCON_BUILDS.PEACETIME_MIXED;
    }

    city.barracks = build.barracks || 0;
    city.factory = build.factories || 0;
    city.hangar = build.hangars || 0;
    city.drydock = build.drydocks || 0;
  }

  /**
   * Generate military units based on cities
   */
  private generateMilitary(settings: SimulationSettings): MilitaryBuild {
    const military: MilitaryBuild = {
      barracks: 0,
      factories: 0,
      hangars: 0,
      drydocks: 0,
      soldiers: 0,
      tanks: 0,
      aircraft: 0,
      ships: 0,
      missiles: 0,
      nukes: 0
    };

    // Calculate based on militarization level
    const cities = this.generateCities(settings);
    
    cities.forEach(city => {
      military.barracks += city.barracks;
      military.factories += city.factory;
      military.hangars += city.hangar;
      military.drydocks += city.drydock;
      
      // Calculate units based on improvements
      military.soldiers += city.barracks * 3000; // 3000 soldiers per barracks
      military.tanks += city.factory * 250; // 250 tanks per factory
      military.aircraft += city.hangar * 15; // 15 aircraft per hangar
      military.ships += city.drydock * 5; // 5 ships per drydock
    });

    return military;
  }

  /**
   * Get economy resources based on settings
   */
  private getEconomyResources(economySettings: any) {
    switch (economySettings.mode) {
      case EconomyMode.UNLIMITED:
        return ECONOMY_PRESETS.UNLIMITED;
      case EconomyMode.LIMITED:
        return ECONOMY_PRESETS.LIMITED;
      case EconomyMode.MINIMAL:
        return ECONOMY_PRESETS.MINIMAL;
      default:
        return economySettings.resources || ECONOMY_PRESETS.LIMITED;
    }
  }

  /**
   * Calculate nation score
   */
  private calculateScore(nation: Partial<SimulatedNation>): number {
    // Basic score calculation
    return 10000; // Default score for simulation
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  /**
   * Start turn timer for a session
   */
  private startTurnTimer(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    const timer = setInterval(() => {
      session.turnTimer--;
      if (session.turnTimer <= 0) {
        this.nextTurn(sessionId);
      }
    }, 1000);

    this.timers.set(sessionId, timer);
  }

  /**
   * Advance to next turn
   */
  private nextTurn(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    session.currentTurn++;
    session.turnTimer = session.settings.turnCooldown;
    session.updated_at = new Date().toISOString();

    // Process turn-based actions here
    this.processTurnActions(session);
  }

  /**
   * Process actions that happen each turn
   */
  private processTurnActions(session: BattleSession): void {
    // Resource generation, unit upkeep, etc.
    session.participants.forEach(nation => {
      this.processNationTurn(nation, session);
    });
  }

  /**
   * Process a single nation's turn
   */
  private processNationTurn(nation: SimulatedNation, session: BattleSession): void {
    // Generate resources
    this.generateResources(nation);
    
    // Pay upkeep
    this.payUpkeep(nation);
    
    // Check win conditions
    this.checkWinConditions(session);
  }

  /**
   * Generate resources for a nation
   */
  private generateResources(nation: SimulatedNation): void {
    // Tax income, resource production, etc.
    nation.resources.money += 100000; // Base income per turn
  }

  /**
   * Pay military upkeep
   */
  private payUpkeep(nation: SimulatedNation): void {
    const upkeepCost = 
      nation.military.soldiers * 1.25 +
      nation.military.tanks * 50 +
      nation.military.aircraft * 500 +
      nation.military.ships * 3375;
    
    nation.resources.money = Math.max(0, nation.resources.money - upkeepCost);
  }

  /**
   * Check for win conditions
   */
  private checkWinConditions(session: BattleSession): void {
    // Implement win condition logic
    const activePlayers = session.participants.filter(p => 
      p.military.soldiers > 0 || 
      p.military.tanks > 0 || 
      p.military.aircraft > 0 || 
      p.military.ships > 0
    );

    if (activePlayers.length === 1) {
      session.winner = activePlayers[0].id;
      session.isActive = false;
      this.endSession(session.id);
    }
  }

  /**
   * Execute an attack action
   */
  private executeAttack(session: BattleSession, attacker: SimulatedNation, action: any): boolean {
    // Implement attack logic
    return true;
  }

  /**
   * Execute recruitment action
   */
  private executeRecruitment(session: BattleSession, nation: SimulatedNation, action: any): boolean {
    // Check if recruitment is allowed this turn
    if (session.currentTurn % session.settings.turnsUntilRecruitment !== 0) {
      return false;
    }

    // Implement recruitment logic
    const { unitType, amount } = action;
    const cost = this.calculateRecruitmentCost(unitType, amount);

    if (this.canAfford(nation, cost)) {
      this.deductResources(nation, cost);
      this.addUnits(nation, unitType, amount);
      return true;
    }

    return false;
  }

  /**
   * Execute spy operation
   */
  private executeSpyOperation(session: BattleSession, nation: SimulatedNation, action: any): boolean {
    if (!session.settings.spyOperationsEnabled) {
      return false;
    }

    // Implement spy operation logic
    return true;
  }

  /**
   * Execute purchase action (infrastructure, improvements, etc.)
   */
  private executePurchase(session: BattleSession, nation: SimulatedNation, action: any): boolean {
    const { cityId, type, item, amount } = action;
    const city = nation.cities.find((_, index) => index.toString() === cityId);
    
    if (!city) return false;

    const cost = this.calculatePurchaseCost(type, item, amount);
    
    if (this.canAfford(nation, cost)) {
      this.deductResources(nation, cost);
      this.addToCity(city, type, item, amount);
      return true;
    }

    return false;
  }

  /**
   * Execute policy change
   */
  private executePolicyChange(session: BattleSession, nation: SimulatedNation, action: any): boolean {
    const { policyType, newPolicy } = action;
    
    switch (policyType) {
      case 'war':
        nation.war_policy = newPolicy;
        break;
      case 'domestic':
        nation.domestic_policy = newPolicy;
        break;
      default:
        return false;
    }
    
    return true;
  }

  /**
   * Calculate recruitment cost
   */
  private calculateRecruitmentCost(unitType: string, amount: number): any {
    const costs = {
      soldiers: { money: 1.25 * amount },
      tanks: { money: 50 * amount, gasoline: amount * 0.01, munitions: amount * 0.01 },
      aircraft: { money: 500 * amount, gasoline: amount * 0.25, munitions: amount * 0.25 },
      ships: { money: 3375 * amount, gasoline: amount * 2, munitions: amount * 2.5 }
    };

    return costs[unitType as keyof typeof costs] || { money: 0 };
  }

  /**
   * Calculate purchase cost for infrastructure/improvements
   */
  private calculatePurchaseCost(type: string, item: string, amount: number): any {
    const costs = {
      infrastructure: { money: 2000 * amount },
      land: { money: 500 * amount },
      // Add improvement costs based on the Politics & War info
      barracks: { money: 3000 * amount },
      factory: { money: 15000 * amount, aluminum: 5 * amount },
      hangar: { money: 100000 * amount, steel: 10 * amount },
      drydock: { money: 250000 * amount, aluminum: 20 * amount }
    };

    return costs[item as keyof typeof costs] || { money: 0 };
  }

  /**
   * Check if nation can afford a cost
   */
  private canAfford(nation: SimulatedNation, cost: any): boolean {
    return Object.entries(cost).every(([resource, amount]) => 
      nation.resources[resource as keyof typeof nation.resources] >= (amount as number)
    );
  }

  /**
   * Deduct resources from nation
   */
  private deductResources(nation: SimulatedNation, cost: any): void {
    Object.entries(cost).forEach(([resource, amount]) => {
      const current = nation.resources[resource as keyof typeof nation.resources];
      nation.resources[resource as keyof typeof nation.resources] = Math.max(0, current - (amount as number));
    });
  }

  /**
   * Add units to nation
   */
  private addUnits(nation: SimulatedNation, unitType: string, amount: number): void {
    switch (unitType) {
      case 'soldiers':
        nation.military.soldiers += amount;
        break;
      case 'tanks':
        nation.military.tanks += amount;
        break;
      case 'aircraft':
        nation.military.aircraft += amount;
        break;
      case 'ships':
        nation.military.ships += amount;
        break;
    }
  }

  /**
   * Add improvements to city
   */
  private addToCity(city: CityBuild, type: string, item: string, amount: number): void {
    if (type === 'infrastructure') {
      city.infrastructure += amount;
    } else if (type === 'land') {
      city.land += amount;
    } else {
      // Add improvement
      const current = city[item as keyof CityBuild] as number;
      (city as any)[item] = current + amount;
    }
  }

  /**
   * End a session
   */
  private endSession(sessionId: string): void {
    const timer = this.timers.get(sessionId);
    if (timer) {
      clearInterval(timer);
      this.timers.delete(sessionId);
    }
  }

  /**
   * Get session by ID
   */
  getSession(sessionId: string): BattleSession | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * Get all active sessions
   */
  getActiveSessions(): BattleSession[] {
    return Array.from(this.sessions.values()).filter(session => session.isActive);
  }

  /**
   * Get open lobbies
   */
  getOpenLobbies(): BattleSession[] {
    return Array.from(this.sessions.values()).filter(session => 
      !session.isActive && session.mode === 'open_lobby'
    );
  }
}
