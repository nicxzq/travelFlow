import { cache } from 'react';
import { createSupabaseServerClient } from '@/lib/supabase/server';

/**
 * Deduplicated per request. Always `getUser()`, which verifies the token with
 * the auth server; reading the session off the cookie only deserialises
 * client-controlled data and is not an authorization basis.
 */
export const getCurrentUser = cache(async () => {
  const { data, error } = await createSupabaseServerClient().auth.getUser();

  // 不区分「未登录」与「Supabase 不可达」会让后者变成静默全站登出，
  // 服务端日志里连一行线索都没有。
  if (error && error.name !== 'AuthSessionMissingError') {
    console.error('[AUTH_GETUSER_ERROR]', error.message);
  }

  return data.user;
});

export async function requireUser() {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error('UNAUTHENTICATED');
  }

  return user;
}
