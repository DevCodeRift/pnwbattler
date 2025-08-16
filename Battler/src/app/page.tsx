import AuthButton from '../components/AuthButton';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-900 to-purple-900 text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header with Auth */}
        <div className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              PW Battle Simulator
            </h1>
            <p className="text-xl text-gray-300">
              Multiplayer battle simulation for Politics and War
            </p>
          </div>
          <AuthButton />
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Quick Battle Card */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20 hover:bg-white/15 transition-all">
            <h2 className="text-2xl font-semibold mb-4 text-blue-300">Quick Battle</h2>
            <p className="text-gray-300 mb-4">
              Jump into a battle simulation with default settings
            </p>
            <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded transition-colors">
              Start Quick Battle
            </button>
          </div>

          {/* Create Match Card */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20 hover:bg-white/15 transition-all">
            <h2 className="text-2xl font-semibold mb-4 text-purple-300">Create Match</h2>
            <p className="text-gray-300 mb-4">
              Create a custom battle with your preferred settings
            </p>
            <button className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded transition-colors">
              Create Match
            </button>
          </div>

          {/* Join Match Card */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20 hover:bg-white/15 transition-all">
            <h2 className="text-2xl font-semibold mb-4 text-green-300">Join Match</h2>
            <p className="text-gray-300 mb-4">
              Join an existing public or private match
            </p>
            <button className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded transition-colors">
              Browse Matches
            </button>
          </div>
        </div>

        {/* Features Section */}
        <div className="mt-16 max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">Features</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
              <h3 className="text-xl font-semibold mb-3 text-blue-300">Politics & War Integration</h3>
              <p className="text-gray-300">
                Link your Politics & War account to import your nation's stats, cities, and military units for authentic battles.
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
              <h3 className="text-xl font-semibold mb-3 text-purple-300">Custom Builds</h3>
              <p className="text-gray-300">
                Create custom nation builds with your preferred city layouts, military compositions, and resource allocations.
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
              <h3 className="text-xl font-semibold mb-3 text-green-300">Real-time Battles</h3>
              <p className="text-gray-300">
                Engage in turn-based battles with action points, realistic damage calculations, and strategic depth.
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
              <h3 className="text-xl font-semibold mb-3 text-yellow-300">Multiplayer Matches</h3>
              <p className="text-gray-300">
                Host private tournaments or join public matches. Battle other players in various game modes and scenarios.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
