// Politics and War API Types based on the introspection schema
export interface Nation {
  id: string;
  nation_name: string;
  leader_name: string;
  continent: string;
  color: string;
  alliance_id?: string;
  alliance?: Alliance;
  cities: City[];
  score: number;
  population: number;
  land: number;
  soldiers: number;
  tanks: number;
  aircraft: number;
  ships: number;
  missiles: number;
  nukes: number;
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
  wars_won: number;
  wars_lost: number;
  war_policy: WarPolicy;
  domestic_policy: DomesticPolicy;
  government_type: GovernmentType;
  economic_policy: EconomicPolicy;
  social_policy: SocialPolicy;
}

export interface Alliance {
  id: string;
  name: string;
  acronym?: string;
  color: string;
  nations: Nation[];
  score: number;
  applicants: number;
  members: number;
  accepted_members: number;
}

export interface City {
  id: string;
  name: string;
  nation_id: string;
  founded: string;
  infrastructure: number;
  land: number;
  powered: boolean;
  oil_power: number;
  wind_power: number;
  coal_power: number;
  nuclear_power: number;
  coal_mine: number;
  oil_well: number;
  uranium_mine: number;
  iron_mine: number;
  bauxite_mine: number;
  lead_mine: number;
  farm: number;
  aluminum_refinery: number;
  steel_mill: number;
  oil_refinery: number;
  munitions_factory: number;
  police_station: number;
  hospital: number;
  recycling_center: number;
  subway: number;
  supermarket: number;
  bank: number;
  shopping_mall: number;
  stadium: number;
  barracks: number;
  factory: number;
  hangar: number;
  drydock: number;
}

export interface War {
  id: string;
  date: string;
  reason: string;
  war_type: WarType;
  ground_control: string;
  air_superiority: string;
  naval_blockade: string;
  winner?: string;
  attacker_id: string;
  attacker: Nation;
  defender_id: string;
  defender: Nation;
  attacker_alliance_id?: string;
  defender_alliance_id?: string;
  attacks: WarAttack[];
}

export interface WarAttack {
  id: string;
  date: string;
  attacker_id: string;
  defender_id: string;
  type: AttackType;
  war_id: string;
  victor: string;
  success: number;
  attacker_army_units_killed: number;
  defender_army_units_killed: number;
  attacker_tank_units_killed: number;
  defender_tank_units_killed: number;
  attacker_aircraft_killed: number;
  defender_aircraft_killed: number;
  attacker_ship_killed: number;
  defender_ship_killed: number;
  attacker_missiles_used: number;
  defender_missiles_used: number;
  attacker_nukes_used: number;
  defender_nukes_used: number;
  infrastructure_destroyed: number;
  attacker_money_looted: number;
  defender_money_looted: number;
  attacker_soldiers_killed: number;
  defender_soldiers_killed: number;
  attacker_tanks_killed: number;
  defender_tanks_killed: number;
}

// Enums
export enum WarType {
  ORDINARY = 'ORDINARY',
  ATTRITION = 'ATTRITION',
  RAID = 'RAID'
}

export enum AttackType {
  AIRVINFRA = 'AIRVINFRA',
  AIRVSOLDIERS = 'AIRVSOLDIERS',
  AIRVTANKS = 'AIRVTANKS',
  AIRVMONEY = 'AIRVMONEY',
  AIRVSHIPS = 'AIRVSHIPS',
  AIRVAIR = 'AIRVAIR',
  GROUND = 'GROUND',
  MISSILE = 'MISSILE',
  MISSILETWO = 'MISSILETWO',
  NUKE = 'NUKE',
  NAVAL = 'NAVAL',
  FORTIFY = 'FORTIFY'
}

export enum WarPolicy {
  BLITZKRIEG = 'BLITZKRIEG',
  TURTLE = 'TURTLE',
  GUARDIAN = 'GUARDIAN',
  COVERT = 'COVERT',
  ARCANE = 'ARCANE'
}

export enum DomesticPolicy {
  MANIFEST_DESTINY = 'MANIFEST_DESTINY',
  OPEN_MARKETS = 'OPEN_MARKETS',
  TECHNOLOGICAL_ADVANCEMENT = 'TECHNOLOGICAL_ADVANCEMENT',
  IMPERIALISM = 'IMPERIALISM',
  URBANIZATION = 'URBANIZATION'
}

