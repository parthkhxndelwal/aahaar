import { DefaultSession, User } from 'next-auth';
import { JWT } from 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: string;
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
    } & DefaultSession['user'];
  }

  interface User {
    role?: string;
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
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string;
    role?: string;
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
}
