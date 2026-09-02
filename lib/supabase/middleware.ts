import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import type { Database } from '@/types/supabase';

const PUBLIC_PREFIXES = ['/login', '/register', '/auth', '/api/auth/hooks'];

/**
 * `/trip/:id` stays public so template itineraries render for anonymous visitors;
 * the eventual row-level policies decide what is actually readable.
 * Exact-or-separator matching keeps `/loginfoo` and `/authorize` private.
 */
const isPublicPath = (pathname: string) =>
  pathname === '/' ||
  pathname.startsWith('/trip/') ||
  PUBLIC_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (list, headers) => {
          list.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
          // Cache-Control / Expires / Pragma. Without them a proxy may cache a
          // Set-Cookie response and hand one user's session token to another.
          Object.entries(headers).forEach(([name, value]) => response.headers.set(name, value));
        },
      },
    },
  );

  // Nothing may run between client creation and this call.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname, search } = request.nextUrl;

  if (!user && !isPublicPath(pathname)) {
    // API callers must get JSON: a redirect would be followed by fetch() and
    // surface as HTML, so the route's own 401 branch would never run.
    if (pathname.startsWith('/api/')) {
      const denied = NextResponse.json({ error: '请先登录后使用' }, { status: 401 });
      response.cookies.getAll().forEach((cookie) => denied.cookies.set(cookie));
      return denied;
    }

    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.search = '';
    url.searchParams.set('next', `${pathname}${search}`);

    const redirect = NextResponse.redirect(url);
    // Both early returns must carry the refreshed cookies, or the new token is
    // lost on this request and the browser keeps replaying the stale one.
    response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
    return redirect;
  }

  return response;
}
