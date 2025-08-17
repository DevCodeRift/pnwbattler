'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../stores';

export default function StatsPage() {
  const { data: session } = useSession();
  const { isVerified, pwNation } = useAuthStore();
  const router = useRouter();

  // Authentication check and redirect
  useEffect(() => {
    if (!session) {
      router.push('/login');
      return;
    }
    if (!isVerified || !pwNation) {
      router.push('/verify');
      return;
    }
  }, [session, isVerified, pwNation, router]);

  // Don't render content while redirecting for authentication
  if (!session || !isVerified || !pwNation) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-300">Checking authentication...</p>
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-6">
      <div className="border-b border-gray-700 pb-4">
        <h1 className="text-3xl font-bold text-white">Statistics</h1>
        <p className="text-gray-400 mt-2">Detailed analytics and performance metrics</p>
      </div>

      <div className="bg-gray-800 rounded-lg p-6">
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 bg-purple-600 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Statistics Dashboard Coming Soon</h2>
          <p className="text-gray-400 mb-6 max-w-md mx-auto">
            The statistics dashboard is currently under development. 
            This will provide detailed analytics on battles, performance, and trends.
          </p>
          <div className="bg-gray-700 rounded-lg p-4 max-w-sm mx-auto">
            <h3 className="text-sm font-medium text-gray-300 mb-2">Planned Features:</h3>
            <ul className="text-xs text-gray-400 space-y-1 text-left">
              <li>• Battle performance metrics</li>
              <li>• Win/loss ratios</li>
              <li>• Unit effectiveness analysis</li>
              <li>• Historical trend charts</li>
              <li>• Comparative statistics</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
