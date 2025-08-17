'use client';

export default function CreateBattlePage() {
  return (
    <div className="space-y-6">
      <div className="border-b border-gray-700 pb-4">
        <h1 className="text-3xl font-bold text-white">Create Battle</h1>
        <p className="text-gray-400 mt-2">Set up custom battle scenarios</p>
      </div>

      <div className="bg-gray-800 rounded-lg p-6">
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 bg-green-600 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Battle Creator Coming Soon</h2>
          <p className="text-gray-400 mb-6 max-w-md mx-auto">
            The custom battle creator is currently under development. 
            This will allow you to create detailed battle scenarios with custom military setups.
          </p>
          <div className="bg-gray-700 rounded-lg p-4 max-w-sm mx-auto">
            <h3 className="text-sm font-medium text-gray-300 mb-2">Planned Features:</h3>
            <ul className="text-xs text-gray-400 space-y-1 text-left">
              <li>• Custom unit compositions</li>
              <li>• Nation vs Nation battles</li>
              <li>• Alliance war scenarios</li>
              <li>• Environmental factors</li>
              <li>• Save and share battles</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
