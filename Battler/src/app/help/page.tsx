'use client';

export default function HelpPage() {
  return (
    <div className="space-y-6">
      <div className="border-b border-gray-700 pb-4">
        <h1 className="text-3xl font-bold text-white">Help & Documentation</h1>
        <p className="text-gray-400 mt-2">Learn how to use the PW Battle Simulator</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Getting Started */}
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-white">Getting Started</h2>
          </div>
          <div className="space-y-3 text-sm text-gray-300">
            <div>
              <h3 className="font-medium text-white mb-1">1. Account Verification</h3>
              <p className="text-gray-400">Link your Politics & War nation to unlock full features</p>
            </div>
            <div>
              <h3 className="font-medium text-white mb-1">2. Battle Simulation</h3>
              <p className="text-gray-400">Test different military strategies and scenarios</p>
            </div>
            <div>
              <h3 className="font-medium text-white mb-1">3. Analysis Tools</h3>
              <p className="text-gray-400">Review battle outcomes and optimize your approach</p>
            </div>
          </div>
        </div>

        {/* Battle Simulator */}
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center mr-3">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-white">Battle Simulator</h2>
          </div>
          <div className="space-y-3 text-sm text-gray-300">
            <div>
              <h3 className="font-medium text-white mb-1">Military Units</h3>
              <p className="text-gray-400">Soldiers, tanks, aircraft, ships - each with unique strengths</p>
            </div>
            <div>
              <h3 className="font-medium text-white mb-1">Battle Mechanics</h3>
              <p className="text-gray-400">Based on official Politics & War combat formulas</p>
            </div>
            <div>
              <h3 className="font-medium text-white mb-1">Strategy Testing</h3>
              <p className="text-gray-400">Compare different unit compositions and tactics</p>
            </div>
          </div>
        </div>

        {/* API Integration */}
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center mr-3">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-white">API Integration</h2>
          </div>
          <div className="space-y-3 text-sm text-gray-300">
            <div>
              <h3 className="font-medium text-white mb-1">Live Data</h3>
              <p className="text-gray-400">Real-time nation and alliance information from P&W</p>
            </div>
            <div>
              <h3 className="font-medium text-white mb-1">Auto-Import</h3>
              <p className="text-gray-400">Automatically load your nation&apos;s military stats</p>
            </div>
            <div>
              <h3 className="font-medium text-white mb-1">Verification</h3>
              <p className="text-gray-400">Secure verification process using P&W&apos;s GraphQL API</p>
            </div>
          </div>
        </div>

        {/* Support */}
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center mr-3">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-white">Need Help?</h2>
          </div>
          <div className="space-y-3 text-sm text-gray-300">
            <div>
              <h3 className="font-medium text-white mb-1">Discord Support</h3>
              <p className="text-gray-400">Join our community server for live help</p>
            </div>
            <div>
              <h3 className="font-medium text-white mb-1">Bug Reports</h3>
              <p className="text-gray-400">Report issues on our GitHub repository</p>
            </div>
            <div>
              <h3 className="font-medium text-white mb-1">Feature Requests</h3>
              <p className="text-gray-400">Suggest new features and improvements</p>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Frequently Asked Questions</h2>
        <div className="space-y-4">
          <div>
            <h3 className="font-medium text-white mb-2">Is this simulator accurate?</h3>
            <p className="text-sm text-gray-400">
              The simulator uses the same combat formulas as Politics & War, providing highly accurate battle predictions.
            </p>
          </div>
          <div>
            <h3 className="font-medium text-white mb-2">Do I need to verify my nation?</h3>
            <p className="text-sm text-gray-400">
              Verification is optional but recommended. It allows auto-import of your military stats and unlocks additional features.
            </p>
          </div>
          <div>
            <h3 className="font-medium text-white mb-2">Is my data safe?</h3>
            <p className="text-sm text-gray-400">
              We only store the minimum necessary data and never store sensitive information like passwords or API keys locally.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
