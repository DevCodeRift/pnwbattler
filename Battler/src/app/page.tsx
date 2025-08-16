'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useAuthStore } from '../stores';

export default function HomePage() {
  const { data: session } = useSession();
  const { pwNation, isVerified } = useAuthStore();

  return (
    <div className="p-6 space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-800 to-purple-800 rounded-lg p-6 border border-gray-600">
        <h1 className="text-3xl font-bold text-white mb-2">
          Welcome to PW Battle Simulator
        </h1>
        <p className="text-blue-100">
          {session 
            ? `Welcome back, ${session.user?.name}! Ready for battle?`
            : 'Login with Discord to start battling other Politics & War players!'
          }
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gray-700 rounded-lg p-4 border border-gray-600 hover:bg-gray-600 transition-colors cursor-pointer">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-2xl">⚔️</span>
            </div>
            <div>
              <h3 className="text-white font-semibold">Quick Battle</h3>
              <p className="text-gray-300 text-sm">Jump into action</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-700 rounded-lg p-4 border border-gray-600 hover:bg-gray-600 transition-colors cursor-pointer">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🛠️</span>
            </div>
            <div>
              <h3 className="text-white font-semibold">Create Match</h3>
              <p className="text-gray-300 text-sm">Host your own</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-700 rounded-lg p-4 border border-gray-600 hover:bg-gray-600 transition-colors cursor-pointer">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🎯</span>
            </div>
            <div>
              <h3 className="text-white font-semibold">Join Match</h3>
              <p className="text-gray-300 text-sm">Find opponents</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-700 rounded-lg p-4 border border-gray-600 hover:bg-gray-600 transition-colors cursor-pointer">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-yellow-600 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🏆</span>
            </div>
            <div>
              <h3 className="text-white font-semibold">Leaderboard</h3>
              <p className="text-gray-300 text-sm">See rankings</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - Recent Activity */}
        <div className="lg:col-span-2 space-y-6">
          {/* Account Status */}
          {session && (
            <div className="bg-gray-700 rounded-lg border border-gray-600">
              <div className="p-4 border-b border-gray-600">
                <h2 className="text-lg font-semibold text-white flex items-center">
                  <span className="mr-2">🏛️</span>
                  Account Status
                </h2>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Discord Account:</span>
                  <span className="text-green-400 flex items-center">
                    <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
                    Connected
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">P&W Verification:</span>
                  <span className={`flex items-center ${isVerified ? 'text-green-400' : 'text-yellow-400'}`}>
                    <span className={`w-2 h-2 rounded-full mr-2 ${isVerified ? 'bg-green-400' : 'bg-yellow-400'}`}></span>
                    {isVerified ? 'Verified' : 'Pending'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Nation Linked:</span>
                  <span className={`flex items-center ${pwNation ? 'text-green-400' : 'text-red-400'}`}>
                    <span className={`w-2 h-2 rounded-full mr-2 ${pwNation ? 'bg-green-400' : 'bg-red-400'}`}></span>
                    {pwNation ? pwNation.nation_name : 'Not Linked'}
                  </span>
                </div>
                
                {!isVerified && (
                  <div className="mt-4 p-3 bg-yellow-900/30 border border-yellow-600/30 rounded">
                    <p className="text-yellow-200 text-sm">
                      <span className="font-semibold">Action Required:</span> Verify your Politics & War account to access all features.
                    </p>
                    <Link 
                      href="/verify"
                      className="mt-2 inline-block text-yellow-400 hover:text-yellow-300 text-sm font-medium transition-colors"
                    >
                      Verify Now →
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Recent Battles */}
          <div className="bg-gray-700 rounded-lg border border-gray-600">
            <div className="p-4 border-b border-gray-600">
              <h2 className="text-lg font-semibold text-white flex items-center">
                <span className="mr-2">📊</span>
                Recent Battles
              </h2>
            </div>
            <div className="p-4">
              <div className="text-center text-gray-400 py-8">
                <span className="text-4xl mb-4 block">⚔️</span>
                <p className="text-lg mb-2">No battles yet</p>
                <p className="text-sm">Start your first battle to see activity here</p>
                <button className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors">
                  Start Battle
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Stats & Info */}
        <div className="space-y-6">
          {/* Battle Stats */}
          <div className="bg-gray-700 rounded-lg border border-gray-600">
            <div className="p-4 border-b border-gray-600">
              <h3 className="text-lg font-semibold text-white">Battle Stats</h3>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-300">Total Battles:</span>
                <span className="text-white font-semibold">0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Wins:</span>
                <span className="text-green-400 font-semibold">0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Losses:</span>
                <span className="text-red-400 font-semibold">0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Win Rate:</span>
                <span className="text-white font-semibold">0%</span>
              </div>
            </div>
          </div>

          {/* Quick Tips */}
          <div className="bg-gray-700 rounded-lg border border-gray-600">
            <div className="p-4 border-b border-gray-600">
              <h3 className="text-lg font-semibold text-white">Quick Tips</h3>
            </div>
            <div className="p-4">
              <div className="space-y-3 text-sm">
                <div className="flex items-start space-x-2">
                  <span className="text-blue-400 mt-1">💡</span>
                  <p className="text-gray-300">
                    Verify your P&W account to use your actual nation data in battles
                  </p>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="text-blue-400 mt-1">⚡</span>
                  <p className="text-gray-300">
                    Action points regenerate over time - use them wisely
                  </p>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="text-blue-400 mt-1">🎯</span>
                  <p className="text-gray-300">
                    Practice in Quick Battle mode before joining competitive matches
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Online Players */}
          <div className="bg-gray-700 rounded-lg border border-gray-600">
            <div className="p-4 border-b border-gray-600">
              <h3 className="text-lg font-semibold text-white">Online Players</h3>
            </div>
            <div className="p-4">
              <div className="flex items-center justify-center text-gray-400 py-4">
                <div className="text-center">
                  <div className="w-3 h-3 bg-green-400 rounded-full mx-auto mb-2"></div>
                  <p className="text-2xl font-bold text-white">0</p>
                  <p className="text-sm">Players Online</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Server Status Footer */}
      <div className="bg-gray-700 rounded-lg border border-gray-600 p-4">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
              <span className="text-gray-300">Server Status: Online</span>
            </div>
            <div className="text-gray-400">
              Last Update: Just now
            </div>
          </div>
          <div className="text-gray-400">
            Version 1.0.0 | <a href="#" className="text-blue-400 hover:text-blue-300">Report Issues</a>
          </div>
        </div>
      </div>
    </div>
  );
}
