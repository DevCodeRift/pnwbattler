'use client';

import { useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useAuthStore } from '../stores';

export function useVerificationCheck() {
  const { data: session, status } = useSession();
  const { setVerified, setPWNation, isVerified } = useAuthStore();
  const hasCheckedRef = useRef(false);
  const isCheckingRef = useRef(false);
  const lastCheckTimeRef = useRef(0);
  const COOLDOWN_MS = 5000; // 5 second cooldown between checks

  useEffect(() => {
    // Don't check if still loading, no session, already verified, or already checking
    if (status === 'loading' || !session || isVerified || hasCheckedRef.current || isCheckingRef.current) {
      return;
    }

    // Check cooldown period
    const now = Date.now();
    if (now - lastCheckTimeRef.current < COOLDOWN_MS) {
      console.log('useVerificationCheck: Skipping check due to cooldown');
      return;
    }

    const checkVerificationStatus = async () => {
      if (isCheckingRef.current) return;
      
      isCheckingRef.current = true;
      hasCheckedRef.current = true;
      lastCheckTimeRef.current = Date.now();

      try {
        console.log('useVerificationCheck: Starting verification status check');
        
        const response = await fetch('/api/verify', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        console.log('useVerificationCheck: Response status:', response.status);

        if (response.ok) {
          const data = await response.json();
          console.log('useVerificationCheck: Response data:', data);
          
          if (data.verified && data.nation) {
            console.log('useVerificationCheck: User is verified, updating store');
            setVerified(true);
            setPWNation(data.nation);
          } else if (!data.verified) {
            console.log('useVerificationCheck: User not verified, clearing store');
            setVerified(false);
            setPWNation(null);
          }
        } else {
          // Handle error responses gracefully
          const errorData = await response.json().catch(() => ({}));
          console.warn('useVerificationCheck: API error:', response.status, errorData);
          
          // Don't clear verification status on server errors (500)
          // Only clear if it's a client error (4xx) indicating invalid auth
          if (response.status >= 400 && response.status < 500) {
            console.log('useVerificationCheck: Client error, clearing verification');
            setVerified(false);
            setPWNation(null);
          }
        }
      } catch (error) {
        console.error('useVerificationCheck: Network or unexpected error:', error);
        // Don't clear verification status on network errors
      } finally {
        isCheckingRef.current = false;
      }
    };

    // Add a small delay to prevent immediate API calls on every render
    const timeoutId = setTimeout(checkVerificationStatus, 1000); // Increased delay
    
    return () => {
      clearTimeout(timeoutId);
    };
  }, [session, status, isVerified]); // REMOVED setVerified and setPWNation from dependencies!

  // Reset hasChecked when session changes (user logs out/in)
  useEffect(() => {
    if (status !== 'loading') {
      hasCheckedRef.current = false;
    }
  }, [(session?.user as any)?.discordId, status]); // Use Discord ID for stable reference
}
