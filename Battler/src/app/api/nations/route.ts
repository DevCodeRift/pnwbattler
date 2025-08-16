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
        variables: { id: nationId },
      });
      return NextResponse.json({ nation: data.nation });
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
    return NextResponse.json(
      { error: 'Failed to fetch nation data' },
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
            variables: { id },
          });
          return data.nation;
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
