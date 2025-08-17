import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

export async function GET(request: NextRequest) {
  try {
    console.log('DEBUG: Checking environment and database connection');
    
    const debugInfo = {
      nodeEnv: process.env.NODE_ENV,
      hasDiscordClientId: !!process.env.DISCORD_CLIENT_ID,
      hasDiscordSecret: !!process.env.DISCORD_CLIENT_SECRET,
      hasPwBotApiKey: !!process.env.PW_BOT_API_KEY,
      hasPublicPwApiKey: !!process.env.NEXT_PUBLIC_PW_API_KEY,
      hasPwBotNationId: !!process.env.PW_BOT_NATION_ID,
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
      hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
    };

    console.log('Environment variables check:', debugInfo);

    // Test database connection
    let databaseStatus;
    try {
      const userCount = await prisma.user.count();
      console.log('Database connection successful, user count:', userCount);
      databaseStatus = {
        connected: true,
        userCount
      };
    } catch (dbError) {
      console.error('Database connection failed:', dbError);
      databaseStatus = {
        connected: false,
        error: dbError instanceof Error ? dbError.message : 'Unknown database error'
      };
    }

    // Test the GraphQL endpoint with a simple query
    const apiKey = process.env.PW_BOT_API_KEY || process.env.NEXT_PUBLIC_PW_API_KEY;
    
    let apiStatus;
    if (!apiKey) {
      apiStatus = {
        hasKey: false,
        error: 'No API key found'
      };
    } else {
      try {
        const testQuery = `{
          nations(first: 1) {
            data {
              id
              nation_name
              leader_name
              alliance {
                id
                name
              }
            }
          }
        }`;

        const response = await fetch(`https://api.politicsandwar.com/graphql?api_key=${apiKey}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: testQuery
          })
        });

        const data = await response.json();
        
        apiStatus = {
          hasKey: true,
          responseStatus: response.status,
          hasData: !!data.data,
          hasErrors: !!data.errors,
          errors: data.errors
        };
      } catch (apiError) {
        apiStatus = {
          hasKey: true,
          error: apiError instanceof Error ? apiError.message : 'Unknown API error'
        };
      }
    }

    const overallStatus = databaseStatus.connected && apiStatus.hasKey && !apiStatus.error ? 'ok' : 'error';
    
    return NextResponse.json({
      status: overallStatus,
      environment: debugInfo,
      database: databaseStatus,
      api: apiStatus,
      timestamp: new Date().toISOString()
    }, { status: overallStatus === 'ok' ? 200 : 500 });

  } catch (error) {
    console.error('Debug endpoint error:', error);
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
