import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import Pusher from 'pusher';
import { prisma } from '../../../lib/prisma';
import { cleanupInactiveLobbies, updateLobbyActivity } from '../../../lib/lobby-cleanup';

// Initialize Pusher
const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.PUSHER_CLUSTER!,
  useTLS: true,
});

// Battle simulation helper functions using authentic P&W mechanics
// Authentic P&W battle simulation
function simulateBattle(attacker: any, defender: any, attackType: string, unitsUsed: any, useMunitions: boolean, airstrikeTarget?: string) {
  // Authentic Politics & War battle simulation
  console.log('Simulating battle with P&W mechanics:', { attackType, unitsUsed, attacker: attacker.name, defender: defender.name });

  const rollOutcomes = ['Utter Failure', 'Pyrrhic Victory', 'Moderate Success', 'Immense Triumph'];
  const resistanceLoss = { 'Utter Failure': 0, 'Pyrrhic Victory': 4, 'Moderate Success': 7, 'Immense Triumph': 10 };

  let attackerStrength = 0;
  let defenderStrength = 0;
  let attackerLosses = { soldiers: 0, tanks: 0, aircraft: 0, ships: 0 };
  let defenderLosses = { soldiers: 0, tanks: 0, aircraft: 0, ships: 0 };
  let resourcesUsed = { gasoline: 0, munitions: 0 };
  let loot = 0;
  let infraDamage = 0;

  // Helper function to calculate P&W victory roll
  function calculateVictoryRoll(attacking: number, defending: number): number {
    if (attacking <= 0.4 * defending) return 0; // Utter failure
    if (defending < 0.4 * attacking) return 3; // Immense triumph
    
    const defMean = (defending + defending * 0.4) / 2;
    const minAtt = attacking * 0.4;
    const roll = 3 * (attacking - defMean) / ((attacking - defMean) + (defMean - minAtt));
    return Math.max(0, Math.min(3, roll));
  }

  // Helper function to get resource consumption scaling
  function getResourceScaling(victoryType: number): number {
    switch (Math.round(victoryType)) {
      case 0: return 0.4; // Utter failure
      case 1: return 0.7; // Small victory  
      case 2: return 0.9; // Moderate victory
      case 3: return 1.0; // Immense triumph
      default: return 0.7;
    }
  }

  const fortifyFactor = 1.0; // Assume no fortification for now
  
  switch (attackType) {
    case 'ground': {
      // Ground attack strength calculation (P&W authentic)
      const attSoldiers = unitsUsed.soldiers || 0;
      const attTanks = unitsUsed.tanks || 0;
      const soldiersUnarmed = useMunitions ? 0 : attSoldiers; // Soldiers without munitions
      const soldiersArmed = useMunitions ? attSoldiers : 0;
      
      attackerStrength = (attTanks * 40) + (soldiersArmed * 1.75) + soldiersUnarmed;
      defenderStrength = (defender.military.tanks * 40) + Math.max(50, defender.military.soldiers * 1.75);
      
      const roll = calculateVictoryRoll(attackerStrength, defenderStrength);
      const victory = Math.round(roll);
      const resourceScaling = getResourceScaling(victory);
      
      // Ground attack casualties (authentic P&W formulas)
      const attTankStr = attTanks * 40;
      const attSoldStr = soldiersArmed * 1.75;
      const defSoldStr = defender.military.soldiers * 1.75;
      const defTankStr = defender.military.tanks * 40;
      const defFactor = Math.max(1, defenderStrength);
      
      // Tank losses
      defenderLosses.tanks = Math.max(0, Math.floor(((attTankStr * 0.7 + 1) / defFactor + (attSoldStr * 0.7 + 1) / 2250) * 1.33));
      attackerLosses.tanks = Math.max(0, Math.floor(defenderLosses.tanks * fortifyFactor));
      
      // Soldier losses  
      attackerLosses.soldiers = Math.max(0, Math.floor(((defSoldStr * 0.7 + 1) / 22 + (defTankStr * 0.7 + 1) / 7.33) * fortifyFactor * 0.3125));
      defenderLosses.soldiers = Math.max(0, Math.floor((attSoldStr * 0.7 + 1) / 22 + (attTankStr * 0.7 + 1) / 7.33 * 0.3125));
      
      // Resource consumption (P&W authentic)
      const baseMunitions = 0.0002 * attSoldiers + 0.01 * attTanks;
      const baseGasoline = 0.01 * attTanks;
      resourcesUsed.munitions = Math.ceil(baseMunitions * resourceScaling);
      resourcesUsed.gasoline = Math.ceil(baseGasoline * resourceScaling);
      
      // Loot calculation
      loot = Math.floor((attSoldiers * 0.99 + attTanks * 22.625) * victory);
      loot = Math.min(loot, defender.resources.money * 0.75); // Capped by 75% of defender wealth
      loot = Math.min(loot, 50000); // Limited by 50k per city (assuming 1 city)
      
      break;
    }

    case 'air': {
      const attAircraft = unitsUsed.aircraft || 0;
      const defAir = defender.military.aircraft;
      
      attackerStrength = attAircraft * 200; // Simplified air strength
      defenderStrength = defAir * 200;
      
      const roll = calculateVictoryRoll(attackerStrength, defenderStrength);
      const victory = Math.round(roll);
      
      // Target-specific damage (P&W authentic)
      const effectiveAircraft = Math.max(0, attAircraft - 0.5 * defAir);
      
      if (!airstrikeTarget || airstrikeTarget === 'aircraft') {
        // Dogfight formula
        attackerLosses.aircraft = Math.max(0, Math.floor(0.638554 * fortifyFactor * 9 * (defAir * 0.7) / 54));
        defenderLosses.aircraft = Math.max(0, Math.floor(0.638554 * 9 * (attAircraft * 0.7) / 38));
      } else {
        // Standard airstrike aircraft losses
        attackerLosses.aircraft = Math.max(0, Math.floor(fortifyFactor * 9 * (defAir * 0.7) / 54));
        defenderLosses.aircraft = Math.max(0, Math.floor(9 * (attAircraft * 0.7) / 54));
      }
      
      switch (airstrikeTarget) {
        case 'soldiers':
          const soldierKills = 0.581395 * roll * Math.round(Math.min(
            defender.military.soldiers,
            Math.min(defender.military.soldiers * 0.75 + 1000, effectiveAircraft * 50 * 0.95)
          ) / 3);
          defenderLosses.soldiers = Math.max(0, Math.floor(soldierKills));
          break;
          
        case 'tanks':
          const tankKills = 0.325581 * roll * Math.round(Math.min(
            defender.military.tanks,
            Math.min(defender.military.tanks * 0.75 + 10, effectiveAircraft * 2.5 * 0.95)
          ) / 3);
          defenderLosses.tanks = Math.max(0, Math.floor(tankKills));
          // Halved aircraft losses for tank attack
          attackerLosses.aircraft = Math.floor(attackerLosses.aircraft * 0.5);
          defenderLosses.aircraft = Math.floor(defenderLosses.aircraft * 0.5);
          break;
          
        case 'ships':
          const shipKills = 0.829268 * roll * Math.round(Math.min(
            defender.military.ships,
            Math.min(defender.military.ships * 0.5 + 4, effectiveAircraft * 0.0285 * 0.95)
          ) / 3);
          defenderLosses.ships = Math.max(0, Math.floor(shipKills));
          // Same aircraft losses as tank attack
          attackerLosses.aircraft = Math.floor(attackerLosses.aircraft * 0.5);
          defenderLosses.aircraft = Math.floor(defenderLosses.aircraft * 0.5);
          break;
      }
      
      // Air resource consumption
      const resourceScaling = getResourceScaling(victory);
      resourcesUsed.gasoline = Math.ceil(attAircraft * 0.25 * resourceScaling);
      resourcesUsed.munitions = Math.ceil(attAircraft * 0.25 * resourceScaling);
      
      break;
    }

    case 'naval': {
      const attShips = unitsUsed.ships || 0;
      const defShips = defender.military.ships;
      
      attackerStrength = attShips * 150; // Simplified naval strength
      defenderStrength = defShips * 150;
      
      const roll = calculateVictoryRoll(attackerStrength, defenderStrength);
      const victory = Math.round(roll);
      const resourceScaling = getResourceScaling(victory);
      
      // Ship losses (P&W authentic)
      attackerLosses.ships = Math.max(0, Math.floor(0.441666 * fortifyFactor * 12 * (defShips * 0.7) / 35));
      defenderLosses.ships = Math.max(0, Math.floor(0.441666 * 12 * (attShips * 0.7) / 35));
      
      // Naval resource consumption (P&W authentic)
      resourcesUsed.gasoline = Math.ceil(2 * attShips * resourceScaling);
      resourcesUsed.munitions = Math.ceil(3 * attShips * resourceScaling);
      
      break;
    }
  }

  // Determine battle outcome based on the roll
  const strengthRatio = attackerStrength / Math.max(defenderStrength, 1);
  const roll = calculateVictoryRoll(attackerStrength, defenderStrength);
  const victoryIndex = Math.round(roll);
  let outcome = rollOutcomes[victoryIndex] || 'Utter Failure';

  // Add some controlled randomness (±10% chance to shift outcome)
  const randomFactor = Math.random();
  if (randomFactor < 0.1 && victoryIndex > 0) {
    outcome = rollOutcomes[victoryIndex - 1]; // Slightly worse outcome
  } else if (randomFactor > 0.9 && victoryIndex < rollOutcomes.length - 1) {
    outcome = rollOutcomes[victoryIndex + 1]; // Slightly better outcome
  }

  const resistanceReduced = resistanceLoss[outcome as keyof typeof resistanceLoss] || 0;

  return {
    outcome,
    attackerStrength,
    defenderStrength,
    attackerLosses,
    defenderLosses,
    resourcesUsed,
    resistanceReduced,
    loot,
    infraDamage,
    roll: roll,
    victory: victoryIndex,
    description: generateBattleDescription(outcome, attackType, unitsUsed, attackerLosses, defenderLosses)
  };
}

