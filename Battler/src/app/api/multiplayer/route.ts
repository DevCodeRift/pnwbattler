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

        // Create battle
        const battle = await prisma.battle.create({
          data: {
            lobbyId,
            status: 'IN_PROGRESS',
            gameState: {
              turn: 1,
              players: lobby.players.map((player: any, index: number) => ({
                id: player.id,
                name: player.name,
                side: index === 0 ? 'side1' : 'side2',
              })),
              settings: lobby.settings,
            },
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
        const { battleId, playerId, actionType, actionData } = data;
        
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

        // Create battle action record
        await prisma.battleAction.create({
          data: {
            battleId,
            playerId,
            actionType,
            actionData,
            turn: (battle.gameState as any)?.turn || 1,
          },
        });

        // Update battle state (you'll need to implement your game logic here)
        const updatedGameState = {
          ...(battle.gameState as any),
          lastAction: {
            playerId,
            actionType,
            actionData,
            timestamp: new Date().toISOString(),
          },
        };

        await prisma.battle.update({
          where: { id: battleId },
          data: { gameState: updatedGameState },
        });

        // Broadcast action to all battle participants
        await pusher.trigger(`battle-${battleId}`, 'battle-action', {
          playerId,
          actionType,
          actionData,
          gameState: updatedGameState,
        });

        return NextResponse.json({ success: true });
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
