import { ApolloClient, InMemoryCache, createHttpLink, gql } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';

const httpLink = createHttpLink({
  uri: 'https://api.politicsandwar.com/graphql',
});

const authLink = setContext((_, { headers }) => {
  // Get the API key from environment variables
  const apiKey = process.env.NEXT_PUBLIC_PW_API_KEY;
  
  return {
    headers: {
      ...headers,
      'X-API-KEY': apiKey || '',
      'Content-Type': 'application/json',
    }
  };
});

export const apolloClient = new ApolloClient({
  link: authLink.concat(httpLink),
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
  query GetNation($id: ID!) {
    nation(id: $id) {
      id
      nation_name
      leader_name
      continent
      color
      alliance_id
      alliance {
        id
        name
        acronym
        color
      }
      cities {
        id
        name
        infrastructure
        land
        powered
      }
      score
      population
      land
      soldiers
      tanks
      aircraft
      ships
      missiles
      nukes
      money
      wars_won
      wars_lost
      war_policy
      domestic_policy
      government_type
      economic_policy
      social_policy
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
          acronym
          color
        }
        cities {
          id
          name
          infrastructure
          land
          powered
        }
        score
        population
        land
        soldiers
        tanks
        aircraft
        ships
        missiles
        nukes
        money
        wars_won
        wars_lost
        war_policy
        domestic_policy
        government_type
        economic_policy
        social_policy
      }
    }
  }
`;

export const GET_ALLIANCE_BY_ID = gql`
  query GetAlliance($id: ID!) {
    alliance(id: $id) {
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
