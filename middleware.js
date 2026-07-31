import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';

// Runs on every request to /roulette and /admin BEFORE the page renders.
// This is the real gate: it checks for a valid Supabase session (and, for
// /admin, the 'admin' role) and redirects unauthenticated / unauthorized
// visitors before any protected markup or data ever reaches the browser.
export async function middleware(request) {
  let response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name) {
          return request.cookies.get(name)?.value;
        },
        set(name, value, options) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value, ...options });
        },
        remove(name, options) {
          request.cookies.set({ name, value: '', ...options });
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  // No session at all -> both gated areas require login.
  if (!user) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', path);
    return NextResponse.redirect(loginUrl);
  }

  // Admin area additionally requires the 'admin' role.
  if (path.startsWith('/admin')) {
    const { data: profile } = await supabase
      .from('salesmen')
      .select('role')
      .eq('email', user.email)
      .single();

    if (!profile || profile.role !== 'admin') {
      return NextResponse.redirect(new URL('/roulette', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ['/roulette/:path*', '/admin/:path*'],
};
