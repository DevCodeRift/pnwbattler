'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useAuthStore } from '../stores';

interface DashboardNavProps {
  currentView: string;
  onViewChange: (view: string) => void;
}

export default function DashboardNav({ currentView, onViewChange }: DashboardNavProps) {
  const { data: session } = useSession();
  const { pwNation, logout } = useAuthStore();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const navItems = [
    { id: 'overview', label: '🏠 Overview', icon: '🏠' },
    { id: 'military', label: '⚔️ Military', icon: '⚔️' },
    { id: 'economy', label: '💰 Economy', icon: '💰' },
    { id: 'alliance', label: '🤝 Alliance', icon: '🤝' },
    { id: 'wars', label: '🔥 Wars', icon: '🔥' },
    { id: 'games', label: '🎮 My Games', icon: '🎮' },
  ];

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/login' });
    logout();
  };

  return (
    <nav className="bg-gray-800 border-b border-gray-700 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Title */}
          <div className="flex items-center space-x-4">
            <Link href="/dashboard" className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">PW</span>
              </div>
              <h1 className="text-xl font-bold text-white hidden md:block">
                {pwNation?.nation_name || 'Dashboard'}
              </h1>
            </Link>
          </div>

          {/* Navigation Items */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  currentView === item.id
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:text-white hover:bg-gray-700'
                }`}
              >
                <span className="mr-2">{item.icon}</span>
                <span className="hidden lg:inline">{item.label.split(' ')[1]}</span>
              </button>
            ))}
          </div>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-3 text-gray-300 hover:text-white bg-gray-700 rounded-lg px-3 py-2"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">
                  {session?.user?.name?.[0]?.toUpperCase() || 'U'}
                </span>
              </div>
              <div className="hidden md:block text-left">
                <div className="text-sm font-medium">{session?.user?.name}</div>
                <div className="text-xs text-gray-400">{pwNation?.leader_name}</div>
              </div>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Dropdown Menu */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-20">
                <div className="p-3 border-b border-gray-700">
                  <div className="text-sm font-medium text-white">{session?.user?.name}</div>
                  <div className="text-xs text-gray-400">{session?.user?.email}</div>
                </div>
                
                <div className="py-1">
                  <Link
                    href="/settings"
                    className="flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
                  >
                    <span className="mr-3">⚙️</span>
                    Settings
                  </Link>
                  <Link
                    href="/verify"
                    className="flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
                  >
                    <span className="mr-3">🔗</span>
                    Re-link Nation
                  </Link>
                  <Link
                    href="/battle/real"
                    className="flex items-center px-4 py-2 text-sm text-green-400 hover:bg-gray-700 hover:text-green-300"
                  >
                    <span className="mr-3">🎯</span>
                    Enter Battler
                  </Link>
                  <hr className="my-1 border-gray-700" />
                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full px-4 py-2 text-sm text-red-400 hover:bg-gray-700 hover:text-red-300"
                  >
                    <span className="mr-3">🚪</span>
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="text-gray-300 hover:text-white p-2"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {showUserMenu && (
          <div className="md:hidden pb-4">
            <div className="grid grid-cols-2 gap-2">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    onViewChange(item.id);
                    setShowUserMenu(false);
                  }}
                  className={`p-3 rounded-lg text-sm font-medium transition-colors ${
                    currentView === item.id
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:text-white hover:bg-gray-700'
                  }`}
                >
                  <div className="text-lg mb-1">{item.icon}</div>
                  <div>{item.label.split(' ')[1]}</div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
