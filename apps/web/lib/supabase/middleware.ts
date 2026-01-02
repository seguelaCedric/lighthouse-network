import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// Recruiter/Agency routes that require authentication
const recruiterProtectedRoutes = [
  '/dashboard',
  '/candidates',
  '/briefs',
  '/settings',
  '/interviews',
  '/clients',
  '/jobs',
  '/verification',
];

// Candidate/Crew routes that require authentication
const crewProtectedRoutes = [
  '/crew/dashboard',
  '/crew/profile',
  '/crew/applications',
  '/crew/jobs',
];

// Public routes (no auth required)
const publicRoutes = [
  '/',
  '/auth',
  '/jobs',           // Public job board
  '/crew/auth',      // Crew auth pages
  '/client/auth',    // Client auth pages
  '/api/webhooks',
  '/api/public',
];

function isRecruiterProtectedRoute(pathname: string): boolean {
  return recruiterProtectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

function isCrewProtectedRoute(pathname: string): boolean {
  return crewProtectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

function isPublicRoute(pathname: string): boolean {
  return publicRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session and get user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Skip auth checks for public routes
  if (isPublicRoute(pathname)) {
    return supabaseResponse;
  }

  // Redirect unauthenticated users from recruiter routes to recruiter login
  if (!user && isRecruiterProtectedRoute(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = '/auth/login';
    url.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(url);
  }

  // Redirect unauthenticated users from crew routes to crew login
  if (!user && isCrewProtectedRoute(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = '/crew/auth/login';
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  // If user is authenticated, optionally check user_type for portal access
  // This is a lighter check - full user_type validation happens in page components
  // to avoid database queries in middleware

  return supabaseResponse;
}