function applyBattleResults(attacker: any, defender: any, result: any) {
  // Apply losses to attacker
  attacker.military.soldiers = Math.max(0, attacker.military.soldiers - result.attackerLosses.soldiers);
  attacker.military.tanks = Math.max(0, attacker.military.tanks - result.attackerLosses.tanks);
  attacker.military.aircraft = Math.max(0, attacker.military.aircraft - result.attackerLosses.aircraft);
  attacker.military.ships = Math.max(0, attacker.military.ships - result.attackerLosses.ships);

  // Apply losses to defender
  defender.military.soldiers = Math.max(0, defender.military.soldiers - result.defenderLosses.soldiers);
  defender.military.tanks = Math.max(0, defender.military.tanks - result.defenderLosses.tanks);
  defender.military.aircraft = Math.max(0, defender.military.aircraft - result.defenderLosses.aircraft);
  defender.military.ships = Math.max(0, defender.military.ships - result.defenderLosses.ships);

  // Deduct resources from attacker
  attacker.resources.gasoline = Math.max(0, attacker.resources.gasoline - result.resourcesUsed.gasoline);
  attacker.resources.munitions = Math.max(0, attacker.resources.munitions - result.resourcesUsed.munitions);

  // Apply loot if any
  if (result.loot && result.loot > 0) {
    attacker.resources.money += result.loot;
    defender.resources.money = Math.max(0, defender.resources.money - result.loot);
  }

  // Reduce defender resistance
  defender.resistance = Math.max(0, defender.resistance - result.resistanceReduced);

  // Check for resistance plunder (when resistance hits 0)
  if (defender.resistance === 0) {
    const plunderMoney = Math.floor(defender.resources.money * 0.1);
    attacker.resources.money += plunderMoney;
    defender.resources.money -= plunderMoney;
    // Note: Infrastructure damage would be applied here in a full implementation
  }
}

