'use client';

export default function LeaderboardPage() {
  return (
    <div className="space-y-6">
      <div className="border-b border-gray-700 pb-4">
        <h1 className="text-3xl font-bold text-white">Leaderboard</h1>
        <p className="text-gray-400 mt-2">Top performers in the Politics & War community</p>
      </div>

      <div className="bg-gray-800 rounded-lg p-6">
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 bg-yellow-600 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3l7 7 7-7M5 21l7-7 7 7" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Leaderboards Coming Soon</h2>
          <p className="text-gray-400 mb-6 max-w-md mx-auto">
            The leaderboard system is currently under development. 
            This will showcase the top nations, alliances, and players based on various metrics.
          </p>
          <div className="bg-gray-700 rounded-lg p-4 max-w-sm mx-auto">
            <h3 className="text-sm font-medium text-gray-300 mb-2">Planned Rankings:</h3>
            <ul className="text-xs text-gray-400 space-y-1 text-left">
              <li>• Top Nations by Score</li>
              <li>• Most Active Players</li>
              <li>• Strongest Alliances</li>
              <li>• Battle Win Rates</li>
              <li>• Economic Powerhouses</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
