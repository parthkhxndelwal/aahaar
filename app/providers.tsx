'use client';

import { SessionProvider } from 'next-auth/react';
import { AuthContextProvider } from '@/contexts/unified-auth-context';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AuthContextProvider>{children}</AuthContextProvider>
    </SessionProvider>
  );
}
