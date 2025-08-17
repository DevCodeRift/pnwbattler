'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useUIStore, useAuthStore } from '../stores';

export default function Sidebar() {
  const { data: session } = useSession();
  const { sidebarOpen, setSidebarOpen } = useUIStore();
  const { pwNation, isVerified } = useAuthStore();

  const menuItems = [
    { name: 'Home', href: '/', icon: '🏠', category: 'main' },
    { name: 'Quick Battle', href: '/battle/quick', icon: '⚔️', category: 'battle' },
    { name: 'Create Match', href: '/battle/create', icon: '🛠️', category: 'battle' },
    { name: 'Real Nation Battle', href: '/battle/real', icon: '🌍', category: 'battle' },
    { name: 'Join Match', href: '/battle/join', icon: '🎯', category: 'battle' },
    { name: 'My Battles', href: '/battles', icon: '📊', category: 'battle' },
    { name: 'Nation Setup', href: '/nation', icon: '🏛️', category: 'nation', requiresAuth: true },
    { name: 'Verify Account', href: '/verify', icon: '✅', category: 'nation', requiresAuth: true, hideIfVerified: true },
    { name: 'Leaderboard', href: '/leaderboard', icon: '🏆', category: 'community' },
    { name: 'Statistics', href: '/stats', icon: '📈', category: 'community' },
    { name: 'Help & Guide', href: '/help', icon: '❓', category: 'other' },
    { name: 'Settings', href: '/settings', icon: '⚙️', category: 'other', requiresAuth: true },
  ];

  const categories = [
    { key: 'main', name: 'Main' },
    { key: 'battle', name: 'Battle' },
    { key: 'nation', name: 'Nation' },
    { key: 'community', name: 'Community' },
    { key: 'other', name: 'Other' },
  ];

  const filteredItems = menuItems.filter(item => {
    if (item.requiresAuth && !session) return false;
    if (item.hideIfVerified && isVerified) return false;
    return true;
  });

  return (
    <>
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50 w-64 bg-gray-900 border-r border-gray-700 transform
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        transition-transform duration-300 ease-in-out
      `}>
        <div className="h-full flex flex-col">
          {/* User Info Panel */}
          {session && (
            <div className="p-4 border-b border-gray-700 bg-gray-800">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">
                    {session.user?.name?.charAt(0) || 'U'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {session.user?.name}
                  </p>
                  {pwNation ? (
                    <p className="text-xs text-green-400 truncate">
                      {pwNation.nation_name}
                    </p>
                  ) : (
                    <p className="text-xs text-yellow-400">
                      {isVerified ? 'Nation not linked' : 'Not verified'}
                    </p>
                  )}
                </div>
              </div>
              
              {/* Quick Stats */}
              {pwNation && (
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-gray-700 rounded px-2 py-1">
                    <span className="text-gray-400">Score:</span>
                    <span className="text-white ml-1">{pwNation.score.toLocaleString()}</span>
                  </div>
                  <div className="bg-gray-700 rounded px-2 py-1">
                    <span className="text-gray-400">Cities:</span>
                    <span className="text-white ml-1">{pwNation.cities.length}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Navigation Menu */}
          <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
            {categories.map(category => {
              const categoryItems = filteredItems.filter(item => item.category === category.key);
              if (categoryItems.length === 0) return null;

              return (
                <div key={category.key} className="mb-6">
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    {category.name}
                  </h3>
                  {categoryItems.map(item => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className="group flex items-center px-3 py-2 text-sm font-medium text-gray-300 rounded-md hover:bg-gray-800 hover:text-white transition-colors"
                    >
                      <span className="mr-3 text-lg">{item.icon}</span>
                      {item.name}
                      {item.name === 'Verify Account' && !isVerified && (
                        <span className="ml-auto w-2 h-2 bg-red-500 rounded-full"></span>
                      )}
                    </Link>
                  ))}
                </div>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-700">
            <p className="text-xs text-gray-400 text-center">
              PW Battle Simulator v1.0
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
