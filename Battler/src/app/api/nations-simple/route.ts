import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const nationId = searchParams.get('id');
  const nationName = searchParams.get('name');

  try {
    const apiKey = process.env.NEXT_PUBLIC_PW_API_KEY || process.env.PW_BOT_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json({
        error: 'No API key configured',
        debug: {
          hasPublicKey: !!process.env.NEXT_PUBLIC_PW_API_KEY,
          hasBotKey: !!process.env.PW_BOT_API_KEY,
        }
      }, { status: 500 });
    }

    let query;
    let variables = {};

    if (nationId) {
      query = `{
        nations(id: [${parseInt(nationId, 10)}]) {
          data {
            id
            nation_name
            leader_name
            continent
            color
            alliance_id
            alliance {
              id
              name
            }
            score
            soldiers
            tanks
            aircraft
            ships
          }
        }
      }`;
    } else if (nationName) {
      query = `{
        nations(first: 1, nation_name: ["${nationName}"]) {
          data {
            id
            nation_name
            leader_name
            continent
            color
            alliance_id
            alliance {
              id
              name
            }
            score
            soldiers
            tanks
            aircraft
            ships
          }
        }
      }`;
    } else {
      return NextResponse.json(
        { error: 'Nation ID or name is required' },
        { status: 400 }
      );
    }

    console.log('Making request to P&W API with query:', query);

    const response = await fetch(`https://api.politicsandwar.com/graphql?api_key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query })
    });

    console.log('P&W API response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('P&W API error response:', errorText);
      return NextResponse.json({
        error: 'P&W API request failed',
        status: response.status,
        statusText: response.statusText,
        response: errorText
      }, { status: 500 });
    }

    const data = await response.json();
    console.log('P&W API response data:', JSON.stringify(data, null, 2));

    if (data.errors) {
      console.error('GraphQL errors:', data.errors);
      return NextResponse.json({
        error: 'GraphQL errors',
        graphqlErrors: data.errors
      }, { status: 500 });
    }

    const nations = data.data?.nations?.data || [];
    const nation = nations[0] || null;

    return NextResponse.json({ 
      nation,
      debug: {
        queryUsed: query,
        responseSize: JSON.stringify(data).length,
        nationCount: nations.length
      }
    });

  } catch (error) {
    console.error('Simple nation fetch error:', error);
    return NextResponse.json({
      error: 'Request failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
