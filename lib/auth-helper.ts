/**
 * Auth Helper
 * Provides unified authentication for API routes supporting both:
 * 1. NextAuth session cookies (new auth system)
 * 2. Legacy Bearer JWT tokens (for backward compatibility)
 */

import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import jwt from 'jsonwebtoken';
import { User } from '@/models';

const JWT_SECRET: string = process.env.JWT_SECRET as string;

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: 'admin' | 'vendor' | 'user';
  courtId?: string;
  managedCourtIds?: string[];
}

export interface AuthResult {
  success: true;
  user: AuthenticatedUser;
}

export interface AuthError {
  success: false;
  error: string;
  status: number;
}

/**
 * Authenticate a request using either NextAuth session or legacy Bearer token
 */
export async function authenticateRequest(
  request: NextRequest
): Promise<AuthResult | AuthError> {
  // First, try NextAuth session (cookie-based)
  try {
    const session = await auth();
    
    if (session?.user) {
      const user = session.user as any;
      
      // Fetch full user data from database to get managedCourtIds
      const dbUser = await User.findByPk(user.id);
      
      if (!dbUser) {
        return { success: false, error: 'User not found', status: 401 };
      }
      
      return {
        success: true,
        user: {
          id: user.id,
          email: user.email || dbUser.email,
          role: user.role || dbUser.role,
          courtId: user.courtId || dbUser.courtId,
          managedCourtIds: dbUser.managedCourtIds || [],
        },
      };
    }
  } catch (error) {
    // NextAuth session check failed, continue to try Bearer token
    console.log('NextAuth session check failed, trying Bearer token');
  }

  // Second, try legacy Bearer token
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    try {
      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, JWT_SECRET) as any;

      if (!decoded.userId) {
        return { success: false, error: 'Invalid token', status: 401 };
      }

      // Fetch user from database
      const user = await User.findByPk(decoded.userId);
      
      if (!user) {
        return { success: false, error: 'User not found', status: 401 };
      }

      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          role: user.role as 'admin' | 'vendor' | 'user',
          courtId: user.courtId,
          managedCourtIds: user.managedCourtIds || [],
        },
      };
    } catch (error) {
      return { success: false, error: 'Invalid or expired token', status: 401 };
    }
  }

  return { success: false, error: 'Authorization required', status: 401 };
}

/**
 * Require admin role
 */
export function requireAdmin(user: AuthenticatedUser): AuthError | null {
  if (user.role !== 'admin') {
    return { success: false, error: 'Admin access required', status: 403 };
  }
  return null;
}

/**
 * Require vendor role
 */
export function requireVendor(user: AuthenticatedUser): AuthError | null {
  if (user.role !== 'vendor') {
    return { success: false, error: 'Vendor access required', status: 403 };
  }
  return null;
}

/**
 * Check if user is super admin
 */
export function isSuperAdmin(user: AuthenticatedUser): boolean {
  return user.email === process.env.SUPER_ADMIN_EMAIL;
}
