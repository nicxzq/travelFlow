'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { safeNext } from '@/lib/auth/safe-next';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export type AuthFormState = {
  message?: string;
  email?: string;
};

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === 'string' ? value.trim() : '';
}

/**
 * 确认邮件的回跳地址。取自环境变量而非请求头——`Origin` 由客户端提供，
 * 不应参与构造发往用户邮箱的链接。
 */
function siteOrigin() {
  const origin = process.env.NEXT_PUBLIC_SITE_URL;

  if (origin) return origin;

  // 这个值会被发进用户邮箱。生产漏配时静默回落 localhost 等于发出一封废信，
  // 且没有任何告警，所以只在开发环境允许回落。
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Missing NEXT_PUBLIC_SITE_URL.');
  }

  return 'http://localhost:3000';
}

export async function signUpWithEmail(
  _state: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = getString(formData, 'email').toLowerCase();
  const password = getString(formData, 'password');
  const next = safeNext(getString(formData, 'next'));

  if (!email || !password) {
    return { message: '请填写邮箱和密码。', email };
  }

  if (password.length < 6) {
    return { message: '密码至少需要 6 位。', email };
  }

  const supabase = createSupabaseServerClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${siteOrigin()}/auth/confirm?next=${encodeURIComponent(next)}`,
    },
  });

  if (error) {
    console.error('[AUTH_SIGNUP_ERROR]', error.message);
    return { message: '注册失败，请稍后重试。', email };
  }

  return { message: '注册成功，请查收确认邮件。', email };
}

export async function signInWithEmail(
  _state: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = getString(formData, 'email').toLowerCase();
  const password = getString(formData, 'password');
  const next = safeNext(getString(formData, 'next'));

  if (!email || !password) {
    return { message: '请填写邮箱和密码。', email };
  }

  const { error } = await createSupabaseServerClient().auth.signInWithPassword({ email, password });

  if (error) {
    console.error('[AUTH_SIGNIN_ERROR]', error.message);
    return { message: '邮箱或密码不正确。', email };
  }

  revalidatePath('/', 'layout');
  // redirect 依靠抛出控制流信号生效，绝不能放进 try 块。
  redirect(next);
}

export async function signOut() {
  const { error } = await createSupabaseServerClient().auth.signOut();

  // 多数失败路径下 auth-js 仍会清掉本地会话，但「读取会话失败」那一支会直接返回，
  // cookie 原样保留。吞掉错误就等于把「点了退出其实没退」变成不可观测的故障。
  if (error) {
    console.error('[AUTH_SIGNOUT_ERROR]', error.message);
  }

  revalidatePath('/', 'layout');
  redirect('/');
}
