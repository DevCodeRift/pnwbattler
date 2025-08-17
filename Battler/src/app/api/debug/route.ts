import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Check environment variables (without exposing the actual keys)
    const hasPublicKey = !!process.env.NEXT_PUBLIC_PW_API_KEY;
    const hasBotKey = !!process.env.PW_BOT_API_KEY;
    const hasBotNationId = !!process.env.PW_BOT_NATION_ID;
    
    // Test a simple fetch to the P&W API
    const apiKey = process.env.NEXT_PUBLIC_PW_API_KEY || process.env.PW_BOT_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json({
        error: 'No API key found',
        environment: {
          hasPublicKey,
          hasBotKey,
          hasBotNationId,
        }
      }, { status: 500 });
    }
    
    // Test the GraphQL endpoint with a simple query
    const testQuery = `{
      nations(first: 1) {
        data {
          id
          nation_name
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
    
    return NextResponse.json({
      status: 'API test completed',
      environment: {
        hasPublicKey,
        hasBotKey,
        hasBotNationId,
      },
      apiResponse: {
        status: response.status,
        ok: response.ok,
        hasData: !!data.data,
        hasErrors: !!data.errors,
        errors: data.errors || null,
        sampleNation: data.data?.nations?.data?.[0] || null
      }
    });
    
  } catch (error) {
    console.error('Debug API error:', error);
    return NextResponse.json({
      error: 'Debug test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
