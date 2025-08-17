// Battle Simulation Types
export enum BattleMode {
  AI = 'ai',
  OPEN_LOBBY = 'open_lobby',
  PRIVATE_INVITE = 'private_invite'
}

export enum EconomyMode {
  UNLIMITED = 'unlimited',
  LIMITED = 'limited',
  MINIMAL = 'minimal'
}

export enum MilitarizationLevel {
  ZERO = 'zero',
  PARTIAL = 'partial',
  MAXED = 'maxed',
  CUSTOM = 'custom'
}

export interface MilitaryBuild {
  barracks: number;
  factories: number;
  hangars: number;
  drydocks: number;
  soldiers: number;
  tanks: number;
  aircraft: number;
  ships: number;
  missiles: number;
  nukes: number;
}

export interface EconomySettings {
  mode: EconomyMode;
  resources: {
    money: number;
    oil: number;
    food: number;
    steel: number;
    aluminum: number;
    gasoline: number;
    munitions: number;
    uranium: number;
    coal: number;
    iron: number;
    bauxite: number;
    lead: number;
  };
}

export interface SimulationSettings {
  battleMode: BattleMode;
  turnCooldown: number; // in seconds (30, 60, 120, 300)
  turnsUntilRecruitment: number; // How many turns until you can buy more troops
  militarizationLevel: MilitarizationLevel;
  customMilitary?: Partial<MilitaryBuild>;
  economySettings: EconomySettings;
  spyOperationsEnabled: boolean;
  isPrivate: boolean;
  inviteNationId?: string;
  inviteMessage?: string;
}

export interface CityBuild {
  infrastructure: number;
  land: number;
  powered: boolean;
  // Power Plants
  coal_power: number;
  oil_power: number;
  nuclear_power: number;
  wind_power: number;
  // Raw Resources
  coal_mine: number;
  oil_well: number;
  uranium_mine: number;
  iron_mine: number;
  bauxite_mine: number;
  lead_mine: number;
  farm: number;
  // Manufacturing
  aluminum_refinery: number;
  steel_mill: number;
  oil_refinery: number;
  munitions_factory: number;
  // Civil
  police_station: number;
  hospital: number;
  recycling_center: number;
  subway: number;
  // Commerce
  supermarket: number;
  bank: number;
  shopping_mall: number;
  stadium: number;
  // Military
  barracks: number;
  factory: number;
  hangar: number;
  drydock: number;
}

export interface SimulatedNation {
  id: string;
  nation_name: string;
  leader_name: string;
  cities: CityBuild[];
  military: MilitaryBuild;
  resources: EconomySettings['resources'];
  war_policy: string;
  domestic_policy: string;
  government_type: string;
  economic_policy: string;
  social_policy: string;
  score: number;
  population: number;
  land: number;
}

export interface BattleSession {
  id: string;
  mode: BattleMode;
  settings: SimulationSettings;
  participants: SimulatedNation[];
  currentTurn: number;
  turnTimer: number;
  isActive: boolean;
  winner?: string;
  created_at: string;
  updated_at: string;
}

export interface BattleAction {
  sessionId: string;
  nationId: string;
  turn: number;
  action: 'attack' | 'recruit' | 'spy' | 'purchase' | 'policy_change';
  details: any;
  timestamp: string;
}

export interface SpyOperation {
  type: 'gather_intel' | 'assassinate_spies' | 'destroy_missiles' | 'destroy_nukes' | 'destroy_units';
  target: string;
  success: boolean;
  damage?: number;
  intelligence?: any;
}

export interface CityUpgrade {
  cityId: string;
  type: 'infrastructure' | 'land' | 'improvement';
  improvement?: keyof CityBuild;
  amount: number;
  cost: {
    money: number;
    steel?: number;
    aluminum?: number;
  };
}

export const DEFCON_BUILDS = {
  PEACETIME_PLANES: { barracks: 0, factories: 0, hangars: 5, drydocks: 0 },
  PEACETIME_MIXED: { barracks: 0, factories: 2, hangars: 5, drydocks: 0 },
  HIGH_ALERT: { barracks: 5, factories: 5, hangars: 5, drydocks: 0 },
  FULL_WAR: { barracks: 5, factories: 5, hangars: 5, drydocks: 3 }
};

export const TURN_COOLDOWNS = [30, 60, 120, 300]; // seconds

export const ECONOMY_PRESETS = {
  UNLIMITED: {
    money: 999999999,
    oil: 999999999,
    food: 999999999,
    steel: 999999999,
    aluminum: 999999999,
    gasoline: 999999999,
    munitions: 999999999,
    uranium: 999999999,
    coal: 999999999,
    iron: 999999999,
    bauxite: 999999999,
    lead: 999999999
  },
  LIMITED: {
    money: 1000000,
    oil: 10000,
    food: 10000,
    steel: 5000,
    aluminum: 5000,
    gasoline: 5000,
    munitions: 5000,
    uranium: 1000,
    coal: 10000,
    iron: 10000,
    bauxite: 10000,
    lead: 10000
  },
  MINIMAL: {
    money: 50000,
    oil: 100,
    food: 500,
    steel: 100,
    aluminum: 100,
    gasoline: 200,
    munitions: 200,
    uranium: 10,
    coal: 100,
    iron: 100,
    bauxite: 100,
    lead: 100
  }
};
