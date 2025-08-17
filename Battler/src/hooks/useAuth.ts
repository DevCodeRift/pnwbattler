'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../stores';

/**
 * Custom hook to handle authentication redirects for protected routes
 * Redirects to login if not authenticated, or to verify if not verified
 */
export function useAuthRedirect() {
  const { data: session, status } = useSession();
  const { isVerified, pwNation } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    // Wait for session to load
    if (status === 'loading') return;

    // Redirect to login if not authenticated
    if (!session) {
      router.push('/login');
      return;
    }

    // Redirect to verify if authenticated but not verified
    if (!isVerified || !pwNation) {
      router.push('/verify');
      return;
    }
  }, [session, status, isVerified, pwNation, router]);

  // Return authentication state
  return {
    isAuthenticated: !!session,
    isVerified: isVerified && !!pwNation,
    isLoading: status === 'loading',
    session,
    pwNation
  };
}