export enum GovernmentType {
  ANARCHY = 'ANARCHY',
  ABSOLUTE_MONARCHY = 'ABSOLUTE_MONARCHY',
  CONSTITUTIONAL_MONARCHY = 'CONSTITUTIONAL_MONARCHY',
  DEMOCRACY = 'DEMOCRACY',
  FEDERAL_DEMOCRACY = 'FEDERAL_DEMOCRACY',
  COMMUNIST = 'COMMUNIST',
  SOCIALIST = 'SOCIALIST',
  REPUBLIC = 'REPUBLIC',
  DICTATORSHIP = 'DICTATORSHIP',
  OLIGARCHY = 'OLIGARCHY',
  THEOCRACY = 'THEOCRACY'
}

export enum EconomicPolicy {
  LAISSEZ_FAIRE = 'LAISSEZ_FAIRE',
  MIXED_ECONOMY = 'MIXED_ECONOMY',
  PLANNED_ECONOMY = 'PLANNED_ECONOMY'
}

export enum SocialPolicy {
  LIBERTARIAN = 'LIBERTARIAN',
  MODERATE = 'MODERATE',
  AUTHORITARIAN = 'AUTHORITARIAN'
}

// Battle Simulation Types
export interface BattleConfig {
  id: string;
  name: string;
  isPrivate: boolean;
  maxPlayers: number;
  turnDuration: number; // in hours
  actionPointsPerTurn: number;
  customBuilds: boolean;
  customCities: boolean;
  customResources: boolean;
  created_at: string;
  created_by: string;
  status: 'waiting' | 'active' | 'completed';
}

export interface BattlePlayer {
  id: string;
  discord_id: string;
  discord_username: string;
  pw_nation_id?: string;
  pw_nation?: Nation;
  custom_nation?: CustomNation;
  action_points: number;
  last_action: string;
  is_ready: boolean;
}

export interface CustomNation {
  name: string;
  cities: CustomCity[];
  soldiers: number;
  tanks: number;
  aircraft: number;
  ships: number;
  missiles: number;
  nukes: number;
  money: number;
  resources: {
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
  policies: {
    war_policy: WarPolicy;
    domestic_policy: DomesticPolicy;
    government_type: GovernmentType;
    economic_policy: EconomicPolicy;
    social_policy: SocialPolicy;
  };
}

export interface CustomCity {
  name: string;
  infrastructure: number;
  land: number;
  powered: boolean;
  improvements: {
    oil_power: number;
    wind_power: number;
    coal_power: number;
    nuclear_power: number;
    coal_mine: number;
    oil_well: number;
    uranium_mine: number;
    iron_mine: number;
    bauxite_mine: number;
    lead_mine: number;
    farm: number;
    aluminum_refinery: number;
    steel_mill: number;
    oil_refinery: number;
    munitions_factory: number;
    police_station: number;
    hospital: number;
    recycling_center: number;
    subway: number;
    supermarket: number;
    bank: number;
    shopping_mall: number;
    stadium: number;
    barracks: number;
    factory: number;
    hangar: number;
    drydock: number;
  };
}

export interface BattleAction {
  id: string;
  battle_id: string;
  player_id: string;
  target_player_id?: string;
  action_type: AttackType;
  timestamp: string;
  result: BattleActionResult;
  cost_action_points: number;
}

export interface BattleActionResult {
  success: boolean;
  damage_dealt: number;
  losses_inflicted: {
    soldiers?: number;
    tanks?: number;
    aircraft?: number;
    ships?: number;
    infrastructure?: number;
    money?: number;
  };
  losses_taken: {
    soldiers?: number;
    tanks?: number;
    aircraft?: number;
    ships?: number;
  };
  message: string;
}

// Discord User Types
export interface DiscordUser {
  id: string;
  username: string;
  discriminator: string;
  avatar?: string;
  email?: string;
}

// Verification Types
export interface PWVerification {
  id: string;
  discord_id: string;
  pw_nation_id: string;
  verification_code: string;
  verified: boolean;
  expires_at: string;
  created_at: string;
}

// Re-export all simulation types
export * from './simulation';
