import { prisma } from '@/lib/prisma';
import Pusher from 'pusher';

// Initialize Pusher
const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.PUSHER_CLUSTER!,
  useTLS: true,
});

export async function cleanupInactiveLobbies() {
  try {
    // Calculate the cutoff time (5 minutes ago)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    // Calculate longer cutoff for stuck battles (10 minutes ago)
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    
    // Find lobbies that are inactive and older than 5 minutes
    const inactiveLobbies = await prisma.lobby.findMany({
      where: {
        status: 'WAITING', // Only cleanup waiting lobbies, not in-progress ones
        updatedAt: {
          lt: fiveMinutesAgo
        }
      },
      include: {
        players: true,
        spectators: true
      }
    });

    // Find IN_PROGRESS lobbies that have been stuck for more than 10 minutes
    const stuckBattleLobbies = await prisma.lobby.findMany({
      where: {
        status: 'IN_PROGRESS',
        updatedAt: {
          lt: tenMinutesAgo
        }
      },
      include: {
        players: true,
        spectators: true,
        battle: true
      }
    });

    const totalToClean = inactiveLobbies.length + stuckBattleLobbies.length;
    
    if (totalToClean === 0) {
      return { cleaned: 0, lobbies: [] };
    }

    console.log(`Found ${inactiveLobbies.length} inactive lobbies and ${stuckBattleLobbies.length} stuck battles to cleanup`);

    // Close each inactive lobby
    const cleanedLobbies = [];
    
    // Handle regular inactive lobbies
    for (const lobby of inactiveLobbies) {
      try {
        // Delete the lobby (cascade will handle players and spectators)
        await prisma.lobby.delete({
          where: { id: lobby.id }
        });

        // Notify clients that the lobby was closed
        await pusher.trigger('multiplayer', 'lobby-closed', { 
          lobbyId: lobby.id,
          reason: 'inactive',
          message: 'Lobby automatically closed due to inactivity'
        });

        // Notify any players in the lobby
        if (lobby.players.length > 0) {
          await pusher.trigger(`lobby-${lobby.id}`, 'lobby-closed', {
            reason: 'inactive',
            message: 'This lobby has been automatically closed due to 5 minutes of inactivity'
          });
        }

        cleanedLobbies.push({
          id: lobby.id,
          hostName: lobby.hostName,
          playerCount: lobby.players.length,
          inactiveFor: Math.round((Date.now() - lobby.updatedAt.getTime()) / (1000 * 60))
        });

        console.log(`Cleaned up inactive lobby: ${lobby.id} (host: ${lobby.hostName}, inactive for ${Math.round((Date.now() - lobby.updatedAt.getTime()) / (1000 * 60))} minutes)`);
      } catch (error) {
        console.error(`Failed to cleanup lobby ${lobby.id}:`, error);
      }
    }

    // Handle stuck battle lobbies
    for (const lobby of stuckBattleLobbies) {
      try {
        // Delete the battle first if it exists
        if (lobby.battle) {
          await prisma.battle.delete({
            where: { id: lobby.battle.id }
          });
          console.log(`Deleted stuck battle: ${lobby.battle.id}`);
        }

        // Reset lobby status to WAITING and reset all players to not ready
        await prisma.lobby.update({
          where: { id: lobby.id },
          data: { 
            status: 'WAITING',
            updatedAt: new Date() // Update timestamp to prevent immediate re-cleanup
          },
        });

        await prisma.player.updateMany({
          where: { lobbyId: lobby.id },
          data: { isReady: false }
        });

        // Notify clients that the battle was reset
        await pusher.trigger('multiplayer', 'lobby-updated', { 
          id: lobby.id,
          hostName: lobby.hostName,
          playerCount: lobby.players.length,
          spectatorCount: lobby.spectators.length,
          status: 'WAITING',
          settings: lobby.settings || {},
          createdAt: lobby.createdAt.toISOString(),
        });

        await pusher.trigger(`lobby-${lobby.id}`, 'battle-cancelled', {
          reason: 'timeout',
          message: 'Battle was automatically cancelled due to inactivity and lobby has been reset'
        });

        cleanedLobbies.push({
          id: lobby.id,
          hostName: lobby.hostName,
          playerCount: lobby.players.length,
          inactiveFor: Math.round((Date.now() - lobby.updatedAt.getTime()) / (1000 * 60)),
          type: 'stuck-battle'
        });

        console.log(`Reset stuck battle lobby: ${lobby.id} (host: ${lobby.hostName}, inactive for ${Math.round((Date.now() - lobby.updatedAt.getTime()) / (1000 * 60))} minutes)`);
      } catch (error) {
        console.error(`Failed to reset stuck battle lobby ${lobby.id}:`, error);
      }
    }

    return { 
      cleaned: cleanedLobbies.length, 
      lobbies: cleanedLobbies,
      totalFound: totalToClean
    };
  } catch (error) {
    console.error('Error during lobby cleanup:', error);
    return { 
      cleaned: 0, 
      lobbies: [], 
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function updateLobbyActivity(lobbyId: string) {
  try {
    // Update the lobby's updatedAt timestamp to mark it as active
    await prisma.lobby.update({
      where: { id: lobbyId },
      data: { updatedAt: new Date() }
    });
    return true;
  } catch (error) {
    console.error(`Failed to update lobby activity for ${lobbyId}:`, error);
    return false;
  }
}
