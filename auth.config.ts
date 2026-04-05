import type { NextAuthConfig } from 'next-auth';

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: '/auth/login',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60,
  },
  secret: process.env.AUTH_SECRET || process.env.JWT_SECRET,
  callbacks: {
    // JWT callback to persist role in token (needed for middleware)
    async jwt({ token, user }) {
      if (user) {
        const u = user as any;
        token.id = user.id;
        token.role = u.role;
        token.courtId = u.courtId;
        token.court = u.court;
        token.vendorProfile = u.vendorProfile;
      }
      return token;
    },
    // Session callback to expose role to client
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.courtId = token.courtId as string | undefined;
        session.user.court = token.court as any;
        session.user.vendorProfile = token.vendorProfile as any;
      }
      return session;
    },
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const pathname = request.nextUrl.pathname;
      const isAuthPage = pathname.startsWith('/auth');
      
      // Customer app login page should be accessible without auth
      const isCustomerLoginPage = pathname.match(/^\/app\/[^/]+\/login$/);

      // Allow auth pages - login page handles its own redirect for authenticated users
      if (isAuthPage || isCustomerLoginPage) {
        return true;
      }

      const isAdminRoute = pathname.startsWith('/admin');
      const isVendorRoute = pathname.startsWith('/vendor');
      // /app/[courtId] routes require auth, but /app alone might be a landing
      // Also exclude /app/auth/* routes (like QR scan page)
      const isAppPublicRoute = pathname.startsWith('/app/auth');
      const isAppProtectedRoute = pathname.match(/^\/app\/[^/]+/) && !isAppPublicRoute;

      // Require login for protected routes
      if (!isLoggedIn && (isAdminRoute || isVendorRoute || isAppProtectedRoute)) {
        // For customer app routes, redirect to the court-specific login page
        if (isAppProtectedRoute) {
          const courtIdMatch = pathname.match(/^\/app\/([^/]+)/);
          if (courtIdMatch) {
            const courtId = courtIdMatch[1];
            return Response.redirect(new URL(`/app/${courtId}/login`, request.nextUrl));
          }
        }
        return false; // Will redirect to signIn page
      }

      // Role-based access control for logged-in users
      if (isLoggedIn) {
        const role = (auth.user as any)?.role;
        
        if (isAdminRoute && role !== 'admin') {
          return Response.redirect(new URL('/auth/login?error=unauthorized', request.nextUrl));
        }
        if (isVendorRoute && role !== 'vendor') {
          return Response.redirect(new URL('/auth/login?error=unauthorized', request.nextUrl));
        }
      }

      return true;
    },
  },
  providers: [],
};
