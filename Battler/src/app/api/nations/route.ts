import { NextRequest, NextResponse } from 'next/server';
import { apolloClient, GET_NATION_BY_ID, GET_NATION_BY_NAME } from '../../../lib/apollo-client';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const nationId = searchParams.get('id');
  const nationName = searchParams.get('name');

  try {
    if (nationId) {
      const { data } = await apolloClient.query({
        query: GET_NATION_BY_ID,
        variables: { id: parseInt(nationId, 10) },
      });
      const nations = data.nations?.data || [];
      return NextResponse.json({ nation: nations[0] || null });
    } else if (nationName) {
      const { data } = await apolloClient.query({
        query: GET_NATION_BY_NAME,
        variables: { name: nationName },
      });
      const nations = data.nations?.data || [];
      return NextResponse.json({ nation: nations[0] || null });
    } else {
      return NextResponse.json(
        { error: 'Nation ID or name is required' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error fetching nation:', error);
    
    // Log more detailed error information
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    
    // Check if it's a GraphQL error
    if (error && typeof error === 'object' && 'graphQLErrors' in error) {
      console.error('GraphQL errors:', (error as any).graphQLErrors);
    }
    
    if (error && typeof error === 'object' && 'networkError' in error) {
      console.error('Network error:', (error as any).networkError);
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch nation data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { nationIds } = await request.json();
    
    if (!Array.isArray(nationIds)) {
      return NextResponse.json(
        { error: 'nationIds must be an array' },
        { status: 400 }
      );
    }

    const nations = await Promise.all(
      nationIds.map(async (id: string) => {
        try {
          const { data } = await apolloClient.query({
            query: GET_NATION_BY_ID,
            variables: { id: parseInt(id, 10) },
          });
          const nations = data.nations?.data || [];
          return nations[0] || null;
        } catch (error) {
          console.error(`Error fetching nation ${id}:`, error);
          return null;
        }
      })
    );

    return NextResponse.json({ nations: nations.filter(Boolean) });
  } catch (error) {
    console.error('Error in batch nation fetch:', error);
    return NextResponse.json(
      { error: 'Failed to fetch nations' },
      { status: 500 }
    );
  }
}
