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

        if (lobby.players.length < 2) {
          return NextResponse.json({ error: 'Need 2 players to start battle' }, { status: 400 });
        }

        // Check if all players are ready
        const allPlayersReady = lobby.players.every((player: any) => player.isReady);
        if (!allPlayersReady) {
          const notReadyPlayers = lobby.players.filter((player: any) => !player.isReady).map((player: any) => player.name);
          return NextResponse.json({ 
            error: `Not all players are ready. Waiting for: ${notReadyPlayers.join(', ')}` 
          }, { status: 400 });
        }

        // Update lobby activity before starting battle
        await updateLobbyActivity(lobbyId);

        // Update lobby status
        await prisma.lobby.update({
          where: { id: lobbyId },
          data: { status: 'IN_PROGRESS' },
        });

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

        // Broadcast battle start
        await pusher.trigger('multiplayer', 'battle-created', formattedBattle);
        await pusher.trigger(`lobby-${lobbyId}`, 'battle-started', {
          battleId: battle.id,
          battle: formattedBattle,
        });

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
        const { lobbyId, playerName } = data;
        
        // Remove player or spectator
        await Promise.all([
          prisma.player.deleteMany({
            where: {
              lobbyId,
              name: playerName,
            },
          }),
          prisma.spectator.deleteMany({
            where: {
              lobbyId,
              name: playerName,
            },
          }),
        ]);

        // Check if lobby is now empty
        const lobby = await prisma.lobby.findUnique({
          where: { id: lobbyId },
          include: {
            players: true,
            spectators: true,
          },
        });

        if (lobby && lobby.players.length === 0 && lobby.spectators.length === 0) {
          // Delete empty lobby
          await prisma.lobby.delete({
            where: { id: lobbyId },
          });

          await pusher.trigger('multiplayer', 'lobby-closed', { lobbyId });
        } else if (lobby) {
          // Update lobby activity since there was player movement
          await updateLobbyActivity(lobbyId);
          
          const formattedLobby = {
            id: lobby.id,
            hostName: lobby.hostName,
            playerCount: lobby.players.length,
            spectatorCount: lobby.spectators.length,
            status: lobby.status,
            settings: lobby.settings,
            createdAt: lobby.createdAt.toISOString(),
          };

          await pusher.trigger('multiplayer', 'lobby-updated', formattedLobby);
          await pusher.trigger(`lobby-${lobbyId}`, 'player-left', {
            playerName,
            lobby: formattedLobby,
            lobbyId: lobbyId,
          });
        }

        return NextResponse.json({ success: true });
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
