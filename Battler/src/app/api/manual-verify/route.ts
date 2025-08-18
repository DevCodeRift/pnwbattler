import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth';
import { apolloClient, GET_NATION_BY_ID } from '../../../lib/apollo-client';
import { prisma } from '../../../lib/prisma';

// Manual verification endpoint for admin use (production-safe)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Only allow access for the specific Discord user (eleos_gb)
    const discordId = (session.user as any).discordId;
    if (discordId !== '989576730165518437') {
      return NextResponse.json(
        { error: 'Access denied: Manual verification restricted to admin' },
        { status: 403 }
      );
    }

    const { nationId } = await request.json();
    
    if (!nationId) {
      return NextResponse.json(
        { error: 'Nation ID is required' },
        { status: 400 }
      );
    }

    // Fetch the nation data from P&W API to verify it exists
    try {
      const { data, errors } = await apolloClient.query({
        query: GET_NATION_BY_ID,
        variables: { id: parseInt(nationId) },
        fetchPolicy: 'network-only', // Always get fresh data
      });

      if (errors || !data.nations?.data?.[0]) {
        return NextResponse.json(
          { error: 'Nation not found in Politics and War' },
          { status: 404 }
        );
      }

      const nation = data.nations.data[0];

      // Save or update user in database
      console.log('MANUAL-VERIFY: Saving verification to database for Discord ID:', discordId);
      try {
        await prisma.user.upsert({
          where: { discordId },
          update: {
            isVerified: true,
            pwNationId: nationId,
            pwNationName: nation.nation_name,
            pwNationData: nation,
            verifiedAt: new Date(),
            discordUsername: (session.user as any).username || session.user.name,
            discordAvatar: (session.user as any).avatar,
          },
          create: {
            discordId,
            discordUsername: (session.user as any).username || session.user.name || 'Unknown',
            discordAvatar: (session.user as any).avatar,
            isVerified: true,
            pwNationId: nationId,
            pwNationName: nation.nation_name,
            pwNationData: nation,
            verifiedAt: new Date(),
          },
        });
        console.log('MANUAL-VERIFY: User verified and saved successfully');
      } catch (dbError) {
        console.error('MANUAL-VERIFY: Database save error:', dbError);
        return NextResponse.json(
          { error: 'Failed to save verification to database', details: dbError instanceof Error ? dbError.message : 'Unknown database error' },
          { status: 500 }
        );
      }

      // Manual verification successful
      return NextResponse.json({
        message: `Account verified manually (admin override${process.env.NODE_ENV === 'development' ? ' - development mode' : ''})`,
        nation: nation,
        verified: true,
        manual: true,
      });

    } catch (error) {
      console.error('Error fetching nation data during manual verification:', error);
      return NextResponse.json(
        { error: 'Failed to fetch nation data' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error in manual verification:', error);
    return NextResponse.json(
      { error: 'Failed to process manual verification' },
      { status: 500 }
    );
  }
}

// GET endpoint to check if user can use manual verification
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ canUseManual: false, reason: 'Not authenticated' });
    }

    const discordId = (session.user as any).discordId;
    const isAdmin = discordId === '989576730165518437'; // Your Discord ID
    
    return NextResponse.json({
      canUseManual: isAdmin,
      isAdmin,
      discordId: discordId,
      message: isAdmin ? 'You can use manual verification' : 'Manual verification restricted to admin',
    });

  } catch (error) {
    return NextResponse.json({ canUseManual: false, reason: 'Error checking permissions' });
  }
}
