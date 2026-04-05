import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { authConfig } from './auth.config';

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        // For OTP-based login, we pass these special fields
        userId: { label: 'User ID', type: 'text' },
        fullName: { label: 'Full Name', type: 'text' },
        role: { label: 'Role', type: 'text' },
        courtId: { label: 'Court ID', type: 'text' },
        isOtpLogin: { label: 'OTP Login', type: 'boolean' },
      },
      async authorize(credentials) {
        console.log("🔐 NextAuth authorize called with:", credentials)
        
        // Handle OTP-based login (when user has already been verified via OTP)
        if (credentials.isOtpLogin === 'true' && credentials.userId && credentials.role) {
          console.log("🔐 OTP login path, returning user:", {
            id: credentials.userId,
            email: credentials.email,
            name: credentials.fullName,
            role: credentials.role,
            courtId: credentials.courtId,
          })
          return {
            id: credentials.userId as string,
            email: credentials.email as string,
            name: credentials.fullName as string,
            role: credentials.role as string,
            courtId: credentials.courtId as string,
          };
        }

        // Handle password-based login
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

        try {
          const response = await fetch(`${baseUrl}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
              loginType: 'password',
            }),
          });

          const data = await response.json();

          if (data.success && data.data?.user && data.data?.token) {
            const user = data.data.user;
            return {
              id: user.id,
              email: user.email,
              name: user.fullName,
              role: user.role,
              courtId: user.courtId,
              court: user.court,
              vendorProfile: user.vendorProfile,
            };
          }

          return null;
        } catch (error) {
          console.error('NextAuth authorize error:', error);
          return null;
        }
      },
    }),
  ],
});