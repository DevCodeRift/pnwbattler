'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';

export default function ManualVerifyPage() {
  const { data: session } = useSession();
  const [nationId, setNationId] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Check if user is the authorized admin (eleos_gb)
  const isAuthorized = session?.user && (session.user as any).discordId === '989576730165518437';

  const handleManualVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch('/api/manual-verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ nationId }),
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data);
      } else {
        setError(data.error || 'Manual verification failed');
      }
    } catch (err) {
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Manual Verification</h1>
          <p className="text-gray-400">Please log in to access manual verification.</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Manual Verification</h1>
          <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-red-400">🚫</span>
              <span className="text-red-200 font-medium">Access Denied</span>
            </div>
            <p className="text-red-100">
              Manual verification is restricted to authorized administrators only.
            </p>
          </div>
          <div className="text-center mt-6">
            <a
              href="/verify"
              className="text-blue-400 hover:text-blue-300 transition-colors"
            >
              ← Use Normal Verification Instead
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Manual Verification (Admin)</h1>
        
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2">
              <span className="text-blue-400">🔒</span>
              <span className="text-blue-200 font-medium">Admin Access Only</span>
            </div>
            <p className="text-blue-100 text-sm mt-2">
              This manual verification endpoint is restricted to authorized administrators for testing and development purposes.
            </p>
          </div>

          <form onSubmit={handleManualVerify} className="space-y-4">
            <div>
              <label htmlFor="nationId" className="block text-sm font-medium text-gray-300 mb-2">
                Nation ID
              </label>
              <input
                id="nationId"
                type="text"
                value={nationId}
                onChange={(e) => setNationId(e.target.value)}
                placeholder="Enter your nation ID"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
              <p className="text-sm text-gray-400 mt-1">
                You can find your nation ID in your P&W nation URL (e.g., https://politicsandwar.com/nation/id=123456)
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-medium py-2 px-4 rounded-md transition-colors"
            >
              {loading ? 'Verifying...' : 'Manual Verify'}
            </button>
          </form>

          {error && (
            <div className="mt-4 bg-red-900/20 border border-red-500/30 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <span className="text-red-400">❌</span>
                <span className="text-red-200 font-medium">Error</span>
              </div>
              <p className="text-red-100 text-sm mt-1">{error}</p>
            </div>
          )}

          {result && (
            <div className="mt-4 bg-green-900/20 border border-green-500/30 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <span className="text-green-400">✅</span>
                <span className="text-green-200 font-medium">Success</span>
              </div>
              <p className="text-green-100 text-sm mt-1">{result.message}</p>
              
              {result.nation && (
                <div className="mt-4 bg-gray-700 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-white mb-2">Nation Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-400">Nation:</span>{' '}
                      <span className="text-white">{result.nation.nation_name}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Leader:</span>{' '}
                      <span className="text-white">{result.nation.leader_name}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Alliance:</span>{' '}
                      <span className="text-white">
                        {result.nation.alliance?.name || 'None'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400">Score:</span>{' '}
                      <span className="text-white">{result.nation.score?.toLocaleString() || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Cities:</span>{' '}
                      <span className="text-white">{result.nation.cities?.length || 0}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Color:</span>{' '}
                      <span className="text-white capitalize">{result.nation.color}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="text-center">
          <a
            href="/verify"
            className="text-blue-400 hover:text-blue-300 transition-colors"
          >
            ← Back to Normal Verification
          </a>
        </div>
      </div>
    </div>
  );
}
