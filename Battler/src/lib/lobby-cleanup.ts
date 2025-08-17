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

    if (inactiveLobbies.length === 0) {
      return { cleaned: 0, lobbies: [] };
    }

    console.log(`Found ${inactiveLobbies.length} inactive lobbies to cleanup`);

    // Close each inactive lobby
    const cleanedLobbies = [];
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

    return { 
      cleaned: cleanedLobbies.length, 
      lobbies: cleanedLobbies,
      totalFound: inactiveLobbies.length
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
