// Test script to validate Politics & War GraphQL API configuration
// This will help us understand if our API key and query structure are correct

const API_KEY = 'your_actual_api_key_here'; // Replace with your actual API key
const GRAPHQL_ENDPOINT = `https://api.politicsandwar.com/graphql?api_key=${API_KEY}`;

// Simple test query based on P&W documentation
const testQuery = `{
  nations(id: [701263]) {
    data {
      id
      nation_name
      leader_name
      continent
      color
    }
  }
}`;

// Test function to validate our understanding
async function testGraphQLAPI() {
  try {
    const response = await fetch(GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: testQuery
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('API Response:', JSON.stringify(data, null, 2));
    
    if (data.errors) {
      console.error('GraphQL Errors:', data.errors);
    }
    
    if (data.data && data.data.nations && data.data.nations.data) {
      console.log('Success! Nation data:', data.data.nations.data[0]);
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// You can run this in a browser console or Node.js to test the API
console.log('GraphQL Endpoint:', GRAPHQL_ENDPOINT);
console.log('Test Query:', testQuery);
console.log('Run testGraphQLAPI() to test the connection');

export { testGraphQLAPI, GRAPHQL_ENDPOINT, testQuery };
