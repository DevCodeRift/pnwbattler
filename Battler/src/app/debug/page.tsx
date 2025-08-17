'use client';

import { useState } from 'react';

export default function ApiTestPage() {
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [nationId, setNationId] = useState('701263');

  const testApiKey = async () => {
    setLoading(true);
    setResult('Testing API configuration...\n');
    
    try {
      // Test environment variables
      const clientApiKey = process.env.NEXT_PUBLIC_PW_API_KEY;
      setResult(prev => prev + `Client API Key: ${clientApiKey ? 'Set' : 'Not set'}\n`);
      
      // Test our API endpoint
      const response = await fetch(`/api/nations?id=${nationId}`);
      const data = await response.json();
      
      setResult(prev => prev + `API Response Status: ${response.status}\n`);
      setResult(prev => prev + `API Response: ${JSON.stringify(data, null, 2)}\n`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${data.error || 'Unknown error'}`);
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setResult(prev => prev + `Error: ${errorMessage}\n`);
    } finally {
      setLoading(false);
    }
  };

  const testDirectGraphQL = async () => {
    setLoading(true);
    setResult('Testing direct GraphQL API...\n');
    
    try {
      // This will help us test if the GraphQL API works with a manual query
      const apiKey = process.env.NEXT_PUBLIC_PW_API_KEY;
      if (!apiKey || apiKey === 'your_pw_api_key_here') {
        throw new Error('API key not configured. Please set NEXT_PUBLIC_PW_API_KEY in .env.local');
      }
      
      const query = `{
        nations(id: [${nationId}]) {
          data {
            id
            nation_name
            leader_name
            continent
            color
          }
        }
      }`;
      
      const url = `https://api.politicsandwar.com/graphql?api_key=${apiKey}`;
      
      setResult(prev => prev + `GraphQL URL: ${url.replace(apiKey, '[API_KEY_HIDDEN]')}\n`);
      setResult(prev => prev + `Query: ${query}\n`);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query })
      });
      
      const data = await response.json();
      
      setResult(prev => prev + `Direct API Status: ${response.status}\n`);
      setResult(prev => prev + `Direct API Response: ${JSON.stringify(data, null, 2)}\n`);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setResult(prev => prev + `Direct API Error: ${errorMessage}\n`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">API Debug Page</h1>
        
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Configuration</h2>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Nation ID to test:</label>
            <input
              type="text"
              value={nationId}
              onChange={(e) => setNationId(e.target.value)}
              className="bg-gray-700 border border-gray-600 rounded px-3 py-2 w-32"
              placeholder="701263"
            />
          </div>
          
          <div className="space-x-4">
            <button
              onClick={testApiKey}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-4 py-2 rounded"
            >
              Test Our API Route
            </button>
            
            <button
              onClick={testDirectGraphQL}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 px-4 py-2 rounded"
            >
              Test Direct GraphQL
            </button>
          </div>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Results</h2>
          <pre className="bg-gray-900 p-4 rounded overflow-auto text-sm whitespace-pre-wrap">
            {result || 'Click a test button to see results...'}
          </pre>
        </div>
        
        <div className="mt-6 bg-yellow-900 border border-yellow-600 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-2">Setup Instructions:</h3>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Get your API key from: <a href="https://politicsandwar.com/account/#7" target="_blank" className="text-blue-400 underline">https://politicsandwar.com/account/#7</a></li>
            <li>Replace <code className="bg-gray-700 px-1 rounded">your_pw_api_key_here</code> in your <code className="bg-gray-700 px-1 rounded">.env.local</code> file</li>
            <li>Restart your development server</li>
            <li>Test again using the buttons above</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
