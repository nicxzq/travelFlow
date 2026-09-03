import type { EmailOtpType } from '@supabase/supabase-js';
import type { AuthNoticeCode } from '@/lib/auth/messages';
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

const LINK_ERROR_NOTICES: Record<string, AuthNoticeCode> = {
  otp_expired: 'confirm_expired',
};

export type ConfirmCredentials =
  | { kind: 'token_hash'; tokenHash: string; type: EmailOtpType }
  | { kind: 'code'; code: string };

export type ConfirmOutcome = { ok: true } | { ok: false; notice: AuthNoticeCode };

/**
 * GoTrue 自己判定失败时不会带凭证回来，而是回 `?error=...&error_code=...`。
 * 不读这两个参数的话，重复点击一个已消费的链接会被归类成「链接无效」而不是「已失效」。
 *
 * 查表必须用 hasOwn：`?error_code=constructor` 用下标取会拿到 Object 构造函数，
 * 这个仓库在 resolveAuthNotice 上已经栽过一次同样的跟头。
 */
export function readLinkError(params: URLSearchParams): AuthNoticeCode | null {
  const code = params.get('error_code');

  if (!code && !params.get('error')) return null;

  return code && Object.hasOwn(LINK_ERROR_NOTICES, code) ? LINK_ERROR_NOTICES[code] : 'confirm_invalid';
}

/**
 * 确认邮件的回跳有两种形态：
 *
 * - `token_hash` + `type`：邮件模板显式用 {{ .TokenHash }} 时的形态。verifyOtp 不依赖
 *   本地状态，电脑上注册、手机上点确认链接也能成功。
 * - `code`：Supabase **默认**模板的形态。链接先打 /auth/v1/verify，邮箱在那一步就已经
 *   确认掉了，之后才带 ?code= 转发过来。只认 token_hash 会把一次成功的确认显示成失败。
 *
 * 两者同时存在时固定走 token_hash，行为确定；失败也不回退去消耗 code。
 */
export function readCredentials(params: URLSearchParams): ConfirmCredentials | null {
  const tokenHash = params.get('token_hash');
  const type = params.get('type') as EmailOtpType | null;
  const code = params.get('code');

  if (tokenHash && type && ALLOWED_TYPES.has(type)) {
    return { kind: 'token_hash', tokenHash, type };
  }

  return code ? { kind: 'code', code } : null;
}

export async function consumeConfirmation(credentials: ConfirmCredentials): Promise<ConfirmOutcome> {
  const supabase = createSupabaseServerClient();

  try {
    const { data, error } =
      credentials.kind === 'token_hash'
        ? await supabase.auth.verifyOtp({ token_hash: credentials.tokenHash, type: credentials.type })
        : await supabase.auth.exchangeCodeForSession(credentials.code);

    if (error) {
      console.error('[AUTH_CONFIRM_ERROR]', error.code, error.message);

      // code 形态走到这里时邮箱**已经**确认过了（GoTrue 在转发之前就验完了），
      // 换不出会话多半是缺本浏览器的 PKCE verifier。此时提示「重新注册」是错误指引：
      // 对已确认的邮箱重新注册只会拿到 Supabase 的混淆响应，用户彻底卡死。
      return { ok: false, notice: credentials.kind === 'code' ? 'confirm_needs_login' : 'confirm_expired' };
    }

    // auth-js 只在 `session.access_token` 存在时才保存会话，所以 error 为 null
    // 不等于已登录。放过去会跳到受保护路径再被 middleware 弹回登录页，且一句提示都没有。
    if (!data.session) {
      return { ok: false, notice: 'confirm_needs_login' };
    }

    return { ok: true };
  } catch (cause) {
    // 响应缺 data 时 auth-js 抛的是普通 Error 而非 AuthError，它的 catch 只转换
    // AuthError，其余原样重抛。不接住就是让用户点确认信收到一个裸 500。
    console.error('[AUTH_CONFIRM_CRASH]', cause);

    return { ok: false, notice: 'confirm_failed' };
  }
}
