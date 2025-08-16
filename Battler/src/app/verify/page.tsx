'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useAuthStore } from '../../stores';

export default function VerifyPage() {
  const { data: session } = useSession();
  const { setPWNation, setVerified, isVerified, pwNation } = useAuthStore();
  
  const [step, setStep] = useState<'search' | 'code' | 'success'>('search');
  const [nationInput, setNationInput] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [foundNation, setFoundNation] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');

  const searchNation = async () => {
    if (!nationInput.trim()) {
      setError('Please enter a nation name or ID');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Check if input is a number (ID) or string (name)
      const isId = /^\d+$/.test(nationInput.trim());
      const params = isId 
        ? `id=${encodeURIComponent(nationInput.trim())}`
        : `name=${encodeURIComponent(nationInput.trim())}`;

      const response = await fetch(`/api/nations?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to find nation');
      }

      if (!data.nation) {
        setError('Nation not found. Please check the name or ID and try again.');
        return;
      }

      setFoundNation(data.nation);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to search for nation');
    } finally {
      setLoading(false);
    }
  };

  const requestVerification = async () => {
    if (!foundNation) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nationId: foundNation.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to request verification');
      }

      // In development, show the code
      if (data.code) {
        setGeneratedCode(data.code);
      }

      setStep('code');
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to request verification');
    } finally {
      setLoading(false);
    }
  };

  const submitVerification = async () => {
    if (!verificationCode.trim()) {
      setError('Please enter the verification code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/verify', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: verificationCode.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to verify');
      }

      // Update the auth store with nation data
      setPWNation(data.nation);
      setVerified(true);
      setStep('success');
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to verify code');
    } finally {
      setLoading(false);
    }
  };

  if (!session) {
    return (
      <div className="p-6">
        <div className="bg-yellow-900/30 border border-yellow-600/30 rounded-lg p-6 text-center">
          <h2 className="text-xl font-bold text-yellow-200 mb-2">Authentication Required</h2>
          <p className="text-yellow-100">Please login with Discord to verify your Politics & War account.</p>
        </div>
      </div>
    );
  }

  if (isVerified && pwNation) {
    return (
      <div className="p-6">
        <div className="bg-green-900/30 border border-green-600/30 rounded-lg p-6">
          <h2 className="text-xl font-bold text-green-200 mb-4">Account Already Verified</h2>
          <div className="bg-gray-700 rounded-lg p-4 border border-gray-600">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">
                  {pwNation.nation_name.charAt(0)}
                </span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">{pwNation.nation_name}</h3>
                <p className="text-gray-300">Leader: {pwNation.leader_name}</p>
                <p className="text-gray-300">Score: {pwNation.score.toLocaleString()}</p>
                <p className="text-gray-300">Cities: {pwNation.cities.length}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="bg-gray-700 rounded-lg border border-gray-600">
        <div className="p-4 border-b border-gray-600">
          <h1 className="text-2xl font-bold text-white">Verify Your Politics & War Account</h1>
          <p className="text-gray-300 mt-2">
            Link your Discord account to your Politics & War nation to access all features.
          </p>
        </div>

        <div className="p-6">
          {/* Step Indicator */}
          <div className="flex items-center mb-8">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${step === 'search' ? 'bg-blue-600 text-white' : foundNation ? 'bg-green-600 text-white' : 'bg-gray-600 text-gray-300'}`}>
              1
            </div>
            <div className={`flex-1 h-1 mx-2 ${foundNation ? 'bg-green-600' : 'bg-gray-600'}`}></div>
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${step === 'code' ? 'bg-blue-600 text-white' : step === 'success' ? 'bg-green-600 text-white' : 'bg-gray-600 text-gray-300'}`}>
              2
            </div>
            <div className={`flex-1 h-1 mx-2 ${step === 'success' ? 'bg-green-600' : 'bg-gray-600'}`}></div>
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${step === 'success' ? 'bg-green-600 text-white' : 'bg-gray-600 text-gray-300'}`}>
              3
            </div>
          </div>

          {error && (
            <div className="bg-red-900/30 border border-red-600/30 rounded-lg p-4 mb-6">
              <p className="text-red-200">{error}</p>
            </div>
          )}

          {step === 'search' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Nation Name or ID
                </label>
                <input
                  type="text"
                  value={nationInput}
                  onChange={(e) => setNationInput(e.target.value)}
                  placeholder="Enter your nation name or ID"
                  className="w-full bg-gray-800 border border-gray-600 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onKeyPress={(e) => e.key === 'Enter' && searchNation()}
                />
                <p className="text-xs text-gray-400 mt-1">
                  You can find your nation ID in your Politics & War URL: politicsandwar.com/nation/id=YOUR_ID
                </p>
              </div>

              {foundNation && (
                <div className="bg-gray-800 rounded-lg p-4 border border-gray-600">
                  <h3 className="text-lg font-semibold text-white mb-3">Nation Found</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">Nation:</span>
                      <span className="text-white ml-2 font-medium">{foundNation.nation_name}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Leader:</span>
                      <span className="text-white ml-2">{foundNation.leader_name}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Score:</span>
                      <span className="text-white ml-2">{foundNation.score.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Cities:</span>
                      <span className="text-white ml-2">{foundNation.cities.length}</span>
                    </div>
                    {foundNation.alliance && (
                      <div className="col-span-2">
                        <span className="text-gray-400">Alliance:</span>
                        <span className="text-white ml-2">{foundNation.alliance.name}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex space-x-4">
                <button
                  onClick={searchNation}
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-6 py-2 rounded-lg transition-colors"
                >
                  {loading ? 'Searching...' : 'Search Nation'}
                </button>
                {foundNation && (
                  <button
                    onClick={requestVerification}
                    disabled={loading}
                    className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-6 py-2 rounded-lg transition-colors"
                  >
                    {loading ? 'Requesting...' : 'Request Verification'}
                  </button>
                )}
              </div>
            </div>
          )}

          {step === 'code' && (
            <div className="space-y-6">
              <div className="bg-blue-900/30 border border-blue-600/30 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-blue-200 mb-2">Verification Code Sent</h3>
                <p className="text-blue-100 text-sm">
                  A verification code has been sent to your Politics & War inbox. Please enter it below to complete verification.
                </p>
                {generatedCode && (
                  <div className="mt-3 p-3 bg-yellow-900/30 border border-yellow-600/30 rounded">
                    <p className="text-yellow-200 text-sm">
                      <strong>Development Mode:</strong> Your verification code is: <strong>{generatedCode}</strong>
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Verification Code
                </label>
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  placeholder="Enter the 6-digit code"
                  className="w-full bg-gray-800 border border-gray-600 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  maxLength={6}
                  onKeyPress={(e) => e.key === 'Enter' && submitVerification()}
                />
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={() => setStep('search')}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={submitVerification}
                  disabled={loading}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-6 py-2 rounded-lg transition-colors"
                >
                  {loading ? 'Verifying...' : 'Verify'}
                </button>
              </div>
            </div>
          )}

          {step === 'success' && (
            <div className="text-center space-y-6">
              <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-green-200 mb-2">Verification Successful!</h3>
                <p className="text-gray-300">
                  Your Politics & War account has been successfully linked to your Discord account.
                </p>
              </div>
              <button
                onClick={() => window.location.href = '/'}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
              >
                Continue to Dashboard
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
