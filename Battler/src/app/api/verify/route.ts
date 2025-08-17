import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth';
import { apolloClient, GET_NATION_BY_ID } from '../../../lib/apollo-client';
import { prisma } from '../../../lib/prisma';

// This would normally connect to a database to store verification codes
// For now, we'll use a simple in-memory store (not suitable for production)
const verificationCodes = new Map<string, {
  discordId: string;
  code: string;
  nationId: string;
  expires: Date;
}>();

export async function GET(request: NextRequest) {
  try {
    console.log('GET /api/verify - Starting verification check');
    
    const session = await getServerSession(authOptions);
    console.log('GET /api/verify - Session:', session ? 'exists' : 'null');
    
    if (!session?.user) {
      console.log('GET /api/verify - No session or user');
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const discordId = (session.user as any).discordId;
    console.log('GET /api/verify - Discord ID:', discordId);
    
    if (!discordId) {
      console.log('GET /api/verify - No Discord ID in session');
      return NextResponse.json(
        { error: 'Discord ID not found in session' },
        { status: 400 }
      );
    }

    // Check if user is verified in database
    console.log('GET /api/verify - Checking database for user:', discordId);
    const user = await prisma.user.findUnique({
      where: { discordId },
    });
    console.log('GET /api/verify - User found:', user ? 'yes' : 'no');
    
    if (user && user.isVerified && user.pwNationData) {
      console.log('GET /api/verify - User is verified');
      return NextResponse.json({
        verified: true,
        nation: user.pwNationData,
        verifiedAt: user.verifiedAt,
      });
    } else {
      console.log('GET /api/verify - User not verified');
      return NextResponse.json({
        verified: false,
      });
    }

  } catch (error) {
    console.error('Error checking verification status:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { error: 'Failed to check verification status', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('POST /api/verify - Starting verification request');
    
    const session = await getServerSession(authOptions);
    console.log('POST /api/verify - Session exists:', !!session?.user);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { nationId } = await request.json();
    console.log('POST /api/verify - Nation ID received:', nationId);
    
    if (!nationId) {
      return NextResponse.json(
        { error: 'Nation ID is required' },
        { status: 400 }
      );
    }

    const discordId = (session.user as any).discordId;
    console.log('POST verification - discordId:', discordId);
    console.log('POST verification - session.user:', session.user);
    
    if (!discordId) {
      return NextResponse.json(
        { error: 'Discord ID not found in session' },
        { status: 400 }
      );
    }

    // Verify the nation exists in P&W API
    console.log('POST /api/verify - Checking nation with GraphQL API');
    try {
      const { data, errors } = await apolloClient.query({
        query: GET_NATION_BY_ID,
        variables: { id: parseInt(nationId) },
      });

      console.log('POST /api/verify - GraphQL response errors:', errors);
      console.log('POST /api/verify - GraphQL response data:', data ? 'exists' : 'null');
      console.log('POST /api/verify - Nation data:', data?.nations?.data?.[0] ? 'found' : 'not found');

      if (errors || !data.nations?.data?.[0]) {
        console.error('POST /api/verify - Nation not found or GraphQL errors:', errors);
        return NextResponse.json(
          { error: 'Nation not found in Politics and War' },
          { status: 404 }
        );
      }

      // Check if nation is already verified by another user (not the current user)
      const existingVerification = Array.from(verificationCodes.values())
        .find(v => v.nationId === nationId && v.expires > new Date() && v.discordId !== discordId);
      
      if (existingVerification) {
        return NextResponse.json(
          { error: 'This nation is already being verified by another user' },
          { status: 409 }
        );
      }

    } catch (error) {
      console.error('Error fetching nation from P&W API:', error);
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      return NextResponse.json(
        { error: 'Failed to verify nation with Politics and War API', details: error instanceof Error ? error.message : 'Unknown error' },
        { status: 500 }
      );
    }

    // Generate a 6-digit verification code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
    
    // Store or update the verification code for this user
    verificationCodes.set(discordId, {
      discordId,
      code,
      nationId,
      expires,
    });
    
    console.log('POST verification - Code stored for discordId:', discordId, 'code:', code);
    console.log('POST verification - verificationCodes size:', verificationCodes.size);

    // Send verification message to the nation via P&W REST API
    try {
      const messageSubject = 'PnW Battler Verification Code';
      const messageBody = `Your verification code for PnW Battler is: ${code}

Please enter this code on the verification page to link your Politics & War account with your Discord account.

This code will expire in 30 minutes. If you did not request this verification, please ignore this message.`;

      const apiKey = process.env.PW_BOT_API_KEY || process.env.NEXT_PUBLIC_PW_API_KEY;
      
      if (!apiKey) {
        console.error('No API key found for sending messages');
      } else {
        // Use P&W REST API to send message (send-message is the exception that remains on original API)
        const messageResponse = await fetch('https://politicsandwar.com/api/send-message/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            key: apiKey,
            to: nationId,
            subject: messageSubject,
            message: messageBody,
          }),
        });

        if (messageResponse.ok) {
          const messageResult = await messageResponse.json();
          if (messageResult.success) {
            console.log(`Verification message sent successfully to nation ${nationId}`);
          } else {
            console.error('Failed to send verification message:', messageResult);
          }
        } else {
          const errorData = await messageResponse.text();
          console.error('Failed to send verification message - HTTP error:', errorData);
        }
      }
    } catch (messageError) {
      console.error('Error sending verification message:', messageError);
      // Don't fail the verification request if message sending fails
    }

    return NextResponse.json({
      message: 'Verification code sent to your Politics and War inbox.',
      // In development, also return the code for testing
      code: process.env.NODE_ENV === 'development' ? code : undefined,
    });
  } catch (error) {
    console.error('Error generating verification code:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { error: 'Failed to generate verification code', details: error instanceof Error ? error.message : 'Unknown error' },
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
    console.log('PUT verification - discordId:', discordId);
    console.log('PUT verification - available codes:', Array.from(verificationCodes.keys()));
    
    const verification = verificationCodes.get(discordId);

    if (!verification) {
      console.log('No verification found for discordId:', discordId);
      // Try to find verification by checking all entries (fallback for potential key mismatch)
      const allVerifications = Array.from(verificationCodes.entries());
      console.log('All verifications:', allVerifications.map(([key, val]) => ({ key, code: val.code, expires: val.expires })));
      
      return NextResponse.json(
        { error: 'No verification request found. Please request a new verification code.' },
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
        variables: { id: parseInt(verification.nationId) },
        fetchPolicy: 'network-only', // Always get fresh data
      });

      if (errors || !data.nations?.data?.[0]) {
        return NextResponse.json(
          { error: 'Nation not found during verification' },
          { status: 404 }
        );
      }

      const nation = data.nations.data[0];

      // Verification successful
      verificationCodes.delete(discordId);

      // Save or update user in database
      await prisma.user.upsert({
        where: { discordId },
        update: {
          isVerified: true,
          pwNationId: verification.nationId,
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
          pwNationId: verification.nationId,
          pwNationName: nation.nation_name,
          pwNationData: nation,
          verifiedAt: new Date(),
        },
      });

      // Return the nation data along with verification success
      return NextResponse.json({
        message: 'Account verified successfully',
        nation: nation,
        verified: true,
      });

    } catch (error) {
      console.error('Error fetching nation data during verification:', error);
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      return NextResponse.json(
        { error: 'Failed to fetch nation data', details: error instanceof Error ? error.message : 'Unknown error' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error verifying code:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { error: 'Failed to verify code', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
