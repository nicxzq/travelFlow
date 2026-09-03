import type { EmailOtpType } from '@supabase/supabase-js';
import { redirect } from 'next/navigation';
import type { AuthNoticeCode } from '@/lib/auth/messages';
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

/**
 * 确认邮件的回跳有两种形态，两种都得收：
 *
 * - `token_hash` + `type`：邮件模板显式用 {{ .TokenHash }} 时的形态。verifyOtp 不依赖
 *   本地状态，电脑上注册、手机上点确认链接也能成功。
 * - `code`：Supabase **默认**模板的形态。链接先打 /auth/v1/verify，邮箱在那一步就已经
 *   确认掉了，之后才带 ?code= 转发过来。只认 token_hash 会把一次成功的确认显示成失败。
 *   代价是 exchangeCodeForSession 要读注册时那个浏览器写下的 PKCE verifier cookie，
 *   换设备打开必然失败——所以 token_hash 模板仍是更优解。
 *
 * 两者同时存在时固定走 token_hash，行为确定；失败也不再回退去消耗 code。
 * 两条路的失败含义不同，各自带走自己的提示码。
 */
function exchangeConfirmation(params: URLSearchParams) {
  const tokenHash = params.get('token_hash');
  const type = params.get('type') as EmailOtpType | null;
  const code = params.get('code');

  if (tokenHash && type && ALLOWED_TYPES.has(type)) {
    return {
      settled: createSupabaseServerClient().auth.verifyOtp({ token_hash: tokenHash, type }),
      failureNotice: 'confirm_expired' satisfies AuthNoticeCode,
    };
  }

  if (code) {
    return {
      settled: createSupabaseServerClient().auth.exchangeCodeForSession(code),
      failureNotice: 'confirm_needs_login' satisfies AuthNoticeCode,
    };
  }

  return null;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const pending = exchangeConfirmation(searchParams);

  if (!pending) {
    redirect('/login?notice=confirm_invalid');
  }

  const { error } = await pending.settled;

  if (error) {
    console.error('[AUTH_CONFIRM_ERROR]', error.message);
    redirect(`/login?notice=${pending.failureNotice}`);
  }

  redirect(safeNext(searchParams.get('next')));
}
