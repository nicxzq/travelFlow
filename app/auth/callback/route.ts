import { redirect } from 'next/navigation';
import { safeNext } from '@/lib/auth/safe-next';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const next = safeNext(searchParams.get('next'));

  if (!code) {
    redirect('/login?notice=callback_invalid');
  }

  const { error } = await createSupabaseServerClient().auth.exchangeCodeForSession(code);

  if (error) {
    console.error('[AUTH_CALLBACK_ERROR]', error.message);
    redirect('/login?notice=callback_expired');
  }

  redirect(next);
}
