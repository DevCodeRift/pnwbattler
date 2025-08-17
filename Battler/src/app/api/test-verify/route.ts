import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth';
import { apolloClient, GET_NATION_BY_ID } from '../../../lib/apollo-client';
import { prisma } from '../../../lib/prisma';

export async function GET(request: NextRequest) {
  try {
    console.log('TEST /api/test-verify - Starting component tests');

    // Test 1: Environment variables
    const envTest = {
      hasDatabase: !!process.env.DATABASE_URL,
      hasPwBotKey: !!process.env.PW_BOT_API_KEY,
      hasPublicKey: !!process.env.NEXT_PUBLIC_PW_API_KEY,
      hasDiscordClient: !!process.env.DISCORD_CLIENT_ID,
      hasDiscordSecret: !!process.env.DISCORD_CLIENT_SECRET,
      hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
      hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
    };

    console.log('Environment test:', envTest);

    // Test 2: Session handling
    let sessionTest;
    try {
      const session = await getServerSession(authOptions);
      sessionTest = {
        hasSession: !!session,
        hasUser: !!session?.user,
        hasDiscordId: !!(session?.user as any)?.discordId,
        userName: session?.user?.name || 'No name',
      };
    } catch (sessionError) {
      sessionTest = {
        error: sessionError instanceof Error ? sessionError.message : 'Unknown session error'
      };
    }

    console.log('Session test:', sessionTest);

    // Test 3: Database connection
    let databaseTest;
    try {
      const userCount = await prisma.user.count();
      databaseTest = {
        connected: true,
        userCount,
      };
    } catch (dbError) {
      databaseTest = {
        connected: false,
        error: dbError instanceof Error ? dbError.message : 'Unknown database error'
      };
    }

    console.log('Database test:', databaseTest);

    // Test 4: GraphQL API (simple query)
    let graphqlTest;
    try {
      const { data, errors } = await apolloClient.query({
        query: GET_NATION_BY_ID,
        variables: { id: 1 }, // Test with nation ID 1 (should exist)
      });

      graphqlTest = {
        hasData: !!data,
        hasErrors: !!errors,
        hasNations: !!data?.nations,
        nationCount: data?.nations?.data?.length || 0,
        errors: errors ? errors.map(e => e.message) : null,
      };
    } catch (gqlError) {
      graphqlTest = {
        error: gqlError instanceof Error ? gqlError.message : 'Unknown GraphQL error'
      };
    }

    console.log('GraphQL test:', graphqlTest);

    return NextResponse.json({
      status: 'test-complete',
      tests: {
        environment: envTest,
        session: sessionTest,
        database: databaseTest,
        graphql: graphqlTest,
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Test endpoint error:', error);
    return NextResponse.json({
      status: 'test-failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : null,
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}
