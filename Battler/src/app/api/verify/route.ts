import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth';
import { apolloClient, GET_NATION_BY_ID } from '../../../lib/apollo-client';

// This would normally connect to a database to store verification codes
// For now, we'll use a simple in-memory store (not suitable for production)
const verificationCodes = new Map<string, {
  discordId: string;
  code: string;
  nationId: string;
  expires: Date;
}>();

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { nationId } = await request.json();
    
    if (!nationId) {
      return NextResponse.json(
        { error: 'Nation ID is required' },
        { status: 400 }
      );
    }

    // Verify the nation exists in P&W API
    try {
      const { data, errors } = await apolloClient.query({
        query: GET_NATION_BY_ID,
        variables: { id: nationId },
      });

      if (errors || !data.nation) {
        return NextResponse.json(
          { error: 'Nation not found in Politics and War' },
          { status: 404 }
        );
      }

      // Check if nation is already verified by another user (in production, check database)
      const existingVerification = Array.from(verificationCodes.values())
        .find(v => v.nationId === nationId && v.expires > new Date());
      
      if (existingVerification) {
        return NextResponse.json(
          { error: 'This nation is already being verified by another user' },
          { status: 409 }
        );
      }

    } catch (error) {
      console.error('Error fetching nation from P&W API:', error);
      return NextResponse.json(
        { error: 'Failed to verify nation with Politics and War API' },
        { status: 500 }
      );
    }

    // Generate a 6-digit verification code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
    
    const discordId = (session.user as any).discordId;
    
    verificationCodes.set(discordId, {
      discordId,
      code,
      nationId,
      expires,
    });

    // In a real implementation, you would send an in-game message to the nation
    // For now, we'll just return the code for demo purposes
    console.log(`Verification code for nation ${nationId}: ${code}`);

    return NextResponse.json({
      message: 'Verification code generated. Check your Politics and War inbox.',
      // In production, don't return the code
      code: process.env.NODE_ENV === 'development' ? code : undefined,
    });
  } catch (error) {
    console.error('Error generating verification code:', error);
    return NextResponse.json(
      { error: 'Failed to generate verification code' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { code } = await request.json();
    
    if (!code) {
      return NextResponse.json(
        { error: 'Verification code is required' },
        { status: 400 }
      );
    }

    const discordId = (session.user as any).discordId;
    const verification = verificationCodes.get(discordId);

    if (!verification) {
      return NextResponse.json(
        { error: 'No verification request found' },
        { status: 404 }
      );
    }

    if (verification.expires < new Date()) {
      verificationCodes.delete(discordId);
      return NextResponse.json(
        { error: 'Verification code has expired' },
        { status: 400 }
      );
    }

    if (verification.code !== code) {
      return NextResponse.json(
        { error: 'Invalid verification code' },
        { status: 400 }
      );
    }

    // Fetch the nation data from P&W API
    try {
      const { data, errors } = await apolloClient.query({
        query: GET_NATION_BY_ID,
        variables: { id: verification.nationId },
        fetchPolicy: 'network-only', // Always get fresh data
      });

      if (errors || !data.nation) {
        return NextResponse.json(
          { error: 'Nation not found during verification' },
          { status: 404 }
        );
      }

      // Verification successful
      verificationCodes.delete(discordId);

      // Return the nation data along with verification success
      return NextResponse.json({
        message: 'Account verified successfully',
        nation: data.nation,
        verified: true,
      });

    } catch (error) {
      console.error('Error fetching nation data during verification:', error);
      return NextResponse.json(
        { error: 'Failed to fetch nation data' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error verifying code:', error);
    return NextResponse.json(
      { error: 'Failed to verify code' },
      { status: 500 }
    );
  }
}
