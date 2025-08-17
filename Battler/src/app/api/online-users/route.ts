import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET: Fetch all online users
export async function GET() {
  try {
    // Mark users as offline if they haven't been seen in the last 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    
    await prisma.onlineUser.updateMany({
      where: {
        lastSeen: {
          lt: fiveMinutesAgo
        },
        isOnline: true
      },
      data: {
        isOnline: false
      }
    });

    // Get all currently online users
    const onlineUsers = await prisma.onlineUser.findMany({
      where: {
        isOnline: true
      },
      select: {
        id: true,
        username: true,
        avatar: true,
        lastSeen: true
      },
      orderBy: {
        lastSeen: 'desc'
      }
    });

    return NextResponse.json({
      users: onlineUsers,
      count: onlineUsers.length
    });
  } catch (error) {
    console.error('Error fetching online users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch online users' },
      { status: 500 }
    );
  }
}

// POST: Update user's online status (heartbeat)
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
    const username = (session.user as any).username || session.user.name || 'Unknown';
    const avatar = (session.user as any).avatar;

    if (!discordId) {
      return NextResponse.json(
        { error: 'Discord ID not found in session' },
        { status: 400 }
      );
    }

    // Update or create the user's online status
    const onlineUser = await prisma.onlineUser.upsert({
      where: {
        discordId: discordId
      },
      update: {
        username: username,
        avatar: avatar,
        lastSeen: new Date(),
        isOnline: true
      },
      create: {
        discordId: discordId,
        username: username,
        avatar: avatar,
        lastSeen: new Date(),
        isOnline: true
      }
    });

    return NextResponse.json({
      message: 'Online status updated',
      user: {
        id: onlineUser.id,
        username: onlineUser.username,
        avatar: onlineUser.avatar,
        lastSeen: onlineUser.lastSeen
      }
    });
  } catch (error) {
    console.error('Error updating online status:', error);
    return NextResponse.json(
      { error: 'Failed to update online status' },
      { status: 500 }
    );
  }
}

// DELETE: Mark user as offline
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const discordId = (session.user as any).discordId;

    if (!discordId) {
      return NextResponse.json(
        { error: 'Discord ID not found in session' },
        { status: 400 }
      );
    }

    // Mark user as offline
    await prisma.onlineUser.updateMany({
      where: {
        discordId: discordId
      },
      data: {
        isOnline: false,
        lastSeen: new Date()
      }
    });

    return NextResponse.json({
      message: 'Marked as offline'
    });
  } catch (error) {
    console.error('Error marking user offline:', error);
    return NextResponse.json(
      { error: 'Failed to mark user offline' },
      { status: 500 }
    );
  }
}
