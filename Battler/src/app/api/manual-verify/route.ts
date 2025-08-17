import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth';
import { apolloClient, GET_NATION_BY_ID } from '../../../lib/apollo-client';

// Manual verification endpoint for development/admin use
export async function POST(request: NextRequest) {
  try {
    // Only allow this in development mode for security
    if (process.env.NODE_ENV !== 'development') {
      return NextResponse.json(
        { error: 'Manual verification only available in development' },
        { status: 403 }
      );
    }

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

      // Manual verification successful
      return NextResponse.json({
        message: 'Account verified manually (development mode)',
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
