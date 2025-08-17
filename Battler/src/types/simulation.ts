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

// MAP (Military Action Points) System
export const MAP_CONSTANTS = {
  STARTING_MAPS: 6,
  MAPS_PER_TURN: 1,
  MAX_MAPS: 12,
  GROUND_ATTACK_COST: 3,
  AIR_ATTACK_COST: 4,
  NAVAL_ATTACK_COST: 4
};

// Building Limits
export const BUILDING_LIMITS = {
  MAX_BARRACKS: 5,
  MAX_FACTORIES: 5,
  MAX_HANGARS: 5,
  MAX_DRYDOCKS: 3
};

export enum AttackType {
  GROUND = 'ground',
  AIR = 'air',
  NAVAL = 'naval'
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
  id?: string;
  name?: string;
  nation_id?: string;
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
  maps: number; // Military Action Points - starts at 6, gains 1 per turn
  maxMaps: number; // Maximum MAPs (usually 12)
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
  details: AttackAction | RecruitAction | SpyAction | PurchaseAction | PolicyAction;
  timestamp: string;
  mapsCost?: number;
}

export interface AttackAction {
  type: AttackType;
  target: string;
  result?: {
    success: boolean;
    damage: number;
    losses: Partial<MilitaryBuild>;
  };
}

export interface RecruitAction {
  unitType: keyof MilitaryBuild;
  quantity: number;
}

export interface SpyAction {
  operation: SpyOperation;
}

export interface PurchaseAction {
  cityId: string;
  upgrade: CityUpgrade;
}

export interface PolicyAction {
  policyType: 'war_policy' | 'domestic_policy';
  newPolicy: string;
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
  [MilitarizationLevel.ZERO]: { barracks: 0, factories: 0, hangars: 0, drydocks: 0 },
  [MilitarizationLevel.PARTIAL]: { barracks: 2, factories: 2, hangars: 3, drydocks: 1 },
  [MilitarizationLevel.MAXED]: { barracks: 5, factories: 5, hangars: 5, drydocks: 3 },
  [MilitarizationLevel.CUSTOM]: { barracks: 0, factories: 0, hangars: 0, drydocks: 0 }
};

export const TURN_COOLDOWNS = [30, 60, 120, 300]; // seconds

export const ECONOMY_PRESETS = {
  [EconomyMode.UNLIMITED]: {
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
  [EconomyMode.LIMITED]: {
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
  [EconomyMode.MINIMAL]: {
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
