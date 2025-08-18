'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useAuthStore } from '../stores';

export function useVerificationCheck() {
  const { data: session, status } = useSession();
  const { setVerified, setPWNation, isVerified } = useAuthStore();

  useEffect(() => {
    // Don't check if still loading or no session
    if (status === 'loading' || !session) return;
    
    // Don't check if already verified
    if (isVerified) return;

    const checkVerificationStatus = async () => {
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
            // Clear verification if not verified in database
            // This ensures localStorage doesn't override database truth
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
        // This preserves user state during temporary connectivity issues
      }
    };

    checkVerificationStatus();
  }, [session, status, isVerified, setVerified, setPWNation]);
}
