'use client';

import { useState } from 'react';

export default function TestPage() {
  const [nationId, setNationId] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const testAPI = async () => {
    if (!nationId.trim()) {
      setError('Please enter a nation ID');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch(`/api/nations?id=${encodeURIComponent(nationId.trim())}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'API request failed');
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch nation data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="bg-gray-700 rounded-lg border border-gray-600">
        <div className="p-4 border-b border-gray-600">
          <h1 className="text-2xl font-bold text-white">API Test</h1>
          <p className="text-gray-300 mt-2">
            Test the Politics & War GraphQL API integration
          </p>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Nation ID
            </label>
            <div className="flex space-x-4">
              <input
                type="text"
                value={nationId}
                onChange={(e) => setNationId(e.target.value)}
                placeholder="Enter a nation ID (e.g., 1, 12345)"
                className="flex-1 bg-gray-800 border border-gray-600 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyPress={(e) => e.key === 'Enter' && testAPI()}
              />
              <button
                onClick={testAPI}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-6 py-2 rounded-lg transition-colors"
              >
                {loading ? 'Testing...' : 'Test API'}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-900/30 border border-red-600/30 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-red-200 mb-2">Error</h3>
              <p className="text-red-100">{error}</p>
            </div>
          )}

          {result && (
            <div className="bg-gray-800 rounded-lg border border-gray-600">
              <div className="p-4 border-b border-gray-600">
                <h3 className="text-lg font-semibold text-white">API Response</h3>
              </div>
              <div className="p-4">
                {result.nation ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-400">Nation:</span>
                        <span className="text-white ml-2 font-medium">{result.nation.nation_name}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Leader:</span>
                        <span className="text-white ml-2">{result.nation.leader_name}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Score:</span>
                        <span className="text-white ml-2">{result.nation.score.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Cities:</span>
                        <span className="text-white ml-2">{result.nation.cities.length}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Population:</span>
                        <span className="text-white ml-2">{result.nation.population.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Continent:</span>
                        <span className="text-white ml-2">{result.nation.continent}</span>
                      </div>
                      {result.nation.alliance && (
                        <>
                          <div className="col-span-2">
                            <span className="text-gray-400">Alliance:</span>
                            <span className="text-white ml-2">{result.nation.alliance.name}</span>
                          </div>
                        </>
                      )}
                    </div>

                    <div className="mt-6">
                      <h4 className="text-md font-semibold text-white mb-2">Raw JSON Response:</h4>
                      <pre className="bg-gray-900 p-4 rounded text-xs text-gray-300 overflow-auto max-h-96">
                        {JSON.stringify(result, null, 2)}
                      </pre>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-300">Nation not found</p>
                )}
              </div>
            </div>
          )}

          <div className="bg-blue-900/30 border border-blue-600/30 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-blue-200 mb-2">Instructions</h3>
            <div className="text-blue-100 text-sm space-y-2">
              <p>• Enter any valid Politics & War nation ID to test the GraphQL API</p>
              <p>• Try nation ID "1" for Alex's nation</p>
              <p>• This tests the /api/nations endpoint which uses the P&W GraphQL API</p>
              <p>• Make sure you have a valid API key in your .env file</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
