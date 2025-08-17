'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../stores';

export default function CreateBattlePage() {
  const { data: session, status } = useSession();
  const { pwNation, isVerified } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    // Wait for session to load
    if (status === 'loading') return;
    
    // Redirect to login if not authenticated
    if (status === 'unauthenticated' || !session) {
      router.push('/login');
      return;
    }

    // Redirect to verify if not verified
    if (session && (!isVerified || !pwNation?.id)) {
      router.push('/verify');
      return;
    }
  }, [session, status, isVerified, pwNation, router]);

  // Show loading while checking authentication
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  // Show loading while redirecting
  if (status === 'unauthenticated' || !session || !isVerified || !pwNation?.id) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Checking authentication...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-8 text-center bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
            Create Battle
          </h1>
          
          <div className="bg-gray-800 rounded-lg p-8 text-center">
            <div className="mb-6">
              <div className="text-6xl mb-4">⚔️</div>
              <h2 className="text-2xl font-semibold mb-4">Battle Creation</h2>
              <p className="text-gray-300 mb-6">
                Create custom battles and scenarios to test your strategic skills.
              </p>
            </div>
            
            <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-center gap-2 text-yellow-300">
                <span className="text-xl">🚧</span>
                <span className="font-medium">Coming Soon</span>
              </div>
              <p className="text-sm text-yellow-200/80 mt-2">
                Battle creation features are currently under development. 
                Check back soon for updates!
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4 text-left">
              <div className="bg-gray-700/50 rounded-lg p-4">
                <h3 className="font-semibold text-blue-300 mb-2">🎯 Custom Scenarios</h3>
                <p className="text-sm text-gray-300">
                  Design your own battle scenarios with custom nations, resources, and objectives.
                </p>
              </div>
              
              <div className="bg-gray-700/50 rounded-lg p-4">
                <h3 className="font-semibold text-green-300 mb-2">⚙️ Advanced Settings</h3>
                <p className="text-sm text-gray-300">
                  Configure unit types, terrain effects, and special battle conditions.
                </p>
              </div>
              
              <div className="bg-gray-700/50 rounded-lg p-4">
                <h3 className="font-semibold text-purple-300 mb-2">🤝 Multiplayer Support</h3>
                <p className="text-sm text-gray-300">
                  Create battles that friends can join for cooperative or competitive gameplay.
                </p>
              </div>
              
              <div className="bg-gray-700/50 rounded-lg p-4">
                <h3 className="font-semibold text-red-300 mb-2">📊 Analytics</h3>
                <p className="text-sm text-gray-300">
                  Track battle statistics and analyze performance across different scenarios.
                </p>
              </div>
            </div>
            
            <div className="mt-8 flex gap-4 justify-center">
              <button 
                onClick={() => router.push('/battle')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
              >
                Back to Battles
              </button>
              <button 
                onClick={() => router.push('/battle/real')}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition-colors"
              >
                Join Multiplayer
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
