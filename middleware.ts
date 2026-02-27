import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check if the request is for a protected app route
  if (pathname.startsWith('/app/') && !pathname.includes('/login')) {
    // Extract court ID from the path
    const pathParts = pathname.split('/')
    const courtId = pathParts[2]
    
    // Skip if it's already a login page or if no courtId
    if (!courtId || pathname.includes('/login')) {
      return NextResponse.next()
    }

    // Check for authentication token in cookies (app-specific)
    const token = request.cookies.get('app-auth-token')?.value
    
    console.log(`🔍 [Middleware] Checking app route ${pathname}:`, {
      hasToken: !!token,
      tokenLength: token?.length || 0,
      courtId,
      cookies: request.cookies.getAll().map(c => c.name)
    })
    
    if (!token) {
      console.log(`🚪 [Middleware] No app token found, redirecting to login`)
      // Redirect to login with return URL
      const loginUrl = new URL(`/app/${courtId}/login`, request.url)
      loginUrl.searchParams.set('returnTo', pathname)
      return NextResponse.redirect(loginUrl)
    } else {
      console.log(`✅ [Middleware] App token found, allowing access to ${pathname}`)
    }
  }

  // Check if the request is for a protected vendor route
  if (pathname.startsWith('/vendor/') && !pathname.includes('/login')) {
    // Extract court ID from the path (if it exists)
    const pathParts = pathname.split('/')
    const courtId = pathParts[2]
    
    // Skip if it's already a login page
    if (pathname.includes('/login')) {
      return NextResponse.next()
    }

    // Check for vendor authentication token in cookies
    const vendorToken = request.cookies.get('vendor-auth-token')?.value
    
    console.log(`🔍 [Middleware] Checking vendor route ${pathname}:`, {
      hasVendorToken: !!vendorToken,
      tokenLength: vendorToken?.length || 0,
      courtId,
      cookies: request.cookies.getAll().map(c => c.name)
    })
    
    if (!vendorToken) {
      console.log(`🚪 [Middleware] No vendor token found, redirecting to vendor login`)
      // Redirect to vendor login
      const loginUrl = new URL('/vendor/login', request.url)
      return NextResponse.redirect(loginUrl)
    } else {
      console.log(`✅ [Middleware] Vendor token found, allowing access to ${pathname}`)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
}