function calculateRecruitmentCost(units: any) {
  const costs = {
    soldiers: 5, // $5 per soldier
    tanks: 60, // $60 per tank
    aircraft: 4000, // $4000 per aircraft
    ships: 50000 // $50000 per ship
  };

  let totalCost = 0;
  if (units.soldiers) totalCost += units.soldiers * costs.soldiers;
  if (units.tanks) totalCost += units.tanks * costs.tanks;
  if (units.aircraft) totalCost += units.aircraft * costs.aircraft;
  if (units.ships) totalCost += units.ships * costs.ships;

  return { money: totalCost };
}

// Helper function to regenerate MAPs over time
function regenerateMAPs(player: any, lastActionTime: number): void {
  const now = Date.now();
  const timeDiff = now - lastActionTime;
  const hoursElapsed = timeDiff / (1000 * 60 * 60); // Convert to hours
  
  // In P&W, MAPs regenerate at 2 per day (24 hours = 2 MAPs, so 12 hours per MAP)
  const mapsToAdd = Math.floor(hoursElapsed / 12);
  
  if (mapsToAdd > 0) {
    player.maps = Math.min(12, player.maps + mapsToAdd); // Cap at 12 MAPs
  }
}

function generateBattleDescription(outcome: string, attackType: string, unitsUsed: any, attackerLosses: any, defenderLosses: any): string {
  const attackTypeNames = {
    ground: 'Ground Attack',
    air: 'Airstrike',
    naval: 'Naval Battle'
  };

  let description = `${attackTypeNames[attackType as keyof typeof attackTypeNames]} resulted in ${outcome}. `;
  
  if (outcome !== 'Utter Failure') {
    description += `Attacker lost ${attackerLosses.soldiers + attackerLosses.tanks + attackerLosses.aircraft + attackerLosses.ships} units, `;
    description += `defender lost ${defenderLosses.soldiers + defenderLosses.tanks + defenderLosses.aircraft + defenderLosses.ships} units.`;
  } else {
    description += 'Attack failed with minimal impact on the defender.';
  }

  return description;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'active-games') {
      // Check if database is available
      if (!process.env.DATABASE_URL) {
        console.error('DATABASE_URL not configured');
        return NextResponse.json({ 
          lobbies: [], 
          battles: [],
          error: 'Database not configured' 
        });
      }

      // Run periodic cleanup of inactive lobbies
      try {
        const cleanupResult = await cleanupInactiveLobbies();
        if (cleanupResult.cleaned > 0) {
          console.log(`Automatically cleaned up ${cleanupResult.cleaned} inactive lobbies`);
        }
      } catch (error) {
        console.error('Error during automatic lobby cleanup:', error);
        // Don't fail the request if cleanup fails
      }

      // Get active lobbies and battles
      const lobbies = await prisma.lobby.findMany({
        where: {
          status: {
            in: ['WAITING', 'IN_PROGRESS']
          }
        },
        include: {
          players: true,
          spectators: true,
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      const battles = await prisma.battle.findMany({
        where: {
          status: 'IN_PROGRESS'
        },
        include: {
          lobby: {
            include: {
              players: true,
            },
          },
          spectators: true,
        },
        orderBy: {
          startedAt: 'desc'
        }
      });

      const formattedLobbies = lobbies.map((lobby: any) => ({
        id: lobby.id,
        hostName: lobby.hostName,
        playerCount: lobby.players.length,
        spectatorCount: lobby.spectators.length,
        status: lobby.status,
        settings: lobby.settings,
        createdAt: lobby.createdAt.toISOString(),
      }));

      const formattedBattles = battles.map((battle: any) => ({
        id: battle.id,
        playerCount: battle.lobby.players.length,
        spectatorCount: battle.spectators.length,
        status: battle.status,
        startedAt: battle.startedAt?.toISOString(),
      }));

      return NextResponse.json({
        lobbies: formattedLobbies,
        battles: formattedBattles,
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('GET /api/multiplayer error:', error);
    
    // Return empty data instead of 500 error for frontend compatibility
    return NextResponse.json({ 
      lobbies: [], 
      battles: [],
      error: error instanceof Error ? error.message : 'Database connection failed'
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const discordId = (session.user as any).discordId;
    const userName = (session.user as any).username || session.user.name || 'Unknown';

    const body = await request.json();
    const { action, ...data } = body;

    switch (action) {
      case 'create-lobby': {
        const { hostName, settings } = data;
        
        const lobby = await prisma.lobby.create({
          data: {
            host: discordId || hostName, // Use Discord ID as identifier
            hostName: hostName || userName,
            settings,
            status: 'WAITING',
          },
        });

        // Add host as a player with Discord ID
        await prisma.player.create({
          data: {
            name: hostName || userName,
            discordId: discordId,
            lobbyId: lobby.id,
            isHost: true,
            isReady: false,
          },
        });

        const lobbyWithPlayers = await prisma.lobby.findUnique({
          where: { id: lobby.id },
          include: {
            players: true,
            spectators: true,
          },
        });

        const formattedLobby = {
          id: lobbyWithPlayers!.id,
          hostName: lobbyWithPlayers!.hostName,
          playerCount: lobbyWithPlayers!.players.length,
          spectatorCount: lobbyWithPlayers!.spectators.length,
          status: lobbyWithPlayers!.status,
          settings: lobbyWithPlayers!.settings,
          createdAt: lobbyWithPlayers!.createdAt.toISOString(),
        };

        // Broadcast lobby creation
        await pusher.trigger('multiplayer', 'lobby-created', formattedLobby);

        return NextResponse.json({ lobby: formattedLobby });
      }

      case 'join-lobby': {
        const { lobbyId, playerName, asSpectator } = data;
        
        console.log('Join lobby request:', { lobbyId, playerName, asSpectator, discordId });
        
        const lobby = await prisma.lobby.findUnique({
          where: { id: lobbyId },
          include: {
            players: true,
            spectators: true,
          },
        });

        if (!lobby) {
          return NextResponse.json({ error: 'Lobby not found' }, { status: 404 });
        }

        if (lobby.status !== 'WAITING') {
          return NextResponse.json({ error: 'Lobby is not accepting new players' }, { status: 400 });
        }

        // Check if user is already in this lobby
        const existingPlayer = lobby.players.find((player: any) => player.discordId === discordId);
        console.log('Existing player check:', { existingPlayer: !!existingPlayer, playerCount: lobby.players.length });
        if (existingPlayer) {
          // User is already in lobby, just return the current state
          const formattedLobby = {
            id: lobby.id,
            hostName: lobby.hostName,
            playerCount: lobby.players.length,
            spectatorCount: lobby.spectators.length,
            status: lobby.status,
            settings: lobby.settings,
            createdAt: lobby.createdAt.toISOString(),
            players: lobby.players.map((p: any) => ({
              id: p.id,
              name: p.name,
              isHost: p.isHost,
              isReady: p.isReady
            }))
          };

          return NextResponse.json({ 
            lobby: formattedLobby,
            rejoined: true,
            message: 'Rejoined existing lobby'
          });
        }

        if (asSpectator) {
          // Add as spectator
          await prisma.spectator.create({
            data: {
              name: playerName || userName,
              lobbyId,
            },
          });
        } else {
          // Check if lobby is full
          if (lobby.players.length >= 2) {
            return NextResponse.json({ error: 'Lobby is full' }, { status: 400 });
          }

          // Add as player with Discord ID
          const newPlayer = await prisma.player.create({
            data: {
              name: playerName || userName,
              discordId: discordId,
              lobbyId,
              isHost: false,
              isReady: false,
            },
          });
          
          console.log('Created new player:', { playerId: newPlayer.id, name: newPlayer.name, discordId: newPlayer.discordId });
        }

        // Get updated lobby
        const updatedLobby = await prisma.lobby.findUnique({
          where: { id: lobbyId },
          include: {
            players: true,
            spectators: true,
          },
        });

        // Update lobby activity to prevent it from being cleaned up
        await updateLobbyActivity(lobbyId);

        const formattedLobby = {
          id: updatedLobby!.id,
          hostName: updatedLobby!.hostName,
          playerCount: updatedLobby!.players.length,
          spectatorCount: updatedLobby!.spectators.length,
          status: updatedLobby!.status,
          settings: updatedLobby!.settings,
          createdAt: updatedLobby!.createdAt.toISOString(),
          players: updatedLobby!.players.map((p: any) => ({
            id: p.id,
            name: p.name,
            isHost: p.isHost,
            isReady: p.isReady
          }))
        };

        console.log('Formatted lobby before broadcast:', formattedLobby);

        // Broadcast lobby update
        await pusher.trigger('multiplayer', 'lobby-updated', formattedLobby);
        await pusher.trigger(`lobby-${lobbyId}`, 'player-joined', {
          playerName,
          asSpectator,
          lobby: formattedLobby,
          lobbyId: lobbyId,
        });

        console.log('Returning lobby response:', formattedLobby);
        return NextResponse.json({ lobby: formattedLobby });
      }

      case 'toggle-ready': {
        const { lobbyId } = data;
        
        // Find the player in the lobby
        const lobby = await prisma.lobby.findUnique({
          where: { id: lobbyId },
          include: {
            players: true,
            spectators: true,
          },
        });

        if (!lobby) {
          return NextResponse.json({ error: 'Lobby not found' }, { status: 404 });
        }

        const player = lobby.players.find((p: any) => p.discordId === discordId);
        if (!player) {
          return NextResponse.json({ error: 'You are not a player in this lobby' }, { status: 400 });
        }

        // Toggle ready status
        await prisma.player.update({
          where: { id: player.id },
          data: { isReady: !player.isReady }
        });

        // Update lobby activity
        await updateLobbyActivity(lobbyId);

        // Get updated lobby
        const updatedLobby = await prisma.lobby.findUnique({
          where: { id: lobbyId },
          include: {
            players: true,
            spectators: true,
          },
        });

        const formattedLobby = {
          id: updatedLobby!.id,
          hostName: updatedLobby!.hostName,
          playerCount: updatedLobby!.players.length,
          spectatorCount: updatedLobby!.spectators.length,
          status: updatedLobby!.status,
          settings: updatedLobby!.settings,
          createdAt: updatedLobby!.createdAt.toISOString(),
          players: updatedLobby!.players.map((p: any) => ({
            id: p.id,
            name: p.name,
            isHost: p.isHost,
            isReady: p.isReady
          }))
        };

        // Broadcast ready status change
        await pusher.trigger('multiplayer', 'lobby-updated', formattedLobby);
        await pusher.trigger(`lobby-${lobbyId}`, 'player-ready-changed', {
          playerId: player.id,
          playerName: player.name,
          isReady: !player.isReady,
          lobby: formattedLobby,
        });

        return NextResponse.json({ 
          lobby: formattedLobby,
          isReady: !player.isReady
        });
      }

      case 'get-my-lobby': {
        // Find any lobby the user is currently in
        const userLobby = await prisma.lobby.findFirst({
          where: {
            players: {
              some: {
                discordId: discordId
              }
            },
            status: {
              in: ['WAITING', 'IN_PROGRESS']
            }
          },
          include: {
            players: true,
            spectators: true,
          }
        });

        if (!userLobby) {
          return NextResponse.json({ lobby: null });
        }

        const formattedLobby = {
          id: userLobby.id,
          hostName: userLobby.hostName,
          playerCount: userLobby.players.length,
          spectatorCount: userLobby.spectators.length,
          status: userLobby.status,
          settings: userLobby.settings,
          createdAt: userLobby.createdAt.toISOString(),
          players: userLobby.players.map((p: any) => ({
            id: p.id,
            name: p.name,
            isHost: p.isHost,
            isReady: p.isReady
          }))
        };

        return NextResponse.json({ 
          lobby: formattedLobby,
          rejoined: true 
        });
      }

      case 'get-my-games': {
        // Find all lobbies and battles the user is currently in
        const userLobbies = await prisma.lobby.findMany({
          where: {
            players: {
              some: {
                discordId: discordId
              }
            },
            status: {
              in: ['WAITING', 'IN_PROGRESS']
            }
          },
          include: {
            players: true,
            spectators: true,
            battle: true,
          }
        });

        const myGames = userLobbies.map((lobby: any) => {
          const myPlayer = lobby.players.find((p: any) => p.discordId === discordId);
          
          return {
            id: lobby.id,
            hostName: lobby.hostName,
            playerCount: lobby.players.length,
            spectatorCount: lobby.spectators.length,
            status: lobby.status,
            settings: lobby.settings,
            createdAt: lobby.createdAt.toISOString(),
            battle: lobby.battle ? {
              id: lobby.battle.id,
              status: lobby.battle.status,
              startedAt: lobby.battle.startedAt?.toISOString(),
            } : null,
            myRole: {
              isHost: myPlayer?.isHost || false,
              isReady: myPlayer?.isReady || false,
              name: myPlayer?.name
            }
          };
        });

        return NextResponse.json({ 
          myGames,
          count: myGames.length
        });
      }

      case 'get-battle-state': {
        const { battleId } = data;
        
        const battle = await prisma.battle.findUnique({
          where: { id: battleId },
          include: {
            lobby: {
              include: {
                players: true,
              },
            },
          },
        });

        if (!battle) {
          return NextResponse.json({ error: 'Battle not found' }, { status: 404 });
        }

        return NextResponse.json({ 
          battle: {
            id: battle.id,
            status: battle.status,
            gameState: battle.gameState,
            lobby: battle.lobby,
            startedAt: battle.startedAt
          }
        });
      }

      case 'start-battle': {
        const { lobbyId } = data;
        
        console.log('Start battle request:', { lobbyId, discordId, userName });
        
        const lobby = await prisma.lobby.findUnique({
          where: { id: lobbyId },
          include: {
            players: true,
            spectators: true,
          },
        });

        if (!lobby) {
          console.log('Lobby not found:', lobbyId);
          return NextResponse.json({ error: 'Lobby not found' }, { status: 404 });
        }

        // Check if the requesting user is the host
        const hostPlayer = lobby.players.find((player: any) => player.isHost);
        if (!hostPlayer || hostPlayer.discordId !== discordId) {
          console.log('Not authorized to start battle. Host:', hostPlayer?.discordId, 'Requester:', discordId);
          return NextResponse.json({ error: 'Only the host can start the battle' }, { status: 403 });
        }

        if (lobby.players.length < 2) {
          console.log('Not enough players:', lobby.players.length);
          return NextResponse.json({ error: 'Need 2 players to start battle' }, { status: 400 });
        }

        // Check if all players are ready
        const allPlayersReady = lobby.players.every((player: any) => player.isReady);
        if (!allPlayersReady) {
          const notReadyPlayers = lobby.players.filter((player: any) => !player.isReady).map((player: any) => player.name);
          console.log('Not all players ready:', notReadyPlayers);
          return NextResponse.json({ 
            error: `Not all players are ready. Waiting for: ${notReadyPlayers.join(', ')}` 
          }, { status: 400 });
        }

        console.log('All validation passed, creating battle...');

        // Update lobby activity before starting battle
        await updateLobbyActivity(lobbyId);

        // Check for existing battle and clean it up if it exists
        const existingBattle = await prisma.battle.findUnique({
          where: { lobbyId }
        });

        if (existingBattle) {
          console.log('Found existing battle for lobby, cleaning up:', existingBattle.id);
          
          // Delete existing battle (this will cascade to battle actions)
          await prisma.battle.delete({
            where: { id: existingBattle.id }
          });
          
          console.log('Existing battle cleaned up successfully');
        }

        // Update lobby status
        await prisma.lobby.update({
          where: { id: lobbyId },
          data: { status: 'IN_PROGRESS' },
        });

        console.log('Lobby status updated to IN_PROGRESS');

        // Create battle with properly initialized players
        const initialGameState = {
          turn: 1,
          players: {} as any,
          battleHistory: [],
          settings: lobby.settings,
        };

        // Initialize all players with starting military and resources
        lobby.players.forEach((player: any, index: number) => {
          initialGameState.players[player.id] = {
            id: player.id,
            name: player.name,
            side: index === 0 ? 'side1' : 'side2',
            military: {
              soldiers: 5000,
              tanks: 500,
              aircraft: 50,
              ships: 10
            },
            resources: {
              money: 1000000,
              gasoline: 1000,
              munitions: 1000,
              steel: 500,
              aluminum: 500
            },
            maps: 6, // Starting MAPs
            resistance: 100
          };
        });

        const battle = await prisma.battle.create({
          data: {
            lobbyId,
            status: 'IN_PROGRESS',
            gameState: initialGameState,
            startedAt: new Date(),
          },
        });

        console.log('Battle created:', battle.id);

        // Move spectators to battle (players stay with lobby)
        if (lobby.spectators.length > 0) {
          await Promise.all(
            lobby.spectators.map((spectator: any) =>
              prisma.spectator.update({
                where: { id: spectator.id },
                data: { battleId: battle.id },
              })
            )
          );
        }

        const battleWithDetails = await prisma.battle.findUnique({
          where: { id: battle.id },
          include: {
            lobby: {
              include: {
                players: true,
              },
            },
            spectators: true,
          },
        });

        const formattedBattle = {
          id: battleWithDetails!.id,
          playerCount: battleWithDetails!.lobby.players.length,
          spectatorCount: battleWithDetails!.spectators.length,
          status: battleWithDetails!.status,
          startedAt: battleWithDetails!.startedAt?.toISOString(),
        };

        console.log('Formatted battle:', formattedBattle);

        // Broadcast battle start
        await pusher.trigger('multiplayer', 'battle-created', formattedBattle);
        await pusher.trigger(`lobby-${lobbyId}`, 'battle-started', {
          battleId: battle.id,
          battle: formattedBattle,
        });

        console.log('Battle events broadcasted, returning response');

        return NextResponse.json({ battle: formattedBattle });
      }

      case 'battle-action': {
        const { battleId, battleAction, details, timestamp } = data;
        
        const battle = await prisma.battle.findUnique({
          where: { id: battleId },
          include: {
            lobby: {
              include: {
                players: true,
              },
            },
          },
        });

        if (!battle) {
          return NextResponse.json({ error: 'Battle not found' }, { status: 404 });
        }

        // Find the current player
        const currentPlayer = battle.lobby.players.find((p: any) => p.discordId === discordId);
        if (!currentPlayer) {
          return NextResponse.json({ error: 'Player not found in battle' }, { status: 400 });
        }

        // Get current game state
        const currentGameState = (battle.gameState as any) || {
          turn: 1,
          players: {},
          battleHistory: []
        };

        // Initialize player data if not exists
        if (!currentGameState.players[currentPlayer.id]) {
          currentGameState.players[currentPlayer.id] = {
            id: currentPlayer.id,
            name: currentPlayer.name,
            military: {
              soldiers: 5000,
              tanks: 500,
              aircraft: 50,
              ships: 10
            },
            resources: {
              money: 1000000,
              gasoline: 1000,
              munitions: 1000,
              steel: 500,
              aluminum: 500
            },
            maps: 6, // Starting MAPs
            resistance: 100
          };
        }

        // Process the battle action based on type
        let actionResult: any = null;
        const playerData = currentGameState.players[currentPlayer.id];

        // Regenerate MAPs based on time elapsed since last action
        const lastActionTime = currentGameState.lastActionTime || Date.now();
        regenerateMAPs(playerData, lastActionTime);

        try {
          switch (battleAction) {
            case 'attack': {
              const { type: attackType, target, unitsUsed, useMunitions, airstrikeTarget } = details;
              
              // Find target player
              const targetPlayer = battle.lobby.players.find((p: any) => p.id === target);
              if (!targetPlayer) {
                return NextResponse.json({ error: 'Target player not found' }, { status: 400 });
              }

              // Initialize target data if not exists
              if (!currentGameState.players[targetPlayer.id]) {
                currentGameState.players[targetPlayer.id] = {
                  id: targetPlayer.id,
                  name: targetPlayer.name,
                  military: {
                    soldiers: 5000,
                    tanks: 500,
                    aircraft: 50,
                    ships: 10
                  },
                  resources: {
                    money: 1000000,
                    gasoline: 1000,
                    munitions: 1000,
                    steel: 500,
                    aluminum: 500
                  },
                  maps: 6,
                  resistance: 100
                };
              }

              const targetData = currentGameState.players[targetPlayer.id];

              // Check MAP costs (P&W authentic)
              const mapCosts = {
                ground: 3,
                air: 4,
                naval: 4
              };
              
              const mapCost = mapCosts[attackType as keyof typeof mapCosts] || 0;
              
              if (playerData.maps < mapCost) {
                return NextResponse.json({ error: `Not enough MAPs for this attack. Need ${mapCost}, have ${playerData.maps}` }, { status: 400 });
              }

              // Deduct MAPs
              playerData.maps -= mapCost;

              // Simulate battle outcome with P&W mechanics
              actionResult = simulateBattle(playerData, targetData, attackType, unitsUsed, useMunitions, airstrikeTarget);
              
              // Apply battle results
              applyBattleResults(playerData, targetData, actionResult);

              break;
            }
            case 'recruit': {
              const { units } = details;
              
              // Check if player can recruit (simplified - just check resources)
              const recruitmentCost = calculateRecruitmentCost(units);
              
              if (playerData.resources.money < recruitmentCost.money) {
                return NextResponse.json({ error: 'Not enough money for recruitment' }, { status: 400 });
              }

              // Deduct costs and add units
              playerData.resources.money -= recruitmentCost.money;
              if (units.soldiers) playerData.military.soldiers += units.soldiers;
              if (units.tanks) playerData.military.tanks += units.tanks;
              if (units.aircraft) playerData.military.aircraft += units.aircraft;
              if (units.ships) playerData.military.ships += units.ships;

              actionResult = {
                type: 'recruitment',
                success: true,
                unitsRecruited: units,
                costPaid: recruitmentCost
              };

              break;
            }
            default:
              return NextResponse.json({ error: 'Unknown battleAction type' }, { status: 400 });
          }

          // Add to battle history
          const battleLogEntry = {
            id: `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            turn: currentGameState.turn,
            timestamp: new Date().toISOString(),
            playerId: currentPlayer.id,
            playerName: currentPlayer.name,
            battleAction,
            details,
            result: actionResult
          };

          if (!currentGameState.battleHistory) {
            currentGameState.battleHistory = [];
          }
          currentGameState.battleHistory.push(battleLogEntry);

          // Update game state with action time
          currentGameState.lastAction = {
            playerId: currentPlayer.id,
            battleAction,
            details,
            result: actionResult,
            timestamp: new Date().toISOString(),
          };
          currentGameState.lastActionTime = Date.now(); // Track time for MAP regeneration

          // Save updated game state
          await prisma.battle.update({
            where: { id: battleId },
            data: { gameState: currentGameState },
          });

          // Create battle action record
          await prisma.battleAction.create({
            data: {
              battleId,
              playerId: currentPlayer.id,
              actionType: battleAction,
              actionData: { details, result: actionResult },
              turn: currentGameState.turn,
            },
          });

          // Broadcast action to all battle participants
          await pusher.trigger(`battle-${battleId}`, 'battle-action', {
            playerId: currentPlayer.id,
            playerName: currentPlayer.name,
            battleAction,
            details,
            result: actionResult,
            gameState: currentGameState,
            battleLogEntry
          });

          return NextResponse.json({ 
            success: true, 
            result: actionResult,
            gameState: currentGameState 
          });

        } catch (error) {
          console.error('Error processing battle action:', error);
          return NextResponse.json({ error: 'Failed to process battle action' }, { status: 500 });
        }
      }

      case 'leave-lobby': {
        const { lobbyId } = data;
        
        console.log('Leave lobby request:', { lobbyId, discordId });
        
        // Find the player/spectator to remove using Discord ID
        const lobby = await prisma.lobby.findUnique({
          where: { id: lobbyId },
          include: {
            players: true,
            spectators: true,
          },
        });

        if (!lobby) {
          return NextResponse.json({ error: 'Lobby not found' }, { status: 404 });
        }

        // Find the leaving player
        const leavingPlayer = lobby.players.find((player: any) => player.discordId === discordId);
        const leavingSpectator = lobby.spectators.find((spectator: any) => spectator.name === userName);
        
        if (!leavingPlayer && !leavingSpectator) {
          return NextResponse.json({ error: 'You are not in this lobby' }, { status: 400 });
        }

        const wasHost = leavingPlayer?.isHost || false;
        const playerName = leavingPlayer?.name || leavingSpectator?.name || userName;

        // Remove the player/spectator
        if (leavingPlayer) {
          await prisma.player.delete({
            where: { id: leavingPlayer.id },
          });
        }
        if (leavingSpectator) {
          await prisma.spectator.delete({
            where: { id: leavingSpectator.id },
          });
        }

        // Get updated lobby
        const updatedLobby = await prisma.lobby.findUnique({
          where: { id: lobbyId },
          include: {
            players: true,
            spectators: true,
          },
        });

        if (!updatedLobby) {
          return NextResponse.json({ success: true });
        }

        // Handle host leaving
        if (wasHost) {
          if (updatedLobby.players.length > 0) {
            // Transfer host to the first remaining player
            const newHost = updatedLobby.players[0];
            await prisma.player.update({
              where: { id: newHost.id },
              data: { isHost: true },
            });

            // Update lobby host name
            await prisma.lobby.update({
              where: { id: lobbyId },
              data: { hostName: newHost.name },
            });

            console.log(`Host transferred from ${playerName} to ${newHost.name}`);
          } else {
            // No players left, delete the lobby
            await prisma.lobby.delete({
              where: { id: lobbyId },
            });

            console.log(`Lobby ${lobbyId} deleted - host left and no players remaining`);
            await pusher.trigger('multiplayer', 'lobby-closed', { lobbyId });
            await pusher.trigger(`lobby-${lobbyId}`, 'lobby-closed', {
              lobbyId,
              message: 'Lobby closed - host left the game',
            });

            return NextResponse.json({ success: true, lobbyDeleted: true });
          }
        }

        // Get final lobby state
        const finalLobby = await prisma.lobby.findUnique({
          where: { id: lobbyId },
          include: {
            players: true,
            spectators: true,
          },
        });

        if (finalLobby) {
          // Update lobby activity
          await updateLobbyActivity(lobbyId);
          
          const formattedLobby = {
            id: finalLobby.id,
            hostName: finalLobby.hostName,
            playerCount: finalLobby.players.length,
            spectatorCount: finalLobby.spectators.length,
            status: finalLobby.status,
            settings: finalLobby.settings,
            createdAt: finalLobby.createdAt.toISOString(),
            players: finalLobby.players.map((p: any) => ({
              id: p.id,
              name: p.name,
              isHost: p.isHost,
              isReady: p.isReady
            }))
          };

          await pusher.trigger('multiplayer', 'lobby-updated', formattedLobby);
          await pusher.trigger(`lobby-${lobbyId}`, 'player-left', {
            playerName,
            wasHost,
            lobby: formattedLobby,
            lobbyId: lobbyId,
          });

          console.log(`Player ${playerName} left lobby ${lobbyId}. ${wasHost ? 'Was host.' : ''}`);
        }

        return NextResponse.json({ success: true });
      }

      case 'cancel-battle': {
        const { lobbyId } = data;
        
        console.log('Cancel battle request:', { lobbyId, discordId });
        
        const lobby = await prisma.lobby.findUnique({
          where: { id: lobbyId },
          include: {
            players: true,
            battle: true,
          },
        });

        if (!lobby) {
          return NextResponse.json({ error: 'Lobby not found' }, { status: 404 });
        }

        // Check if the requesting user is a player in the lobby
        const player = lobby.players.find((p: any) => p.discordId === discordId);
        if (!player) {
          return NextResponse.json({ error: 'You are not a player in this lobby' }, { status: 403 });
        }

        // Delete any existing battle
        if (lobby.battle) {
          await prisma.battle.delete({
            where: { id: lobby.battle.id }
          });
          console.log('Battle cancelled and deleted:', lobby.battle.id);
        }

        // Reset lobby status to WAITING and reset all players to not ready
        await prisma.lobby.update({
          where: { id: lobbyId },
          data: { status: 'WAITING' },
        });

        await prisma.player.updateMany({
          where: { lobbyId },
          data: { isReady: false }
        });

        // Get updated lobby
        const updatedLobby = await prisma.lobby.findUnique({
          where: { id: lobbyId },
          include: {
            players: true,
            spectators: true,
          },
        });

        const formattedLobby = {
          id: updatedLobby!.id,
          hostName: updatedLobby!.hostName,
          playerCount: updatedLobby!.players.length,
          spectatorCount: updatedLobby!.spectators.length,
          status: updatedLobby!.status,
          settings: updatedLobby!.settings,
          createdAt: updatedLobby!.createdAt.toISOString(),
          players: updatedLobby!.players.map((p: any) => ({
            id: p.id,
            name: p.name,
            isHost: p.isHost,
            isReady: p.isReady
          }))
        };

        // Broadcast battle cancellation
        await pusher.trigger('multiplayer', 'lobby-updated', formattedLobby);
        await pusher.trigger(`lobby-${lobbyId}`, 'battle-cancelled', {
          message: 'Battle was cancelled, lobby reset',
          lobby: formattedLobby,
        });

        return NextResponse.json({ 
          success: true,
          lobby: formattedLobby,
          message: 'Battle cancelled successfully'
        });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('POST /api/multiplayer error:', error);
    
    // Return specific error information for debugging
    let errorMessage = 'Internal server error';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    return NextResponse.json({ 
      error: errorMessage,
      success: false 
    }, { status: 500 });
  }
}
