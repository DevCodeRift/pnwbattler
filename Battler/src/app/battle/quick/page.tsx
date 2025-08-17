'use client';

export default function QuickBattlePage() {
  return (
    <div className="space-y-6">
      <div className="border-b border-gray-700 pb-4">
        <h1 className="text-3xl font-bold text-white">Quick Battle</h1>
        <p className="text-gray-400 mt-2">Fast battle simulation with preset scenarios</p>
      </div>

      <div className="bg-gray-800 rounded-lg p-6">
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-600 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Quick Battle Coming Soon</h2>
          <p className="text-gray-400 mb-6 max-w-md mx-auto">
            The quick battle system is currently under development. 
            This will allow you to quickly simulate battles with preset military compositions.
          </p>
          <div className="bg-gray-700 rounded-lg p-4 max-w-sm mx-auto">
            <h3 className="text-sm font-medium text-gray-300 mb-2">Planned Features:</h3>
            <ul className="text-xs text-gray-400 space-y-1 text-left">
              <li>• Pre-configured battle scenarios</li>
              <li>• One-click battle simulation</li>
              <li>• Common military compositions</li>
              <li>• Quick results comparison</li>
              <li>• Save favorite setups</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
