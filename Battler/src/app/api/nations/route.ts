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
      
      try {
        const result = await apolloClient.query({
          query: GET_NATION_BY_ID,
          variables: { id: parseInt(nationId, 10) },
          fetchPolicy: 'network-only',
        });
        
        console.log('GraphQL result object:', result);
        
        if (result.data?.nations?.data?.[0]) {
          const nation = result.data.nations.data[0];
          return NextResponse.json({ 
            nation,
            _message: 'Data fetched from Politics & War API'
          });
        } else {
          return NextResponse.json({
            error: 'Nation not found',
            nation: null
          }, { status: 404 });
        }
        console.log('GraphQL data:', JSON.stringify(result.data, null, 2));
        console.log('GraphQL errors:', result.errors);
        console.log('GraphQL loading:', result.loading);
        console.log('GraphQL network status:', result.networkStatus);
        
        // Check for GraphQL errors first
        if (result.errors && result.errors.length > 0) {
          console.error('GraphQL query returned errors:', result.errors);
          return NextResponse.json(
            { 
              error: 'GraphQL query failed',
              details: result.errors.map((err: any) => err.message).join(', '),
              graphqlErrors: result.errors
            },
            { status: 500 }
          );
        }
        
        // Check if we have any data at all
        if (!result.data) {
          console.error('No data in GraphQL result');
          return NextResponse.json(
            { 
              error: 'No data returned from GraphQL query',
              details: 'GraphQL query completed but returned no data',
              fullResult: result
            },
            { status: 500 }
          );
        }
        
        // Log the exact structure we received
        console.log('Data structure keys:', Object.keys(result.data));
        if (result.data.nations) {
          console.log('Nations structure:', typeof result.data.nations);
          console.log('Nations keys:', Object.keys(result.data.nations || {}));
          if (result.data.nations.data) {
            console.log('Nations data length:', result.data.nations.data.length);
            console.log('First nation preview:', result.data.nations.data[0] ? Object.keys(result.data.nations.data[0]) : 'No nations');
          }
        }
        
        // Try to extract nation data with better error handling
        let nations = null;
        if (result.data?.nations?.data) {
          nations = result.data.nations.data;
          console.log('Found nations in data.nations.data:', nations.length);
        } else if (result.data?.nations) {
          nations = result.data.nations;
          console.log('Found nations in data.nations:', Array.isArray(nations) ? nations.length : 'not array');
        } else {
          console.error('Nations not found in expected locations');
          console.error('Available data keys:', Object.keys(result.data));
          return NextResponse.json(
            { 
              error: 'Unexpected API response structure',
              details: 'Nations data not found in expected location',
              responseStructure: Object.keys(result.data),
              fullData: result.data
            },
            { status: 500 }
          );
        }
        
        const nation = Array.isArray(nations) ? nations[0] : nations;
        
        if (!nation) {
          console.log('No nation found in nations array/object');
          return NextResponse.json(
            { 
              error: 'Nation not found',
              details: `No nation found with ID ${nationId}`,
              nationsFound: Array.isArray(nations) ? nations.length : 'not array'
            },
            { status: 404 }
          );
        }
        
        console.log('Successfully extracted nation:', nation.id, nation.nation_name);
        return NextResponse.json({ nation });
        
      } catch (queryError) {
        console.error('GraphQL query failed with error:', queryError);
        
        // Log detailed error information
        if (queryError instanceof Error) {
          console.error('Error message:', queryError.message);
          console.error('Error stack:', queryError.stack);
        }
        
        // Check if it's an Apollo/GraphQL specific error
        if (queryError && typeof queryError === 'object') {
          if ('graphQLErrors' in queryError) {
            console.error('GraphQL errors:', (queryError as any).graphQLErrors);
          }
          if ('networkError' in queryError) {
            console.error('Network error:', (queryError as any).networkError);
          }
          if ('extraInfo' in queryError) {
            console.error('Extra info:', (queryError as any).extraInfo);
          }
        }
        
        return NextResponse.json(
          { 
            error: 'GraphQL query execution failed',
            details: queryError instanceof Error ? queryError.message : 'Unknown GraphQL error',
            errorType: queryError?.constructor?.name || 'Unknown'
          },
          { status: 500 }
        );
      }
    } else if (nationName) {
      console.log('Fetching nation by name:', nationName);
      
      try {
        const result = await apolloClient.query({
          query: GET_NATION_BY_NAME,
          variables: { name: nationName },
          fetchPolicy: 'network-only',
        });
        
        console.log('GraphQL result for name query:', result);
        console.log('GraphQL data for name:', JSON.stringify(result.data, null, 2));
        
        // Check for GraphQL errors first
        if (result.errors && result.errors.length > 0) {
          console.error('GraphQL name query returned errors:', result.errors);
          return NextResponse.json(
            { 
              error: 'GraphQL name query failed',
              details: result.errors.map((err: any) => err.message).join(', '),
              graphqlErrors: result.errors
            },
            { status: 500 }
          );
        }
        
        if (!result.data) {
          console.error('No data in GraphQL name result');
          return NextResponse.json(
            { 
              error: 'No data returned from GraphQL name query',
              details: 'GraphQL query completed but returned no data'
            },
            { status: 500 }
          );
        }
        
        let nations = null;
        if (result.data?.nations?.data) {
          nations = result.data.nations.data;
        } else if (result.data?.nations) {
          nations = result.data.nations;
        } else {
          console.error('Nations not found in name query response');
          return NextResponse.json(
            { 
              error: 'Unexpected API response structure for name query',
              details: 'Nations data not found in expected location',
              responseStructure: Object.keys(result.data),
              fullData: result.data
            },
            { status: 500 }
          );
        }
        
        const nation = Array.isArray(nations) ? nations[0] : nations;
        
        if (!nation) {
          return NextResponse.json(
            { 
              error: 'Nation not found',
              details: `No nation found with name ${nationName}`
            },
            { status: 404 }
          );
        }
        
        console.log('Successfully extracted nation by name:', nation.id, nation.nation_name);
        return NextResponse.json({ nation });
        
      } catch (queryError) {
        console.error('GraphQL name query failed with error:', queryError);
        return NextResponse.json(
          { 
            error: 'GraphQL name query execution failed',
            details: queryError instanceof Error ? queryError.message : 'Unknown GraphQL error'
          },
          { status: 500 }
        );
      }
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
