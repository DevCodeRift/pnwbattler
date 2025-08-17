'use client';

import { usePathname } from 'next/navigation';
import Header from './Header';
import Sidebar from './Sidebar';

interface LayoutWrapperProps {
  children: React.ReactNode;
}

export default function LayoutWrapper({ children }: LayoutWrapperProps) {
  const pathname = usePathname();
  
  // Hide header and sidebar on login and verification pages
  const hideNavigation = pathname === '/login' || pathname === '/verify';
  
  if (hideNavigation) {
    return (
      <main className="min-h-screen bg-gray-900">
        {children}
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 min-h-screen bg-gray-800">
          {children}
        </main>
      </div>
    </div>
  );
}
