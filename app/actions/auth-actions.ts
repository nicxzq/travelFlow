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
  return process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
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
  await createSupabaseServerClient().auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/');
}
