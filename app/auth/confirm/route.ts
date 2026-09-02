import type { EmailOtpType } from '@supabase/supabase-js';
import { redirect } from 'next/navigation';
import { safeNext } from '@/lib/auth/safe-next';
import { createSupabaseServerClient } from '@/lib/supabase/server';

// 必须包含 'email'：确认邮件模板发的正是 type=email，漏掉它会拒绝掉所有真实确认链接。
const ALLOWED_TYPES = new Set<EmailOtpType>([
  'signup',
  'invite',
  'magiclink',
  'recovery',
  'email_change',
  'email',
]);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tokenHash = searchParams.get('token_hash');
  const type = searchParams.get('type');
  const next = safeNext(searchParams.get('next'));

  if (!tokenHash || !type || !ALLOWED_TYPES.has(type as EmailOtpType)) {
    redirect('/login?notice=confirm_invalid');
  }

  const { error } = await createSupabaseServerClient().auth.verifyOtp({
    token_hash: tokenHash,
    type: type as EmailOtpType,
  });

  if (error) {
    console.error('[AUTH_CONFIRM_ERROR]', error.message);
    redirect('/login?notice=confirm_expired');
  }

  redirect(next);
}
