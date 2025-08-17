'use client';

import { SessionProvider } from 'next-auth/react';
import { ApolloProvider } from '@apollo/client';
import { apolloClient } from '../lib/apollo-client';
import { Toaster } from 'react-hot-toast';
import { useVerificationCheck } from '../lib/use-verification-check';

function VerificationChecker({ children }: { children: React.ReactNode }) {
  useVerificationCheck();
  return <>{children}</>;
}

interface ProvidersProps {
  children: React.ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider>
      <ApolloProvider client={apolloClient}>
        <VerificationChecker>
          {children}
        </VerificationChecker>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#1f2937',
              color: '#fff',
              border: '1px solid #374151',
            },
          }}
        />
      </ApolloProvider>
    </SessionProvider>
  );
}
