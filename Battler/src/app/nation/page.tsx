'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../stores';

export default function NationPage() {
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
        <h1 className="text-3xl font-bold text-white">My Nation</h1>
        <p className="text-gray-400 mt-2">View and manage your nation information</p>
      </div>

      <div className="bg-gray-800 rounded-lg p-6">
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 bg-indigo-600 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Nation Dashboard Coming Soon</h2>
          <p className="text-gray-400 mb-6 max-w-md mx-auto">
            The nation dashboard is currently under development. 
            This will show your complete nation overview and military information.
          </p>
          <div className="bg-gray-700 rounded-lg p-4 max-w-sm mx-auto">
            <h3 className="text-sm font-medium text-gray-300 mb-2">Planned Features:</h3>
            <ul className="text-xs text-gray-400 space-y-1 text-left">
              <li>• Real-time nation data</li>
              <li>• Military unit breakdown</li>
              <li>• Economic information</li>
              <li>• Alliance details</li>
              <li>• Battle readiness meter</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
