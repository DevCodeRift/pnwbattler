'use client';

import { useState, useEffect } from 'react';

export default function TestMultiplayer() {
  const [testResults, setTestResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const runTest = async (testName: string, apiCall: () => Promise<Response>) => {
    try {
      const response = await apiCall();
      const data = await response.json();
      return {
        test: testName,
        status: response.ok ? 'PASS' : 'FAIL',
        statusCode: response.status,
        data: data
      };
    } catch (error) {
      return {
        test: testName,
        status: 'ERROR',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  };

  const runAllTests = async () => {
    setIsLoading(true);
    const results = [];

    // Test 1: Get lobbies
    results.push(await runTest('Get Lobbies', () => 
      fetch('/api/multiplayer?action=get_lobbies')
    ));

    // Test 2: Create lobby
    results.push(await runTest('Create Lobby', () => 
      fetch('/api/multiplayer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_lobby',
          hostName: 'TestHost',
          settings: {
            maxPlayers: 2,
            turnTimer: 60,
            economyType: 'UNLIMITED',
            cityMode: 'NATION_CITIES',
            unitBuyFrequency: 'EVERY_TURN'
          }
        })
      })
    ));

    // Test 3: Get nations (existing endpoint)
    results.push(await runTest('Get Nations', () => 
      fetch('/api/nations-simple')
    ));

    // Test 4: Debug endpoint
    results.push(await runTest('Debug Info', () => 
      fetch('/api/debug')
    ));

    setTestResults(results);
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Multiplayer System Test</h1>
        
        <button
          onClick={runAllTests}
          disabled={isLoading}
          className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-semibold mb-8 disabled:opacity-50"
        >
          {isLoading ? 'Running Tests...' : 'Run All Tests'}
        </button>

        <div className="space-y-4">
          {testResults.map((result, index) => (
            <div key={index} className="bg-gray-800 p-6 rounded-lg">
              <div className="flex items-center gap-4 mb-4">
                <h3 className="text-xl font-semibold">{result.test}</h3>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  result.status === 'PASS' ? 'bg-green-600' :
                  result.status === 'FAIL' ? 'bg-red-600' : 'bg-yellow-600'
                }`}>
                  {result.status}
                </span>
                {result.statusCode && (
                  <span className="text-gray-400">Status: {result.statusCode}</span>
                )}
              </div>
              
              {result.error && (
                <div className="bg-red-900 p-3 rounded mb-4">
                  <strong>Error:</strong> {result.error}
                </div>
              )}
              
              {result.data && (
                <details className="mt-4">
                  <summary className="cursor-pointer text-blue-400 hover:text-blue-300">
                    View Response Data
                  </summary>
                  <pre className="mt-2 p-4 bg-gray-900 rounded overflow-auto text-sm">
                    {JSON.stringify(result.data, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          ))}
        </div>

        <div className="mt-8 p-6 bg-blue-900 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Environment Check</h2>
          <p className="mb-2">This page tests the multiplayer API endpoints to verify:</p>
          <ul className="list-disc list-inside space-y-1 text-gray-300">
            <li>Database connectivity (PostgreSQL)</li>
            <li>API route functionality</li>
            <li>Lobby creation and retrieval</li>
            <li>Error handling</li>
          </ul>
          <p className="mt-4 text-yellow-300">
            If tests fail, check that DATABASE_URL is set in Vercel environment variables.
          </p>
        </div>
      </div>
    </div>
  );
}
