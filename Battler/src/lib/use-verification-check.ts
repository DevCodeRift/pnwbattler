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
        const response = await fetch('/api/verify', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          
          if (data.verified && data.nation) {
            setVerified(true);
            setPWNation(data.nation);
          } else if (!data.verified) {
            // Clear verification if not verified in database
            // This ensures localStorage doesn't override database truth
            setVerified(false);
            setPWNation(null);
          }
        }
      } catch (error) {
        console.error('Error checking verification status:', error);
      }
    };

    checkVerificationStatus();
  }, [session, status, isVerified, setVerified, setPWNation]);
}
