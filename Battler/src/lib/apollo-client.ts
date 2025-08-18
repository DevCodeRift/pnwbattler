import { ApolloClient, InMemoryCache, createHttpLink, gql } from '@apollo/client';

// Get the API key from environment variables
// Use server-side env var for API routes, client-side for client components
const getApiKey = () => {
  const serverKey = process.env.PW_BOT_API_KEY;
  const publicKey = process.env.NEXT_PUBLIC_PW_API_KEY;
  
  const apiKey = typeof window === 'undefined' 
    ? serverKey || publicKey
    : publicKey;
    
  // Removed excessive console logging to improve performance
  // console.log('API Key check:', {
  //   isServer: typeof window === 'undefined',
  //   hasServerKey: !!serverKey,
  //   hasPublicKey: !!publicKey,
  //   usingKey: apiKey ? `${apiKey.substring(0, 6)}...` : 'none',
  //   keyLength: apiKey?.length || 0,
  //   nodeEnv: process.env.NODE_ENV
  // });
  
  if (!apiKey) {
    console.error('CRITICAL: No API key found! Available env vars:', {
      PW_BOT_API_KEY: process.env.PW_BOT_API_KEY ? 'set' : 'not set',
      NEXT_PUBLIC_PW_API_KEY: process.env.NEXT_PUBLIC_PW_API_KEY ? 'set' : 'not set'
    });
  }
  
  return apiKey;
};

const httpLink = createHttpLink({
  uri: () => {
    const apiKey = getApiKey();
    if (!apiKey) {
      console.error('No API key found in environment variables');
      throw new Error('Politics & War API key not configured');
    }
    const fullUri = `https://api.politicsandwar.com/graphql?api_key=${apiKey}`;
    console.log('GraphQL URI configured with API key');
    return fullUri;
  },
  fetch: (uri, options) => {
    console.log('Making GraphQL request to:', uri);
    return fetch(uri, options).then(response => {
      console.log('GraphQL response status:', response.status);
      if (!response.ok) {
        console.error('GraphQL HTTP error:', response.status, response.statusText);
      }
      return response;
    }).catch(error => {
      console.error('GraphQL fetch error:', error);
      throw error;
    });
  }
});

export const apolloClient = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      errorPolicy: 'all',
    },
    query: {
      errorPolicy: 'all',
    },
  },
});

const GET_NATIONS_BY_ID = gql`
  query GetNationsById($id: [Int]!) {
    nations(id: $id, first: 1) {
      data {
        id
        nation_name
        leader_name
        alliance_id
        alliance {
          id
          name
        }
        war_policy
        domestic_policy
        color
        num_cities
        score
        population
        soldiers
        tanks
        aircraft
        ships
        missiles
        nukes
        money
        coal
        oil
        uranium
        iron
        bauxite
        lead
        gasoline
        munitions
        steel
        aluminum
        food
        government_type
        economic_policy
        social_policy
        cities {
          id
          name
          infrastructure
          land
          powered
          barracks
          factory
          hangar
          drydock
          coal_power
          oil_power
          nuclear_power
          wind_power
          coal_mine
          oil_well
          uranium_mine
          iron_mine
          bauxite_mine
          lead_mine
          farm
          aluminum_refinery
          steel_mill
          oil_refinery
          munitions_factory
          police_station
          hospital
          recycling_center
          subway
          supermarket
          bank
          shopping_mall
          stadium
        }
      }
    }
  }
`;

const GET_NATIONS_BY_NAME = gql`
  query GetNationsByName($name: [String]!) {
    nations(nation_name: $name, first: 1) {
      data {
        id
        nation_name
        leader_name
        alliance_id
        alliance {
          id
          name
        }
        war_policy
        domestic_policy
        color
        num_cities
        score
        population
        soldiers
        tanks
        aircraft
        ships
        missiles
        nukes
        money
        coal
        oil
        uranium
        iron
        bauxite
        lead
        gasoline
        munitions
        steel
        aluminum
        food
        government_type
        economic_policy
        social_policy
        cities {
          id
          name
          infrastructure
          land
          powered
          barracks
          factory
          hangar
          drydock
          coal_power
          oil_power
          nuclear_power
          wind_power
          coal_mine
          oil_well
          uranium_mine
          iron_mine
          bauxite_mine
          lead_mine
          farm
          aluminum_refinery
          steel_mill
          oil_refinery
          munitions_factory
          police_station
          hospital
          recycling_center
          subway
          supermarket
          bank
          shopping_mall
          stadium
        }
      }
    }
  }
`;

export const GET_ALLIANCE_BY_ID = gql`
  query GetAlliance($id: ID!) {
    alliances(id: [$id]) {
      data {
        id
        name
        acronym
        color
        score
        applicants
        members
        accepted_members
        nations {
          id
          nation_name
          leader_name
          score
        }
      }
    }
  }
`;

export const SEARCH_NATIONS = gql`
  query SearchNations($search: String!, $first: Int = 10) {
    nations(first: $first, nation_name: [$search]) {
      data {
        id
        nation_name
        leader_name
        continent
        color
        alliance {
          id
          name
          acronym
        }
        score
        soldiers
        tanks
        aircraft
        ships
      }
      paginatorInfo {
        hasNextPage
        hasPreviousPage
        currentPage
        lastPage
        total
      }
    }
  }
`;

// Export the renamed queries for backward compatibility
export { GET_NATIONS_BY_ID as GET_NATION_BY_ID, GET_NATIONS_BY_NAME as GET_NATION_BY_NAME };
