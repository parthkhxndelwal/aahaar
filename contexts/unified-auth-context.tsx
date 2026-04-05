'use client';

import { createContext, useContext, useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signOut as nextAuthSignOut, signIn } from 'next-auth/react';

interface AuthUser {
  id: string;
  email?: string;
  phone?: string;
  fullName: string;
  role: 'admin' | 'vendor' | 'user';
  courtId?: string;
  court?: {
    courtId: string;
    instituteName: string;
  } | null;
  vendorProfile?: {
    id: string;
    stallName: string;
    stallLocation?: string;
    isOnline: boolean;
  } | null;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  login: (token: string, user: AuthUser) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
  loading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthContextProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const login = useCallback(async (token: string, user: AuthUser) => {
    console.log("🎯 login() called with:", { token: token?.substring(0, 20) + "...", user })
    
    try {
      // Use NextAuth signIn with special OTP login parameters
      // This will create a proper session
      const result = await signIn('credentials', {
        userId: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        courtId: user.courtId,
        isOtpLogin: 'true',
        redirect: false,
      });

      console.log("🎯 signIn result:", result)

      if (result?.ok) {
        console.log("🎯 Session created successfully!")
        
        // Force a session update to sync NextAuth state with React
        await update()
        
        // Use router navigation with a small delay to ensure cookies are set
        const targetUrl = `/app/${user.courtId}`
        console.log("🎯 Navigating to:", targetUrl)
        
        // Small delay to ensure session cookie is properly set by browser
        await new Promise(resolve => setTimeout(resolve, 100))
        
        // Use window.location for a clean navigation that ensures fresh session
        window.location.href = targetUrl
      } else {
        console.error("🎯 signIn failed:", result?.error)
      }
    } catch (error) {
      console.error("🎯 Login error:", error)
    }
  }, [update]);

  const logout = useCallback(async () => {
    await nextAuthSignOut({ redirect: false });
    router.push('/');
  }, [router]);

  const refreshUser = useCallback(async () => {
    await update();
  }, [update]);

  // Determine user and token from session
  const s = session?.user;
  let user: AuthUser | null = null;
  let token: string | null = null;

  if (s) {
    user = {
      id: s.id,
      email: s.email || undefined,
      fullName: s.name || '',
      role: s.role as 'admin' | 'vendor' | 'user',
      courtId: s.courtId,
      court: s.court || null,
      vendorProfile: s.vendorProfile || null,
    };
    token = session ? 'nextauth-session' : null;
  }

  const value: AuthContextType = {
    user,
    token,
    login,
    logout,
    refreshUser,
    loading: status === 'loading',
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useUnifiedAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useUnifiedAuth must be used within an AuthContextProvider');
  }
  return context;
}
