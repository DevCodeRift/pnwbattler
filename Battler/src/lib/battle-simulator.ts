import { AttackType, Nation, City, BattleActionResult, WarPolicy } from '../types';

export class BattleSimulator {
  /**
   * Calculate military strength based on nation stats and policies
   */
  static calculateMilitaryStrength(nation: Nation | any, attackType: AttackType): number {
    let baseStrength = 0;
    
    switch (attackType) {
      case AttackType.GROUND:
        baseStrength = nation.soldiers * 1 + nation.tanks * 40;
        break;
      case AttackType.AIRVINFRA:
      case AttackType.AIRVSOLDIERS:
      case AttackType.AIRVTANKS:
      case AttackType.AIRVMONEY:
      case AttackType.AIRVSHIPS:
      case AttackType.AIRVAIR:
        baseStrength = nation.aircraft;
        break;
      case AttackType.NAVAL:
        baseStrength = nation.ships;
        break;
      case AttackType.MISSILE:
      case AttackType.MISSILETWO:
        baseStrength = nation.missiles;
        break;
      case AttackType.NUKE:
        baseStrength = nation.nukes;
        break;
      default:
        baseStrength = nation.soldiers + nation.tanks + nation.aircraft + nation.ships;
    }

    // Apply war policy modifiers
    const warPolicyModifier = this.getWarPolicyModifier(nation.war_policy, attackType);
    
    return Math.floor(baseStrength * warPolicyModifier);
  }

  /**
   * Get war policy modifiers for different attack types
   */
  static getWarPolicyModifier(warPolicy: WarPolicy, attackType: AttackType): number {
    const modifiers: Record<WarPolicy, Record<string, number>> = {
      [WarPolicy.BLITZKRIEG]: {
        ground: 1.1,
        air: 1.05,
        naval: 1.0,
        missile: 1.0,
        nuke: 1.0
      },
      [WarPolicy.TURTLE]: {
        ground: 0.9,
        air: 0.95,
        naval: 1.0,
        missile: 1.1,
        nuke: 1.0
      },
      [WarPolicy.GUARDIAN]: {
        ground: 1.0,
        air: 1.0,
        naval: 1.05,
        missile: 1.0,
        nuke: 0.9
      },
      [WarPolicy.COVERT]: {
        ground: 0.95,
        air: 1.0,
        naval: 1.0,
        missile: 1.05,
        nuke: 1.1
      },
      [WarPolicy.ARCANE]: {
        ground: 1.0,
        air: 1.0,
        naval: 1.0,
        missile: 1.0,
        nuke: 1.2
      }
    };

    let category = 'ground';
    if (attackType.includes('AIR')) category = 'air';
    else if (attackType === AttackType.NAVAL) category = 'naval';
    else if (attackType.includes('MISSILE')) category = 'missile';
    else if (attackType === AttackType.NUKE) category = 'nuke';

    return modifiers[warPolicy]?.[category] || 1.0;
  }

  /**
   * Calculate infrastructure defense based on city improvements
   */
  static calculateInfraDefense(cities: City[]): number {
    let defense = 0;
    
    cities.forEach(city => {
      // Military improvements provide defense
      defense += city.barracks * 2;
      defense += city.hangar * 3;
      defense += city.drydock * 3;
      defense += city.factory * 1;
      
      // Defensive improvements
      defense += city.police_station * 1.5;
      defense += city.hospital * 1;
      
      // Infrastructure base defense
      defense += Math.sqrt(city.infrastructure) * 0.5;
    });
    
    return Math.floor(defense);
  }

  /**
   * Simulate a battle between attacker and defender
   */
  static simulateBattle(
    attacker: Nation | any,
    defender: Nation | any,
    attackType: AttackType,
    targetCity?: City
  ): BattleActionResult {
    const attackerStrength = this.calculateMilitaryStrength(attacker, attackType);
    const defenderStrength = this.calculateMilitaryStrength(defender, this.getDefenseType(attackType));
    const infraDefense = targetCity ? this.calculateInfraDefense([targetCity]) : this.calculateInfraDefense(defender.cities || []);
    
    // Add randomness factor (±20%)
    const randomFactor = 0.8 + Math.random() * 0.4;
    const effectiveAttackerStrength = attackerStrength * randomFactor;
    
    // Calculate success probability
    const strengthRatio = effectiveAttackerStrength / (defenderStrength + infraDefense + 1);
    const successProbability = Math.min(0.95, Math.max(0.05, strengthRatio / (strengthRatio + 1)));
    
    const success = Math.random() < successProbability;
    
    if (!success) {
      return {
        success: false,
        damage_dealt: 0,
        losses_inflicted: {},
        losses_taken: this.calculateLosses(attacker, attackType, 0.1 + Math.random() * 0.2),
        message: `Attack failed! The defender successfully repelled the ${attackType.toLowerCase()} assault.`
      };
    }

    // Calculate damage and losses
    const damageMultiplier = 0.3 + Math.random() * 0.4; // 30-70% damage
    const attackerLossMultiplier = 0.05 + Math.random() * 0.15; // 5-20% losses
    
    const lossesInflicted = this.calculateLosses(defender, this.getDefenseType(attackType), damageMultiplier);
    const lossesTaken = this.calculateLosses(attacker, attackType, attackerLossMultiplier);
    
    let damage_dealt = 0;
    let message = '';

    switch (attackType) {
      case AttackType.AIRVINFRA:
        damage_dealt = Math.floor(attackerStrength * 0.1 * damageMultiplier);
        message = `Air strike destroyed ${damage_dealt} infrastructure!`;
        break;
      case AttackType.GROUND:
        damage_dealt = lossesInflicted.soldiers || 0;
        message = `Ground assault eliminated ${damage_dealt} enemy soldiers!`;
        break;
      case AttackType.NAVAL:
        damage_dealt = lossesInflicted.ships || 0;
        message = `Naval battle sank ${damage_dealt} enemy ships!`;
        break;
      case AttackType.MISSILE:
        damage_dealt = Math.floor(attackerStrength * 0.2 * damageMultiplier);
        message = `Missile strike caused ${damage_dealt} infrastructure damage!`;
        break;
      case AttackType.NUKE:
        damage_dealt = Math.floor(attackerStrength * 0.5 * damageMultiplier);
        message = `Nuclear attack devastated the target, destroying ${damage_dealt} infrastructure!`;
        break;
      default:
        damage_dealt = Math.floor(attackerStrength * 0.15 * damageMultiplier);
        message = `Attack successful! Dealt ${damage_dealt} damage to the enemy.`;
    }

    return {
      success: true,
      damage_dealt,
      losses_inflicted: lossesInflicted,
      losses_taken: lossesTaken,
      message
    };
  }

