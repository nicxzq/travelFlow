import { cache } from 'react';
import { createSupabaseServerClient } from '@/lib/supabase/server';

/**
 * Deduplicated per request. Always `getUser()`, which verifies the token with
 * the auth server; reading the session off the cookie only deserialises
 * client-controlled data and is not an authorization basis.
 */
export const getCurrentUser = cache(async () => {
  const {
    data: { user },
  } = await createSupabaseServerClient().auth.getUser();

  return user;
});

export async function requireUser() {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error('UNAUTHENTICATED');
  }

  return user;
}
