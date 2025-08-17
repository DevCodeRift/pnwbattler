'use client';

export default function BattlesPage() {
  return (
    <div className="space-y-6">
      <div className="border-b border-gray-700 pb-4">
        <h1 className="text-3xl font-bold text-white">Battle History</h1>
        <p className="text-gray-400 mt-2">View and analyze past battles</p>
      </div>

      <div className="bg-gray-800 rounded-lg p-6">
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 bg-blue-600 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Battle System Coming Soon</h2>
          <p className="text-gray-400 mb-6 max-w-md mx-auto">
            The battle history and replay system is currently under development. 
            This will show detailed battle statistics and allow you to review past conflicts.
          </p>
          <div className="bg-gray-700 rounded-lg p-4 max-w-sm mx-auto">
            <h3 className="text-sm font-medium text-gray-300 mb-2">Planned Features:</h3>
            <ul className="text-xs text-gray-400 space-y-1 text-left">
              <li>• Battle replay system</li>
              <li>• Detailed combat statistics</li>
              <li>• Win/loss tracking</li>
              <li>• Alliance battle history</li>
              <li>• Battle analytics dashboard</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