  /**
   * Calculate losses based on attack type and damage multiplier
   */
  static calculateLosses(nation: Nation | any, attackType: AttackType, multiplier: number): any {
    const losses: any = {};

    switch (attackType) {
      case AttackType.GROUND:
        losses.soldiers = Math.floor(nation.soldiers * multiplier);
        losses.tanks = Math.floor(nation.tanks * multiplier * 0.3);
        break;
      case AttackType.AIRVINFRA:
      case AttackType.AIRVSOLDIERS:
      case AttackType.AIRVTANKS:
      case AttackType.AIRVMONEY:
      case AttackType.AIRVSHIPS:
      case AttackType.AIRVAIR:
        losses.aircraft = Math.floor(nation.aircraft * multiplier);
        break;
      case AttackType.NAVAL:
        losses.ships = Math.floor(nation.ships * multiplier);
        break;
      case AttackType.MISSILE:
      case AttackType.MISSILETWO:
        losses.missiles = Math.floor(nation.missiles * multiplier);
        break;
      case AttackType.NUKE:
        losses.nukes = Math.floor(nation.nukes * multiplier);
        break;
    }

    return losses;
  }

  /**
   * Get the corresponding defense type for an attack type
   */
  static getDefenseType(attackType: AttackType): AttackType {
    switch (attackType) {
      case AttackType.AIRVINFRA:
      case AttackType.AIRVSOLDIERS:
      case AttackType.AIRVTANKS:
      case AttackType.AIRVMONEY:
      case AttackType.AIRVSHIPS:
        return AttackType.AIRVAIR;
      case AttackType.NAVAL:
        return AttackType.NAVAL;
      default:
        return AttackType.GROUND;
    }
  }

  /**
   * Calculate action point cost for different attack types
   */
  static getActionPointCost(attackType: AttackType): number {
    const costs: Record<AttackType, number> = {
      [AttackType.GROUND]: 3,
      [AttackType.AIRVINFRA]: 4,
      [AttackType.AIRVSOLDIERS]: 4,
      [AttackType.AIRVTANKS]: 4,
      [AttackType.AIRVMONEY]: 4,
      [AttackType.AIRVSHIPS]: 4,
      [AttackType.AIRVAIR]: 4,
      [AttackType.NAVAL]: 4,
      [AttackType.MISSILE]: 8,
      [AttackType.MISSILETWO]: 12,
      [AttackType.NUKE]: 12,
      [AttackType.FORTIFY]: 1
    };

    return costs[attackType] || 3;
  }

  /**
   * Check if a player has enough resources for an attack
   */
  static canAffordAttack(nation: Nation | any, attackType: AttackType): boolean {
    switch (attackType) {
      case AttackType.GROUND:
        return nation.soldiers > 0;
      case AttackType.AIRVINFRA:
      case AttackType.AIRVSOLDIERS:
      case AttackType.AIRVTANKS:
      case AttackType.AIRVMONEY:
      case AttackType.AIRVSHIPS:
      case AttackType.AIRVAIR:
        return nation.aircraft > 0 && nation.gasoline >= 3;
      case AttackType.NAVAL:
        return nation.ships > 0 && nation.gasoline >= 2;
      case AttackType.MISSILE:
      case AttackType.MISSILETWO:
        return nation.missiles > 0 && nation.gasoline >= 5;
      case AttackType.NUKE:
        return nation.nukes > 0;
      default:
        return true;
    }
  }

  /**
   * Calculate resource consumption for an attack
   */
  static calculateResourceConsumption(attackType: AttackType): Record<string, number> {
    const consumption: Record<string, number> = {};

    switch (attackType) {
      case AttackType.GROUND:
        consumption.munitions = 2;
        consumption.gasoline = 1;
        break;
      case AttackType.AIRVINFRA:
      case AttackType.AIRVSOLDIERS:
      case AttackType.AIRVTANKS:
      case AttackType.AIRVMONEY:
      case AttackType.AIRVSHIPS:
      case AttackType.AIRVAIR:
        consumption.gasoline = 3;
        consumption.munitions = 1;
        break;
      case AttackType.NAVAL:
        consumption.gasoline = 2;
        consumption.munitions = 2;
        break;
      case AttackType.MISSILE:
      case AttackType.MISSILETWO:
        consumption.gasoline = 5;
        consumption.munitions = 3;
        break;
      case AttackType.NUKE:
        consumption.uranium = 1;
        break;
    }

    return consumption;
  }
}
