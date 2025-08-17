import { NextRequest, NextResponse } from 'next/server';
import { cleanupInactiveLobbies } from '@/lib/lobby-cleanup';

export async function POST(request: NextRequest) {
  try {
    // Optional: Add authorization check here if needed
    // For now, allow any POST request to trigger cleanup
    
    const result = await cleanupInactiveLobbies();
    
    return NextResponse.json({
      success: true,
      message: `Cleanup completed. Removed ${result.cleaned} inactive lobbies.`,
      details: {
        cleanedLobbies: result.cleaned,
        totalFound: result.totalFound || result.cleaned,
        lobbies: result.lobbies
      }
    });
  } catch (error) {
    console.error('Lobby cleanup API error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to cleanup lobbies',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // GET endpoint to check for inactive lobbies without cleaning them
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    
    // Use a simple import to avoid circular dependencies
    const { prisma } = await import('@/lib/prisma');
    
    const inactiveLobbies = await prisma.lobby.findMany({
      where: {
        status: 'WAITING',
        updatedAt: {
          lt: fiveMinutesAgo
        }
      },
      select: {
        id: true,
        hostName: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            players: true
          }
        }
      }
    });

    const inactiveLobbyInfo = inactiveLobbies.map((lobby: any) => ({
      id: lobby.id,
      hostName: lobby.hostName,
      playerCount: lobby._count.players,
      createdAt: lobby.createdAt,
      lastActivity: lobby.updatedAt,
      inactiveMinutes: Math.round((Date.now() - lobby.updatedAt.getTime()) / (1000 * 60))
    }));

    return NextResponse.json({
      inactiveLobbies: inactiveLobbyInfo,
      count: inactiveLobbies.length,
      message: inactiveLobbies.length > 0 
        ? `Found ${inactiveLobbies.length} inactive lobbies ready for cleanup`
        : 'No inactive lobbies found'
    });
  } catch (error) {
    console.error('Error checking inactive lobbies:', error);
    return NextResponse.json(
      { 
        error: 'Failed to check inactive lobbies',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
