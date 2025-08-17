import { ApolloClient, InMemoryCache, createHttpLink, gql } from '@apollo/client';

// Get the API key from environment variables
// Use server-side env var for API routes, client-side for client components
const getApiKey = () => {
  return typeof window === 'undefined' 
    ? process.env.NEXT_PUBLIC_PW_API_KEY || process.env.PW_BOT_API_KEY
    : process.env.NEXT_PUBLIC_PW_API_KEY;
};

const httpLink = createHttpLink({
  uri: () => {
    const apiKey = getApiKey();
    if (!apiKey) {
      console.error('No API key found in environment variables');
      return 'https://api.politicsandwar.com/graphql';
    }
    const fullUri = `https://api.politicsandwar.com/graphql?api_key=${apiKey}`;
    console.log('Using GraphQL endpoint with API key configured');
    return fullUri;
  },
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

// GraphQL Queries for Politics and War API
export const GET_NATION_BY_ID = gql`
  query GetNation($id: Int!) {
    nations(id: [$id]) {
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
        missiles
        nukes
        money
        wars_won
        wars_lost
        cities {
          id
          name
        }
      }
    }
  }
`;

export const GET_NATION_BY_NAME = gql`
  query GetNationByName($name: String!) {
    nations(first: 1, nation_name: [$name]) {
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
        missiles
        nukes
        money
        wars_won
        wars_lost
        cities {
          id
          name
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
