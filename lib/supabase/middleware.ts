import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import type { Database } from '@/types/supabase';

const PUBLIC_PREFIXES = ['/login', '/register', '/auth', '/api/auth/hooks'];

// @supabase/ssr 随 setAll 传来的禁缓存头，也是唯一需要在响应之间结转的头。
const NO_STORE_HEADERS = ['cache-control', 'expires', 'pragma'];

function copyNoStoreHeaders(from: NextResponse, to: NextResponse) {
  NO_STORE_HEADERS.forEach((name) => {
    const value = from.headers.get(name);
    if (value) to.headers.set(name, value);
  });
}

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

          // 重建响应是为了让下游渲染看到更新后的 request cookie，但新对象是空的，
          // 必须把上一次 setAll 写过的 cookie 与 header 结转过来，否则多次调用
          // 写入不相交的 cookie 集合时，先写的那批 Set-Cookie 会被静默丢弃。
          const refreshed = NextResponse.next({ request });
          response.cookies.getAll().forEach((cookie) => refreshed.cookies.set(cookie));
          copyNoStoreHeaders(response, refreshed);

          list.forEach(({ name, value, options }) => refreshed.cookies.set(name, value, options));
          // Cache-Control / Expires / Pragma。缺了它们，反代可能缓存住带
          // Set-Cookie 的响应，把一个用户的 session token 发给另一个用户。
          Object.entries(headers).forEach(([name, value]) => refreshed.headers.set(name, value));

          response = refreshed;
        },
      },
    },
  );

  // Nothing may run between client creation and this call.
  const { data, error } = await supabase.auth.getUser();

  const user = data.user;
  if (error && error.name !== 'AuthSessionMissingError') {
    console.error('[AUTH_MIDDLEWARE_GETUSER_ERROR]', error.message);
  }

  const { pathname, search } = request.nextUrl;

  // 提前返回的响应必须同时带走刷新后的 cookie 和禁缓存 header：只搬 cookie 的话，
  // 「本次刚刷新了 token、同时又判定未登录」的那一次响应会带着 Set-Cookie 却没有
  // no-store，正是 @supabase/ssr 明文警告的可被 CDN 缓存的形态。
  //
  // 只搬白名单里的头。整体复制会把 NextResponse.next() 的内部头 `x-middleware-next`
  // 一起带过去，Next 见到它就放行到路由，401 会被完全忽略。
  const carryOver = <T extends NextResponse>(target: T) => {
    response.cookies.getAll().forEach((cookie) => target.cookies.set(cookie));
    copyNoStoreHeaders(response, target);
    return target;
  };

  if (!user && !isPublicPath(pathname)) {
    // API callers must get JSON: a redirect would be followed by fetch() and
    // surface as HTML, so the route's own 401 branch would never run.
    if (pathname.startsWith('/api/')) {
      return carryOver(NextResponse.json({ error: '请先登录后使用' }, { status: 401 }));
    }

    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.search = '';
    url.searchParams.set('next', `${pathname}${search}`);

    return carryOver(NextResponse.redirect(url));
  }

  return response;
}
