'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';

export default function TestMessagePage() {
  const { data: session } = useSession();
  const [nationId, setNationId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const testMessage = async () => {
    if (!nationId.trim()) {
      setError('Please enter a nation ID');
      return;
    }

    if (!session?.user) {
      setError('Please sign in first');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch('/api/test-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nationId: nationId.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Show detailed error information
        const errorMsg = data?.error || 'Failed to send test message';
        const details = data?.response ? ` - ${JSON.stringify(data.response)}` : '';
        throw new Error(errorMsg + details);
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Failed to send test message');
    } finally {
      setLoading(false);
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Authentication Required</h1>
          <p className="text-gray-300">Please sign in to test message sending.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 py-12 px-4">
      <div className="max-w-md mx-auto">
        <div className="bg-gray-800 rounded-lg shadow-xl p-6">
          <h1 className="text-2xl font-bold text-white mb-6 text-center">
            Test P&amp;W Message API
          </h1>
          
          {error && (
            <div className="bg-red-900/30 border border-red-600/30 rounded-lg p-4 mb-4">
              <p className="text-red-200 text-sm">{error}</p>
            </div>
          )}

          {result && (
            <div className="bg-green-900/30 border border-green-600/30 rounded-lg p-4 mb-4">
              <h3 className="text-green-200 font-semibold mb-2">API Response:</h3>
              <pre className="text-green-100 text-xs whitespace-pre-wrap">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Target Nation ID
              </label>
              <input
                type="text"
                value={nationId}
                onChange={(e) => setNationId(e.target.value)}
                placeholder="e.g., 701263"
                className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-gray-400 text-xs mt-1">
                Note: This will send a test message to the specified nation
              </p>
            </div>

            <button
              onClick={testMessage}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white py-2 px-4 rounded-lg transition-colors"
            >
              {loading ? 'Sending...' : 'Send Test Message'}
            </button>
          </div>

          <div className="mt-6 text-center">
            <a
              href="/verify"
              className="text-blue-400 hover:text-blue-300 text-sm"
            >
              ← Back to Verification
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
