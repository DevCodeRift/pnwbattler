import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth';

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

    // Verification successful
    verificationCodes.delete(discordId);

    // In production, you would store this verification in a database
    return NextResponse.json({
      message: 'Account verified successfully',
      nationId: verification.nationId,
    });
  } catch (error) {
    console.error('Error verifying code:', error);
    return NextResponse.json(
      { error: 'Failed to verify code' },
      { status: 500 }
    );
  }
}
