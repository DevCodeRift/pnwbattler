import { NextRequest, NextResponse } from 'next/server';
import { apolloClient, GET_NATION_BY_ID, GET_NATION_BY_NAME } from '../../../lib/apollo-client';
import { getMockNationData, isApiKeyConfigured } from '../../../lib/mock-nation-data';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const nationId = searchParams.get('id');
  const nationName = searchParams.get('name');

  try {
    // Check if API key is properly configured
    if (!isApiKeyConfigured()) {
      console.log('API key not configured, using mock data for nation:', nationId || nationName);
      
      if (nationId) {
        const mockNation = getMockNationData(nationId);
        if (mockNation) {
          return NextResponse.json({ 
            nation: mockNation,
            _mock: true,
            _message: 'Using mock data - API key not configured for local development'
          });
        } else {
          return NextResponse.json({
            nation: null,
            _mock: true,
            _message: `Mock nation data not available for ID: ${nationId}. Available IDs: 145633, 662952, 701263`
          });
        }
      } else {
        return NextResponse.json({
          nation: null,
          _mock: true,
          _message: 'Mock data only supports nation ID lookup, not name lookup'
        });
      }
    }

    // Continue with real API calls if API key is configured
    if (nationId) {
      console.log('Fetching nation by ID:', nationId);
      const { data } = await apolloClient.query({
        query: GET_NATION_BY_ID,
        variables: { id: parseInt(nationId, 10) },
      });
      
      console.log('GraphQL response data:', JSON.stringify(data, null, 2));
      
      // Check different possible response structures
      let nations = null;
      if (data?.nations?.data) {
        nations = data.nations.data;
      } else if (data?.nations) {
        nations = data.nations;
      } else if (data?.data?.nations) {
        nations = data.data.nations;
      } else {
        console.error('Unexpected response structure:', data);
        return NextResponse.json(
          { 
            error: 'Unexpected API response structure',
            details: 'Nations data not found in expected location',
            responseStructure: Object.keys(data || {})
          },
          { status: 500 }
        );
      }
      
      const nation = Array.isArray(nations) ? nations[0] : nations;
      console.log('Extracted nation:', nation);
      
      return NextResponse.json({ nation: nation || null });
    } else if (nationName) {
      console.log('Fetching nation by name:', nationName);
      const { data } = await apolloClient.query({
        query: GET_NATION_BY_NAME,
        variables: { name: nationName },
      });
      
      console.log('GraphQL response data:', JSON.stringify(data, null, 2));
      
      // Check different possible response structures
      let nations = null;
      if (data?.nations?.data) {
        nations = data.nations.data;
      } else if (data?.nations) {
        nations = data.nations;
      } else if (data?.data?.nations) {
        nations = data.data.nations;
      } else {
        console.error('Unexpected response structure:', data);
        return NextResponse.json(
          { 
            error: 'Unexpected API response structure',
            details: 'Nations data not found in expected location',
            responseStructure: Object.keys(data || {})
          },
          { status: 500 }
        );
      }
      
      const nation = Array.isArray(nations) ? nations[0] : nations;
      console.log('Extracted nation:', nation);
      
      return NextResponse.json({ nation: nation || null });
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

    // Check if API key is properly configured
    if (!isApiKeyConfigured()) {
      console.log('API key not configured, using mock data for nations:', nationIds);
      
      const nations = nationIds.map((id: string) => {
        const mockNation = getMockNationData(id);
        return mockNation || null;
      }).filter(Boolean);

      return NextResponse.json({ 
        nations,
        _mock: true,
        _message: 'Using mock data - API key not configured for local development'
      });
    }

    const nations = await Promise.all(
      nationIds.map(async (id: string) => {
        try {
          console.log('Fetching nation by ID in batch:', id);
          const { data } = await apolloClient.query({
            query: GET_NATION_BY_ID,
            variables: { id: parseInt(id, 10) },
          });
          
          console.log('Batch GraphQL response data for', id, ':', JSON.stringify(data, null, 2));
          
          // Check different possible response structures
          let nationData = null;
          if (data?.nations?.data) {
            nationData = data.nations.data;
          } else if (data?.nations) {
            nationData = data.nations;
          } else if (data?.data?.nations) {
            nationData = data.data.nations;
          }
          
          const nation = Array.isArray(nationData) ? nationData[0] : nationData;
          return nation || null;
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
