import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/types/supabase';

/**
 * Per-request server client. Next 14's `cookies()` is synchronous — do not await it.
 *
 * Must be called afresh on every request; caching the returned client in a module
 * variable shares one user's session across concurrent requests.
 */
export function createSupabaseServerClient() {
  const cookieStore = cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (list) => {
          try {
            list.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch (cause) {
            // Server Component 写不了 cookie，由 middleware 刷新，属预期。但同一个 client
            // 也跑在 Route Handler 和 Server Action 里，那两处写的是刚换出来的新会话，
            // middleware 无从代劳——失败即「确认成功却没登上」且毫无痕迹。两者在这里无法
            // 区分，所以至少留一行。
            console.warn('[AUTH_COOKIE_WRITE_SKIPPED]', cause);
          }
        },
      },
    },
  );
}
