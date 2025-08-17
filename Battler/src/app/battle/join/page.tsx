'use client';

export default function JoinBattlePage() {
  return (
    <div className="space-y-6">
      <div className="border-b border-gray-700 pb-4">
        <h1 className="text-3xl font-bold text-white">Join Battle</h1>
        <p className="text-gray-400 mt-2">Participate in community battles</p>
      </div>

      <div className="bg-gray-800 rounded-lg p-6">
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 bg-blue-600 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Community Battles Coming Soon</h2>
          <p className="text-gray-400 mb-6 max-w-md mx-auto">
            The community battle system is currently under development. 
            This will allow you to join battles created by other players.
          </p>
          <div className="bg-gray-700 rounded-lg p-4 max-w-sm mx-auto">
            <h3 className="text-sm font-medium text-gray-300 mb-2">Planned Features:</h3>
            <ul className="text-xs text-gray-400 space-y-1 text-left">
              <li>• Browse public battles</li>
              <li>• Real-time multiplayer</li>
              <li>• Tournament brackets</li>
              <li>• Spectator mode</li>
              <li>• Battle chat system</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
