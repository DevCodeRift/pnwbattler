'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import AuthButton from './AuthButton';
import { useUIStore } from '../stores';

export default function Header() {
  const { data: session } = useSession();
  const { setSidebarOpen, sidebarOpen } = useUIStore();

  return (
    <header className="bg-gray-900 border-b border-gray-700 px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {/* Menu Toggle for Mobile */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-gray-300 hover:text-white p-2 rounded-md lg:hidden"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
              <span className="text-white font-bold text-sm">PW</span>
            </div>
            <h1 className="text-xl font-bold text-white">Battle Simulator</h1>
          </div>
        </div>

        {/* Top Navigation Links */}
        <nav className="hidden md:flex items-center space-x-6">
          <a href="#" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
            Home
          </a>
          <a href="#" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
            Battles
          </a>
          <a href="#" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
            Leaderboard
          </a>
          <a href="#" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
            Help
          </a>
        </nav>

        {/* User Section */}
        <div className="flex items-center space-x-4">
          <AuthButton />
        </div>
      </div>
    </header>
  );
}
